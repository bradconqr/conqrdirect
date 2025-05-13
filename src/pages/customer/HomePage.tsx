import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { HeroSection } from '../../components/home/HeroSection';
import { ProductCard } from '../../components/products/ProductCard';
import { Product } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCartStore();
  
  const fetchProducts = async () => {
    try {
      // Fetch published products from the database
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          creator:creators(
            id,
            store_name
          )
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
          creator: item.creator,
        }));
        
        setProducts(transformedProducts);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('id, store_name, store_description')
        .order('store_name');
        
      if (error) throw error;
      
      setCreators(data || []);
    } catch (err) {
      console.error('Error fetching creators:', err);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    Promise.all([
      fetchProducts(),
      fetchCreators()
    ]);
  }, []);
  
  // Subscribe to real-time product changes
  useRealtimeSubscription(
    { table: 'products', event: '*' },
    (_) => {
      fetchProducts();
    }
  );
  
  // Subscribe to real-time creator changes
  useRealtimeSubscription(
    { table: 'creators', event: '*' },
    (_) => {
      fetchCreators();
    }
  );
  
  const viewProductDetails = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  const viewCreatorStore = (creatorId: string) => {
    navigate(`/store/${creatorId}`);
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
      <HeroSection 
        title="Direct to Consumer Solutions"
        subtitle="Discover unique digital products from CONQR Direct"
        onCtaClick={() => navigate('/products')}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
        {products.filter(product => product.featured).length === 0 ? (
          <div className="mt-6 text-center py-10">
            <p className="text-gray-500">No featured products available at the moment.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products
              .filter(product => product.featured)
              .slice(0, 8)
              .map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAdd={addToCart} 
                  onView={viewProductDetails}
                />
              ))
            }
          </div>
        )}
        
        <h2 className="mt-16 text-2xl font-bold text-gray-900">Top Creators</h2>
        {creators.length === 0 ? (
          <div className="mt-6 text-center py-10">
            <p className="text-gray-500">No creators available at the moment.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {creators.slice(0, 4).map((creator) => (
              <Card key={creator.id} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6 flex flex-col h-full">
                  <h3 className="text-xl font-semibold text-purple-800">{creator.store_name}</h3>
                  {creator.store_description && (
                    <p className="mt-2 text-sm text-gray-600 flex-grow line-clamp-3">{creator.store_description}</p>
                  )}
                  <Button 
                    className="mt-4"
                    onClick={() => viewCreatorStore(creator.id)}
                  >
                    Visit Store
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <h2 className="mt-16 text-2xl font-bold text-gray-900">Latest Products</h2>
        {products.length === 0 ? (
          <div className="mt-6 text-center py-10">
            <p className="text-gray-500">No products available at the moment.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products
              .slice(0, 8)
              .map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAdd={addToCart} 
                  onView={viewProductDetails}
                />
              ))}
          </div>
        )}
        
        {products.length > 8 && (
          <div className="mt-8 text-center">
            <Button onClick={() => navigate('/products')}>
              View All Products
            </Button>
          </div>
        )}
      </div>
    </>
  );
};