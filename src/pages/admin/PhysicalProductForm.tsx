import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  Package, 
  Tag, 
  Truck, 
  DollarSign, 
  BarChart, 
  Layers, 
  Plus, 
  X, 
  ArrowLeft, 
  Image as ImageIcon,
  Link as LinkIcon,
  AlertTriangle,
  Info,
  Check,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Grip
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { FileUploader } from '../../components/products/FileUploader';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface ProductVariant {
  id: string;
  size?: string;
  color?: string;
  material?: string;
  customAttribute?: string;
  customAttributeValue?: string;
  price: number;
  salePrice?: number;
  sku: string;
  stock: number;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images?: string[];
}

interface ProductFormData {
  // Basic Information
  name: string;
  sku: string;
  brand: string;
  category: 'physical' | 'merch' | 'affiliate';
  shortDescription: string;
  description: string;
  featuredImage: File | null;
  featuredImageUrl: string;
  additionalImages: File[];
  additionalImageUrls: string[];
  
  // Inventory & Pricing
  regularPrice: number;
  salePrice?: number;
  costPerUnit: number;
  quantity: number;
  lowStockThreshold: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  
  // Shipping Details
  shippingWeight: number;
  packageDimensions: {
    length: number;
    width: number;
    height: number;
  };
  shippingClass: string;
  freeShipping: boolean;
  shippingRestrictions: string[];
  handlingTime: number;
  
  // Product Variations
  hasVariants: boolean;
  sizeOptions: string[];
  colorOptions: string[];
  materialOptions: string[];
  customAttributes: {
    name: string;
    values: string[];
  }[];
  variants: ProductVariant[];
  
  // Affiliate Information
  affiliateNetwork?: string;
  affiliateLink?: string;
  commissionRate?: number;
  cookieDuration?: number;
  termsAndConditions?: string;
  
  // Additional Features
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  relatedProducts: string[];
  crossSellProducts: string[];
  returnPolicy: string;
  warrantyInfo: string;
}

export const PhysicalProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  
  // Form data state
  const [formData, setFormData] = useState<ProductFormData>({
    // Basic Information
    name: '',
    sku: '',
    brand: '',
    category: 'physical',
    shortDescription: '',
    description: '',
    featuredImage: null,
    featuredImageUrl: '',
    additionalImages: [],
    additionalImageUrls: [],
    
    // Inventory & Pricing
    regularPrice: 0,
    salePrice: undefined,
    costPerUnit: 0,
    quantity: 0,
    lowStockThreshold: 5,
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    
    // Shipping Details
    shippingWeight: 0,
    packageDimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    shippingClass: 'standard',
    freeShipping: false,
    shippingRestrictions: [],
    handlingTime: 1,
    
    // Product Variations
    hasVariants: false,
    sizeOptions: [],
    colorOptions: [],
    materialOptions: [],
    customAttributes: [],
    variants: [],
    
    // Affiliate Information
    affiliateNetwork: '',
    affiliateLink: '',
    commissionRate: 0,
    cookieDuration: 30,
    termsAndConditions: '',
    
    // Additional Features
    tags: [],
    metaTitle: '',
    metaDescription: '',
    relatedProducts: [],
    crossSellProducts: [],
    returnPolicy: '',
    warrantyInfo: ''
  });
  
  // New tag input state
  const [newTag, setNewTag] = useState('');
  const [newSizeOption, setNewSizeOption] = useState('');
  const [newColorOption, setNewColorOption] = useState('');
  const [newMaterialOption, setNewMaterialOption] = useState('');
  const [newCustomAttribute, setNewCustomAttribute] = useState({ name: '', value: '' });
  const [newShippingRestriction, setNewShippingRestriction] = useState('');
  
  // Fetch creator ID and product data if editing
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
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
          
          // If editing an existing product, fetch its data
          if (productId) {
            await fetchProductData(data.id, productId);
          } else {
            // Generate a random SKU for new products
            setFormData(prev => ({
              ...prev,
              sku: `SKU-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
            }));
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching creator ID:', err);
        setError('Could not fetch your creator profile.');
        setLoading(false);
      }
    };
    
    fetchCreatorId();
  }, [user, productId, navigate]);
  
  // Fetch product data when editing
  const fetchProductData = async (creatorId: string, productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('creator_id', creatorId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Transform database data to form data structure
        setFormData({
          // Basic Information
          name: data.name || '',
          sku: data.sku || '',
          brand: data.brand || '',
          category: data.category || 'physical',
          shortDescription: data.short_description || '',
          description: data.description || '',
          featuredImage: null,
          featuredImageUrl: data.thumbnail || '',
          additionalImages: [],
          additionalImageUrls: data.additional_images || [],
          
          // Inventory & Pricing
          regularPrice: data.price || 0,
          salePrice: data.discount_price,
          costPerUnit: data.cost_per_unit || 0,
          quantity: data.quantity || 0,
          lowStockThreshold: data.low_stock_threshold || 5,
          weight: data.weight || 0,
          dimensions: data.dimensions || {
            length: 0,
            width: 0,
            height: 0
          },
          
          // Shipping Details
          shippingWeight: data.shipping_weight || 0,
          packageDimensions: data.package_dimensions || {
            length: 0,
            width: 0,
            height: 0
          },
          shippingClass: data.shipping_class || 'standard',
          freeShipping: data.free_shipping || false,
          shippingRestrictions: data.shipping_restrictions || [],
          handlingTime: data.handling_time || 1,
          
          // Product Variations
          hasVariants: data.has_variants || false,
          sizeOptions: data.size_options || [],
          colorOptions: data.color_options || [],
          materialOptions: data.material_options || [],
          customAttributes: data.custom_attributes || [],
          variants: data.variants || [],
          
          // Affiliate Information
          affiliateNetwork: data.affiliate_network,
          affiliateLink: data.affiliate_link,
          commissionRate: data.commission_rate,
          cookieDuration: data.cookie_duration || 30,
          termsAndConditions: data.terms_and_conditions,
          
          // Additional Features
          tags: data.tags || [],
          metaTitle: data.meta_title || '',
          metaDescription: data.meta_description || '',
          relatedProducts: data.related_products || [],
          crossSellProducts: data.cross_sell_products || [],
          returnPolicy: data.return_policy || '',
          warrantyInfo: data.warranty_info || ''
        });
      }
    } catch (err) {
      console.error('Error fetching product data:', err);
      setError('Could not fetch product data.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof ProductFormData],
          [child]: type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      // Handle regular properties
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : 
                type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                value
      }));
    }
    
    setIsDirty(true);
  };
  
  // Handle featured image upload
  const handleFeaturedImageUpload = (file: File) => {
    setFormData(prev => ({
      ...prev,
      featuredImage: file
    }));
    setIsDirty(true);
  };
  
  // Handle additional image upload
  const handleAdditionalImageUpload = (file: File) => {
    setFormData(prev => ({
      ...prev,
      additionalImages: [...prev.additionalImages, file]
    }));
    setIsDirty(true);
  };
  
  // Remove additional image
  const removeAdditionalImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index),
      additionalImageUrls: prev.additionalImageUrls.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };
  
  // Add a new tag
  const addTag = () => {
    if (!newTag.trim()) return;
    
    if (formData.tags.includes(newTag.trim())) {
      setNewTag('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    
    setNewTag('');
    setIsDirty(true);
  };
  
  // Remove a tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
    setIsDirty(true);
  };
  
  // Add a size option
  const addSizeOption = () => {
    if (!newSizeOption.trim()) return;
    
    if (formData.sizeOptions.includes(newSizeOption.trim())) {
      setNewSizeOption('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      sizeOptions: [...prev.sizeOptions, newSizeOption.trim()]
    }));
    
    setNewSizeOption('');
    setIsDirty(true);
  };
  
  // Remove a size option
  const removeSizeOption = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizeOptions: prev.sizeOptions.filter(s => s !== size)
    }));
    setIsDirty(true);
  };
  
  // Add a color option
  const addColorOption = () => {
    if (!newColorOption.trim()) return;
    
    if (formData.colorOptions.includes(newColorOption.trim())) {
      setNewColorOption('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      colorOptions: [...prev.colorOptions, newColorOption.trim()]
    }));
    
    setNewColorOption('');
    setIsDirty(true);
  };
  
  // Remove a color option
  const removeColorOption = (color: string) => {
    setFormData(prev => ({
      ...prev,
      colorOptions: prev.colorOptions.filter(c => c !== color)
    }));
    setIsDirty(true);
  };
  
  // Add a material option
  const addMaterialOption = () => {
    if (!newMaterialOption.trim()) return;
    
    if (formData.materialOptions.includes(newMaterialOption.trim())) {
      setNewMaterialOption('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      materialOptions: [...prev.materialOptions, newMaterialOption.trim()]
    }));
    
    setNewMaterialOption('');
    setIsDirty(true);
  };
  
  // Remove a material option
  const removeMaterialOption = (material: string) => {
    setFormData(prev => ({
      ...prev,
      materialOptions: prev.materialOptions.filter(m => m !== material)
    }));
    setIsDirty(true);
  };
  
  // Add a custom attribute
  const addCustomAttribute = () => {
    if (!newCustomAttribute.name.trim() || !newCustomAttribute.value.trim()) return;
    
    // Check if this attribute name already exists
    const existingAttr = formData.customAttributes.find(attr => 
      attr.name.toLowerCase() === newCustomAttribute.name.toLowerCase()
    );
    
    if (existingAttr) {
      // Add the value to the existing attribute if it doesn't already exist
      if (!existingAttr.values.includes(newCustomAttribute.value.trim())) {
        setFormData(prev => ({
          ...prev,
          customAttributes: prev.customAttributes.map(attr => 
            attr.name.toLowerCase() === newCustomAttribute.name.toLowerCase()
              ? { ...attr, values: [...attr.values, newCustomAttribute.value.trim()] }
              : attr
          )
        }));
      }
    } else {
      // Add a new attribute
      setFormData(prev => ({
        ...prev,
        customAttributes: [
          ...prev.customAttributes, 
          { 
            name: newCustomAttribute.name.trim(), 
            values: [newCustomAttribute.value.trim()] 
          }
        ]
      }));
    }
    
    setNewCustomAttribute({ name: '', value: '' });
    setIsDirty(true);
  };
  
  // Remove a custom attribute
  const removeCustomAttribute = (attrName: string) => {
    setFormData(prev => ({
      ...prev,
      customAttributes: prev.customAttributes.filter(attr => attr.name !== attrName)
    }));
    setIsDirty(true);
  };
  
  // Remove a custom attribute value
  const removeCustomAttributeValue = (attrName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customAttributes: prev.customAttributes.map(attr => 
        attr.name === attrName
          ? { 
              ...attr, 
              values: attr.values.filter(v => v !== value),
            }
          : attr
      ).filter(attr => attr.values.length > 0) // Remove attribute if no values left
    }));
    setIsDirty(true);
  };
  
  // Add a shipping restriction
  const addShippingRestriction = () => {
    if (!newShippingRestriction.trim()) return;
    
    if (formData.shippingRestrictions.includes(newShippingRestriction.trim())) {
      setNewShippingRestriction('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      shippingRestrictions: [...prev.shippingRestrictions, newShippingRestriction.trim()]
    }));
    
    setNewShippingRestriction('');
    setIsDirty(true);
  };
  
  // Remove a shipping restriction
  const removeShippingRestriction = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      shippingRestrictions: prev.shippingRestrictions.filter(r => r !== restriction)
    }));
    setIsDirty(true);
  };
  
  // Generate variants based on selected options
  const generateVariants = () => {
    if (!formData.hasVariants) return;
    
    // Collect all attribute options
    const attributeOptions: Record<string, string[]> = {};
    
    if (formData.sizeOptions.length > 0) {
      attributeOptions['size'] = formData.sizeOptions;
    }
    
    if (formData.colorOptions.length > 0) {
      attributeOptions['color'] = formData.colorOptions;
    }
    
    if (formData.materialOptions.length > 0) {
      attributeOptions['material'] = formData.materialOptions;
    }
    
    // Add custom attributes
    formData.customAttributes.forEach(attr => {
      attributeOptions[attr.name] = attr.values;
    });
    
    // If no attributes, don't generate variants
    if (Object.keys(attributeOptions).length === 0) {
      return;
    }
    
    // Generate all possible combinations
    const attributeNames = Object.keys(attributeOptions);
    const combinations: Record<string, string>[] = [{}];
    
    attributeNames.forEach(attrName => {
      const values = attributeOptions[attrName];
      const newCombinations: Record<string, string>[] = [];
      
      combinations.forEach(combo => {
        values.forEach(value => {
          newCombinations.push({
            ...combo,
            [attrName]: value
          });
        });
      });
      
      combinations.length = 0;
      combinations.push(...newCombinations);
    });
    
    // Create variants from combinations
    const newVariants: ProductVariant[] = combinations.map((combo, index) => {
      // Generate a variant name from the combination
      const variantName = Object.entries(combo)
        .map(([attr, value]) => `${value}`)
        .join('-');
      
      // Generate a SKU
      const sku = `${formData.sku}-${variantName}`.replace(/\s+/g, '-');
      
      return {
        id: `variant-${Date.now()}-${index}`,
        ...combo,
        price: formData.regularPrice,
        salePrice: formData.salePrice,
        sku,
        stock: formData.quantity,
        weight: formData.weight,
        dimensions: { ...formData.dimensions }
      };
    });
    
    setFormData(prev => ({
      ...prev,
      variants: newVariants
    }));
    
    setIsDirty(true);
  };
  
  // Update a variant
  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(variant => 
        variant.id === variantId ? { ...variant, ...updates } : variant
      )
    }));
    setIsDirty(true);
  };
  
  // Remove a variant
  const removeVariant = (variantId: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(variant => variant.id !== variantId)
    }));
    setIsDirty(true);
  };
  
  // Toggle variant expanded state
  const toggleVariantExpanded = (variantId: string) => {
    setExpandedVariant(expandedVariant === variantId ? null : variantId);
  };
  
  // Save the product
  const saveProduct = async (publish: boolean = false) => {
    if (!creatorId) return;
    
    // Validate required fields
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    
    if (formData.category === 'affiliate' && !formData.affiliateLink) {
      setError('Affiliate link is required for affiliate products');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Upload featured image if present
      let featuredImageUrl = formData.featuredImageUrl;
      if (formData.featuredImage) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(`products/${Date.now()}-${formData.featuredImage.name}`, formData.featuredImage);
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(uploadData.path);
          
        featuredImageUrl = urlData.publicUrl;
      }
      
      // Upload additional images if present
      let additionalImageUrls = [...formData.additionalImageUrls];
      for (const image of formData.additionalImages) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(`products/${Date.now()}-${image.name}`, image);
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(uploadData.path);
          
        additionalImageUrls.push(urlData.publicUrl);
      }
      
      // Prepare product data for database
      const productData = {
        creator_id: creatorId,
        name: formData.name,
        sku: formData.sku,
        brand: formData.brand,
        category: formData.category,
        short_description: formData.shortDescription,
        description: formData.description,
        thumbnail: featuredImageUrl,
        additional_images: additionalImageUrls,
        
        // Inventory & Pricing
        price: formData.regularPrice * 100, // Store in cents
        discount_price: formData.salePrice ? formData.salePrice * 100 : null, // Store in cents
        cost_per_unit: formData.costPerUnit * 100, // Store in cents
        quantity: formData.quantity,
        low_stock_threshold: formData.lowStockThreshold,
        weight: formData.weight,
        dimensions: formData.dimensions,
        
        // Shipping Details
        shipping_weight: formData.shippingWeight,
        package_dimensions: formData.packageDimensions,
        shipping_class: formData.shippingClass,
        free_shipping: formData.freeShipping,
        shipping_restrictions: formData.shippingRestrictions,
        handling_time: formData.handlingTime,
        
        // Product Variations
        has_variants: formData.hasVariants,
        size_options: formData.sizeOptions,
        color_options: formData.colorOptions,
        material_options: formData.materialOptions,
        custom_attributes: formData.customAttributes,
        variants: formData.variants,
        
        // Affiliate Information
        affiliate_network: formData.affiliateNetwork,
        affiliate_link: formData.affiliateLink,
        commission_rate: formData.commissionRate,
        cookie_duration: formData.cookieDuration,
        terms_and_conditions: formData.termsAndConditions,
        
        // Additional Features
        tags: formData.tags,
        meta_title: formData.metaTitle,
        meta_description: formData.metaDescription,
        related_products: formData.relatedProducts,
        cross_sell_products: formData.crossSellProducts,
        return_policy: formData.returnPolicy,
        warranty_info: formData.warrantyInfo,
        
        // Set published_at if publishing
        published_at: publish ? new Date().toISOString() : null,
        
        // Set type based on category
        type: formData.category === 'affiliate' ? 'external_link' : 'download'
      };
      
      if (productId) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId);
          
        if (error) throw error;
        
        setSuccess('Product updated successfully');
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select();
          
        if (error) throw error;
        
        setSuccess('Product created successfully');
        
        // Redirect to edit page for the new product
        if (data && data.length > 0) {
          navigate(`/creator/products/edit/${data[0].id}`);
        }
      }
      
      setIsDirty(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product. Please try again.');
    } finally {
      setSaving(false);
      if (publish) {
        setIsPublishing(false);
      }
    }
  };
  
  // Publish the product
  const publishProduct = async () => {
    setIsPublishing(true);
    await saveProduct(true);
  };
  
  // Navigate to previous step
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Navigate to next step
  const goToNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => navigate('/creator/products')}
          className="mr-4 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {productId ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-gray-500">
            {productId ? 'Update your product details' : 'Create a new physical or affiliate product'}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}
      
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-purple-600 h-2.5 rounded-full" 
              style={{ width: `${(currentStep / 6) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <div className={currentStep >= 1 ? 'text-purple-600 font-medium' : ''}>Basic Info</div>
          <div className={currentStep >= 2 ? 'text-purple-600 font-medium' : ''}>Inventory & Pricing</div>
          <div className={currentStep >= 3 ? 'text-purple-600 font-medium' : ''}>Shipping</div>
          <div className={currentStep >= 4 ? 'text-purple-600 font-medium' : ''}>Variations</div>
          <div className={currentStep >= 5 ? 'text-purple-600 font-medium' : ''}>Affiliate Info</div>
          <div className={currentStep >= 6 ? 'text-purple-600 font-medium' : ''}>Additional</div>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Basic Information</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name/Title*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      required
                      maxLength={100}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                      SKU/Product ID*
                    </label>
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Product Category*
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      required
                    >
                      <option value="physical">Physical Product</option>
                      <option value="merch">Merchandise</option>
                      <option value="affiliate">Affiliate Product</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description (150 chars max)*
                  </label>
                  <textarea
                    id="shortDescription"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    rows={2}
                    maxLength={150}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {formData.shortDescription.length}/150 characters
                  </p>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Description*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image*
                  </label>
                  {formData.featuredImageUrl ? (
                    <div className="relative w-full max-w-md">
                      <img 
                        src={formData.featuredImageUrl} 
                        alt="Featured product" 
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, featuredImageUrl: '' }))}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <FileUploader
                      onFileSelected={handleFeaturedImageUpload}
                      onClear={() => setFormData(prev => ({ ...prev, featuredImage: null }))}
                      accept="image/*"
                      maxSize={5}
                      isImage={true}
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Product Images (up to 5)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                    {formData.additionalImageUrls.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={imageUrl} 
                          alt={`Product view ${index + 1}`} 
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(index)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    {formData.additionalImages.map((image, index) => (
                      <div key={`new-${index}`} className="relative">
                        <img 
                          src={URL.createObjectURL(image)} 
                          alt={`New product view ${index + 1}`} 
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(index)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    {(formData.additionalImageUrls.length + formData.additionalImages.length) < 5 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                        <input
                          type="file"
                          id="additionalImage"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleAdditionalImageUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('additionalImage')?.click()}
                          className="text-purple-600 hover:text-purple-500"
                        >
                          <Plus className="h-8 w-8" />
                        </button>
                        <span className="mt-2 text-xs text-gray-500">Add Image</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Add up to 5 additional images to show different angles or details of your product.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Inventory & Pricing */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Inventory & Pricing</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="regularPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Regular Price*
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="regularPrice"
                        name="regularPrice"
                        value={formData.regularPrice}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">USD</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Sale Price (optional)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="salePrice"
                        name="salePrice"
                        value={formData.salePrice || ''}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">USD</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="costPerUnit" className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Per Unit
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="costPerUnit"
                        name="costPerUnit"
                        value={formData.costPerUnit}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">USD</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      For your reference only (not shown to customers)
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity in Stock*
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="0"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      id="lowStockThreshold"
                      name="lowStockThreshold"
                      value={formData.lowStockThreshold}
                      onChange={handleChange}
                      min="0"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Get alerts when stock falls below this number
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-3">Product Dimensions & Weight</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                        Weight (lbs)*
                      </label>
                      <input
                        type="number"
                        id="weight"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="dimensions.length" className="block text-sm font-medium text-gray-700 mb-1">
                        Length (in)
                      </label>
                      <input
                        type="number"
                        id="dimensions.length"
                        name="dimensions.length"
                        value={formData.dimensions.length}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="dimensions.width" className="block text-sm font-medium text-gray-700 mb-1">
                        Width (in)
                      </label>
                      <input
                        type="number"
                        id="dimensions.width"
                        name="dimensions.width"
                        value={formData.dimensions.width}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="dimensions.height" className="block text-sm font-medium text-gray-700 mb-1">
                        Height (in)
                      </label>
                      <input
                        type="number"
                        id="dimensions.height"
                        name="dimensions.height"
                        value={formData.dimensions.height}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                {formData.category === 'affiliate' && (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Affiliate Product Note</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            For affiliate products, inventory management is handled by the merchant. You'll set up the affiliate link details in Step 5.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 3: Shipping Details */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Details</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="shippingWeight" className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Weight (lbs)*
                    </label>
                    <input
                      type="number"
                      id="shippingWeight"
                      name="shippingWeight"
                      value={formData.shippingWeight}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="packageDimensions.length" className="block text-sm font-medium text-gray-700 mb-1">
                      Package Length (in)
                    </label>
                    <input
                      type="number"
                      id="packageDimensions.length"
                      name="packageDimensions.length"
                      value={formData.packageDimensions.length}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="packageDimensions.width" className="block text-sm font-medium text-gray-700 mb-1">
                      Package Width (in)
                    </label>
                    <input
                      type="number"
                      id="packageDimensions.width"
                      name="packageDimensions.width"
                      value={formData.packageDimensions.width}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="packageDimensions.height" className="block text-sm font-medium text-gray-700 mb-1">
                      Package Height (in)
                    </label>
                    <input
                      type="number"
                      id="packageDimensions.height"
                      name="packageDimensions.height"
                      value={formData.packageDimensions.height}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="shippingClass" className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Class
                    </label>
                    <select
                      id="shippingClass"
                      name="shippingClass"
                      value={formData.shippingClass}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    >
                      <option value="standard">Standard Shipping</option>
                      <option value="express">Express Shipping</option>
                      <option value="economy">Economy Shipping</option>
                      <option value="bulky">Bulky Item</option>
                      <option value="fragile">Fragile Item</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="handlingTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Handling Time (days)
                    </label>
                    <input
                      type="number"
                      id="handlingTime"
                      name="handlingTime"
                      value={formData.handlingTime}
                      onChange={handleChange}
                      min="0"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Number of business days to process and ship the order
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="freeShipping"
                    name="freeShipping"
                    type="checkbox"
                    checked={formData.freeShipping}
                    onChange={(e) => setFormData(prev => ({ ...prev, freeShipping: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="freeShipping" className="ml-2 block text-sm text-gray-700">
                    Free Shipping
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Restrictions
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.shippingRestrictions.map((restriction, index) => (
                      <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                        <span>{restriction}</span>
                        <button
                          type="button"
                          onClick={() => removeShippingRestriction(restriction)}
                          className="ml-1.5 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newShippingRestriction}
                      onChange={(e) => setNewShippingRestriction(e.target.value)}
                      placeholder="Add shipping restriction (e.g., country or region)"
                      className="block w-full rounded-l-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={addShippingRestriction}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Add locations where this product cannot be shipped
                  </p>
                </div>
                
                {formData.category === 'affiliate' && (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Affiliate Product Note</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            For affiliate products, shipping details are handled by the merchant. These settings won't affect the product listing but can be used for your reference.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 4: Product Variations */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Variations</h2>
              
              <div className="space-y-6">
                <div className="flex items-center">
                  <input
                    id="hasVariants"
                    name="hasVariants"
                    type="checkbox"
                    checked={formData.hasVariants}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasVariants: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasVariants" className="ml-2 block text-sm text-gray-700">
                    This product has multiple variations (size, color, etc.)
                  </label>
                </div>
                
                {formData.hasVariants && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Size Options */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Size Options
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.sizeOptions.map((size, index) => (
                            <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                              <span>{size}</span>
                              <button
                                type="button"
                                onClick={() => removeSizeOption(size)}
                                className="ml-1.5 text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex">
                          <input
                            type="text"
                            value={newSizeOption}
                            onChange={(e) => setNewSizeOption(e.target.value)}
                            placeholder="Add size (e.g., S, M, L, XL)"
                            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={addSizeOption}
                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      
                      {/* Color Options */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color Options
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.colorOptions.map((color, index) => (
                            <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                              <span>{color}</span>
                              <button
                                type="button"
                                onClick={() => removeColorOption(color)}
                                className="ml-1.5 text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex">
                          <input
                            type="text"
                            value={newColorOption}
                            onChange={(e) => setNewColorOption(e.target.value)}
                            placeholder="Add color (e.g., Red, Blue)"
                            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={addColorOption}
                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      
                      {/* Material Options */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Material Options
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.materialOptions.map((material, index) => (
                            <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                              <span>{material}</span>
                              <button
                                type="button"
                                onClick={() => removeMaterialOption(material)}
                                className="ml-1.5 text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex">
                          <input
                            type="text"
                            value={newMaterialOption}
                            onChange={(e) => setNewMaterialOption(e.target.value)}
                            placeholder="Add material (e.g., Cotton)"
                            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={addMaterialOption}
                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Custom Attributes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Attributes
                      </label>
                      
                      {formData.customAttributes.length > 0 && (
                        <div className="mb-4 space-y-3">
                          {formData.customAttributes.map((attr, attrIndex) => (
                            <div key={attrIndex} className="border rounded-md p-3">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium text-gray-900">{attr.name}</h4>
                                <button
                                  type="button"
                                  onClick={() => removeCustomAttribute(attr.name)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {attr.values.map((value, valueIndex) => (
                                  <div key={valueIndex} className="bg-gray-100 rounded-full px-3 py-1 text-xs flex items-center">
                                    <span>{value}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeCustomAttributeValue(attr.name, value)}
                                      className="ml-1.5 text-gray-400 hover:text-gray-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={newCustomAttribute.name}
                          onChange={(e) => setNewCustomAttribute({ ...newCustomAttribute, name: e.target.value })}
                          placeholder="Attribute name (e.g., Style)"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                        <div className="flex">
                          <input
                            type="text"
                            value={newCustomAttribute.value}
                            onChange={(e) => setNewCustomAttribute({ ...newCustomAttribute, value: e.target.value })}
                            placeholder="Attribute value (e.g., Casual)"
                            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={addCustomAttribute}
                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                            disabled={!newCustomAttribute.name.trim() || !newCustomAttribute.value.trim()}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Add custom attributes like style, pattern, etc.
                      </p>
                    </div>
                    
                    {/* Generate Variants Button */}
                    <div className="flex justify-center">
                      <Button
                        onClick={generateVariants}
                        leftIcon={<Layers className="h-4 w-4" />}
                        disabled={
                          formData.sizeOptions.length === 0 && 
                          formData.colorOptions.length === 0 && 
                          formData.materialOptions.length === 0 &&
                          formData.customAttributes.length === 0
                        }
                      >
                        Generate Product Variants
                      </Button>
                    </div>
                    
                    {/* Variants List */}
                    {formData.variants.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-base font-medium text-gray-900 mb-3">
                          Product Variants ({formData.variants.length})
                        </h3>
                        
                        <div className="space-y-3">
                          {formData.variants.map((variant) => (
                            <div key={variant.id} className="border rounded-md overflow-hidden">
                              <div 
                                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                                onClick={() => toggleVariantExpanded(variant.id)}
                              >
                                <div className="flex items-center">
                                  <Grip className="h-4 w-4 text-gray-400 mr-2" />
                                  <div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {variant.size && `${variant.size} `}
                                      {variant.color && `${variant.color} `}
                                      {variant.material && `${variant.material} `}
                                      {Object.entries(variant)
                                        .filter(([key]) => !['id', 'size', 'color', 'material', 'price', 'salePrice', 'sku', 'stock', 'weight', 'dimensions', 'images'].includes(key))
                                        .map(([_, value]) => value)
                                        .join(' ')}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                      SKU: {variant.sku} | Stock: {variant.stock} | Price: {formatCurrency(variant.price)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeVariant(variant.id);
                                    }}
                                    className="text-red-500 hover:text-red-700 mr-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                  {expandedVariant === variant.id ? (
                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                              
                              {expandedVariant === variant.id && (
                                <div className="p-4 border-t">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <label htmlFor={`variant-${variant.id}-price`} className="block text-sm font-medium text-gray-700 mb-1">
                                        Price
                                      </label>
                                      <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                          <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input
                                          type="number"
                                          id={`variant-${variant.id}-price`}
                                          value={variant.price}
                                          onChange={(e) => updateVariant(variant.id, { price: parseFloat(e.target.value) || 0 })}
                                          min="0"
                                          step="0.01"
                                          className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <label htmlFor={`variant-${variant.id}-salePrice`} className="block text-sm font-medium text-gray-700 mb-1">
                                        Sale Price
                                      </label>
                                      <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                          <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input
                                          type="number"
                                          id={`variant-${variant.id}-salePrice`}
                                          value={variant.salePrice || ''}
                                          onChange={(e) => updateVariant(variant.id, { salePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                                          min="0"
                                          step="0.01"
                                          className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <label htmlFor={`variant-${variant.id}-sku`} className="block text-sm font-medium text-gray-700 mb-1">
                                        SKU
                                      </label>
                                      <input
                                        type="text"
                                        id={`variant-${variant.id}-sku`}
                                        value={variant.sku}
                                        onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label htmlFor={`variant-${variant.id}-stock`} className="block text-sm font-medium text-gray-700 mb-1">
                                        Stock Quantity
                                      </label>
                                      <input
                                        type="number"
                                        id={`variant-${variant.id}-stock`}
                                        value={variant.stock}
                                        onChange={(e) => updateVariant(variant.id, { stock: parseInt(e.target.value) || 0 })}
                                        min="0"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label htmlFor={`variant-${variant.id}-weight`} className="block text-sm font-medium text-gray-700 mb-1">
                                        Weight (lbs)
                                      </label>
                                      <input
                                        type="number"
                                        id={`variant-${variant.id}-weight`}
                                        value={variant.weight}
                                        onChange={(e) => updateVariant(variant.id, { weight: parseFloat(e.target.value) || 0 })}
                                        min="0"
                                        step="0.01"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {formData.category === 'affiliate' && (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Affiliate Product Note</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            For affiliate products, variations are typically managed by the merchant. You can skip this step or add variations for your reference only.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 5: Affiliate Information */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Affiliate Information</h2>
              
              {formData.category === 'affiliate' ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="affiliateNetwork" className="block text-sm font-medium text-gray-700 mb-1">
                      Affiliate Network
                    </label>
                    <select
                      id="affiliateNetwork"
                      name="affiliateNetwork"
                      value={formData.affiliateNetwork}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    >
                      <option value="">Select Network</option>
                      <option value="amazon">Amazon Associates</option>
                      <option value="clickbank">ClickBank</option>
                      <option value="cj">Commission Junction</option>
                      <option value="shareasale">ShareASale</option>
                      <option value="impact">Impact</option>
                      <option value="awin">AWIN</option>
                      <option value="rakuten">Rakuten</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="affiliateLink" className="block text-sm font-medium text-gray-700 mb-1">
                      Affiliate Link/URL*
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        <LinkIcon className="h-4 w-4" />
                      </span>
                      <input
                        type="url"
                        id="affiliateLink"
                        name="affiliateLink"
                        value={formData.affiliateLink}
                        onChange={handleChange}
                        placeholder="https://example.com/affiliate-link"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm border-gray-300"
                        required={formData.category === 'affiliate'}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your full affiliate link including tracking parameters
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-1">
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        id="commissionRate"
                        name="commissionRate"
                        value={formData.commissionRate}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Your commission percentage for each sale
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="cookieDuration" className="block text-sm font-medium text-gray-700 mb-1">
                        Cookie Duration (days)
                      </label>
                      <input
                        type="number"
                        id="cookieDuration"
                        name="cookieDuration"
                        value={formData.cookieDuration}
                        onChange={handleChange}
                        min="0"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        How long the affiliate cookie lasts
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="termsAndConditions" className="block text-sm font-medium text-gray-700 mb-1">
                      Terms & Conditions
                    </label>
                    <textarea
                      id="termsAndConditions"
                      name="termsAndConditions"
                      value={formData.termsAndConditions}
                      onChange={handleChange}
                      rows={4}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Enter any specific terms or conditions for this affiliate product"
                    />
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Affiliate Disclosure</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            Remember to include proper affiliate disclosures on your product pages to comply with FTC guidelines and other regulations. Customers should be informed that you may earn a commission from their purchases.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-md text-center">
                  <LinkIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Not an Affiliate Product</h3>
                  <p className="mt-1 text-gray-500">
                    This section is only applicable for affiliate products. You can skip this step.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={goToNextStep}
                  >
                    Skip to Next Step
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Step 6: Additional Features */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Features</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1.5 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add product tag"
                      className="block w-full rounded-l-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Tags help customers find your products
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      id="metaTitle"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="SEO title (leave blank to use product name)"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      id="metaDescription"
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleChange}
                      rows={2}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="SEO description (leave blank to use short description)"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="returnPolicy" className="block text-sm font-medium text-gray-700 mb-1">
                    Return Policy
                  </label>
                  <textarea
                    id="returnPolicy"
                    name="returnPolicy"
                    value={formData.returnPolicy}
                    onChange={handleChange}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="Enter return policy for this product (leave blank to use store default)"
                  />
                </div>
                
                <div>
                  <label htmlFor="warrantyInfo" className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty Information
                  </label>
                  <textarea
                    id="warrantyInfo"
                    name="warrantyInfo"
                    value={formData.warrantyInfo}
                    onChange={handleChange}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="Enter warranty information for this product"
                  />
                </div>
                
                {formData.category === 'affiliate' && (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Affiliate Product Note</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            For affiliate products, return policies and warranties are handled by the merchant. Make sure to include accurate information about the merchant's policies in your product description.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 1}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            
            <div className="flex space-x-3">
              {currentStep < 6 ? (
                <Button
                  type="button"
                  onClick={goToNextStep}
                >
                  Next
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => saveProduct(false)}
                    isLoading={saving && !isPublishing}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Save Draft
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => publishProduct()}
                    isLoading={isPublishing}
                    leftIcon={<Check className="h-4 w-4" />}
                  >
                    {productId ? 'Update & Publish' : 'Save & Publish'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};