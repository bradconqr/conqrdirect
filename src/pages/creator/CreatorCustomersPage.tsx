import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { 
  Download, 
  Mail, 
  Search, 
  User, 
  UserPlus, 
  X, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { addExistingUserToStore, inviteUserToStore, createNewUserInStore } from '../../lib/adminService';

interface Customer {
  id: string;
  user_id: string;
  created_at: string;
  is_subscribed: boolean;
  user: {
    email: string;
    full_name: string | null;
    last_login_at: string | null;
  };
  purchases_count: number;
  total_spent: number;
}

interface StoreInvitation {
  id: string;
  email: string;
  message: string | null;
  created_at: string;
  accepted_at: string | null;
  user_id: string | null;
}

export const CreatorCustomersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invitations, setInvitations] = useState<StoreInvitation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'add' | 'invite' | 'create'>('add');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [modalStatus, setModalStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchCreatorId = async () => {
      try {
        const { data, error } = await supabase
          .from('creators')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCreatorId(data.id);
          fetchCustomers(data.id);
          fetchInvitations(data.id);
        } else {
          setError('Could not find your creator profile.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching creator ID:', err);
        setError('Could not fetch your creator profile.');
        setLoading(false);
      }
    };

    fetchCreatorId();
  }, [user]);

  const fetchCustomers = async (creatorId: string) => {
    setLoading(true);
    setError(null);

    try {
      // First get all store users
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
        setCustomers([]);
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

      // Get purchase information for each customer
      const customersWithDetails = storeUsers.map(storeUser => {
        // Find the corresponding user data
        const userData = usersData?.find(u => u.id === storeUser.user_id) || {
          email: 'unknown@email.com',
          full_name: null,
          last_login_at: null
        };

        return {
          ...storeUser,
          user: {
            email: userData.email,
            full_name: userData.full_name,
            last_login_at: userData.last_login_at
          },
          purchases_count: 0, // Will be updated
          total_spent: 0 // Will be updated
        };
      });

      // Get purchase counts and totals
      await Promise.all(customersWithDetails.map(async (customer) => {
        const { data: purchases, error: purchasesError } = await supabase
          .from('purchases')
          .select('id, price, discount_applied')
          .eq('customer_id', customer.user_id)
          .eq('status', 'completed');

        if (!purchasesError && purchases) {
          customer.purchases_count = purchases.length;
          customer.total_spent = purchases.reduce((sum, purchase) => {
            return sum + (purchase.price - (purchase.discount_applied || 0));
          }, 0);
        }
      }));

      setCustomers(customersWithDetails);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async (creatorId: string) => {
    try {
      const { data, error } = await supabase
        .from('store_invitations')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(customer => customer.id));
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    const email = customer.user?.email?.toLowerCase() || '';
    const name = customer.user?.full_name?.toLowerCase() || '';
    
    return email.includes(searchLower) || name.includes(searchLower);
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const refreshData = async () => {
    if (!creatorId || refreshing) return;
    
    setRefreshing(true);
    await Promise.all([
      fetchCustomers(creatorId),
      fetchInvitations(creatorId)
    ]);
    setRefreshing(false);
  };

  const exportCustomers = () => {
    // Create CSV data
    const headers = ['Name', 'Email', 'Joined Date', 'Purchases', 'Total Spent'];
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(customer => [
        customer.user?.full_name || 'Unknown',
        customer.user?.email || 'No email',
        formatDate(customer.created_at),
        customer.purchases_count,
        formatCurrency(customer.total_spent)
      ].join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'customers.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    
    // Ensure we include at least one of each required character type
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // number
    password += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)]; // special
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setUserPassword(password);
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(userPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  // Function to handle form submission
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!creatorId) {
      setModalStatus({
        type: 'error',
        message: 'Creator ID not found'
      });
      return;
    }
    
    if (!userEmail) {
      setModalStatus({
        type: 'error',
        message: 'Email is required'
      });
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setModalStatus({
        type: 'error',
        message: 'Invalid email format'
      });
      return;
    }

    if (addMode === 'create' && !userPassword) {
      setModalStatus({
        type: 'error',
        message: 'Password is required when creating a new user'
      });
      return;
    }

    setIsSubmitting(true);
    setModalStatus({ type: null, message: '' });

    try {
      if (addMode === 'add') {
        // Check if the user exists and add them
        const result = await addExistingUserToStore(
          creatorId,
          userEmail,
          userName || undefined
        );

        setModalStatus({
          type: result.success ? 'success' : 'error',
          message: result.message
        });

        if (result.success) {
          // Refresh the customer list
          await refreshData();
        }
      } else if (addMode === 'invite') {
        // Invite a new user
        const result = await inviteUserToStore(
          creatorId,
          userEmail,
          customMessage
        );

        setModalStatus({
          type: result.success ? 'success' : 'error',
          message: result.message
        });

        if (result.success) {
          // Refresh the invitations list
          await fetchInvitations(creatorId);
        }
      } else if (addMode === 'create') {
        // Create a new user directly
        const result = await createNewUserInStore(
          creatorId,
          userEmail,
          userPassword,
          userName || undefined
        );

        setModalStatus({
          type: result.success ? 'success' : 'error',
          message: result.message
        });

        if (result.success) {
          // Refresh the customer list
          await refreshData();
        }
      }
    } catch (error: any) {
      setModalStatus({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddUserModal = () => {
    setIsAddUserModalOpen(true);
    setAddMode('add');
    setUserEmail('');
    setUserName('');
    setUserPassword('');
    setCustomMessage('');
    setModalStatus({ type: null, message: '' });
  };

  const closeAddUserModal = () => {
    setIsAddUserModalOpen(false);
  };

  const getPendingInvitationsCount = () => {
    return invitations.filter(inv => !inv.accepted_at).length;
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
      <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
      <p className="mt-2 text-gray-600">Manage and view all your customers</p>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{customers.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Subscribers</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              {customers.filter(c => c.is_subscribed).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">With Purchases</h3>
            <p className="mt-2 text-3xl font-semibold text-purple-600">
              {customers.filter(c => c.purchases_count > 0).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Pending Invitations</h3>
            <p className="mt-2 text-3xl font-semibold text-orange-500">
              {getPendingInvitationsCount()}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 bg-white shadow-sm rounded-lg">
        <div className="p-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search customers..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2">
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
              leftIcon={<Download className="h-4 w-4" />}
              onClick={exportCustomers}
            >
              Export
            </Button>
            <Button 
              size="sm"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={openAddUserModal}
            >
              Add User
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchases
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
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
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => handleSelectCustomer(customer.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.user?.full_name || 'Unnamed Customer'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.user?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.user?.last_login_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.purchases_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        customer.is_subscribed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.is_subscribed ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-900"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center">
                      <UserPlus className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-gray-600 font-medium mb-1">No customers found</p>
                      {searchQuery ? (
                        <p>Try adjusting your search query</p>
                      ) : (
                        <p>You don't have any customers yet</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Customer Overview</h3>
            <p className="text-sm text-gray-500 mb-4">Summary of your customer base</p>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Total Customers</span>
                <span className="text-sm font-medium text-gray-900">{customers.length}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Active Subscribers</span>
                <span className="text-sm font-medium text-gray-900">
                  {customers.filter(c => c.is_subscribed).length}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">With Purchases</span>
                <span className="text-sm font-medium text-gray-900">
                  {customers.filter(c => c.purchases_count > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Average Spent</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(
                    customers.length > 0
                      ? customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length
                      : 0
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Recent Activity</h3>
            <p className="text-sm text-gray-500 mb-4">Latest customer actions</p>
            
            {customers.length > 0 ? (
              <div className="space-y-3">
                {customers
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 3)
                  .map(customer => (
                    <div key={customer.id} className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {customer.user?.full_name || 'Unnamed Customer'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {formatDate(customer.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent activity to show</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Pending Invitations</h3>
            <p className="text-sm text-gray-500 mb-4">Users invited to your store</p>
            
            {invitations.length > 0 ? (
              <div className="space-y-3">
                {invitations
                  .filter(inv => !inv.accepted_at)
                  .slice(0, 3)
                  .map(invitation => (
                    <div key={invitation.id} className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {invitation.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Invited {formatDate(invitation.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pending invitations</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={closeAddUserModal}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                  <UserPlus className="h-6 w-6 text-purple-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Add New Customer
                  </h3>
                </div>
              </div>

              <div className="mt-5 sm:mt-6">
                <div className="mb-5 flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setAddMode('add')}
                    className={`relative flex-1 py-2 text-sm font-medium rounded-l-md border focus:z-10 focus:outline-none ${
                      addMode === 'add' 
                        ? 'bg-purple-100 text-purple-700 border-purple-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Add Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddMode('create');
                      if (!userPassword) {
                        generatePassword();
                      }
                    }}
                    className={`relative flex-1 py-2 text-sm font-medium border-t border-b focus:z-10 focus:outline-none ${
                      addMode === 'create'
                        ? 'bg-purple-100 text-purple-700 border-purple-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Create New
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('invite')}
                    className={`relative flex-1 py-2 text-sm font-medium rounded-r-md border focus:z-10 focus:outline-none ${
                      addMode === 'invite'
                        ? 'bg-purple-100 text-purple-700 border-purple-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Send Invite
                  </button>
                </div>

                {modalStatus.type && (
                  <div className={`mb-4 p-3 rounded-md ${
                    modalStatus.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        {modalStatus.type === 'success' ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm">{modalStatus.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAddUser}>
                  <div className="mb-4">
                    <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      id="userEmail"
                      name="userEmail"
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="customer@example.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />
                  </div>

                  {(addMode === 'add' || addMode === 'create') && (
                    <div className="mb-4">
                      <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name {addMode === 'add' ? '(optional)' : ''}
                      </label>
                      <input
                        type="text"
                        id="userName"
                        name="userName"
                        required={addMode === 'create'}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        placeholder="John Doe"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                      />
                    </div>
                  )}

                  {addMode === 'create' && (
                    <div className="mb-4">
                      <label htmlFor="userPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="userPassword"
                          name="userPassword"
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={generatePassword}
                        >
                          Generate Password
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={copyPasswordToClipboard}
                          leftIcon={passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        >
                          {passwordCopied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Password must include lowercase, uppercase, number, and special character
                      </p>
                    </div>
                  )}

                  {addMode === 'invite' && (
                    <div className="mb-4">
                      <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Message (optional)
                      </label>
                      <textarea
                        id="customMessage"
                        name="customMessage"
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Include a personal message with your invitation..."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeAddUserModal}
                      fullWidth
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      fullWidth
                    >
                      {addMode === 'add' ? 'Add User' : 
                       addMode === 'create' ? 'Create User' : 
                       'Send Invitation'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};