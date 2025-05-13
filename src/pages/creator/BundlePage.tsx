import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Gift, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  DollarSign, 
  Tag,
  ShoppingBag,
  Package,
  X,
  RefreshCw,
  Copy,
  Eye,
  Check,
  Percent
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Product } from '../../types';

// Mock bundle data
const MOCK_BUNDLES = [
  {
    id: 'bundle-1',
    name: 'Complete Photography Bundle',
    description: 'Get all our photography courses at a discounted price',
    status: 'active',
    products: [
      {
        id: 'prod-1',
        name: 'Beginner Photography Course',
        price: 4900
      },
      {
        id: 'prod-2',
        name: 'Advanced Photography Masterclass',
        price: 9900
      },
      {
        id: 'prod-3',
        name: 'Lightroom Editing Course',
        price: 7900
      }
    ],
    regularPrice: 22700,
    bundlePrice: 17900,
    savings: 4800,
    savingsPercentage: 21,
    sales: 24,
    revenue: 429600,
    createdAt: '2025-04-10T10:00:00Z'
  },
  {
    id: 'bundle-2',
    name: 'Digital Marketing Essentials',
    description: 'Everything you need to start your digital marketing journey',
    status: 'active',
    products: [
      {
        id: 'prod-4',
        name: 'SEO Fundamentals',
        price: 5900
      },
      {
        id: 'prod-5',
        name: 'Social Media Marketing',
        price: 6900
      },
      {
        id: 'prod-6',
        name: 'Email Marketing Mastery',
        price: 4900
      }
    ],
    regularPrice: 17700,
    bundlePrice: 12900,
    savings: 4800,
    savingsPercentage: 27,
    sales: 18,
    revenue: 232200,
    createdAt: '2025-04-15T14:30:00Z'
  },
  {
    id: 'bundle-3',
    name: 'Fitness Program Bundle',
    description: 'Complete fitness and nutrition programs',
    status: 'inactive',
    products: [
      {
        id: 'prod-7',
        name: 'Home Workout Program',
        price: 3900
      },
      {
        id: 'prod-8',
        name: 'Nutrition Guide',
        price: 2900
      }
    ],
    regularPrice: 6800,
    bundlePrice: 4900,
    savings: 1900,
    savingsPercentage: 28,
    sales: 0,
    revenue: 0,
    createdAt: '2025-05-01T09:15:00Z'
  }
];

export const BundlePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [bundles, setBundles] = useState(MOCK_BUNDLES);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<any | null>(null);
  
  // Form state for creating/editing bundles
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    productIds: [] as string[],
    discountType: 'percentage',
    discountValue: 20
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
          fetchProducts(data.id);
        }
      } catch (err) {
        console.error('Error fetching creator ID:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCreatorId();
  }, [user]);
  
  const fetchProducts = async (creatorId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
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
  
  const calculateBundlePrice = (productIds: string[], discountType: string, discountValue: number) => {
    const selectedProducts = products.filter(p => productIds.includes(p.id));
    const regularPrice = selectedProducts.reduce((sum, product) => sum + product.price, 0);
    
    let bundlePrice;
    if (discountType === 'percentage') {
      bundlePrice = Math.round(regularPrice * (1 - discountValue / 100));
    } else {
      bundlePrice = Math.max(0, regularPrice - discountValue * 100);
    }
    
    const savings = regularPrice - bundlePrice;
    const savingsPercentage = regularPrice > 0 ? Math.round((savings / regularPrice) * 100) : 0;
    
    return {
      regularPrice,
      bundlePrice,
      savings,
      savingsPercentage
    };
  };
  
  const handleCreateBundle = () => {
    // In a real implementation, this would create a new bundle in the database
    const selectedProducts = products.filter(p => formData.productIds.includes(p.id));
    
    const { regularPrice, bundlePrice, savings, savingsPercentage } = calculateBundlePrice(
      formData.productIds,
      formData.discountType,
      formData.discountValue
    );
    
    const newBundle = {
      id: `bundle-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      status: 'active',
      products: selectedProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price
      })),
      regularPrice,
      bundlePrice,
      savings,
      savingsPercentage,
      sales: 0,
      revenue: 0,
      createdAt: new Date().toISOString()
    };
    
    setBundles([newBundle, ...bundles]);
    setIsCreateModalOpen(false);
    resetForm();
  };
  
  const handleEditBundle = () => {
    if (!selectedBundle) return;
    
    const selectedProducts = products.filter(p => formData.productIds.includes(p.id));
    
    const { regularPrice, bundlePrice, savings, savingsPercentage } = calculateBundlePrice(
      formData.productIds,
      formData.discountType,
      formData.discountValue
    );
    
    const updatedBundles = bundles.map(bundle => {
      if (bundle.id === selectedBundle.id) {
        return {
          ...bundle,
          name: formData.name,
          description: formData.description,
          products: selectedProducts.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price
          })),
          regularPrice,
          bundlePrice,
          savings,
          savingsPercentage
        };
      }
      return bundle;
    });
    
    setBundles(updatedBundles);
    setSelectedBundle(null);
    setIsCreateModalOpen(false);
    resetForm();
  };
  
  const handleDeleteBundle = (id: string) => {
    setBundles(bundles.filter(bundle => bundle.id !== id));
    setIsDeleteModalOpen(null);
  };
  
  const toggleBundleStatus = (id: string) => {
    setBundles(bundles.map(bundle => {
      if (bundle.id === id) {
        return {
          ...bundle,
          status: bundle.status === 'active' ? 'inactive' : 'active'
        };
      }
      return bundle;
    }));
  };
  
  const editBundle = (bundle: any) => {
    setSelectedBundle(bundle);
    
    // Calculate discount value based on original and bundle price
    let discountValue;
    let discountType = 'percentage';
    
    const discountAmount = bundle.regularPrice - bundle.bundlePrice;
    const discountPercentage = Math.round((discountAmount / bundle.regularPrice) * 100);
    
    // If the discount is a clean percentage, use percentage, otherwise use fixed amount
    if (discountPercentage % 5 === 0) {
      discountType = 'percentage';
      discountValue = discountPercentage;
    } else {
      discountType = 'fixed';
      discountValue = discountAmount / 100; // Convert cents to dollars
    }
    
    setFormData({
      name: bundle.name,
      description: bundle.description,
      productIds: bundle.products.map((p: any) => p.id),
      discountType,
      discountValue
    });
    
    setIsCreateModalOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      productIds: [],
      discountType: 'percentage',
      discountValue: 20
    });
  };
  
  const handleProductSelection = (productId: string) => {
    setFormData(prev => {
      if (prev.productIds.includes(productId)) {
        return {
          ...prev,
          productIds: prev.productIds.filter(id => id !== productId)
        };
      } else {
        return {
          ...prev,
          productIds: [...prev.productIds, productId]
        };
      }
    });
  };
  
  const filteredBundles = bundles.filter(bundle => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      bundle.name.toLowerCase().includes(query) ||
      bundle.description.toLowerCase().includes(query) ||
      bundle.products.some((p: any) => p.name.toLowerCase().includes(query))
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
          <h1 className="text-3xl font-bold text-gray-900">Product Bundles</h1>
          <p className="mt-1 text-gray-600">Create and manage product bundles to increase sales</p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setSelectedBundle(null);
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          Create Bundle
        </Button>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search bundles..."
            className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
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
      
      {filteredBundles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBundles.map((bundle) => (
            <Card key={bundle.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{bundle.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{bundle.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    bundle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {bundle.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Bundle Products</h4>
                    <span className="text-xs text-gray-500">{bundle.products.length} products</span>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {bundle.products.map((product: any) => (
                      <div key={product.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                        <span className="text-sm text-gray-700">{product.name}</span>
                        <span className="text-xs text-gray-500">{formatCurrency(product.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 bg-purple-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-purple-700">Bundle Price</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(bundle.bundlePrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-purple-700">Regular Price</p>
                      <p className="text-sm text-gray-500 line-through">{formatCurrency(bundle.regularPrice)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <Percent className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">
                      Save {formatCurrency(bundle.savings)} ({bundle.savingsPercentage}% off)
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Sales</p>
                    <p className="text-sm font-medium text-gray-900">{bundle.sales}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(bundle.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(bundle.createdAt)}</p>
                  </div>
                </div>
                
                <div className="mt-5 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    leftIcon={<Edit className="h-4 w-4" />}
                    onClick={() => editBundle(bundle)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={bundle.status === 'active' ? 'outline' : 'primary'}
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleBundleStatus(bundle.id)}
                  >
                    {bundle.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={() => setIsDeleteModalOpen(bundle.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Gift className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No product bundles found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery ? 'Try adjusting your search query.' : 'Get started by creating your first product bundle.'}
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => {
                setSelectedBundle(null);
                resetForm();
                setIsCreateModalOpen(true);
              }}
              leftIcon={<Plus className="h-5 w-5" />}
            >
              Create Product Bundle
            </Button>
          </div>
        </div>
      )}
      
      {/* Create/Edit Bundle Modal */}
      {isCreateModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsCreateModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedBundle ? 'Edit Product Bundle' : 'Create Product Bundle'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Bundle Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="e.g., Complete Photography Bundle"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={2}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Brief description of this bundle"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Products for Bundle*
                    </label>
                    <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                      {products.length > 0 ? (
                        products.map(product => (
                          <div 
                            key={product.id} 
                            className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`product-${product.id}`}
                                checked={formData.productIds.includes(product.id)}
                                onChange={() => handleProductSelection(product.id)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`product-${product.id}`} className="ml-3 block text-sm text-gray-700">
                                {product.name}
                              </label>
                            </div>
                            <span className="text-xs text-gray-500">{formatCurrency(product.price)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No products available
                        </div>
                      )}
                    </div>
                    {formData.productIds.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.productIds.length} products selected
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Type
                      </label>
                      <select
                        id="discountType"
                        value={formData.discountType}
                        onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Value
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {formData.discountType === 'percentage' ? (
                            <span className="text-gray-500 sm:text-sm">%</span>
                          ) : (
                            <DollarSign className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <input
                          type="number"
                          id="discountValue"
                          value={formData.discountValue}
                          onChange={(e) => setFormData({...formData, discountValue: parseFloat(e.target.value) || 0})}
                          min="0"
                          max={formData.discountType === 'percentage' ? 100 : undefined}
                          step={formData.discountType === 'percentage' ? 1 : 0.01}
                          className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {formData.productIds.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Bundle Preview</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Regular Price:</span>
                          <span className="text-sm text-gray-600 line-through">
                            {formatCurrency(calculateBundlePrice(formData.productIds, formData.discountType, formData.discountValue).regularPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">Bundle Price:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(calculateBundlePrice(formData.productIds, formData.discountType, formData.discountValue).bundlePrice)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-green-600">Customer Savings:</span>
                          <span className="text-xs text-green-600">
                            {formatCurrency(calculateBundlePrice(formData.productIds, formData.discountType, formData.discountValue).savings)} 
                            ({calculateBundlePrice(formData.productIds, formData.discountType, formData.discountValue).savingsPercentage}% off)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={selectedBundle ? handleEditBundle : handleCreateBundle}
                  className="sm:ml-3"
                  disabled={!formData.name || formData.productIds.length < 2}
                >
                  {selectedBundle ? 'Update Bundle' : 'Create Bundle'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setSelectedBundle(null);
                  }}
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
                      Delete Bundle
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this bundle? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="danger"
                  onClick={() => handleDeleteBundle(isDeleteModalOpen)}
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
      
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Bundle Best Practices</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="ml-3 font-medium text-purple-900">Complementary Products</h3>
                </div>
                <p className="text-sm text-purple-700">
                  Bundle products that naturally go together. Customers are more likely to purchase bundles when the products complement each other.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="ml-3 font-medium text-blue-900">Clear Value Proposition</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Make the savings obvious. Clearly show how much customers save by purchasing the bundle compared to buying products individually.
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Tag className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="ml-3 font-medium text-green-900">Themed Bundles</h3>
                </div>
                <p className="text-sm text-green-700">
                  Create bundles around specific themes or goals. For example, "Beginner's Kit," "Complete Solution," or "Ultimate Package."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};