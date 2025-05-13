import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { 
  Percent, 
  PlusCircle, 
  Trash2, 
  Edit2, 
  Clock, 
  Tag, 
  Calendar, 
  Copy, 
  CheckCircle,
  X
} from 'lucide-react';

interface Discount {
  id: string;
  creator_id: string;
  code: string;
  product_id: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  start_date: string | null;
  end_date: string | null;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
  product?: {
    name: string;
  } | null;
}

interface Product {
  id: string;
  name: string;
}

export const CreatorDiscountsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    productId: '',
    type: 'percentage',
    value: 10,
    startDate: '',
    endDate: '',
    maxUses: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [codeCopied, setCodeCopied] = useState<string | null>(null);

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
          fetchDiscounts(data.id);
          fetchProducts(data.id);
        }
      } catch (err: any) {
        console.error('Error fetching creator ID:', err);
        setError('Could not fetch your creator profile.');
        setLoading(false);
      }
    };

    fetchCreatorId();
  }, [user]);

  const fetchDiscounts = async (creatorId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('discounts')
        .select(`
          *,
          product:products(name)
        `)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDiscounts(data || []);
    } catch (err: any) {
      console.error('Error fetching discounts:', err);
      setError('Failed to load discounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (creatorId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('creator_id', creatorId)
        .order('name');

      if (error) throw error;

      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    }
  };

  const openCreateModal = () => {
    setIsEdit(false);
    setFormData({
      id: '',
      code: generateRandomCode(),
      productId: '',
      type: 'percentage',
      value: 10,
      startDate: '',
      endDate: '',
      maxUses: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (discount: Discount) => {
    setIsEdit(true);
    setFormData({
      id: discount.id,
      code: discount.code,
      productId: discount.product_id || '',
      type: discount.type,
      value: discount.value,
      startDate: discount.start_date || '',
      endDate: discount.end_date || '',
      maxUses: discount.max_uses?.toString() || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Discount code is required';
    }

    if (formData.type === 'percentage' && (formData.value < 1 || formData.value > 100)) {
      errors.value = 'Percentage must be between 1 and 100';
    }

    if (formData.type === 'fixed' && formData.value <= 0) {
      errors.value = 'Fixed amount must be greater than 0';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      errors.endDate = 'End date must be after start date';
    }

    if (formData.maxUses && parseInt(formData.maxUses) <= 0) {
      errors.maxUses = 'Maximum uses must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when field is changed
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !creatorId) return;
    
    setFormSubmitting(true);
    
    try {
      const discountData = {
        creator_id: creatorId,
        code: formData.code.toUpperCase(),
        product_id: formData.productId || null,
        type: formData.type,
        value: formData.type === 'percentage' ? formData.value : formData.value * 100, // Store in cents for fixed type
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        max_uses: formData.maxUses ? parseInt(formData.maxUses) : null,
      };
      
      if (isEdit) {
        // Update existing discount
        const { error } = await supabase
          .from('discounts')
          .update(discountData)
          .eq('id', formData.id);
          
        if (error) throw error;
      } else {
        // Create new discount
        const { error } = await supabase
          .from('discounts')
          .insert({
            ...discountData,
            current_uses: 0
          });
          
        if (error) throw error;
      }
      
      // Refresh discounts
      await fetchDiscounts(creatorId);
      closeModal();
    } catch (err: any) {
      console.error('Error saving discount:', err);
      setError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;
    
    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh discounts
      if (creatorId) {
        await fetchDiscounts(creatorId);
      }
    } catch (err: any) {
      console.error('Error deleting discount:', err);
      setError(err.message);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(
      () => {
        setCodeCopied(code);
        setTimeout(() => setCodeCopied(null), 2000);
      },
      (err) => console.error('Could not copy text: ', err)
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiration';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (discount: Discount) => {
    if (!discount.end_date) return false;
    return new Date(discount.end_date) < new Date();
  };

  const isMaxedOut = (discount: Discount) => {
    if (!discount.max_uses) return false;
    return discount.current_uses >= discount.max_uses;
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
      <h1 className="text-3xl font-bold text-gray-900">Discount Codes</h1>
      <p className="mt-2 text-gray-600">Create and manage discount codes for your products</p>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mt-8 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">All Discount Codes</h2>
          <p className="text-sm text-gray-600">{discounts.length} total discount codes</p>
        </div>
        <Button
          onClick={openCreateModal}
          leftIcon={<PlusCircle className="h-4 w-4" />}
        >
          Create New Discount
        </Button>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {discounts.length > 0 ? (
          discounts.map((discount) => (
            <Card key={discount.id} className={`${
              isExpired(discount) || isMaxedOut(discount) ? 'opacity-70' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-md">
                        <Percent className="h-5 w-5 text-purple-700" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {discount.type === 'percentage' 
                            ? `${discount.value}% Off` 
                            : formatCurrency(discount.value)}
                        </h3>
                        <div className="flex items-center mt-1">
                          <Tag className="h-3 w-3 text-gray-400 mr-1" />
                          <p className="text-sm text-gray-500">
                            {discount.product?.name || 'All products'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center">
                      <div className="bg-gray-100 py-1 px-2 rounded flex-1 flex justify-between items-center">
                        <code className="text-sm font-mono font-medium text-gray-800">
                          {discount.code}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(discount.code)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          {codeCopied === discount.code ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span>
                          Uses: {discount.current_uses}{discount.max_uses ? `/${discount.max_uses}` : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span>
                          {discount.start_date && `From ${formatDate(discount.start_date)}`}
                          {discount.start_date && discount.end_date && ' · '}
                          {discount.end_date && `Until ${formatDate(discount.end_date)}`}
                          {!discount.start_date && !discount.end_date && 'No date restrictions'}
                        </span>
                      </div>
                    </div>
                    
                    {(isExpired(discount) || isMaxedOut(discount)) && (
                      <div className="mt-3 text-sm flex items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          <X className="h-3 w-3 mr-1" />
                          {isExpired(discount) ? 'Expired' : 'Max uses reached'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    leftIcon={<Edit2 className="h-4 w-4" />}
                    onClick={() => openEditModal(discount)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4 text-red-500" />}
                    className="text-red-500"
                    onClick={() => deleteDiscount(discount.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
              <Percent className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No discount codes yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first discount code to offer special deals to your customers.
            </p>
            <div className="mt-6">
              <Button
                onClick={openCreateModal}
                leftIcon={<PlusCircle className="h-4 w-4" />}
              >
                Create New Discount
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Create/Edit Discount Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Percent className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {isEdit ? 'Edit Discount Code' : 'Create New Discount Code'}
                      </h3>
                      <div className="mt-6 space-y-4">
                        <div>
                          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                            Discount Code
                          </label>
                          <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                              type="text"
                              name="code"
                              id="code"
                              value={formData.code}
                              onChange={handleFormChange}
                              className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md uppercase focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                              placeholder="SUMMER20"
                            />
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, code: generateRandomCode()})}
                              className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              Generate
                            </button>
                          </div>
                          {formErrors.code && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
                            Apply to
                          </label>
                          <select
                            id="productId"
                            name="productId"
                            value={formData.productId}
                            onChange={handleFormChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md"
                          >
                            <option value="">All Products</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                            Discount Type
                          </label>
                          <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleFormChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                            {formData.type === 'percentage' ? 'Percentage Value' : 'Amount'}
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">
                                {formData.type === 'percentage' ? '%' : '$'}
                              </span>
                            </div>
                            <input
                              type="number"
                              name="value"
                              id="value"
                              value={formData.value}
                              onChange={handleFormChange}
                              className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                              min={formData.type === 'percentage' ? 1 : 0.01}
                              max={formData.type === 'percentage' ? 100 : undefined}
                              step={formData.type === 'percentage' ? 1 : 0.01}
                            />
                          </div>
                          {formErrors.value && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.value}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                              Start Date (Optional)
                            </label>
                            <input
                              type="date"
                              name="startDate"
                              id="startDate"
                              value={formData.startDate}
                              onChange={handleFormChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                              End Date (Optional)
                            </label>
                            <input
                              type="date"
                              name="endDate"
                              id="endDate"
                              value={formData.endDate}
                              onChange={handleFormChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            />
                            {formErrors.endDate && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700">
                            Maximum Uses (Optional)
                          </label>
                          <input
                            type="number"
                            name="maxUses"
                            id="maxUses"
                            value={formData.maxUses}
                            onChange={handleFormChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            min="1"
                            placeholder="Unlimited"
                          />
                          {formErrors.maxUses && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.maxUses}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    type="submit"
                    isLoading={formSubmitting}
                    className="sm:ml-3"
                  >
                    {isEdit ? 'Update Discount' : 'Create Discount'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="mt-3 sm:mt-0"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};