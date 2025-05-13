import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Mail, 
  Tag, 
  Trash2, 
  Edit, 
  Upload,
  X,
  Check,
  FileText,
  UserPlus,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface Contact {
  id: string;
  user_id: string;
  email: string;
  firstName: string;
  lastName: string;
  source: string;
  tags: string[];
  dateAdded: string;
  lastActive: string | null;
  totalPurchases: number;
  totalSpent: number;
  emailStatus: 'subscribed' | 'unsubscribed';
}

interface Tag {
  id: string;
  name: string;
  count: number;
}

export const ContactManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // New contact form state
  const [newContact, setNewContact] = useState({
    email: '',
    firstName: '',
    lastName: '',
    tags: [] as string[]
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
          fetchContacts(data.id);
        }
      } catch (err) {
        console.error('Error fetching creator ID:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCreatorId();
  }, [user]);
  
  // Set up real-time subscription for store_users
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
        fetchContacts(creatorId);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(storeUsersChannel);
    };
  }, [creatorId]);
  
  const fetchContacts = async (creatorId: string) => {
    try {
      setLoading(true);
      
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
        setContacts([]);
        setLoading(false);
        return;
      }
      
      // Get user details for each store user
      const userIds = storeUsers.map(su => su.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, last_login_at')
        .in('id', userIds);
        
      if (usersError) throw usersError;
      
      // Get purchase information for each user
      const purchaseStats = await Promise.all(userIds.map(async (userId) => {
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('creator_id', creatorId);
          
        if (!products || products.length === 0) {
          return { userId, totalPurchases: 0, totalSpent: 0 };
        }
        
        const productIds = products.map(p => p.id);
        
        const { data: purchases } = await supabase
          .from('purchases')
          .select('id, price, discount_applied')
          .eq('customer_id', userId)
          .eq('status', 'completed')
          .in('product_id', productIds);
          
        const totalPurchases = purchases?.length || 0;
        const totalSpent = purchases?.reduce((sum, purchase) => {
          return sum + (purchase.price - (purchase.discount_applied || 0));
        }, 0) || 0;
        
        return { userId, totalPurchases, totalSpent };
      }));
      
      // Create a map for quick lookup
      const purchaseStatsMap = new Map();
      purchaseStats.forEach(stat => {
        purchaseStatsMap.set(stat.userId, {
          totalPurchases: stat.totalPurchases,
          totalSpent: stat.totalSpent
        });
      });
      
      // Combine the data
      const contactsData: Contact[] = storeUsers.map(storeUser => {
        const userData = usersData?.find(u => u.id === storeUser.user_id);
        const purchaseData = purchaseStatsMap.get(storeUser.user_id) || { totalPurchases: 0, totalSpent: 0 };
        
        // Extract first and last name from full_name
        let firstName = '';
        let lastName = '';
        
        if (userData?.full_name) {
          const nameParts = userData.full_name.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        return {
          id: storeUser.id,
          user_id: storeUser.user_id,
          email: userData?.email || 'unknown@email.com',
          firstName,
          lastName,
          source: 'Store User', // Default source
          tags: [], // We'll need to implement a tagging system
          dateAdded: storeUser.created_at,
          lastActive: userData?.last_login_at,
          totalPurchases: purchaseData.totalPurchases,
          totalSpent: purchaseData.totalSpent,
          emailStatus: storeUser.is_subscribed ? 'subscribed' : 'unsubscribed'
        };
      });
      
      setContacts(contactsData);
      generateTagsFromContacts(contactsData);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const generateTagsFromContacts = (contactsData: Contact[]) => {
    // Create a map to count tag occurrences
    const tagCounts = new Map<string, number>();
    
    // Count occurrences of each tag
    contactsData.forEach(contact => {
      contact.tags.forEach(tag => {
        const count = tagCounts.get(tag) || 0;
        tagCounts.set(tag, count + 1);
      });
    });
    
    // Convert to Tag objects
    const tagsArray: Tag[] = Array.from(tagCounts.entries()).map(([name, count], index) => ({
      id: `tag-${index}`,
      name,
      count
    }));
    
    setTags(tagsArray);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const handleAddContact = async () => {
    if (!newContact.email.trim()) return;
    
    // Check if email already exists
    if (contacts.some(contact => contact.email.toLowerCase() === newContact.email.toLowerCase())) {
      alert('A contact with this email already exists.');
      return;
    }
    
    try {
      if (!creatorId) return;
      
      // Use the Edge Function to add the user
      const response = await supabase.functions.invoke('add-existing-user-to-store', {
        body: {
          creatorId,
          email: newContact.email,
          fullName: `${newContact.firstName} ${newContact.lastName}`.trim()
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      
      // Refresh contacts
      await fetchContacts(creatorId);
      
      // Reset form and close modal
      setIsAddContactModalOpen(false);
      setNewContact({
        email: '',
        firstName: '',
        lastName: '',
        tags: []
      });
      
      // If we have tags to add, we'll need to implement that separately
      // For now, we'll just show a success message
      if (newContact.tags.length > 0) {
        alert('Contact added successfully! Note: Tags will be implemented in a future update.');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      alert(`Failed to add contact: ${error.message}`);
    }
    
    setIsAddContactModalOpen(false);
    setNewContact({
      email: '',
      firstName: '',
      lastName: '',
      tags: []
    });
  };
  
  const handleImportContacts = () => {
    // In a real implementation, this would process the CSV file
    alert('This would import contacts from the CSV file.');
    setIsImportModalOpen(false);
    setImportFile(null);
  };
  
  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    
    // Check if tag already exists
    if (tags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
      setNewTagName('');
      return;
    }
    
    const newTag = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      count: 0
    };
    
    setTags([...tags, newTag]);
    setNewTagName('');
  };
  
  const handleTagSelection = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };
  
  const handleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };
  
  const handleSelectAllContacts = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };
  
  const handleAddTagToContacts = () => {
    if (selectedContacts.length === 0 || newContact.tags.length === 0) return;
    
    setContacts(prev => 
      prev.map(contact => {
        if (selectedContacts.includes(contact.id)) {
          // Add new tags that don't already exist for this contact
          const updatedTags = [...contact.tags];
          newContact.tags.forEach(tag => {
            if (!updatedTags.includes(tag)) {
              updatedTags.push(tag);
            }
          });
          
          return {
            ...contact,
            tags: updatedTags
          };
        }
        return contact;
      })
    );
    
    setIsTagModalOpen(false);
    setNewContact(prev => ({ ...prev, tags: [] }));
    setSelectedContacts([]);
  };
  
  const handleDeleteContacts = async () => {
    if (selectedContacts.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedContacts.length} contact(s)?`)) {
      try {
        // In a real implementation, we would delete the store_users entries
        // For now, we'll just show a message
        alert('Delete functionality will be implemented in a future update.');
        
        // Reset selection
        setSelectedContacts([]);
      } catch (error) {
        console.error('Error deleting contacts:', error);
        alert(`Failed to delete contacts: ${error.message}`);
      }
    }
  };
  
  const toggleContactTag = (contactId: string, tagName: string) => {
    setContacts(prev => 
      prev.map(contact => {
        if (contact.id === contactId) {
          if (contact.tags.includes(tagName)) {
            // Remove tag
            return {
              ...contact,
              tags: contact.tags.filter(t => t !== tagName)
            };
          } else {
            // Add tag
            return {
              ...contact,
              tags: [...contact.tags, tagName]
            };
          }
        }
        return contact;
      })
    );
  };
  
  const handleToggleTagSelection = (tagName: string) => {
    if (!newContact.tags.includes(tagName)) {
      setNewContact(prev => ({
        ...prev,
        tags: [...prev.tags, tagName]
      }));
    } else {
      setNewContact(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t !== tagName)
      }));
    }
  };
  
  const refreshData = async () => {
    if (!creatorId || refreshing) return;
    
    setRefreshing(true);
    await fetchContacts(creatorId);
    setRefreshing(false);
  };
  
  // Filter contacts based on search query and selected tags
  const filteredContacts = contacts.filter(contact => {
    // Apply tag filter
    if (selectedTags.length > 0 && !selectedTags.some(tag => contact.tags.includes(tag))) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        contact.email.toLowerCase().includes(query) ||
        contact.firstName.toLowerCase().includes(query) ||
        contact.lastName.toLowerCase().includes(query) ||
        contact.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return true;
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
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-gray-600">Manage your email subscribers and customers</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => setIsImportModalOpen(true)}
          >
            Import Contacts
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddContactModalOpen(true)}
          >
            Add Contact
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with tags */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Tags</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                  rightIcon={isTagsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                >
                  {isTagsExpanded ? 'Show Less' : 'Show All'}
                </Button>
              </div>
              
              <div className="space-y-2">
                {tags
                  .slice(0, isTagsExpanded ? undefined : 5)
                  .map(tag => (
                    <div 
                      key={tag.id} 
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                        selectedTags.includes(tag.name) 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleTagSelection(tag.name)}
                    >
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{tag.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{tag.count}</span>
                    </div>
                  ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Add new tag"
                    className="block w-full rounded-l-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-l-none"
                    disabled={!newTagName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Contacts</span>
                    <span className="font-medium text-gray-900">{contacts.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subscribed</span>
                    <span className="font-medium text-gray-900">
                      {contacts.filter(c => c.emailStatus === 'subscribed' || c.emailStatus === undefined).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Unsubscribed</span>
                    <span className="font-medium text-gray-900">
                      {contacts.filter(c => c.emailStatus === 'unsubscribed').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Customers</span>
                    <span className="font-medium text-gray-900">
                      {contacts.filter(c => c.totalPurchases > 0).length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search contacts..."
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
                leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
                onClick={refreshData}
                disabled={refreshing}
              >
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export
              </Button>
              {selectedContacts.length > 0 && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    leftIcon={<Tag className="h-4 w-4" />}
                    onClick={() => setIsTagModalOpen(true)}
                  >
                    Add Tags
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    leftIcon={<Mail className="h-4 w-4" />}
                  >
                    Email Selected
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={handleDeleteContacts}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {filteredContacts.length > 0 ? (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                            checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                            onChange={handleSelectAllContacts}
                          />
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tags
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchases
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
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={() => handleContactSelection(contact.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-700">
                                {contact.firstName.charAt(0) || ''}{contact.lastName.charAt(0) || ''}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {contact.firstName} {contact.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{contact.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.map(tag => (
                              <span 
                                key={`${contact.id}-${tag}`} 
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200"
                                onClick={() => toggleContactTag(contact.id, tag)}
                              >
                                {tag}
                              </span>
                            ))}
                            <button
                              className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
                              onClick={() => {
                                setSelectedContacts([contact.id]);
                                setIsTagModalOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.dateAdded ? formatDate(contact.dateAdded) : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contact.totalPurchases}</div>
                          <div className="text-xs text-gray-500">{formatCurrency(contact.totalSpent)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            contact.emailStatus === 'subscribed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {contact.emailStatus.charAt(0).toUpperCase() + contact.emailStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-500"
                              title="Edit contact"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-500"
                              title="Email contact"
                            >
                              <Mail className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                className="text-red-400 hover:text-red-500"
                                title="Delete contact"
                                onClick={() => {
                                  setSelectedContacts([contact.id]);
                                  handleDeleteContacts();
                                }}
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
              <Users className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No contacts found</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery || selectedTags.length > 0 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Get started by adding your first contact.'}
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => setIsAddContactModalOpen(true)}
                  leftIcon={<Plus className="h-5 w-5" />}
                >
                  Add Contact
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsAddContactModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Contact</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address*
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name*
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={newContact.firstName}
                        onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name*
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={newContact.lastName}
                        onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newContact.tags.map(tag => (
                        <div key={tag} className="bg-purple-100 rounded-full px-3 py-1 text-sm flex items-center">
                          <span className="text-purple-800">{tag}</span>
                          <button
                            type="button"
                            onClick={() => setNewContact({
                              ...newContact, 
                              tags: newContact.tags.filter(t => t !== tag)
                            })}
                            className="ml-1.5 text-purple-400 hover:text-purple-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                      {tags.map(tag => (
                        <div 
                          key={tag.id} 
                          className="flex items-center p-1 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => handleToggleTagSelection(tag.name)}
                        >
                          <input
                            type="checkbox"
                            checked={newContact.tags.includes(tag.name)}
                            onChange={() => {}}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleAddContact}
                  className="sm:ml-3"
                  disabled={!newContact.email.trim() || !newContact.firstName.trim() || !newContact.lastName.trim()}
                >
                  Add Contact
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="mt-3 sm:mt-0"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Contacts Modal */}
      {isImportModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsImportModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Import Contacts</h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    <div className="text-gray-600">
                      <Upload className="h-10 w-10 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm">
                        <button 
                          type="button"
                          className="font-medium text-purple-600 hover:text-purple-500"
                          onClick={() => document.getElementById('fileUpload')?.click()}
                        >
                          Upload a file
                        </button>{' '}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">CSV, XLSX up to 10MB</p>
                      <input
                        id="fileUpload"
                        type="file"
                        accept=".csv,.xlsx"
                        className="hidden"
                        onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                      />
                      {importFile && (
                        <div className="mt-4 text-left px-4 py-3 bg-gray-50 rounded-md flex items-center justify-between">
                          <span className="text-sm">{importFile.name}</span>
                          <button 
                            type="button"
                            onClick={() => setImportFile(null)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Download Sample File</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      leftIcon={<Download className="h-4 w-4" />}
                    >
                      Download CSV Template
                    </Button>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Import Guidelines</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Your CSV file should include email, first_name, and last_name columns</li>
                            <li>Optional columns: tags (comma separated)</li>
                            <li>Make sure your file is UTF-8 encoded</li>
                            <li>Duplicate emails will be skipped</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleImportContacts}
                  className="sm:ml-3"
                  disabled={!importFile}
                >
                  Import Contacts
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsImportModalOpen(false)}
                  className="mt-3 sm:mt-0"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Tags Modal */}
      {isTagModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsTagModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add Tags to {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newContact.tags.map(tag => (
                        <div key={tag} className="bg-purple-100 rounded-full px-3 py-1 text-sm flex items-center">
                          <span className="text-purple-800">{tag}</span>
                          <button
                            type="button"
                            onClick={() => setNewContact({
                              ...newContact, 
                              tags: newContact.tags.filter(t => t !== tag)
                            })}
                            className="ml-1.5 text-purple-400 hover:text-purple-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                      {tags.map(tag => (
                        <div 
                          key={tag.id} 
                          className="flex items-center p-1 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => handleToggleTagSelection(tag.name)}
                        >
                          <input
                            type="checkbox"
                            checked={newContact.tags.includes(tag.name)}
                            onChange={() => {}}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Create new tag"
                      className="block w-full rounded-l-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (newTagName.trim()) {
                          handleAddTag();
                          handleToggleTagSelection(newTagName.trim());
                        }
                      }}
                      className="rounded-l-none"
                      disabled={!newTagName.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleAddTagToContacts}
                  className="sm:ml-3"
                  disabled={newContact.tags.length === 0}
                >
                  Add Tags
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsTagModalOpen(false)}
                  className="mt-3 sm:mt-0"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}