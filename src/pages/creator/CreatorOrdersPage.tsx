import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { 
  CheckCircle, 
  Clock, 
  Download, 
  FileText, 
  Filter, 
  RefreshCw, 
  Search, 
  ShoppingBag, 
  X 
} from 'lucide-react';

interface Order {
  id: string;
  customer_id: string;
  product_id: string;
  price: number;
  discount_applied: number | null;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  customer: {
    email: string;
    full_name: string | null;
  };
  product: {
    name: string;
    type: string;
  };
}

export const CreatorOrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'refunded'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
          fetchOrders(data.id);
        }
      } catch (err: any) {
        console.error('Error fetching creator ID:', err);
        setError('Could not fetch your creator profile.');
        setLoading(false);
      }
    };

    fetchCreatorId();
  }, [user]);

  const fetchOrders = async (creatorId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Get all products for this creator
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('creator_id', creatorId);

      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const productIds = products.map(p => p.id);

      // Get all purchases for these products
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          id, 
          customer_id, 
          product_id, 
          price, 
          discount_applied, 
          payment_method, 
          status, 
          created_at,
          product:products(name, type)
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (purchasesError) throw purchasesError;

      // Fetch customer information separately since purchases.customer_id references auth.users
      // but we need to get the data from public.users
      if (purchases && purchases.length > 0) {
        const customerIds = [...new Set(purchases.map(p => p.customer_id))];
        
        const { data: customers, error: customersError } = await supabase
          .from('users')
          .select('id, email, full_name')
          .in('id', customerIds);
          
        if (customersError) throw customersError;
        
        // Map customer data to purchases
        const ordersWithCustomers = purchases.map(purchase => {
          const customer = customers?.find(c => c.id === purchase.customer_id) || {
            email: 'Unknown',
            full_name: null
          };
          
          return {
            ...purchase,
            customer
          };
        });
        
        setOrders(ordersWithCustomers || []);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = async () => {
    if (!creatorId || isRefreshing) return;
    
    setIsRefreshing(true);
    await fetchOrders(creatorId);
    setIsRefreshing(false);
  };

  const filteredOrders = orders.filter(order => {
    // Filter by status
    if (filter !== 'all' && order.status !== filter) {
      return false;
    }

    // Filter by search term
    const searchLower = searchQuery.toLowerCase();
    const customerEmail = order.customer?.email?.toLowerCase() || '';
    const customerName = order.customer?.full_name?.toLowerCase() || '';
    const productName = order.product?.name?.toLowerCase() || '';
    const orderId = order.id.toLowerCase();
    
    return (
      orderId.includes(searchLower) ||
      customerEmail.includes(searchLower) ||
      customerName.includes(searchLower) ||
      productName.includes(searchLower)
    );
  });

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" /> Completed
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <RefreshCw className="h-3 w-3 mr-1" /> Refunded
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            <X className="h-3 w-3 mr-1" /> Failed
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const exportOrders = () => {
    // Create CSV data
    const headers = ['Order ID', 'Date', 'Customer', 'Product', 'Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.id,
        formatDate(order.created_at),
        `${order.customer?.full_name || 'Unnamed'} (${order.customer?.email || 'No email'})`,
        order.product?.name || 'Unknown Product',
        formatCurrency(order.price - (order.discount_applied || 0)),
        order.status
      ].join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'orders.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate total revenue
  const totalRevenue = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + (order.price - (order.discount_applied || 0)), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
      <p className="mt-2 text-gray-600">View and manage your product orders</p>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{orders.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Completed Orders</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              {orders.filter(o => o.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Refund Rate</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {orders.length > 0 
                ? `${(orders.filter(o => o.status === 'refunded').length / orders.length * 100).toFixed(1)}%` 
                : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 bg-white shadow-sm rounded-lg">
        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center">
              <div className="relative inline-block text-left">
                <div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="min-w-40"
                    leftIcon={<Filter className="h-4 w-4" />}
                  >
                    Filter: {filter === 'all' ? 'All Orders' : `${filter.charAt(0).toUpperCase()}${filter.slice(1)}`}
                  </Button>
                </div>
                <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      className={`block px-4 py-2 text-sm w-full text-left ${filter === 'all' ? 'text-purple-700 bg-purple-50' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setFilter('all')}
                    >
                      All Orders
                    </button>
                    <button
                      className={`block px-4 py-2 text-sm w-full text-left ${filter === 'completed' ? 'text-purple-700 bg-purple-50' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setFilter('completed')}
                    >
                      Completed
                    </button>
                    <button
                      className={`block px-4 py-2 text-sm w-full text-left ${filter === 'pending' ? 'text-purple-700 bg-purple-50' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setFilter('pending')}
                    >
                      Pending
                    </button>
                    <button
                      className={`block px-4 py-2 text-sm w-full text-left ${filter === 'refunded' ? 'text-purple-700 bg-purple-50' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setFilter('refunded')}
                    >
                      Refunded
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 w-full md:w-auto justify-between sm:justify-start">
            <Button 
              variant="outline" 
              size="sm"
              leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
              onClick={refreshOrders}
              disabled={isRefreshing}
            >
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={exportOrders}
            >
              Export
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
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
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">
                            {order.customer?.full_name?.charAt(0) || order.customer?.email?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer?.full_name || 'Unnamed Customer'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.customer?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.product?.name || 'Unknown Product'}</div>
                      <div className="text-xs text-gray-500">{order.product?.type || 'Other'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.price - (order.discount_applied || 0))}
                      {order.discount_applied && (
                        <div className="text-xs text-green-600">
                          {formatCurrency(order.discount_applied)} discount
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<FileText className="h-4 w-4" />}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center">
                      <ShoppingBag className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-gray-600 font-medium mb-1">No orders found</p>
                      {searchQuery || filter !== 'all' ? (
                        <p>Try adjusting your search or filter</p>
                      ) : (
                        <p>You don't have any orders yet</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>
    </div>
  );
};