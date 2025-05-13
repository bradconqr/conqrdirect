import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, BookOpen, Users, Video } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface Purchase {
  id: string;
  product: {
    id: string;
    name: string;
    description: string;
    type: 'download' | 'course' | 'membership' | 'webinar';
    thumbnail: string | null;
    file_url: string | null;
  };
  price: number;
  status: string;
  created_at: string;
}

export const PurchasesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchPurchases = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('purchases')
          .select(`
            id,
            price,
            status,
            created_at,
            product:products (
              id,
              name,
              description,
              type,
              thumbnail,
              file_url
            )
          `)
          .eq('customer_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPurchases(data || []);
      } catch (err: any) {
        console.error('Error fetching purchases:', err);
        setError(err.message || 'Failed to fetch purchases');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'download':
        return <Download className="h-5 w-5 text-purple-600" />;
      case 'course':
        return <BookOpen className="h-5 w-5 text-teal-600" />;
      case 'membership':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'webinar':
        return <Video className="h-5 w-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getActionButton = (purchase: Purchase) => {
    switch (purchase.product.type) {
      case 'download':
        return (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => window.open(purchase.product.file_url || '#', '_blank')}
            disabled={!purchase.product.file_url}
          >
            Download
          </Button>
        );
      case 'course':
        return (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BookOpen className="h-4 w-4" />}
          >
            Access Course
          </Button>
        );
      case 'membership':
        return (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Users className="h-4 w-4" />}
          >
            Access Membership
          </Button>
        );
      case 'webinar':
        return (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Video className="h-4 w-4" />}
          >
            Join Webinar
          </Button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">My Purchases</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">My Purchases</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">My Purchases</h1>
        <Card>
          <CardContent className="p-10 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <Download className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No purchases yet</h2>
            <p className="text-gray-600 mb-6">
              Explore our marketplace to find products that interest you.
            </p>
            <Button>
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">My Purchases</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {purchases.map((purchase) => (
          <Card key={purchase.id} className="overflow-hidden">
            <div className="h-48 bg-gray-100 relative">
              {purchase.product.thumbnail ? (
                <img 
                  src={purchase.product.thumbnail} 
                  alt={purchase.product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="p-6 rounded-full bg-white shadow-sm">
                    {getTypeIcon(purchase.product.type)}
                  </div>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-800 shadow-sm">
                  {purchase.product.type.charAt(0).toUpperCase() + purchase.product.type.slice(1)}
                </span>
              </div>
            </div>
            
            <CardContent className="p-5">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{purchase.product.name}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{purchase.product.description}</p>
              
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>Purchased on: {formatDate(purchase.created_at)}</span>
                <span>{formatPrice(purchase.price)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  purchase.status === 'completed' ? 'bg-green-100 text-green-800' : 
                  purchase.status === 'refunded' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                </span>
                
                {getActionButton(purchase)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};