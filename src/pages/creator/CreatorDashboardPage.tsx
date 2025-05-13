import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, Users, ShoppingBag, TrendingUp, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SubscriptionStatus } from '../../components/payment/SubscriptionStatus';
import { AnalyticsCard } from '../../components/dashboard/AnalyticsCard';
import { ProductCard } from '../../components/products/ProductCard';
import { Product } from '../../types';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useSubscription } from '../../hooks/useSubscription';
import { getSubscriptionDetails } from '../../lib/checkout';
import { getDashboardAnalytics, getMonthlyRevenueData, getRevenueByProductType } from '../../services/dashboardService';

export const CreatorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    revenue: { value: 0, change: 0 },
    customers: { value: 0, change: 0 },
    sales: { value: 0, change: 0 },
    conversionRate: { value: 0, change: 0 }
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [revenueByType, setRevenueByType] = useState<any[]>([]);
  
  useEffect(() => {
    if (!user) return;
    
    fetchData();
  }, [user]);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (creatorError) throw creatorError;
      
      setCreatorProfile(creatorData);
      
      // Fetch creator's products
      if (creatorData) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('creator_id', creatorData.id)
          .order('created_at', { ascending: false });
            
        if (productsError) throw productsError;
        
        // Transform products data
        if (productsData) {
          // Make sure we only show products created by this creator
          const transformedProducts: Product[] = (productsData || []).map(item => ({
            id: item.id,
            creatorId: item.creator_id,
            name: item.name,
            description: item.description,
            type: item.type as any,
            price: item.price,
            discountPrice: item.discount_price,
            thumbnail: item.thumbnail,
            featured: item.featured,
            publishedAt: item.published_at ? new Date(item.published_at) : undefined,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));
          
          setProducts(transformedProducts);
        }
        
        // Fetch dashboard analytics
        const analytics = await getDashboardAnalytics(creatorData.id);
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
        
        setRecentSales(analytics.recentSales || []);
        setTopProducts(analytics.topProducts || []);
        
        // Fetch chart data
        const monthlyData = await getMonthlyRevenueData(creatorData.id);
        setMonthlyRevenue(monthlyData);
        
        const typeData = await getRevenueByProductType(creatorData.id);
        setRevenueByType(typeData);
      }
    } catch (error) {
      console.error('Error fetching creator data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Get subscription plan details
  const subscriptionPlan = subscription?.priceId 
    ? getSubscriptionDetails(subscription.priceId)
    : null;

  const viewProductDetails = (product: Product) => {
    navigate(`/product/${product.id}`);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
          <div className="mt-2 text-gray-600">
            <p>Welcome back, {user?.user_metadata?.full_name || 'Creator'}</p>
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
      
      {error && (
        <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}
      
      {/* Subscription Status */}
      <div className="mt-6">
        <SubscriptionStatus />
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard 
          title="Total Revenue" 
          value={formatCurrency(stats.revenue.value)} 
          change={stats.revenue.change} 
          icon={<DollarSign className="h-5 w-5 text-purple-700" />}
        />
        <AnalyticsCard 
          title="Total Customers" 
          value={stats.customers.value.toString()} 
          change={stats.customers.change} 
          icon={<Users className="h-5 w-5 text-teal-600" />}
        />
        <AnalyticsCard 
          title="Products Sold" 
          value={stats.sales.value.toString()} 
          change={stats.sales.change} 
          icon={<ShoppingBag className="h-5 w-5 text-orange-500" />}
        />
        <AnalyticsCard 
          title="Conversion Rate" 
          value={`${stats.conversionRate.value}%`} 
          change={stats.conversionRate.change} 
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
        />
      </div>
      
      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
          <Button 
            onClick={() => navigate('/creator/products/new')}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            Add New Product
          </Button>
        </div>
        
        {products.length === 0 ? (
          <div className="mt-6 text-center py-12 bg-white rounded-lg shadow-sm">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No products yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first product.
            </p>
            <div className="mt-6">
              <Button 
                onClick={() => navigate('/creator/products/new')}
                leftIcon={<Plus className="h-5 w-5" />}
              >
                Add New Product
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onView={() => navigate(`/creator/products/edit/${product.id}`)}
              />
            ))}
          </div>
        )}
        
        {products.length > 4 && (
          <div className="mt-8 text-center">
            <Link to="/creator/products">
              <Button variant="outline">
                View All Products
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Recent sales and top products */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sales</h3>
          {recentSales.length > 0 ? (
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm font-medium">
                      {sale.customer.full_name?.charAt(0) || sale.customer.email?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{sale.customer.full_name || 'Customer'}</h4>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(sale.price - (sale.discount_applied || 0))}</p>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <p className="text-xs text-gray-500">{sale.product?.name || 'Product'}</p>
                      <p className="text-xs text-gray-500">{formatDate(sale.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No sales data available yet</p>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product) => (
                <div key={product.id} className="flex items-center">
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No product data available yet</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick stats */}
      <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">This Month's Summary</h2>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-800">Published Products</h3>
            <p className="mt-2 text-3xl font-semibold text-purple-900">
              {products.filter(p => p.publishedAt).length}
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800">Total Earnings</h3>
            <p className="mt-2 text-3xl font-semibold text-green-900">
              {formatCurrency(stats.revenue.value)}
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800">Average Order Value</h3>
            <p className="mt-2 text-3xl font-semibold text-blue-900">
              {stats.sales.value > 0 
                ? formatCurrency(stats.revenue.value / stats.sales.value) 
                : '$0.00'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};