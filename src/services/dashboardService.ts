import { supabase } from '../lib/supabase';

/**
 * Get dashboard analytics data for a creator
 * @param creatorId The ID of the creator
 * @param timeRange Optional time range in days (default: 30)
 * @returns Dashboard metrics
 */
export const getDashboardAnalytics = async (
  creatorId: string,
  timeRange: number = 30
): Promise<{
  revenue: { value: number; change: number };
  customers: { value: number; change: number };
  sales: { value: number; change: number };
  conversionRate: { value: number; change: number };
  recentSales: any[];
  topProducts: any[];
}> => {
  try {
    // Set date ranges for current and previous periods
    const now = new Date();
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(now.getDate() - timeRange);
    
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - timeRange);
    
    // Format dates for queries
    const currentPeriodStartStr = currentPeriodStart.toISOString();
    const previousPeriodStartStr = previousPeriodStart.toISOString();
    const nowStr = now.toISOString();
    
    // Get all product IDs for this creator
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('creator_id', creatorId);
    
    if (!products || products.length === 0) {
      return {
        revenue: { value: 0, change: 0 },
        customers: { value: 0, change: 0 },
        sales: { value: 0, change: 0 },
        conversionRate: { value: 0, change: 0 },
        recentSales: [],
        topProducts: []
      };
    }
    
    const productIds = products.map(p => p.id);
    
    // Get current period sales data
    const { data: currentSales } = await supabase
      .from('purchases')
      .select('id, customer_id, product_id, price, discount_applied, created_at')
      .in('product_id', productIds)
      .eq('status', 'completed')
      .gte('created_at', currentPeriodStartStr)
      .lte('created_at', nowStr);
    
    // Get previous period sales data
    const { data: previousSales } = await supabase
      .from('purchases')
      .select('id, customer_id, product_id, price, discount_applied, created_at')
      .in('product_id', productIds)
      .eq('status', 'completed')
      .gte('created_at', previousPeriodStartStr)
      .lt('created_at', currentPeriodStartStr);
    
    // Calculate metrics for current period
    const currentRevenue = (currentSales || []).reduce((sum, sale) => 
      sum + (sale.price - (sale.discount_applied || 0)), 0);
      
    const currentUniqueCustomers = new Set((currentSales || []).map(sale => sale.customer_id)).size;
    const currentSalesCount = (currentSales || []).length;
    
    // Calculate metrics for previous period (for change calculation)
    const previousRevenue = (previousSales || []).reduce((sum, sale) => 
      sum + (sale.price - (sale.discount_applied || 0)), 0);
      
    const previousUniqueCustomers = new Set((previousSales || []).map(sale => sale.customer_id)).size;
    const previousSalesCount = (previousSales || []).length;
    
    // Calculate percentage changes
    const calculatePercentChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    const revenueChange = calculatePercentChange(currentRevenue, previousRevenue);
    const customersChange = calculatePercentChange(currentUniqueCustomers, previousUniqueCustomers);
    const salesChange = calculatePercentChange(currentSalesCount, previousSalesCount);
    
    // Get store visits data for conversion rate (simplified using store_users as proxy)
    const { data: currentVisitors } = await supabase
      .from('store_users')
      .select('id')
      .eq('creator_id', creatorId)
      .gte('created_at', currentPeriodStartStr);
    
    const { data: previousVisitors } = await supabase
      .from('store_users')
      .select('id')
      .eq('creator_id', creatorId)
      .gte('created_at', previousPeriodStartStr)
      .lt('created_at', currentPeriodStartStr);
    
    // Calculate conversion rates
    const currentVisitorCount = (currentVisitors || []).length;
    const previousVisitorCount = (previousVisitors || []).length;
    
    const currentConversionRate = currentVisitorCount > 0 
      ? (currentSalesCount / currentVisitorCount) * 100
      : 0;
      
    const previousConversionRate = previousVisitorCount > 0
      ? (previousSalesCount / previousVisitorCount) * 100
      : 0;
      
    const conversionRateChange = calculatePercentChange(currentConversionRate, previousConversionRate);
    
    // Get recent sales with customer and product info (last 5)
    const { data: recentSalesData } = await supabase
      .from('purchases')
      .select(`
        id, 
        price, 
        discount_applied, 
        status, 
        created_at,
        product:products(id, name, type)
      `)
      .in('product_id', productIds)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);
      
    // Get customer info
    const recentCustomerIds = (recentSalesData || []).map(sale => sale.customer_id);
    const { data: recentCustomers } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', recentCustomerIds);
    
    // Merge customer info into recent sales
    const recentSales = (recentSalesData || []).map(sale => {
      const customer = (recentCustomers || []).find(c => c.id === sale.customer_id) || {
        email: 'unknown@example.com',
        full_name: 'Unknown Customer'
      };
      
      return {
        ...sale,
        customer
      };
    });
    
    // Get top selling products
    const productSaleMap = new Map();
    (currentSales || []).forEach(sale => {
      const productId = sale.product_id;
      const amount = sale.price - (sale.discount_applied || 0);
      
      if (productSaleMap.has(productId)) {
        const product = productSaleMap.get(productId);
        product.sales += 1;
        product.revenue += amount;
      } else {
        productSaleMap.set(productId, { productId, sales: 1, revenue: amount });
      }
    });
    
    // Convert map to array and sort by revenue
    let topProductsRevenue = Array.from(productSaleMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
    
    // Fetch product details
    if (topProductsRevenue.length > 0) {
      const topProductIds = topProductsRevenue.map(p => p.productId);
      const { data: productDetails } = await supabase
        .from('products')
        .select('id, name, thumbnail, type')
        .in('id', topProductIds);
        
      // Merge product details with sales data
      topProductsRevenue = topProductsRevenue.map(product => {
        const details = (productDetails || []).find(p => p.id === product.productId);
        return { ...product, ...details };
      });
    }
    
    return {
      revenue: { 
        value: currentRevenue, 
        change: parseFloat(revenueChange.toFixed(1))
      },
      customers: { 
        value: currentUniqueCustomers, 
        change: parseFloat(customersChange.toFixed(1))
      },
      sales: { 
        value: currentSalesCount, 
        change: parseFloat(salesChange.toFixed(1))
      },
      conversionRate: { 
        value: parseFloat(currentConversionRate.toFixed(1)), 
        change: parseFloat(conversionRateChange.toFixed(1))
      },
      recentSales,
      topProducts: topProductsRevenue
    };
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    throw error;
  }
};

/**
 * Get monthly revenue data for charts
 * @param creatorId The ID of the creator
 * @param months Number of months to include
 */
export const getMonthlyRevenueData = async (creatorId: string, months = 6) => {
  try {
    // Get all product IDs for this creator
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('creator_id', creatorId);
    
    if (!products || products.length === 0) {
      return [];
    }
    
    const productIds = products.map(p => p.id);
    
    // Get start date (first day of the month, N months ago)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    // Get all completed purchases in the date range
    const { data: purchases } = await supabase
      .from('purchases')
      .select('id, price, discount_applied, created_at')
      .in('product_id', productIds)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());
    
    if (!purchases || purchases.length === 0) {
      return [];
    }
    
    // Group by month and calculate revenue
    const monthlyRevenue = new Map();
    
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue.set(monthKey, 0);
    }
    
    purchases.forEach(purchase => {
      const date = new Date(purchase.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const amount = purchase.price - (purchase.discount_applied || 0);
      
      if (monthlyRevenue.has(monthKey)) {
        monthlyRevenue.set(monthKey, monthlyRevenue.get(monthKey) + amount);
      }
    });
    
    // Convert to array of objects sorted by date
    return Array.from(monthlyRevenue.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
  } catch (error) {
    console.error('Error fetching monthly revenue data:', error);
    throw error;
  }
};

/**
 * Get revenue data by product type
 * @param creatorId The ID of the creator
 * @param timeRange Optional time range in days (default: 30)
 */
export const getRevenueByProductType = async (creatorId: string, timeRange = 30) => {
  try {
    // Set date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    
    // Get all products for this creator with their type
    const { data: products } = await supabase
      .from('products')
      .select('id, type')
      .eq('creator_id', creatorId);
    
    if (!products || products.length === 0) {
      return [];
    }
    
    const productIds = products.map(p => p.id);
    
    // Get all completed purchases in the date range
    const { data: purchases } = await supabase
      .from('purchases')
      .select('id, product_id, price, discount_applied')
      .in('product_id', productIds)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());
    
    if (!purchases || purchases.length === 0) {
      return [];
    }
    
    // Create product type lookup
    const productTypeMap = new Map();
    products.forEach(product => {
      productTypeMap.set(product.id, product.type);
    });
    
    // Group purchases by product type and calculate revenue
    const typeRevenue = new Map();
    
    purchases.forEach(purchase => {
      const productType = productTypeMap.get(purchase.product_id);
      const amount = purchase.price - (purchase.discount_applied || 0);
      
      if (typeRevenue.has(productType)) {
        typeRevenue.set(productType, typeRevenue.get(productType) + amount);
      } else {
        typeRevenue.set(productType, amount);
      }
    });
    
    // Convert to array of objects
    return Array.from(typeRevenue.entries())
      .map(([type, amount]) => ({ type, amount }));
      
  } catch (error) {
    console.error('Error fetching revenue by product type:', error);
    throw error;
  }
};