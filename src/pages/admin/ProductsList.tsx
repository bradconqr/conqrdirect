import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { publishProduct, unpublishProduct } from '../../services/productService';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Pencil, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Tag, 
  Filter,
  Search,
  ArrowUp,
  ArrowDown,
  Copy,
  MoreHorizontal,
  Check,
  Download,
  ShoppingBag,
  Layers,
  GridIcon,
  ListIcon,
  Phone,
  Link,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const { isCreator, creator } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isCreator || !creator?.id) {
      navigate('/');
      return;
    }
    
    fetchProducts(creator.id);
  }, [isCreator, creator, navigate]);
  
  const fetchProducts = async (creatorId: string) => {
    if (!creatorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });
        
      setLoading(false);
      
      if (error) {
        console.error('Error fetching products:', error);
        setError('Could not fetch products. Please try again.');
        return;
      }
      
      setProducts(data || []);
      applyFilters(data || [], searchQuery, typeFilter, statusFilter, sortBy);
    } catch (err: any) {
      setLoading(false);
      console.error('Error in fetchProducts:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const applyFilters = (
    productList: Product[],
    search: string,
    type: string,
    status: string,
    sort: string
  ) => {
    let result = [...productList];

    // Apply search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        product => 
          product.name.toLowerCase().includes(lowerSearch) ||
          product.description.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply type filter
    if (type !== 'all') {
      result = result.filter(product => product.type === type);
    }

    // Apply status filter
    if (status !== 'all') {
      if (status === 'published') {
        result = result.filter(product => product.published_at);
      } else if (status === 'draft') {
        result = result.filter(product => !product.published_at);
      } else if (status === 'featured') {
        result = result.filter(product => product.featured);
      }
    }

    // Apply sorting
    if (sort === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === 'created_asc') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sort === 'created_desc') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredProducts(result);
  };

  useEffect(() => {
    applyFilters(products, searchQuery, typeFilter, statusFilter, sortBy);
  }, [searchQuery, typeFilter, statusFilter, sortBy, products]);
  
  const handlePublishToggle = async (productId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await unpublishProduct(productId);
      } else {
        await publishProduct(productId);
      }
      
      // Refresh the products list
      if (creator?.id) {
        fetchProducts(creator.id);
      }
    } catch (error: any) {
      console.error('Error toggling publish status:', error);
      setError(error.message || 'Failed to update product status. Please try again.');
    }
  };
  
  const handleFeaturedToggle = async (productId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ featured: !isFeatured })
        .eq('id', productId);
        
      if (error) throw error;
      
      // Refresh the products list
      if (creator?.id) {
        fetchProducts(creator.id);
      }
    } catch (error: any) {
      console.error('Error toggling featured status:', error);
      setError(error.message || 'Failed to update product status. Please try again.');
    }
  };
  
  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
        
      if (error) throw error;
      
      // Refresh the products list
      setShowDeleteConfirm(null);
      if (creator?.id) {
        fetchProducts(creator.id);
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setError(error.message || 'Failed to delete product. Please try again.');
    }
  };

  const handleCloneProduct = async (product: Product) => {
    try {
      setIsCloning(true);
      
      const clonedProduct = {
        ...product,
        name: `${product.name} (Copy)`,
        published_at: null, // Always start as draft
        featured: false,
      };
      
      // Remove id and timestamps
      delete clonedProduct.id;
      delete clonedProduct.created_at;
      delete clonedProduct.updated_at;
      
      const { data, error } = await supabase
        .from('products')
        .insert(clonedProduct)
        .select()
        .single();
        
      if (error) throw error;
      
      // Refresh the products list
      if (creator?.id) {
        fetchProducts(creator.id);
      }
      setIsMenuOpen(null);
      
      // Navigate to edit the cloned product
      navigate(`/creator/products/edit/${data.id}`);
    } catch (error: any) {
      console.error('Error cloning product:', error);
      setError(error.message || 'Failed to clone product. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };

  const copyProductId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    setIsMenuOpen(null);
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-white">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-gray-400 mt-1">Manage your digital products and offerings</p>
        </div>
        <Button
          onClick={() => navigate('/creator/products/new')}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add New Product
        </Button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-300 rounded-md">
          {error}
        </div>
      )}

      {/* Filters and Controls */}
      <div className="mb-6 bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-900 placeholder-gray-500 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="typeFilter" className="sr-only">Filter by Type</label>
            <div className="relative">
              <select
                id="typeFilter"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="download">Downloads</option>
                <option value="course">Courses</option>
                <option value="membership">Memberships</option>
                <option value="webinar">Webinars</option>
                <option value="1on1call">1on1 Calls</option>
                <option value="external_link">External Links</option>
                <option value="lead_magnet">Lead Magnets</option>
                <option value="ama">Ask Me Anything</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
            <div className="relative">
              <select
                id="statusFilter"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="featured">Featured</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="sortBy" className="sr-only">Sort By</label>
            <div className="relative">
              <select
                id="sortBy"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                {sortBy.includes('asc') ? (
                  <ArrowUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              leftIcon={<ListIcon className="h-4 w-4" />}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              leftIcon={<GridIcon className="h-4 w-4" />}
            >
              Grid
            </Button>
          </div>
          <div>
            <span className="text-sm text-gray-400">
              Showing {filteredProducts.length} of {products.length} products
            </span>
          </div>
        </div>
      </div>
      
      {products.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="my-6">
              <Tag className="h-12 w-12 text-gray-500 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-white">No products yet</h3>
              <p className="mt-1 text-gray-400">Get started by creating your first product.</p>
              <div className="mt-6">
                <Button
                  onClick={() => navigate('/creator/products/new')}
                  leftIcon={<Plus className="h-5 w-5" />}
                >
                  Add New Product
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded overflow-hidden bg-gray-700">
                              {product.thumbnail ? (
                                <img src={product.thumbnail} alt={product.name} className="h-10 w-10 object-cover" />
                              ) : (
                                <div className="h-10 w-10 flex items-center justify-center bg-purple-900 text-purple-400">
                                  <Tag className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{product.name}</div>
                              <div className="text-sm text-gray-400 truncate max-w-xs">
                                {product.description.substring(0, 60)}
                                {product.description.length > 60 ? '...' : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                            {product.type === '1on1call' 
                              ? '1on1 Call'
                              : product.type === 'external_link'
                                ? 'External Link'
                                : product.type === 'lead_magnet'
                                  ? 'Lead Magnet'
                                  : product.type === 'ama'
                                    ? 'Ask Me Anything'
                                    : product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                          </span>
                          {product.featured && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                              Featured
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {product.type === 'external_link' || product.type === 'lead_magnet' ? 
                              'N/A' : 
                              formatPrice(product.price)
                            }
                          </div>
                          {product.discount_price && (
                            <div className="text-xs text-gray-400 line-through">
                              {formatPrice(product.discount_price)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.published_at 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-yellow-900 text-yellow-300'
                          }`}>
                            {product.published_at ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(product.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost" 
                              size="sm"
                              leftIcon={<Pencil className="h-4 w-4" />}
                              onClick={() => navigate(`/creator/products/edit/${product.id}`)}
                            >
                              Edit
                            </Button>
                            
                            <div className="relative inline-block text-left">
                              <Button
                                variant="ghost" 
                                size="sm"
                                onClick={() => setIsMenuOpen(isMenuOpen === product.id ? null : product.id)}
                                leftIcon={<MoreHorizontal className="h-4 w-4" />}
                              >
                                More
                              </Button>
                              
                              {isMenuOpen === product.id && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-gray-700 focus:outline-none z-10">
                                  <div className="py-1" role="menu" aria-orientation="vertical">
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                                      onClick={() => handleFeaturedToggle(product.id, !!product.featured)}
                                    >
                                      <Tag className="h-4 w-4 mr-2" />
                                      {product.featured ? 'Remove from Featured' : 'Mark as Featured'}
                                    </button>
                                    
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                                      onClick={() => handlePublishToggle(product.id, !!product.published_at)}
                                    >
                                      {product.published_at ? (
                                        <>
                                          <EyeOff className="h-4 w-4 mr-2" />
                                          Unpublish
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Publish
                                        </>
                                      )}
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                                      onClick={() => handleCloneProduct(product)}
                                      disabled={isCloning}
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      {isCloning ? 'Cloning...' : 'Clone Product'}
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                                      onClick={() => copyProductId(product.id)}
                                    >
                                      {copiedId === product.id ? (
                                        <>
                                          <Check className="h-4 w-4 mr-2 text-green-500" />
                                          Copied!
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-4 w-4 mr-2" />
                                          Copy ID
                                        </>
                                      )}
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center"
                                      onClick={() => setShowDeleteConfirm(product.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {showDeleteConfirm === product.id && (
                              <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                  <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                                  <div className="inline-block align-bottom bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-700">
                                    <div className="bg-gray-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                      <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                                          <Trash2 className="h-6 w-6 text-red-400" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                          <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                                            Delete Product
                                          </h3>
                                          <div className="mt-2">
                                            <p className="text-sm text-gray-400">
                                              Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-700">
                                      <Button
                                        variant="danger"
                                        onClick={() => handleDelete(product.id)}
                                        className="w-full sm:ml-3 sm:w-auto"
                                      >
                                        Delete
                                      </Button>
                                      <Button
                                        variant="outline" 
                                        onClick={() => setShowDeleteConfirm(null)}
                                        className="mt-3 w-full sm:mt-0 sm:w-auto sm:text-sm"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-700">
                  <div className="h-48 bg-gray-800 relative">
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {product.type === 'download' && <Download className="h-12 w-12 text-gray-400" />}
                        {product.type === 'course' && <Layers className="h-12 w-12 text-gray-400" />}
                        {product.type === 'membership' && <ShoppingBag className="h-12 w-12 text-gray-400" />}
                        {product.type === 'webinar' && <Tag className="h-12 w-12 text-gray-400" />}
                        {product.type === '1on1call' && <Phone className="h-12 w-12 text-gray-400" />}
                        {product.type === 'external_link' && <Link className="h-12 w-12 text-gray-400" />}
                        {product.type === 'lead_magnet' && <Mail className="h-12 w-12 text-gray-400" />}
                        {product.type === 'ama' && <MessageSquare className="h-12 w-12 text-gray-400" />}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        product.published_at 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-yellow-900 text-yellow-300'
                      }`}>
                        {product.published_at ? 'Published' : 'Draft'}
                      </span>
                      {product.featured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900 text-blue-300">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <button
                        className="text-gray-400 hover:text-gray-200 p-1 rounded-full bg-gray-800 bg-opacity-90 hover:bg-opacity-100"
                        onClick={() => setIsMenuOpen(isMenuOpen === product.id ? null : product.id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {isMenuOpen === product.id && (
                        <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-gray-700 focus:outline-none z-10">
                          <div className="py-1" role="menu" aria-orientation="vertical">
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                              onClick={() => handleFeaturedToggle(product.id, !!product.featured)}
                            >
                              <Tag className="h-4 w-4 mr-2" />
                              {product.featured ? 'Remove from Featured' : 'Mark as Featured'}
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                              onClick={() => handlePublishToggle(product.id, !!product.published_at)}
                            >
                              {product.published_at ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Publish
                                </>
                              )}
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                              onClick={() => handleCloneProduct(product)}
                              disabled={isCloning}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Clone Product
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center"
                              onClick={() => setShowDeleteConfirm(product.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                        {product.type === '1on1call' 
                          ? '1on1 Call' 
                          : product.type === 'external_link'
                            ? 'External Link'
                            : product.type === 'lead_magnet'
                              ? 'Lead Magnet'
                              : product.type === 'ama'
                                ? 'Ask Me Anything'
                                : product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center mb-4 text-white">
                      {product.type === 'external_link' ? (
                        <span className="font-semibold text-gray-300">External Link</span>
                      ) : product.type === 'lead_magnet' ? (
                        <span className="font-semibold text-gray-300">Free Download</span>
                      ) : (
                        <>
                          <span className="font-semibold">{formatPrice(product.price)}</span>
                          {product.discount_price && (
                            <span className="ml-2 text-sm text-gray-400 line-through">
                              {formatPrice(product.discount_price)}
                            </span>
                          )}
                        </>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(product.created_at)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/creator/products/edit/${product.id}`)}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="bg-gray-800 rounded-lg shadow-sm p-8 text-center border border-gray-700">
              <Tag className="h-12 w-12 text-gray-500 mx-auto" />
              <h3 className="mt-2 text-lg font-medium text-white">No products match your filters</h3>
              <p className="mt-1 text-sm text-gray-400">
                Try adjusting your search or filter criteria
              </p>
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};