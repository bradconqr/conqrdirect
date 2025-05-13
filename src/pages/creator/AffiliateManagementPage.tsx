import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Share2, 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Edit, 
  Trash2, 
  DollarSign, 
  Users,
  RefreshCw,
  CheckCircle,
  Link,
  BarChart,
  ArrowUpRight,
  Settings,
  AlertCircle,
  X
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface AffiliateProgram {
  id: string;
  name: string;
  commission: number;
  active: boolean;
  createdAt: string;
}

interface Affiliate {
  id: string;
  userId: string;
  name: string;
  email: string;
  code: string;
  sales: number;
  earnings: number;
  conversionRate: number;
  createdAt: string;
  status: 'active' | 'pending' | 'inactive';
}

export const AffiliateManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [affiliateProgram, setAffiliateProgram] = useState<AffiliateProgram | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<string | null>(null);
  const [isProgramSettingsOpen, setIsProgramSettingsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Form states
  const [newAffiliate, setNewAffiliate] = useState({
    name: '',
    email: '',
    customCode: '',
    commission: 0
  });
  
  // Program settings form
  const [programSettings, setProgramSettings] = useState({
    name: 'Affiliate Program',
    defaultCommission: 10,
    cookieDuration: 30,
    termsAndConditions: ''
  });
  
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
          await fetchAffiliateData(data.id);
        }
      } catch (err) {
        console.error('Error fetching creator ID:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCreatorId();
  }, [user]);
  
  // Set up real-time subscription for affiliate-related tables
  useEffect(() => {
    if (!creatorId) return;
    
    // Subscribe to changes in the store_users table (for new users)
    const storeUsersChannel = supabase
      .channel('store_users_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'store_users',
        filter: `creator_id=eq.${creatorId}`
      }, () => {
        fetchAffiliateData(creatorId);
      })
      .subscribe();
      
    // Subscribe to changes in the purchases table (for affiliate sales)
    const purchasesChannel = supabase
      .channel('purchases_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'purchases'
      }, () => {
        fetchAffiliateData(creatorId);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(storeUsersChannel);
      supabase.removeChannel(purchasesChannel);
    };
  }, [creatorId]);
  
  const fetchAffiliateData = async (creatorId: string) => {
    try {
      setLoading(true);
      
      // Get creator details to check if they have affiliate settings
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('id', creatorId)
        .single();
        
      if (creatorError) throw creatorError;
      
      // Check if creator has social_links with affiliate settings
      const socialLinks = creatorData.social_links || {};
      const hasAffiliateProgram = socialLinks.affiliate_program_settings !== undefined;
      
      let affiliateProgramData: AffiliateProgram | null = null;
      
      if (hasAffiliateProgram) {
        // Use existing settings
        const settings = socialLinks.affiliate_program_settings;
        affiliateProgramData = {
          id: `program-${creatorId}`,
          name: settings.name || 'Affiliate Program',
          commission: settings.defaultCommission || 10,
          active: settings.active !== false, // Default to true if not specified
          createdAt: settings.createdAt || new Date().toISOString()
        };
        
        // Update program settings form
        setProgramSettings({
          name: settings.name || 'Affiliate Program',
          defaultCommission: settings.defaultCommission || 10,
          cookieDuration: settings.cookieDuration || 30,
          termsAndConditions: settings.termsAndConditions || ''
        });
      } else {
        // Create default program
        affiliateProgramData = {
          id: `program-${creatorId}`,
          name: 'Affiliate Program',
          commission: 10,
          active: true,
          createdAt: new Date().toISOString()
        };
      }
      
      setAffiliateProgram(affiliateProgramData);
      
      // Get all store users for this creator
      const { data: storeUsers, error: storeUsersError } = await supabase
        .from('store_users')
        .select(`
          id, 
          user_id, 
          created_at, 
          is_subscribed
        `)
        .eq('creator_id', creatorId);

      if (storeUsersError) throw storeUsersError;
      
      if (!storeUsers || storeUsers.length === 0) {
        setAffiliates([]);
        setLoading(false);
        return;
      }
      
      // Get user details for each store user
      const userIds = storeUsers.map(su => su.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds);
        
      if (usersError) throw usersError;
      
      // Get products for this creator
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('creator_id', creatorId);
        
      if (!products || products.length === 0) {
        setAffiliates([]);
        setLoading(false);
        return;
      }
      
      const productIds = products.map(p => p.id);
      
      // Generate affiliate data based on store users
      // In a real implementation, you would have a dedicated affiliates table
      // For now, we'll generate data based on store users
      const affiliatesData: Affiliate[] = [];
      
      // Get a subset of users to be affiliates (for demo purposes)
      const affiliateUsers = storeUsers.slice(0, Math.min(5, storeUsers.length));
      
      for (const storeUser of affiliateUsers) {
        const userData = usersData?.find(u => u.id === storeUser.user_id);
        if (!userData) continue;
        
        // Generate a random affiliate code if none exists
        const code = `${userData.full_name?.split(' ')[0] || 'aff'}${Math.floor(Math.random() * 1000)}`.toLowerCase();
        
        // Calculate random sales and earnings for demo
        const sales = Math.floor(Math.random() * 20);
        const earnings = sales * Math.floor(Math.random() * 5000 + 1000);
        const conversionRate = Math.floor(Math.random() * 15) + 5;
        
        affiliatesData.push({
          id: `aff-${storeUser.id}`,
          userId: storeUser.user_id,
          name: userData.full_name || 'Unnamed Affiliate',
          email: userData.email,
          code,
          sales,
          earnings,
          conversionRate,
          createdAt: storeUser.created_at,
          status: Math.random() > 0.2 ? 'active' : 'pending' // 80% active, 20% pending
        });
      }
      
      setAffiliates(affiliatesData);
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const saveAffiliateProgram = async () => {
    if (!creatorId) return;
    
    try {
      // Get current creator data
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('social_links')
        .eq('id', creatorId)
        .single();
        
      if (creatorError) throw creatorError;
      
      // Update social_links with affiliate program settings
      const socialLinks = creatorData.social_links || {};
      socialLinks.affiliate_program_settings = {
        name: programSettings.name,
        defaultCommission: programSettings.defaultCommission,
        cookieDuration: programSettings.cookieDuration,
        termsAndConditions: programSettings.termsAndConditions,
        active: affiliateProgram?.active || true,
        createdAt: affiliateProgram?.createdAt || new Date().toISOString()
      };
      
      // Update creator record
      const { error: updateError } = await supabase
        .from('creators')
        .update({
          social_links: socialLinks,
          updated_at: new Date().toISOString()
        })
        .eq('id', creatorId);
        
      if (updateError) throw updateError;
      
      // Update local state
      setAffiliateProgram({
        id: affiliateProgram?.id || `program-${creatorId}`,
        name: programSettings.name,
        commission: programSettings.defaultCommission,
        active: affiliateProgram?.active || true,
        createdAt: affiliateProgram?.createdAt || new Date().toISOString()
      });
      
      setIsProgramSettingsOpen(false);
    } catch (error) {
      console.error('Error saving affiliate program:', error);
      alert('Failed to save affiliate program settings');
    }
  };
  
  const handleCreateAffiliate = async () => {
    if (!creatorId || !newAffiliate.email) return;
    
    try {
      // In a real implementation, you would:
      // 1. Check if the user exists
      // 2. Create an affiliate record
      // 3. Send an invitation email
      
      // For now, we'll just add a simulated affiliate
      const code = newAffiliate.customCode || 
                  `${newAffiliate.name.split(' ')[0] || 'aff'}${Math.floor(Math.random() * 1000)}`.toLowerCase();
      
      const newAffiliateData: Affiliate = {
        id: `aff-${Date.now()}`,
        userId: `user-${Date.now()}`,
        name: newAffiliate.name,
        email: newAffiliate.email,
        code,
        sales: 0,
        earnings: 0,
        conversionRate: 0,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      setAffiliates([...affiliates, newAffiliateData]);
      setIsCreateModalOpen(false);
      setNewAffiliate({
        name: '',
        email: '',
        customCode: '',
        commission: 0
      });
    } catch (error) {
      console.error('Error creating affiliate:', error);
      alert('Failed to create affiliate');
    }
  };
  
  const handleDeleteAffiliate = (id: string) => {
    // In a real implementation, you would delete the affiliate record from the database
    setAffiliates(affiliates.filter(affiliate => affiliate.id !== id));
    setIsDeleteModalOpen(null);
  };
  
  const toggleAffiliateStatus = (id: string) => {
    setAffiliates(affiliates.map(affiliate => {
      if (affiliate.id === id) {
        return {
          ...affiliate,
          status: affiliate.status === 'active' ? 'inactive' : 'active'
        };
      }
      return affiliate;
    }));
  };
  
  const copyAffiliateCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const refreshData = async () => {
    if (!creatorId || refreshing) return;
    
    setRefreshing(true);
    await fetchAffiliateData(creatorId);
    setRefreshing(false);
  };
  
  // Filter affiliates based on search query
  const filteredAffiliates = affiliates.filter(affiliate => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      affiliate.name.toLowerCase().includes(query) ||
      affiliate.email.toLowerCase().includes(query) ||
      affiliate.code.toLowerCase().includes(query)
    );
  });
  
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
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Program</h1>
          <p className="mt-1 text-gray-600">Manage your affiliate partners and track their performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            leftIcon={<Settings className="h-4 w-4" />}
            onClick={() => setIsProgramSettingsOpen(true)}
          >
            Program Settings
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Affiliate
          </Button>
        </div>
      </div>
      
      {/* Program Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Affiliates</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{affiliates.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Affiliates</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              {affiliates.filter(a => a.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {affiliates.reduce((sum, a) => sum + a.sales, 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Commissions</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatCurrency(affiliates.reduce((sum, a) => sum + a.earnings, 0))}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search affiliates..."
            className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={refreshData}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filter
          </Button>
        </div>
      </div>
      
      {/* Affiliates List */}
      {filteredAffiliates.length > 0 ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affiliate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-700">
                            {affiliate.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{affiliate.name}</div>
                          <div className="text-sm text-gray-500">{affiliate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{affiliate.code}</code>
                        <button
                          onClick={() => copyAffiliateCode(affiliate.code)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title="Copy code"
                        >
                          {copiedCode === affiliate.code ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {affiliate.sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(affiliate.earnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {affiliate.conversionRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        affiliate.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : affiliate.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          title="View details"
                        >
                          <BarChart className="h-5 w-5" />
                        </button>
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit affiliate"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          title={affiliate.status === 'active' ? 'Deactivate' : 'Activate'}
                          onClick={() => toggleAffiliateStatus(affiliate.id)}
                        >
                          {affiliate.status === 'active' ? (
                            <X className="h-5 w-5" />
                          ) : (
                            <CheckCircle className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          className="text-red-400 hover:text-red-600"
                          title="Delete affiliate"
                          onClick={() => setIsDeleteModalOpen(affiliate.id)}
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
          <Share2 className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No affiliates found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by adding your first affiliate.'}
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="h-5 w-5" />}
            >
              Add Affiliate
            </Button>
          </div>
        </div>
      )}
      
      {/* Affiliate Resources */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Affiliate Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Link className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">Affiliate Links</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Your affiliate link format is:
              </p>
              <div className="bg-gray-100 p-3 rounded-md mb-4">
                <code className="text-sm text-gray-800">https://yourdomain.com?ref=CODE</code>
              </div>
              <p className="text-sm text-gray-600">
                Affiliates can replace CODE with their unique affiliate code.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">Commission Structure</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Default commission rate: <span className="font-semibold">{affiliateProgram?.commission || 10}%</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Cookie duration: <span className="font-semibold">{programSettings.cookieDuration} days</span>
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsProgramSettingsOpen(true)}
              >
                Edit Settings
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <ArrowUpRight className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">Promotional Materials</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Provide your affiliates with ready-to-use promotional materials.
              </p>
              <Button 
                variant="outline" 
                size="sm"
              >
                Manage Materials
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add Affiliate Modal */}
      {isCreateModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsCreateModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Affiliate</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={newAffiliate.name}
                      onChange={(e) => setNewAffiliate({...newAffiliate, name: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={newAffiliate.email}
                      onChange={(e) => setNewAffiliate({...newAffiliate, email: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Affiliate Code (Optional)
                    </label>
                    <input
                      type="text"
                      id="customCode"
                      value={newAffiliate.customCode}
                      onChange={(e) => setNewAffiliate({...newAffiliate, customCode: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="johndoe10"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave blank to generate automatically
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="commission" className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      id="commission"
                      value={newAffiliate.commission || ''}
                      onChange={(e) => setNewAffiliate({...newAffiliate, commission: parseInt(e.target.value) || 0})}
                      min="0"
                      max="100"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder={`${affiliateProgram?.commission || 10}`}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave at 0 to use default program rate ({affiliateProgram?.commission || 10}%)
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleCreateAffiliate}
                  className="sm:ml-3"
                  disabled={!newAffiliate.name || !newAffiliate.email}
                >
                  Add Affiliate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="mt-3 sm:mt-0"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Program Settings Modal */}
      {isProgramSettingsOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsProgramSettingsOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Affiliate Program Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="programName" className="block text-sm font-medium text-gray-700 mb-1">
                      Program Name
                    </label>
                    <input
                      type="text"
                      id="programName"
                      value={programSettings.name}
                      onChange={(e) => setProgramSettings({...programSettings, name: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Affiliate Program"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="defaultCommission" className="block text-sm font-medium text-gray-700 mb-1">
                      Default Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      id="defaultCommission"
                      value={programSettings.defaultCommission}
                      onChange={(e) => setProgramSettings({...programSettings, defaultCommission: parseInt(e.target.value) || 0})}
                      min="0"
                      max="100"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cookieDuration" className="block text-sm font-medium text-gray-700 mb-1">
                      Cookie Duration (days)
                    </label>
                    <input
                      type="number"
                      id="cookieDuration"
                      value={programSettings.cookieDuration}
                      onChange={(e) => setProgramSettings({...programSettings, cookieDuration: parseInt(e.target.value) || 0})}
                      min="1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      How long the affiliate cookie lasts after a visitor clicks an affiliate link
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="termsAndConditions" className="block text-sm font-medium text-gray-700 mb-1">
                      Terms and Conditions
                    </label>
                    <textarea
                      id="termsAndConditions"
                      value={programSettings.termsAndConditions}
                      onChange={(e) => setProgramSettings({...programSettings, termsAndConditions: e.target.value})}
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Enter your affiliate program terms and conditions..."
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={saveAffiliateProgram}
                  className="sm:ml-3"
                >
                  Save Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsProgramSettingsOpen(false)}
                  className="mt-3 sm:mt-0"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsDeleteModalOpen(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Affiliate
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this affiliate? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="danger"
                  onClick={() => handleDeleteAffiliate(isDeleteModalOpen)}
                  className="sm:ml-3"
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(null)}
                  className="mt-3 sm:mt-0"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Affiliate Program Best Practices */}
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Affiliate Program Best Practices</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="ml-3 font-medium text-purple-900">Find the Right Partners</h3>
                </div>
                <p className="text-sm text-purple-700">
                  Look for affiliates who have an audience that matches your target market. Quality is more important than quantity.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="ml-3 font-medium text-blue-900">Competitive Commission</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Offer competitive commission rates to motivate affiliates. Consider tiered commissions based on performance.
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Link className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="ml-3 font-medium text-green-900">Provide Resources</h3>
                </div>
                <p className="text-sm text-green-700">
                  Give your affiliates the tools they need to succeed: banners, email templates, product images, and sample copy.
                </p>
              </div>
            </div>
            
            <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Affiliate Disclosure Requirements</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Remind your affiliates that they must disclose their affiliate relationship with your brand in accordance with FTC guidelines. This disclosure should be:
                    </p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Clear and conspicuous</li>
                      <li>Near the affiliate link or recommendation</li>
                      <li>In plain language that readers can understand</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AffiliateManagementPage;