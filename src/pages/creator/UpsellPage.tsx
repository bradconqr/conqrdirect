import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  Edit, 
  Trash2, 
  DollarSign, 
  Tag,
  ShoppingBag,
  CheckCircle,
  X,
  RefreshCw,
  Copy,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Product } from '../../types';

// Mock upsell offers data
const MOCK_UPSELLS = [
  {
    id: 'upsell-1',
    name: 'Course Upgrade Offer',
    description: 'Offer premium course access after basic course purchase',
    status: 'active',
    triggerProduct: {
      id: 'prod-1',
      name: 'Beginner Photography Course',
      price: 4900
    },
    offerProduct: {
      id: 'prod-2',
      name: 'Advanced Photography Masterclass',
      price: 9900,
      discountPrice: 7900
    },
    conversionRate: 32,
    revenue: 237000,
    impressions: 100,
    createdAt: '2025-04-15T10:00:00Z'
  },
  {
    id: 'upsell-2',
    name: 'E-book Bundle Offer',
    description: 'Offer related e-books after first purchase',
    status: 'active',
    triggerProduct: {
      id: 'prod-3',
      name: 'Digital Marketing Basics E-book',
      price: 1900
    },
    offerProduct: {
      id: 'prod-4',
      name: 'Social Media Strategy E-book',
      price: 2900,
      discountPrice: 1900
    },
    conversionRate: 45,
    revenue: 85500,
    impressions: 100,
    createdAt: '2025-04-20T14:30:00Z'
  },
  {
    id: 'upsell-3',
    name: 'Membership Upgrade',
    description: 'Offer yearly membership after monthly purchase',
    status: 'inactive',
    triggerProduct: {
      id: 'prod-5',
      name: 'Monthly Membership',
      price: 2900
    },
    offerProduct: {
      id: 'prod-6',
      name: 'Yearly Membership',
      price: 29900,
      discountPrice: 24900
    },
    conversionRate: 0,
    revenue: 0,
    impressions: 0,
    createdAt: '2025-05-01T09:15:00Z'
  }
];

export const UpsellPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [upsells, setUpsells] = useState(MOCK_UPSELLS);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<string | null>(null);
  const [selectedUpsell, setSelectedUpsell] = useState<any | null>(null);
  
  // Form state for creating/editing upsells
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerProductId: '',
    offerProductId: '',
    discountType: 'percentage',
    discountValue: 20,
    displayLocation: 'thank_you_page',
    isLimitedTimeOffer: false,
    expirationTime: 15
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
  
  const handleCreateUpsell = () => {
    // In a real implementation, this would create a new upsell in the database
    const triggerProduct = products.find(p => p.id === formData.triggerProductId);
    const offerProduct = products.find(p => p.id === formData.offerProductId);
    
    if (!triggerProduct || !offerProduct) return;
    
    // Calculate discounted price based on discount type and value
    let discountPrice;
    if (formData.discountType === 'percentage') {
      discountPrice = Math.round(offerProduct.price * (1 - formData.discountValue / 100));
    } else {
      discountPrice = Math.max(0, offerProduct.price - formData.discountValue * 100);
    }
    
    const newUpsell = {
      id: `upsell-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      status: 'active',
      triggerProduct: {
        id: triggerProduct.id,
        name: triggerProduct.name,
        price: triggerProduct.price
      },
      offerProduct: {
        id: offerProduct.id,
        name: offerProduct.name,
        price: offerProduct.price,
        discountPrice: discountPrice
      },
      conversionRate: 0,
      revenue: 0,
      impressions: 0,
      createdAt: new Date().toISOString(),
      displayLocation: formData.displayLocation,
      isLimitedTimeOffer: formData.isLimitedTimeOffer,
      expirationTime: formData.expirationTime
    };
    
    setUpsells([newUpsell, ...upsells]);
    setIsCreateModalOpen(false);
    resetForm();
  };
  
  const handleEditUpsell = () => {
    if (!selectedUpsell) return;
    
    const triggerProduct = products.find(p => p.id === formData.triggerProductId);
    const offerProduct = products.find(p => p.id === formData.offerProductId);
    
    if (!triggerProduct || !offerProduct) return;
    
    // Calculate discounted price based on discount type and value
    let discountPrice;
    if (formData.discountType === 'percentage') {
      discountPrice = Math.round(offerProduct.price * (1 - formData.discountValue / 100));
    } else {
      discountPrice = Math.max(0, offerProduct.price - formData.discountValue * 100);
    }
    
    const updatedUpsells = upsells.map(upsell => {
      if (upsell.id === selectedUpsell.id) {
        return {
          ...upsell,
          name: formData.name,
          description: formData.description,
          triggerProduct: {
            id: triggerProduct.id,
            name: triggerProduct.name,
            price: triggerProduct.price
          },
          offerProduct: {
            id: offerProduct.id,
            name: offerProduct.name,
            price: offerProduct.price,
            discountPrice: discountPrice
          },
          displayLocation: formData.displayLocation,
          isLimitedTimeOffer: formData.isLimitedTimeOffer,
          expirationTime: formData.expirationTime
        };
      }
      return upsell;
    });
    
    setUpsells(updatedUpsells);
    setSelectedUpsell(null);
    setIsCreateModalOpen(false);
    resetForm();
  };
  
  const handleDeleteUpsell = (id: string) => {
    setUpsells(upsells.filter(upsell => upsell.id !== id));
    setIsDeleteModalOpen(null);
  };
  
  const toggleUpsellStatus = (id: string) => {
    setUpsells(upsells.map(upsell => {
      if (upsell.id === id) {
        return {
          ...upsell,
          status: upsell.status === 'active' ? 'inactive' : 'active'
        };
      }
      return upsell;
    }));
  };
  
  const editUpsell = (upsell: any) => {
    setSelectedUpsell(upsell);
    
    // Calculate discount value based on original and discounted price
    let discountValue;
    let discountType = 'percentage';
    
    if (upsell.offerProduct.discountPrice) {
      const discountAmount = upsell.offerProduct.price - upsell.offerProduct.discountPrice;
      const discountPercentage = Math.round((discountAmount / upsell.offerProduct.price) * 100);
      
      // If the discount is a clean percentage, use percentage, otherwise use fixed amount
      if (discountPercentage % 5 === 0) {
        discountType = 'percentage';
        discountValue = discountPercentage;
      } else {
        discountType = 'fixed';
        discountValue = discountAmount / 100; // Convert cents to dollars
      }
    } else {
      discountValue = 0;
    }
    
    setFormData({
      name: upsell.name,
      description: upsell.description,
      triggerProductId: upsell.triggerProduct.id,
      offerProductId: upsell.offerProduct.id,
      discountType: discountType,
      discountValue: discountValue,
      displayLocation: upsell.displayLocation || 'thank_you_page',
      isLimitedTimeOffer: upsell.isLimitedTimeOffer || false,
      expirationTime: upsell.expirationTime || 15
    });
    
    setIsCreateModalOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      triggerProductId: '',
      offerProductId: '',
      discountType: 'percentage',
      discountValue: 20,
      displayLocation: 'thank_you_page',
      isLimitedTimeOffer: false,
      expirationTime: 15
    });
  };
  
  const filteredUpsells = upsells.filter(upsell => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      upsell.name.toLowerCase().includes(query) ||
      upsell.description.toLowerCase().includes(query) ||
      upsell.triggerProduct.name.toLowerCase().includes(query) ||
      upsell.offerProduct.name.toLowerCase().includes(query)
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
          <h1 className="text-3xl font-bold text-gray-900">Upsell Offers</h1>
          <p className="mt-1 text-gray-600">Create and manage upsell offers to increase your average order value</p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setSelectedUpsell(null);
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          Create Upsell
        </Button>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search upsells..."
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
      
      {filteredUpsells.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUpsells.map((upsell) => (
            <Card key={upsell.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{upsell.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{upsell.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    upsell.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {upsell.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mt-4 space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <ShoppingBag className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Trigger Product</p>
                        <p className="text-sm font-medium text-gray-900">{upsell.triggerProduct.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(upsell.triggerProduct.price)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 text-purple-500 mr-2" />
                      <div>
                        <p className="text-xs text-purple-700">Upsell Offer</p>
                        <p className="text-sm font-medium text-gray-900">{upsell.offerProduct.name}</p>
                        <div className="flex items-center">
                          <p className="text-xs font-medium text-gray-900">{formatCurrency(upsell.offerProduct.discountPrice || upsell.offerProduct.price)}</p>
                          {upsell.offerProduct.discountPrice && (
                            <p className="text-xs text-gray-500 line-through ml-1">{formatCurrency(upsell.offerProduct.price)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Conversion</p>
                    <p className="text-sm font-medium text-gray-900">{upsell.conversionRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(upsell.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(upsell.createdAt)}</p>
                  </div>
                </div>
                
                <div className="mt-5 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    leftIcon={<Edit className="h-4 w-4" />}
                    onClick={() => editUpsell(upsell)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={upsell.status === 'active' ? 'outline' : 'primary'}
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleUpsellStatus(upsell.id)}
                  >
                    {upsell.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={() => setIsDeleteModalOpen(upsell.id)}
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
          <Zap className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No upsell offers found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery ? 'Try adjusting your search query.' : 'Get started by creating your first upsell offer.'}
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => {
                setSelectedUpsell(null);
                resetForm();
                setIsCreateModalOpen(true);
              }}
              leftIcon={<Plus className="h-5 w-5" />}
            >
              Create Upsell Offer
            </Button>
          </div>
        </div>
      )}
      
      {/* Create/Edit Upsell Modal */}
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
                  {selectedUpsell ? 'Edit Upsell Offer' : 'Create Upsell Offer'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Offer Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="e.g., Course Upgrade Offer"
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
                      placeholder="Brief description of this upsell offer"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="triggerProductId" className="block text-sm font-medium text-gray-700 mb-1">
                      Trigger Product*
                    </label>
                    <select
                      id="triggerProductId"
                      value={formData.triggerProductId}
                      onChange={(e) => setFormData({...formData, triggerProductId: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({formatCurrency(product.price)})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      The product that will trigger this upsell offer when purchased
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="offerProductId" className="block text-sm font-medium text-gray-700 mb-1">
                      Offer Product*
                    </label>
                    <select
                      id="offerProductId"
                      value={formData.offerProductId}
                      onChange={(e) => setFormData({...formData, offerProductId: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({formatCurrency(product.price)})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      The product you want to offer as an upsell
                    </p>
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
                  
                  <div>
                    <label htmlFor="displayLocation" className="block text-sm font-medium text-gray-700 mb-1">
                      Display Location
                    </label>
                    <select
                      id="displayLocation"
                      value={formData.displayLocation}
                      onChange={(e) => setFormData({...formData, displayLocation: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    >
                      <option value="thank_you_page">Thank You Page</option>
                      <option value="checkout_page">Checkout Page</option>
                      <option value="post_purchase_email">Post-Purchase Email</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Where this upsell offer will be displayed to customers
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="isLimitedTimeOffer"
                      name="isLimitedTimeOffer"
                      type="checkbox"
                      checked={formData.isLimitedTimeOffer}
                      onChange={(e) => setFormData({...formData, isLimitedTimeOffer: e.target.checked})}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isLimitedTimeOffer" className="ml-2 block text-sm text-gray-700">
                      Limited time offer
                    </label>
                  </div>
                  
                  {formData.isLimitedTimeOffer && (
                    <div>
                      <label htmlFor="expirationTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Offer Expires After (minutes)
                      </label>
                      <input
                        type="number"
                        id="expirationTime"
                        value={formData.expirationTime}
                        onChange={(e) => setFormData({...formData, expirationTime: parseInt(e.target.value) || 15})}
                        min="1"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={selectedUpsell ? handleEditUpsell : handleCreateUpsell}
                  className="sm:ml-3"
                  disabled={!formData.name || !formData.triggerProductId || !formData.offerProductId}
                >
                  {selectedUpsell ? 'Update Upsell' : 'Create Upsell'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setSelectedUpsell(null);
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
                      Delete Upsell Offer
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this upsell offer? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="danger"
                  onClick={() => handleDeleteUpsell(isDeleteModalOpen)}
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upsell Best Practices</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Tag className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="ml-3 font-medium text-purple-900">Relevant Offers</h3>
                </div>
                <p className="text-sm text-purple-700">
                  Make sure your upsell offers are relevant to the original purchase. Customers are more likely to accept offers that complement what they've already bought.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="ml-3 font-medium text-blue-900">Compelling Value</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Offer a special discount or exclusive deal that's only available as an upsell. This creates urgency and increases conversion rates.
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="ml-3 font-medium text-green-900">Clear Benefits</h3>
                </div>
                <p className="text-sm text-green-700">
                  Clearly communicate the benefits of accepting the upsell offer. Explain why it's valuable and how it enhances their original purchase.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};