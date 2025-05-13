import React, { useState, useEffect } from 'react';
import { DollarSign, Users, ShoppingBag, Calendar, TrendingUp, RefreshCw, Filter } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AnalyticsCard } from '../../components/dashboard/AnalyticsCard';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { getDashboardAnalytics, getMonthlyRevenueData, getRevenueByProductType } from '../../services/dashboardService';

export const CreatorAnalyticsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  
  // Analytics data states
  const [stats, setStats] = useState({
    revenue: { value: 0, change: 0 },
    customers: { value: 0, change: 0 },
    sales: { value: 0, change: 0 },
    conversionRate: { value: 0, change: 0 }
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [revenueByType, setRevenueByType] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  
  useEffect(() => {
    if (!user) return;
    
    fetchCreatorId();
  }, [user]);
  
  useEffect(() => {
    if (creatorId) {
      fetchAnalyticsData();
    }
  }, [creatorId, timeRange]);
  
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
      }
    } catch (err) {
      console.error('Error fetching creator ID:', err);
      setError('Could not fetch your creator profile.');
      setLoading(false);
    }
  };
  
  const fetchAnalyticsData = async () => {
    if (!creatorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Determine the time range in days
      const rangeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      
      // Get dashboard analytics data
      const analytics = await getDashboardAnalytics(creatorId, rangeDays);
      setStats({
        revenue: {
          value: analytics.revenue.value,
          change: analytics.revenue.change
        },
        customers: {
          value: analytics.customers.value, 
          change: analytics.customers.change
        },
        sales: {
          value: analytics.sales.value, 
          change: analytics.sales.change
        },
        conversionRate: {
          value: analytics.conversionRate.value, 
          change: analytics.conversionRate.change
        }
      });
      
      setTopProducts(analytics.topProducts || []);
      
      // Get monthly revenue data (for charts)
      const monthsToFetch = timeRange === '7d' ? 1 : timeRange === '30d' ? 3 : timeRange === '90d' ? 6 : 12;
      const monthlyData = await getMonthlyRevenueData(creatorId, monthsToFetch);
      setMonthlyRevenue(monthlyData);
      
      // Get revenue by product type
      const typeData = await getRevenueByProductType(creatorId, rangeDays);
      setRevenueByType(typeData);
      
      // Get top customers
      await fetchTopCustomers(creatorId, rangeDays);
      
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTopCustomers = async (creatorId: string, timeRange: number) => {
    try {
      // Get all product IDs for this creator
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('creator_id', creatorId);
      
      if (!products || products.length === 0) {
        setTopCustomers([]);
        return;
      }
      
      const productIds = products.map(p => p.id);
      
      // Set date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);
      
      // Get all completed purchases grouped by customer
      const { data: purchases } = await supabase
        .from('purchases')
        .select('customer_id, price, discount_applied, created_at')
        .in('product_id', productIds)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());
      
      if (!purchases || purchases.length === 0) {
        setTopCustomers([]);
        return;
      }
      
      // Group by customer and calculate total spent
      const customerMap = new Map();
      
      purchases.forEach(purchase => {
        const customerId = purchase.customer_id;
        const amount = purchase.price - (purchase.discount_applied || 0);
        
        if (customerMap.has(customerId)) {
          const customer = customerMap.get(customerId);
          customer.purchases += 1;
          customer.spent += amount;
        } else {
          customerMap.set(customerId, { 
            id: customerId, 
            purchases: 1, 
            spent: amount 
          });
        }
      });
      
      // Convert to array and sort by total spent
      const sortedCustomers = Array.from(customerMap.values())
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);
      
      // Get customer details
      const customerIds = sortedCustomers.map(c => c.id);
      const { data: customerDetails } = await supabase
        .from('users')
        .select('id, email, full_name, last_login_at')
        .in('id', customerIds);
      
      // Merge customer details with spending data
      const topCustomersWithDetails = sortedCustomers.map(customer => {
        const details = (customerDetails || []).find(c => c.id === customer.id) || {
          email: 'unknown@email.com',
          full_name: 'Unknown Customer',
          last_login_at: null
        };
        
        return {
          ...customer,
          email: details.email,
          name: details.full_name,
          lastLogin: details.last_login_at
        };
      });
      
      setTopCustomers(topCustomersWithDetails);
    } catch (error) {
      console.error('Error fetching top customers:', error);
    }
  };

  const refreshData = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last 12 Months';
      default: return 'Last 30 Days';
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">Track your store's performance and growth</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-md shadow-sm">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                  timeRange === '7d' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setTimeRange('7d')}
              >
                7D
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-sm font-medium ${
                  timeRange === '30d' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setTimeRange('30d')}
              >
                30D
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-sm font-medium ${
                  timeRange === '90d' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setTimeRange('90d')}
              >
                90D
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                  timeRange === '1y' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setTimeRange('1y')}
              >
                1Y
              </button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
            disabled={refreshing}
          >
            Refresh Data
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">Performance Overview for {getTimeRangeLabel()}</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <AnalyticsCard 
              title="Total Revenue" 
              value={formatCurrency(stats.revenue.value)}
              change={stats.revenue.change}
              period={`from previous ${timeRange}`}
              icon={<DollarSign className="h-5 w-5 text-purple-700" />}
            />
            <AnalyticsCard 
              title="Total Orders" 
              value={stats.sales.value.toString()}
              change={stats.sales.change}
              period={`from previous ${timeRange}`}
              icon={<ShoppingBag className="h-5 w-5 text-orange-500" />}
            />
            <AnalyticsCard 
              title="Customers" 
              value={stats.customers.value.toString()}
              change={stats.customers.change}
              period={`from previous ${timeRange}`}
              icon={<Users className="h-5 w-5 text-teal-600" />}
            />
            <AnalyticsCard 
              title="Conversion Rate" 
              value={`${stats.conversionRate.value}%`}
              change={stats.conversionRate.change}
              period={`from previous ${timeRange}`}
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            />
          </div>
          
          {/* Revenue chart placeholder */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Revenue Over Time</h3>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Filter
              </Button>
            </div>
            <div className="h-80 bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center justify-center">
              {monthlyRevenue.length > 0 ? (
                <div className="w-full h-full">
                  <div className="flex justify-between mb-4">
                    <div className="text-xs text-gray-500">
                      {monthlyRevenue[0]?.month}
                    </div>
                    <div className="text-xs text-gray-500">
                      {monthlyRevenue[monthlyRevenue.length - 1]?.month}
                    </div>
                  </div>
                  <div className="relative h-4/5">
                    <div className="absolute bottom-0 left-0 right-0 flex items-end h-full">
                      {monthlyRevenue.map((item, index) => {
                        // Calculate max amount for relative heights
                        const maxAmount = Math.max(...monthlyRevenue.map(i => i.amount));
                        const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                        // Format month label
                        const monthLabel = new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' });
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-4/5 bg-purple-500 rounded-t"
                              style={{ height: `${height}%` }}
                              title={`${formatCurrency(item.amount)}`}
                            />
                            <div className="text-xs mt-2 text-gray-500">{monthLabel}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No revenue data available for this period</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product.id || index} className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-md overflow-hidden">
                      {product.thumbnail ? (
                        <img 
                          src={product.thumbnail} 
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                          <ShoppingBag className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                      <div className="mt-1 flex justify-between">
                        <p className="text-sm text-gray-500">{product.sales} sales</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-500">No product data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers</h3>
            <div className="space-y-4">
              {topCustomers.length > 0 ? (
                topCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-medium">
                        {customer.name?.charAt(0) || customer.email?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{customer.name || 'Unknown'}</h4>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(customer.spent)}</p>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <p className="text-xs text-gray-500">{customer.email}</p>
                        <p className="text-xs text-gray-500">{customer.purchases} orders</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Users className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-500">No customer data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Product Type</h3>
            
            {revenueByType.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-4">
                    {revenueByType.map((item, index) => {
                      // Calculate percentage of total
                      const totalRevenue = revenueByType.reduce((sum, i) => sum + i.amount, 0);
                      const percentage = totalRevenue > 0 ? ((item.amount / totalRevenue) * 100).toFixed(1) : '0';
                      
                      const getTypeColor = (type: string) => {
                        switch (type) {
                          case 'download': return 'bg-purple-500';
                          case 'course': return 'bg-blue-500';
                          case 'membership': return 'bg-green-500';
                          case 'webinar': return 'bg-orange-500';
                          default: return 'bg-gray-500';
                        }
                      };
                      
                      return (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${getTypeColor(item.type)} h-2 rounded-full`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500 text-right">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">
                          {formatCurrency(revenueByType.reduce((sum, i) => sum + i.amount, 0))}
                        </div>
                        <div className="text-sm text-gray-500">Total Revenue</div>
                      </div>
                    </div>
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {revenueByType.map((item, index) => {
                        const totalRevenue = revenueByType.reduce((sum, i) => sum + i.amount, 0);
                        const percentage = totalRevenue > 0 ? (item.amount / totalRevenue) : 0;
                        
                        // Calculate the circle segment
                        let cumulativePercentage = 0;
                        for (let i = 0; i < index; i++) {
                          const itemPercentage = totalRevenue > 0 ? (revenueByType[i].amount / totalRevenue) : 0;
                          cumulativePercentage += itemPercentage;
                        }
                        
                        const startAngle = cumulativePercentage * 360;
                        const endAngle = (cumulativePercentage + percentage) * 360;
                        
                        // SVG arcs are complex - this is a simplified approach
                        const getColor = (type: string) => {
                          switch (type) {
                            case 'download': return '#8b5cf6'; // Purple
                            case 'course': return '#3b82f6'; // Blue
                            case 'membership': return '#10b981'; // Green
                            case 'webinar': return '#f97316'; // Orange
                            default: return '#6b7280'; // Gray
                          }
                        };
                        
                        const radius = 25;
                        const center = 50;
                        
                        // Convert angle to radians and calculate coordinates
                        const startRad = (startAngle - 90) * Math.PI / 180;
                        const endRad = (endAngle - 90) * Math.PI / 180;
                        
                        const x1 = center + radius * Math.cos(startRad);
                        const y1 = center + radius * Math.sin(startRad);
                        const x2 = center + radius * Math.cos(endRad);
                        const y2 = center + radius * Math.sin(endRad);
                        
                        // Determine if the arc should be drawn the long way around
                        const largeArcFlag = percentage > 0.5 ? 1 : 0;
                        
                        if (percentage < 0.01) return null; // Don't draw tiny segments
                        
                        return (
                          <path
                            key={index}
                            d={`M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`}
                            fill={getColor(item.type)}
                          />
                        );
                      })}
                      <circle cx="50" cy="50" r="15" fill="white" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="mt-2 text-gray-500">No revenue data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};