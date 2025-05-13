import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Edit, 
  Trash2, 
  Copy, 
  ArrowRight,
  RefreshCw,
  Users,
  EyeIcon,
  MousePointerClick,
  Download,
  Upload,
  X,
  BarChart
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface EmailList {
  id: string;
  name: string;
  subscriberCount: number;
  description: string;
  openRate: number;
  clickRate: number;
  lastCampaignDate: string | null;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  lastModified: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  listId: string;
  listName: string;
  sentDate: string;
  status: 'Draft' | 'Sent' | 'Scheduled';
  openRate: number | null;
  clickRate: number | null;
  recipients: number | null;
}

const EmailManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'lists' | 'templates' | 'campaigns'>('lists');
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form states
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchCreatorId = async () => {
      try {
        const { data, error } = await supabase
          .from('creators')
          .select('id')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setCreatorId(data.id);
          await fetchEmailData(data.id);
        }
      } catch (err) {
        console.error('Error fetching creator ID:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCreatorId();
  }, [user]);
  
  // Set up real-time subscription for store_users (for subscriber counts)
  useEffect(() => {
    if (!creatorId) return;
    
    const storeUsersChannel = supabase
      .channel('store_users_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'store_users',
        filter: `creator_id=eq.${creatorId}`
      }, () => {
        fetchEmailData(creatorId);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(storeUsersChannel);
    };
  }, [creatorId]);
  
  const fetchEmailData = async (creatorId: string) => {
    try {
      setLoading(true);
      
      // Fetch email lists (based on store_users)
      await fetchEmailLists(creatorId);
      
      // Fetch email templates
      await fetchEmailTemplates(creatorId);
      
      // Fetch email campaigns
      await fetchEmailCampaigns(creatorId);
      
    } catch (error) {
      console.error('Error fetching email data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEmailLists = async (creatorId: string) => {
    try {
      // Get all store users for this creator
      const { data: storeUsers, error: storeUsersError } = await supabase
        .from('store_users')
        .select('id, is_subscribed')
        .eq('creator_id', creatorId);

      if (storeUsersError) throw storeUsersError;
      
      // Count subscribed users
      const subscribedCount = storeUsers?.filter(user => user.is_subscribed).length || 0;
      
      // Get purchases for this creator's products
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('creator_id', creatorId);
        
      if (!products || products.length === 0) {
        // No products, so create just the main list
        const mainList: EmailList = {
          id: 'list-main',
          name: 'All Subscribers',
          subscriberCount: subscribedCount,
          description: 'All subscribers to your store',
          openRate: 0,
          clickRate: 0,
          lastCampaignDate: null
        };
        
        setEmailLists([mainList]);
        return;
      }
      
      const productIds = products.map(p => p.id);
      
      const { data: purchases } = await supabase
        .from('purchases')
        .select('customer_id, product_id')
        .in('product_id', productIds)
        .eq('status', 'completed');
        
      // Count unique customers who have made purchases
      const purchaserIds = new Set();
      purchases?.forEach(purchase => {
        purchaserIds.add(purchase.customer_id);
      });
      
      // Create email lists
      const lists: EmailList[] = [
        {
          id: 'list-main',
          name: 'All Subscribers',
          subscriberCount: subscribedCount,
          description: 'All subscribers to your store',
          openRate: 32.5, // Sample metrics since we don't have real email data
          clickRate: 4.8,
          lastCampaignDate: null
        },
        {
          id: 'list-purchasers',
          name: 'Product Purchasers',
          subscriberCount: purchaserIds.size,
          description: 'Customers who have purchased products',
          openRate: 41.2,
          clickRate: 7.9,
          lastCampaignDate: null
        }
      ];
      
      // Check if we have any lead magnet products
      const { data: leadMagnets } = await supabase
        .from('products')
        .select('id, name, email_list_name')
        .eq('creator_id', creatorId)
        .eq('type', 'lead_magnet');
        
      if (leadMagnets && leadMagnets.length > 0) {
        // Add a list for each lead magnet
        leadMagnets.forEach(leadMagnet => {
          // Count users who downloaded this lead magnet
          // In a real implementation, we would track this properly
          // For now, we'll use a random number
          const randomSubscriberCount = Math.floor(Math.random() * 200) + 50;
          
          lists.push({
            id: `list-leadmagnet-${leadMagnet.id}`,
            name: leadMagnet.email_list_name || `${leadMagnet.name} Subscribers`,
            subscriberCount: randomSubscriberCount,
            description: `Subscribers from ${leadMagnet.name} lead magnet`,
            openRate: 35 + Math.random() * 10,
            clickRate: 5 + Math.random() * 5,
            lastCampaignDate: null
          });
        });
      }
      
      setEmailLists(lists);
    } catch (error) {
      console.error('Error fetching email lists:', error);
    }
  };
  
  const fetchEmailTemplates = async (creatorId: string) => {
    try {
      // In a real implementation, we would fetch templates from the database
      // For now, we'll create some sample templates
      const templates: EmailTemplate[] = [
        {
          id: 'template-welcome',
          name: 'Welcome Email',
          description: 'Sent to new subscribers',
          lastModified: new Date().toISOString()
        },
        {
          id: 'template-newsletter',
          name: 'Monthly Newsletter',
          description: 'Standard newsletter template',
          lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        }
      ];
      
      // Check if we have any products to create product-specific templates
      const { data: products } = await supabase
        .from('products')
        .select('id, name, type')
        .eq('creator_id', creatorId)
        .limit(5);
        
      if (products && products.length > 0) {
        // Add a template for product announcements
        templates.push({
          id: 'template-product',
          name: 'Product Announcement',
          description: 'New product launch template',
          lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
        });
        
        // Add a template for special offers
        templates.push({
          id: 'template-offer',
          name: 'Special Offer',
          description: 'Discount and special promotion template',
          lastModified: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString() // 21 days ago
        });
      }
      
      setEmailTemplates(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
    }
  };
  
  const fetchEmailCampaigns = async (creatorId: string) => {
    try {
      // In a real implementation, we would fetch campaigns from the database
      // For now, we'll create some sample campaigns based on the lists
      
      if (emailLists.length === 0) {
        setEmailCampaigns([]);
        return;
      }
      
      const campaigns: EmailCampaign[] = [];
      
      // Add a sent campaign for the main list
      const mainList = emailLists.find(list => list.id === 'list-main');
      if (mainList) {
        campaigns.push({
          id: 'campaign-newsletter',
          name: 'Monthly Newsletter',
          subject: 'Your Monthly Update & Exclusive Content',
          listId: mainList.id,
          listName: mainList.name,
          sentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          status: 'Sent',
          openRate: 34.7,
          clickRate: 5.9,
          recipients: mainList.subscriberCount
        });
      }
      
      // Add a sent campaign for purchasers if we have any
      const purchasersList = emailLists.find(list => list.id === 'list-purchasers');
      if (purchasersList && purchasersList.subscriberCount > 0) {
        campaigns.push({
          id: 'campaign-purchasers',
          name: 'Product Update',
          subject: 'New Features You\'ll Love',
          listId: purchasersList.id,
          listName: purchasersList.name,
          sentDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
          status: 'Sent',
          openRate: 41.3,
          clickRate: 8.7,
          recipients: purchasersList.subscriberCount
        });
      }
      
      // Add a draft campaign
      if (mainList) {
        campaigns.push({
          id: 'campaign-draft',
          name: 'Upcoming Promotion',
          subject: 'Limited Time Offer: Special Discount Inside',
          listId: mainList.id,
          listName: mainList.name,
          sentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days in future
          status: 'Draft',
          openRate: null,
          clickRate: null,
          recipients: null
        });
      }
      
      setEmailCampaigns(campaigns);
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
    }
  };

  // Filter email lists, templates, or campaigns based on search query
  const filteredData = (data: any[]) => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(item => {
      return item.name.toLowerCase().includes(query) || 
             (item.description && item.description.toLowerCase().includes(query)) ||
             (item.subject && item.subject.toLowerCase().includes(query));
    });
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleCreateList = () => {
    if (!newListName.trim()) return;
    
    const newList = {
      id: `list-${Date.now()}`,
      name: newListName,
      description: newListDescription,
      subscriberCount: 0,
      openRate: 0,
      clickRate: 0,
      lastCampaignDate: null
    };
    
    setEmailLists([...emailLists, newList]);
    setIsCreateModalOpen(false);
    setNewListName('');
    setNewListDescription('');
  };
  
  const handleImportSubscribers = () => {
    // In a real application, this would upload and process the file
    alert('This would import your subscribers from the CSV file.');
    setIsImportModalOpen(false);
    setImportFile(null);
  };
  
  const refreshData = async () => {
    if (!creatorId || refreshing) return;
    
    setRefreshing(true);
    await fetchEmailData(creatorId);
    setRefreshing(false);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
          <p className="mt-1 text-gray-600">Create and manage email lists, templates, and campaigns</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => setIsImportModalOpen(true)}
          >
            Import Subscribers
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              if (activeView === 'lists') {
                setIsCreateModalOpen(true);
              } else if (activeView === 'templates') {
                alert('Create new email template');
              } else if (activeView === 'campaigns') {
                alert('Create new email campaign');
              }
            }}
          >
            {activeView === 'lists' 
              ? 'New List' 
              : activeView === 'templates' 
                ? 'New Template' 
                : 'New Campaign'
            }
          </Button>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-4 px-6 font-medium text-sm ${
            activeView === 'lists'
              ? 'border-b-2 border-purple-500 text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveView('lists')}
        >
          Email Lists
        </button>
        <button
          className={`py-4 px-6 font-medium text-sm ${
            activeView === 'templates'
              ? 'border-b-2 border-purple-500 text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveView('templates')}
        >
          Email Templates
        </button>
        <button
          className={`py-4 px-6 font-medium text-sm ${
            activeView === 'campaigns'
              ? 'border-b-2 border-purple-500 text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveView('campaigns')}
        >
          Email Campaigns
        </button>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-3 md:space-y-0">
        <div className="relative md:max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={`Search ${activeView}...`}
            className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filter
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={refreshData}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Content based on active view */}
      {activeView === 'lists' && (
        <div className="space-y-6">
          {filteredData(emailLists).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData(emailLists).map((list) => (
                <Card key={list.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{list.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{list.description}</p>
                      </div>
                      <div className="flex">
                        <button 
                          className="text-gray-400 hover:text-gray-500"
                          title="Edit list"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-6 text-sm">
                      <div>
                        <p className="text-gray-500">Subscribers</p>
                        <p className="font-semibold">{list.subscriberCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Open Rate</p>
                        <p className="font-semibold">{list.openRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Click Rate</p>
                        <p className="font-semibold">{list.clickRate}%</p>
                      </div>
                    </div>
                    
                    {list.lastCampaignDate && (
                      <p className="mt-3 text-xs text-gray-500">
                        Last campaign: {formatDate(list.lastCampaignDate)}
                      </p>
                    )}
                    
                    <div className="mt-5 flex space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Users className="h-4 w-4" />}
                        className="flex-1"
                      >
                        View Subscribers
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<Mail className="h-4 w-4" />}
                        className="flex-1"
                      >
                        Send Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Mail className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No email lists found</h3>
              <p className="mt-1 text-gray-500">Get started by creating your first email list.</p>
              <div className="mt-6">
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  leftIcon={<Plus className="h-5 w-5" />}
                >
                  Create Email List
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeView === 'templates' && (
        <div className="space-y-6">
          {filteredData(emailTemplates).length > 0 ? (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Modified
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData(emailTemplates).map((template, idx) => (
                      <tr key={template.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {template.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {template.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(template.lastModified)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              className="text-gray-400 hover:text-gray-500"
                              title="Preview template"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button 
                              className="text-gray-400 hover:text-gray-500"
                              title="Edit template"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button 
                              className="text-gray-400 hover:text-gray-500"
                              title="Duplicate template"
                            >
                              <Copy className="h-5 w-5" />
                            </button>
                            <button 
                              className="text-red-400 hover:text-red-500"
                              title="Delete template"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Mail className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No email templates found</h3>
              <p className="mt-1 text-gray-500">Get started by creating your first email template.</p>
              <div className="mt-6">
                <Button leftIcon={<Plus className="h-5 w-5" />}>
                  Create Email Template
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeView === 'campaigns' && (
        <div className="space-y-6">
          {filteredData(emailCampaigns).length > 0 ? (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email List
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData(emailCampaigns).map((campaign, idx) => (
                      <tr key={campaign.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                            <p className="text-xs text-gray-500">{campaign.subject}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {campaign.listName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {campaign.status === 'Draft' ? '-' : formatDate(campaign.sentDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {campaign.status === 'Sent' ? (
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center mb-1">
                                <EyeIcon className="h-3 w-3 mr-1 text-gray-400" />
                                <span className="text-gray-900 font-medium">{campaign.openRate}%</span>
                                <span className="ml-1">open rate</span>
                              </div>
                              <div className="flex items-center">
                                <MousePointerClick className="h-3 w-3 mr-1 text-gray-400" />
                                <span className="text-gray-900 font-medium">{campaign.clickRate}%</span>
                                <span className="ml-1">click rate</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            campaign.status === 'Draft' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {campaign.status === 'Draft' ? (
                              <>
                                <button 
                                  className="text-gray-400 hover:text-gray-500"
                                  title="Edit campaign"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button 
                                  className="text-gray-400 hover:text-gray-500"
                                  title="Preview campaign"
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </button>
                                <button 
                                  className="text-red-400 hover:text-red-500"
                                  title="Delete campaign"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  className="text-gray-400 hover:text-gray-500"
                                  title="View report"
                                >
                                  <BarChart className="h-5 w-5" />
                                </button>
                                <button 
                                  className="text-gray-400 hover:text-gray-500"
                                  title="Duplicate campaign"
                                >
                                  <Copy className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Mail className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No email campaigns found</h3>
              <p className="mt-1 text-gray-500">Get started by creating your first email campaign.</p>
              <div className="mt-6">
                <Button leftIcon={<Plus className="h-5 w-5" />}>
                  Create Email Campaign
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Create List Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Email List</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="listName" className="block text-sm font-medium text-gray-700">
                  List Name
                </label>
                <input
                  type="text"
                  id="listName"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter list name"
                />
              </div>
              
              <div>
                <label htmlFor="listDescription" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="listDescription"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter list description"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
              >
                Create List
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Import Subscribers</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload CSV File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv"
                          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      CSV file up to 10MB
                    </p>
                  </div>
                </div>
              </div>
              
              {importFile && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Download className="h-4 w-4" />
                  <span>{importFile.name}</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImportSubscribers}
                disabled={!importFile}
              >
                Import
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailManagementPage;

export { EmailManagementPage }