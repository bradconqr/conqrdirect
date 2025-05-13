import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Product, ProductType } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProductGridCard } from '../../components/products/ProductGridCard';
import { ProductListCard } from '../../components/products/ProductListCard';
import { 
  Download,
  BookOpen,
  Users,
  Video,
  Filter,
  Search,
  GridIcon,
  ListIcon,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

export const BrowseProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  
  // Creator filter
  const [creators, setCreators] = useState<Array<{id: string, store_name: string}>>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);

  // Price filter expanded state
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    types: true,
    price: true,
    creators: true
  });
  
  // Get initial params from URL
  useEffect(() => {
    const type = searchParams.get('type');
    const search = searchParams.get('q');
    const creator = searchParams.get('creator');
    const sort = searchParams.get('sort') as SortOption;
    const view = searchParams.get('view') as 'grid' | 'list';
    const featured = searchParams.get('featured');
    
    if (type) setSelectedTypes(type.split(',') as ProductType[]);
    if (search) setSearchQuery(search);
    if (creator) setSelectedCreators(creator.split(','));
    if (sort) setSortOption(sort);
    if (view) setViewMode(view);
    if (featured === 'true') setShowFeaturedOnly(true);
    
    fetchProducts();
    fetchCreators();
  }, [searchParams]);
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch published products from the database
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          creator:creators(id, store_name)
        `)
        .not('published_at', 'is', null)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Transform database records to match Product type
        const transformedProducts: Product[] = data.map(item => ({
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
          creator: item.creator
        }));
        
        setProducts(transformedProducts);
        applyFilters(transformedProducts);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('id, store_name')
        .order('store_name');
        
      if (error) throw error;
      
      if (data) {
        setCreators(data);
      }
    } catch (err) {
      console.error('Error fetching creators:', err);
    }
  };
  
  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters(products);
    updateSearchParams();
  }, [selectedTypes, searchQuery, priceRange, sortOption, showFeaturedOnly, selectedCreators]);
  
  const applyFilters = (productList: Product[]) => {
    let filtered = [...productList];
    
    // Apply type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(product => selectedTypes.includes(product.type));
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
      );
    }
    
    // Apply price filter
    filtered = filtered.filter(product => {
      const productPrice = product.discountPrice || product.price;
      const priceInDollars = productPrice / 100;
      return priceInDollars >= priceRange[0] && priceInDollars <= priceRange[1];
    });
    
    // Apply creator filter
    if (selectedCreators.length > 0) {
      filtered = filtered.filter(product => 
        selectedCreators.includes(product.creatorId)
      );
    }
    
    // Apply featured filter
    if (showFeaturedOnly) {
      filtered = filtered.filter(product => product.featured);
    }
    
    // Apply sort
    switch (sortOption) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price_asc':
        filtered.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        break;
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    
    setFilteredProducts(filtered);
  };
  
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    
    if (selectedTypes.length > 0) {
      params.set('type', selectedTypes.join(','));
    }
    
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    
    if (selectedCreators.length > 0) {
      params.set('creator', selectedCreators.join(','));
    }
    
    if (sortOption !== 'newest') {
      params.set('sort', sortOption);
    }
    
    if (viewMode !== 'grid') {
      params.set('view', viewMode);
    }
    
    if (showFeaturedOnly) {
      params.set('featured', 'true');
    }
    
    setSearchParams(params);
  };
  
  const toggleTypeFilter = (type: ProductType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };
  
  const toggleCreatorFilter = (creatorId: string) => {
    if (selectedCreators.includes(creatorId)) {
      setSelectedCreators(selectedCreators.filter(id => id !== creatorId));
    } else {
      setSelectedCreators([...selectedCreators, creatorId]);
    }
  };
  
  const resetFilters = () => {
    setSelectedTypes([]);
    setSearchQuery('');
    setPriceRange([0, 1000]);
    setSortOption('newest');
    setShowFeaturedOnly(false);
    setSelectedCreators([]);
    setMobileFiltersOpen(false);
  };
  
  const toggleFilterSection = (section: string) => {
    setExpandedFilters(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const viewProductDetails = (product: Product) => {
    navigate(`/product/${product.id}`);
  };
  
  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>
          <p className="mt-1 text-gray-500">Discover digital products from our creators</p>
        </div>
        
        {/* Mobile filters button */}
        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <Button 
            onClick={() => setMobileFiltersOpen(true)}
            leftIcon={<SlidersHorizontal className="h-5 w-5" />}
            variant="outline"
            className="md:hidden w-full justify-center"
          >
            Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters - Desktop */}
        <div className="hidden lg:block col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={resetFilters}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Reset All
                </Button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                </div>
              </div>

              {/* Product Types */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => toggleFilterSection('types')}
                  className="flex justify-between items-center w-full text-left font-medium text-gray-900 mb-2"
                >
                  <span>Product Types</span>
                  {expandedFilters.types ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                
                {expandedFilters.types && (
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes('download')}
                        onChange={() => toggleTypeFilter('download')}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700 flex items-center">
                        <Download className="h-4 w-4 mr-1.5 text-purple-500" />
                        Downloads
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes('course')}
                        onChange={() => toggleTypeFilter('course')}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700 flex items-center">
                        <BookOpen className="h-4 w-4 mr-1.5 text-blue-500" />
                        Courses
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes('membership')}
                        onChange={() => toggleTypeFilter('membership')}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700 flex items-center">
                        <Users className="h-4 w-4 mr-1.5 text-green-500" />
                        Memberships
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes('webinar')}
                        onChange={() => toggleTypeFilter('webinar')}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700 flex items-center">
                        <Video className="h-4 w-4 mr-1.5 text-orange-500" />
                        Webinars
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => toggleFilterSection('price')}
                  className="flex justify-between items-center w-full text-left font-medium text-gray-900 mb-2"
                >
                  <span>Price Range</span>
                  {expandedFilters.price ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                
                {expandedFilters.price && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">${priceRange[0]}</span>
                      <span className="text-sm text-gray-600">${priceRange[1]}+</span>
                    </div>
                    
                    <div className="flex space-x-4">
                      <input
                        type="range"
                        min={0}
                        max={1000}
                        step={10}
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                        className="flex-1 h-2 w-full bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      
                      <input
                        type="range"
                        min={0}
                        max={1000}
                        step={10}
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="flex-1 h-2 w-full bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="min-price" className="sr-only">Minimum Price</label>
                        <input
                          type="number"
                          id="min-price"
                          min={0}
                          max={1000}
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="max-price" className="sr-only">Maximum Price</label>
                        <input
                          type="number"
                          id="max-price"
                          min={0}
                          max={1000}
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Creators */}
              {creators.length > 0 && (
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => toggleFilterSection('creators')}
                    className="flex justify-between items-center w-full text-left font-medium text-gray-900 mb-2"
                  >
                    <span>Creators</span>
                    {expandedFilters.creators ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedFilters.creators && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {creators.map(creator => (
                        <label key={creator.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCreators.includes(creator.id)}
                            onChange={() => toggleCreatorFilter(creator.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-gray-700 text-sm">
                            {creator.store_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Featured Only */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showFeaturedOnly}
                    onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700">
                    Featured Products Only
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Filters Dialog */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 overflow-hidden z-40 lg:hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                onClick={() => setMobileFiltersOpen(false)}></div>
              
              <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
                <div className="relative w-screen max-w-md">
                  <div className="h-full flex flex-col bg-white shadow-xl">
                    <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                      <button
                        type="button"
                        className="-mr-2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-500"
                        onClick={() => setMobileFiltersOpen(false)}
                      >
                        <span className="sr-only">Close panel</span>
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="overflow-y-auto p-4 flex-1">
                      {/* Mobile Search */}
                      <div className="mb-6">
                        <label htmlFor="mobile-search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            id="mobile-search"
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                          />
                        </div>
                      </div>
                      
                      {/* Mobile Product Types */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Product Types</h3>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedTypes.includes('download')}
                              onChange={() => toggleTypeFilter('download')}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-gray-700 flex items-center">
                              <Download className="h-4 w-4 mr-1.5 text-purple-500" />
                              Downloads
                            </span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedTypes.includes('course')}
                              onChange={() => toggleTypeFilter('course')}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-gray-700 flex items-center">
                              <BookOpen className="h-4 w-4 mr-1.5 text-blue-500" />
                              Courses
                            </span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedTypes.includes('membership')}
                              onChange={() => toggleTypeFilter('membership')}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-gray-700 flex items-center">
                              <Users className="h-4 w-4 mr-1.5 text-green-500" />
                              Memberships
                            </span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedTypes.includes('webinar')}
                              onChange={() => toggleTypeFilter('webinar')}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-gray-700 flex items-center">
                              <Video className="h-4 w-4 mr-1.5 text-orange-500" />
                              Webinars
                            </span>
                          </label>
                        </div>
                      </div>
                      
                      {/* Mobile Price Range */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Price Range</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">${priceRange[0]}</span>
                            <span className="text-sm text-gray-600">${priceRange[1]}+</span>
                          </div>
                          
                          <input
                            type="range"
                            min={0}
                            max={1000}
                            step={10}
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          
                          <input
                            type="range"
                            min={0}
                            max={1000}
                            step={10}
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="mobile-min-price" className="sr-only">Minimum Price</label>
                              <input
                                type="number"
                                id="mobile-min-price"
                                min={0}
                                max={1000}
                                value={priceRange[0]}
                                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                            <div>
                              <label htmlFor="mobile-max-price" className="sr-only">Maximum Price</label>
                              <input
                                type="number"
                                id="mobile-max-price"
                                min={0}
                                max={1000}
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mobile Creators */}
                      {creators.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Creators</h3>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {creators.map(creator => (
                              <label key={creator.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedCreators.includes(creator.id)}
                                  onChange={() => toggleCreatorFilter(creator.id)}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-gray-700 text-sm">
                                  {creator.store_name}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Mobile Featured Only */}
                      <div className="mb-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={showFeaturedOnly}
                            onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-gray-700">
                            Featured Products Only
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 p-4 space-y-3">
                      <Button
                        fullWidth
                        onClick={() => setMobileFiltersOpen(false)}
                      >
                        Apply Filters
                      </Button>
                      
                      <Button
                        fullWidth
                        variant="outline"
                        onClick={resetFilters}
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products List & Controls */}
        <div className="lg:col-span-3">
          <div className="mb-6 bg-white shadow-sm rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="mb-4 sm:mb-0 text-sm text-gray-500">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <label htmlFor="sort" className="sr-only">Sort by</label>
                  <select
                    id="sort"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A to Z</option>
                    <option value="name_desc">Name: Z to A</option>
                  </select>
                </div>
                
                <div className="hidden sm:flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-l-md border ${
                      viewMode === 'grid'
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <GridIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-r-md border-t border-b border-r ${
                      viewMode === 'list'
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <ListIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Active filters */}
            {(selectedTypes.length > 0 || searchQuery || selectedCreators.length > 0 || showFeaturedOnly) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">Active filters:</span>
                
                {selectedTypes.map(type => (
                  <span 
                    key={type}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                    <button 
                      type="button" 
                      onClick={() => toggleTypeFilter(type)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                
                {searchQuery && (
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    Search: {searchQuery}
                    <button 
                      type="button" 
                      onClick={() => setSearchQuery('')}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {selectedCreators.map(creatorId => {
                  const creator = creators.find(c => c.id === creatorId);
                  if (!creator) return null;
                  return (
                    <span 
                      key={creatorId}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {creator.store_name}
                      <button 
                        type="button" 
                        onClick={() => toggleCreatorFilter(creatorId)}
                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500 focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                
                {showFeaturedOnly && (
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                  >
                    Featured Only
                    <button 
                      type="button" 
                      onClick={() => setShowFeaturedOnly(false)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-yellow-400 hover:bg-yellow-200 hover:text-yellow-500 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-purple-600 hover:text-purple-900 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 p-4 rounded-md text-red-700 mb-6">
              <p className="flex items-center">
                <X className="h-5 w-5 mr-2" />
                {error}
              </p>
            </div>
          )}
          
          {/* No results */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Filter className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or search criteria to find what you're looking for.
              </p>
              <div className="mt-6">
                <Button
                  onClick={resetFilters}
                  variant="outline"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          ) : (
            /* Product grid or list */
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductGridCard 
                    key={product.id}
                    product={product}
                    onAdd={handleAddToCart}
                    onView={viewProductDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredProducts.map((product) => (
                  <ProductListCard
                    key={product.id}
                    product={product}
                    onAdd={handleAddToCart}
                    onView={viewProductDetails}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};