import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Table = 'products' | 'purchases' | 'creators' | 'discounts' | 'cart_items' | 'store_users';
type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

interface SubscriptionOptions {
  table: Table;
  schema?: string;
  event?: RealtimeEvent | '*';
  filter?: string;
  filterValues?: Record<string, any>;
}

/**
 * Custom hook for subscribing to real-time data changes
 * @param options Subscription configuration options
 * @param callback Function to call when data changes
 * @returns Cleanup function to unsubscribe
 */
export const useRealtimeSubscription = (
  options: SubscriptionOptions,
  callback: (payload: any) => void
) => {
  useEffect(() => {
    // Set default schema to public if not specified
    const schema = options.schema || 'public';
    
    // Build the channel name using the table and schema
    const channelName = `${schema}:${options.table}:${options.event || '*'}`;
    
    // Subscribe to the channel
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: options.event || '*',
        schema: schema,
        table: options.table,
        filter: options.filter ? `${options.filter}=eq.${options.filterValues?.[options.filter]}` : undefined
      }, (payload) => {
        callback(payload);
      })
      .subscribe();
    
    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [options, callback]);
};

/**
 * Hook for subscribing to real-time product updates for a specific creator
 * @param creatorId The creator's ID
 * @param callback Optional callback function to run when products change
 * @returns Array of products and isLoading state
 */
export const useCreatorProducts = (creatorId: string | null, callback?: (products: any[]) => void) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorId) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Transform the data if needed
        const transformedProducts = data?.map(item => ({
          id: item.id,
          creatorId: item.creator_id,
          name: item.name,
          description: item.description,
          type: item.type,
          price: item.price,
          discountPrice: item.discount_price,
          thumbnail: item.thumbnail,
          featured: item.featured,
          publishedAt: item.published_at ? new Date(item.published_at) : undefined,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        })) || [];

        setProducts(transformedProducts);
        
        if (callback) {
          callback(transformedProducts);
        }
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();

    // Subscribe to real-time updates for this creator's products
    const channel = supabase
      .channel(`public:products:creator_id:${creatorId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `creator_id=eq.${creatorId}`
      }, (payload) => {
        // Refetch all products when any change occurs
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creatorId, callback]);

  return { products, isLoading, error };
};

/**
 * Hook for subscribing to real-time published products for a specific creator's store
 * @param creatorId The creator's ID
 * @returns Array of published products and loading state
 */
export const usePublishedProducts = (creatorId: string | null) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorId) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const fetchPublishedProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            *,
            creator:creators(
              id,
              store_name,
              store_description,
              social_links
            )
          `)
          .eq('creator_id', creatorId)
          .not('published_at', 'is', null)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Transform the data
        const transformedProducts = data?.map(item => ({
          id: item.id,
          creatorId: item.creator_id,
          name: item.name,
          description: item.description,
          type: item.type,
          price: item.price,
          discountPrice: item.discount_price,
          thumbnail: item.thumbnail,
          featured: item.featured,
          publishedAt: item.published_at ? new Date(item.published_at) : undefined,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          creator: item.creator,
          // Add other type-specific fields from the database
          fileUrl: item.file_url,
          fileSize: item.file_size,
          fileType: item.file_type,
          modules: item.modules,
          totalDuration: item.total_duration,
          benefits: item.benefits,
          interval: item.interval,
          startDate: item.start_date,
          endDate: item.end_date,
          maxAttendees: item.max_attendees,
          meetingUrl: item.meeting_url,
          callDuration: item.call_duration,
          callPlatform: item.call_platform,
          availableDays: item.available_days,
          callTimeSlots: item.call_time_slots,
          targetUrl: item.target_url,
          linkType: item.link_type,
          linkText: item.link_text,
          commissionRate: item.commission_rate,
          leadMagnetFile: item.lead_magnet_file,
          emailListName: item.email_list_name,
          thankYouMessage: item.thank_you_message,
          redirectUrl: item.redirect_url,
          optInRequired: item.opt_in_required,
          optInText: item.opt_in_text,
          responseTime: item.response_time,
          maxQuestionLength: item.max_question_length,
          topicCategories: item.topic_categories,
          allowAttachments: item.allow_attachments,
          attachmentTypes: item.attachment_types,
          anonymousAllowed: item.anonymous_allowed
        })) || [];

        setProducts(transformedProducts);
      } catch (err: any) {
        console.error('Error fetching published products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublishedProducts();

    // Subscribe to real-time updates for this creator's published products
    const channel = supabase
      .channel(`public:products:published:${creatorId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `creator_id=eq.${creatorId}`
      }, (payload) => {
        // Refetch all published products when any change occurs
        fetchPublishedProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creatorId]);

  return { products, isLoading, error };
};

/**
 * Hook for subscribing to real-time store information for a creator
 * @param creatorId The creator's ID
 * @returns Creator store data and loading state
 */
export const useCreatorStore = (creatorId: string | null) => {
  const [creatorStore, setCreatorStore] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorId) {
      setCreatorStore(null);
      setIsLoading(false);
      return;
    }

    const fetchCreatorStore = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('creators')
          .select('*')
          .eq('id', creatorId)
          .single();

        if (fetchError) throw fetchError;

        setCreatorStore(data);
      } catch (err: any) {
        console.error('Error fetching creator store:', err);
        setError(err.message || 'Failed to load store information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreatorStore();

    // Subscribe to real-time updates for this creator's store
    const channel = supabase
      .channel(`public:creators:${creatorId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'creators',
        filter: `id=eq.${creatorId}`
      }, (payload) => {
        // Update store data when changes occur
        setCreatorStore(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creatorId]);

  return { creatorStore, isLoading, error };
};

/**
 * Hook for subscribing to real-time product details
 * @param productId The product ID
 * @returns Product data and loading state
 */
export const useProductDetails = (productId: string | null) => {
  const [product, setProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    const fetchProductDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            *,
            creator:creators(
              id,
              store_name,
              store_description,
              social_links
            )
          `)
          .eq('id', productId)
          .single();

        if (fetchError) throw fetchError;

        setProduct(data);
      } catch (err: any) {
        console.error('Error fetching product details:', err);
        setError(err.message || 'Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();

    // Subscribe to real-time updates for this product
    const channel = supabase
      .channel(`public:products:${productId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `id=eq.${productId}`
      }, (payload) => {
        // Refetch product details when changes occur
        fetchProductDetails();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  return { product, isLoading, error };
};