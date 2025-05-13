import { supabase } from '../lib/supabase';
import { Product } from '../types';

export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    // Format data for insert
    const dataToInsert = {
      creator_id: productData.creatorId,
      name: productData.name,
      description: productData.description,
      type: productData.type,
      price: productData.price,
      discount_price: productData.discountPrice || null,
      thumbnail: productData.thumbnail || null,
      featured: productData.featured || false,
      published_at: productData.publishedAt || null,
      file_url: productData.fileUrl || null,
      file_size: productData.fileSize || null,
      file_type: productData.fileType || null,
      modules: productData.modules || null,
      total_duration: productData.totalDuration || null,
      benefits: productData.benefits || null,
      interval: productData.interval || null,
      start_date: productData.startDate || null,
      end_date: productData.endDate || null,
      max_attendees: productData.maxAttendees || null,
      meeting_url: productData.meetingUrl || null,
    };

    // First, create the product in our database
    const { data: product, error } = await supabase
      .from('products')
      .insert(dataToInsert)
      .select()
      .single();
      
    if (error) throw error;
    
    // Then sync it with Stripe (if necessary)
    if (productData.price > 0 && await hasStripeKeys()) {
      await syncProductWithStripe(product);
    }
    
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (productId: string, updates: Partial<Product>) => {
  try {
    // Format data for update
    const dataToUpdate: Record<string, any> = {};

    // Map camelCase properties to snake_case for the database
    if (updates.name !== undefined) dataToUpdate.name = updates.name;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.type !== undefined) dataToUpdate.type = updates.type;
    if (updates.price !== undefined) dataToUpdate.price = updates.price;
    if (updates.discountPrice !== undefined) dataToUpdate.discount_price = updates.discountPrice;
    if (updates.thumbnail !== undefined) dataToUpdate.thumbnail = updates.thumbnail;
    if (updates.featured !== undefined) dataToUpdate.featured = updates.featured;
    if (updates.publishedAt !== undefined) dataToUpdate.published_at = updates.publishedAt;
    if (updates.fileUrl !== undefined) dataToUpdate.file_url = updates.fileUrl;
    if (updates.fileSize !== undefined) dataToUpdate.file_size = updates.fileSize;
    if (updates.fileType !== undefined) dataToUpdate.file_type = updates.fileType;
    if (updates.modules !== undefined) dataToUpdate.modules = updates.modules;
    if (updates.totalDuration !== undefined) dataToUpdate.total_duration = updates.totalDuration;
    if (updates.benefits !== undefined) dataToUpdate.benefits = updates.benefits;
    if (updates.interval !== undefined) dataToUpdate.interval = updates.interval;
    if (updates.startDate !== undefined) dataToUpdate.start_date = updates.startDate;
    if (updates.endDate !== undefined) dataToUpdate.end_date = updates.endDate;
    if (updates.maxAttendees !== undefined) dataToUpdate.max_attendees = updates.maxAttendees;
    if (updates.meetingUrl !== undefined) dataToUpdate.meeting_url = updates.meetingUrl;
    if (updates.callDuration !== undefined) dataToUpdate.call_duration = updates.callDuration;
    if (updates.callPlatform !== undefined) dataToUpdate.call_platform = updates.callPlatform;
    if (updates.availableDays !== undefined) dataToUpdate.available_days = updates.availableDays;
    if (updates.callTimeSlots !== undefined) dataToUpdate.call_time_slots = updates.callTimeSlots;
    if (updates.targetUrl !== undefined) dataToUpdate.target_url = updates.targetUrl;
    if (updates.linkType !== undefined) dataToUpdate.link_type = updates.linkType;
    if (updates.linkText !== undefined) dataToUpdate.link_text = updates.linkText;
    if (updates.commissionRate !== undefined) dataToUpdate.commission_rate = updates.commissionRate;
    if (updates.leadMagnetFile !== undefined) dataToUpdate.lead_magnet_file = updates.leadMagnetFile;
    if (updates.emailListName !== undefined) dataToUpdate.email_list_name = updates.emailListName;
    if (updates.thankYouMessage !== undefined) dataToUpdate.thank_you_message = updates.thankYouMessage;
    if (updates.redirectUrl !== undefined) dataToUpdate.redirect_url = updates.redirectUrl;
    if (updates.optInRequired !== undefined) dataToUpdate.opt_in_required = updates.optInRequired;
    if (updates.optInText !== undefined) dataToUpdate.opt_in_text = updates.optInText;
    if (updates.responseTime !== undefined) dataToUpdate.response_time = updates.responseTime;
    if (updates.maxQuestionLength !== undefined) dataToUpdate.max_question_length = updates.maxQuestionLength;
    if (updates.topicCategories !== undefined) dataToUpdate.topic_categories = updates.topicCategories;
    if (updates.allowAttachments !== undefined) dataToUpdate.allow_attachments = updates.allowAttachments;
    if (updates.attachmentTypes !== undefined) dataToUpdate.attachment_types = updates.attachmentTypes;
    if (updates.anonymousAllowed !== undefined) dataToUpdate.anonymous_allowed = updates.anonymousAllowed;

    // Add updated_at timestamp
    dataToUpdate.updated_at = new Date().toISOString();

    // First, update the product in our database
    const { data: product, error } = await supabase
      .from('products')
      .update(dataToUpdate)
      .eq('id', productId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Then sync it with Stripe if price-related fields changed
    if ((updates.price !== undefined || updates.name !== undefined || updates.description !== undefined || updates.publishedAt !== undefined) && 
        await hasStripeKeys()) {
      await syncProductWithStripe(product);
    }
    
    return product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const publishProduct = async (productId: string) => {
  try {
    // Update the product with published_at timestamp
    const { data: product, error } = await supabase
      .from('products')
      .update({ published_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Then sync it with Stripe to ensure it's active
    if (await hasStripeKeys()) {
      await syncProductWithStripe(product);
    }
    
    return product;
  } catch (error) {
    console.error('Error publishing product:', error);
    throw error;
  }
};

export const unpublishProduct = async (productId: string) => {
  try {
    // Update the product to remove the published_at timestamp
    const { data: product, error } = await supabase
      .from('products')
      .update({ published_at: null })
      .eq('id', productId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Then sync it with Stripe to ensure it's inactive
    if (await hasStripeKeys()) {
      await syncProductWithStripe(product);
    }
    
    return product;
  } catch (error) {
    console.error('Error unpublishing product:', error);
    throw error;
  }
};

// Helper function to sync a product with Stripe
const syncProductWithStripe = async (product: any) => {
  try {
    // Check if Stripe keys are available
    if (!await hasStripeKeys()) {
      console.warn('Skipping Stripe sync: API keys not configured');
      return null;
    }
    
    const { data, error } = await supabase.functions.invoke('sync-product-to-stripe', {
      body: { product },
    });
    
    if (error) {
      console.warn('Warning: Unable to sync with Stripe:', error);
    }
    
    return data;
  } catch (error) {
    console.warn('Error syncing product with Stripe:', error);
    // Don't rethrow here - we want to allow product creation/updates even if Stripe sync fails
  }
};

// Helper function to check if Stripe keys are configured
const hasStripeKeys = async (): Promise<boolean> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Get the creator profile
    const { data: creator, error } = await supabase
      .from('creators')
      .select('social_links')
      .eq('user_id', user.id)
      .single();
      
    if (error || !creator) return false;
    
    // Check if Stripe keys are configured
    const socialLinks = creator.social_links || {};
    return !!(socialLinks.stripe_publishable_key && socialLinks.stripe_secret_key);
  } catch (error) {
    console.error('Error checking Stripe keys:', error);
    return false;
  }
};

// Get all products for a creator
export const getCreatorProducts = async (creatorId: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching creator products:', error);
    throw error;
  }
};

// Get products by type
export const getProductsByType = async (type: ProductType, limit = 8) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('type', type)
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching products by type:', error);
    throw error;
  }
};

// Get featured products
export const getFeaturedProducts = async (limit = 8) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
};

// Get published products for a creator
export const getPublishedProductsByCreator = async (creatorId: string) => {
  try {
    const { data, error } = await supabase
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
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching published products:', error);
    throw error;
  }
};

// Get a single product with all details
export const getProductById = async (productId: string) => {
  try {
    const { data, error } = await supabase
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
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// Check if a product is published
export const isProductPublished = async (productId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('published_at')
      .eq('id', productId)
      .single();
      
    if (error) throw error;
    
    return data?.published_at !== null;
  } catch (error) {
    console.error('Error checking if product is published:', error);
    return false;
  }
};