import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';
import { createProduct, updateProduct, getProductById } from '../../services/productService';
import { useAuthStore } from '../../stores/authStore';
import { Product, ProductType, CourseModule, Benefit } from '../../types';
import { FileUploader } from '../../components/products/FileUploader';
import { CourseModuleEditor } from '../../components/products/CourseModuleEditor';
import { MembershipBenefitEditor } from '../../components/products/MembershipBenefitEditor';
import { WebinarScheduler } from '../../components/products/WebinarScheduler';
import { ExternalLinkSettings } from '../../components/products/ExternalLinkSettings';
import { LeadMagnetSettings } from '../../components/products/LeadMagnetSettings';
import { AMASettings } from '../../components/products/AMASettings';
import { PhysicalProductSettings } from '../../components/products/PhysicalProductSettings';
import { AffiliateProductSettings } from '../../components/products/AffiliateProductSettings';
import { ServiceSettings } from '../../components/products/ServiceSettings';
import { TicketSettings } from '../../components/products/TicketSettings';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { 
  ArrowLeft, 
  ArrowRight, 
  Download, 
  BookOpen, 
  Users, 
  Video, 
  Calendar, 
  Clock, 
  Phone, 
  Link, 
  Mail, 
  MessageSquare,
  Package,
  ExternalLink,
  Briefcase,
  Ticket
} from 'lucide-react';

export const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuthStore();
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    type: 'download',
    price: 0,
    discountPrice: undefined,
    thumbnail: undefined,
    featured: false,
    
    // Download specific fields
    fileUrl: undefined,
    fileSize: undefined,
    fileType: undefined,
    
    // Course specific fields
    modules: [],
    totalDuration: 0,
    
    // Membership specific fields
    benefits: [],
    interval: 'monthly',
    
    // Webinar specific fields
    startDate: '',
    endDate: '',
    maxAttendees: undefined,
    meetingUrl: '',
    
    // 1on1call specific fields
    callDuration: 30,
    callPlatform: 'zoom',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    callTimeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    
    // External link specific fields
    targetUrl: '',
    linkType: 'affiliate',
    linkText: '',
    commissionRate: 10,
    
    // Lead magnet specific fields
    leadMagnetFile: '',
    emailListName: '',
    thankYouMessage: 'Thank you for your interest! Your download link has been sent to your email.',
    redirectUrl: '',
    optInRequired: true,
    optInText: 'Yes, I agree to receive newsletters and promotional emails. I understand I can unsubscribe at any time.',
    
    // AMA specific fields
    responseTime: 24,
    maxQuestionLength: 1000,
    topicCategories: [],
    allowAttachments: false,
    attachmentTypes: [],
    anonymousAllowed: false,
    
    // Physical product specific fields
    sku: '',
    brand: '',
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    inventory: 0,
    lowStockThreshold: 5,
    shippingWeight: 0,
    shippingDimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    shippingClass: '',
    freeShipping: false,
    handlingTime: 1,
    variations: [],
    additionalImages: [],
    
    // Affiliate product specific fields
    affiliateNetwork: '',
    cookieDuration: 30,
    termsAndConditions: '',
    
    // Service specific fields
    serviceType: '',
    serviceDuration: 1,
    serviceDeliverables: [],
    serviceTurnaroundTime: 3,
    serviceRevisions: 2,
    
    // Ticket specific fields
    ticketType: 'physical',
    venue: '',
    venueAddress: '',
    eventDate: '',
    eventTime: '',
    ticketQuantity: 100,
    ticketOptions: [],
    seatingChart: null,
    ticketDeliveryMethod: 'email',
    ticketTransferable: true,
    ticketRefundPolicy: ''
  });
  
  // File upload states
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [leadMagnetFile, setLeadMagnetFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingLeadMagnet, setUploadingLeadMagnet] = useState(false);
  
  // Fetch creator ID on component mount
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
          
          // If we're editing an existing product, fetch its data
          if (productId) {
            setIsEditing(true);
            await fetchProductData(productId);
          } else {
            setLoading(false);
          }
        } else {
          setError('Creator profile not found. Please complete your creator onboarding first.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching creator ID:', err);
        setError(err.message || 'An error occurred while fetching your creator profile.');
        setLoading(false);
      }
    };
    
    fetchCreatorId();
  }, [user, navigate, productId]);
  
  // Fetch product data when editing
  const fetchProductData = async (id: string) => {
    try {
      const product = await getProductById(id);
      
      if (product) {
        // Transform the data to match our form structure
        setFormData({
          id: product.id,
          creatorId: product.creator_id,
          name: product.name,
          description: product.description,
          type: product.type as ProductType,
          price: product.price,
          discountPrice: product.discount_price,
          thumbnail: product.thumbnail,
          featured: product.featured,
          publishedAt: product.published_at,
          
          // Type-specific fields
          fileUrl: product.file_url,
          fileSize: product.file_size,
          fileType: product.file_type,
          modules: product.modules,
          totalDuration: product.total_duration,
          benefits: product.benefits,
          interval: product.interval,
          startDate: product.start_date,
          endDate: product.end_date,
          maxAttendees: product.max_attendees,
          meetingUrl: product.meeting_url,
          callDuration: product.call_duration,
          callPlatform: product.call_platform,
          availableDays: product.available_days,
          callTimeSlots: product.call_time_slots,
          targetUrl: product.target_url,
          linkType: product.link_type,
          linkText: product.link_text,
          commissionRate: product.commission_rate,
          leadMagnetFile: product.lead_magnet_file,
          emailListName: product.email_list_name,
          thankYouMessage: product.thank_you_message,
          redirectUrl: product.redirect_url,
          optInRequired: product.opt_in_required,
          optInText: product.opt_in_text,
          responseTime: product.response_time,
          maxQuestionLength: product.max_question_length,
          topicCategories: product.topic_categories,
          allowAttachments: product.allow_attachments,
          attachmentTypes: product.attachment_types,
          anonymousAllowed: product.anonymous_allowed,
          sku: product.sku,
          brand: product.brand,
          weight: product.weight,
          dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
          inventory: product.inventory,
          lowStockThreshold: product.low_stock_threshold,
          shippingWeight: product.shipping_weight,
          shippingDimensions: product.shipping_dimensions || { length: 0, width: 0, height: 0 },
          shippingClass: product.shipping_class,
          freeShipping: product.free_shipping,
          handlingTime: product.handling_time,
          variations: product.variations,
          additionalImages: product.additional_images,
          affiliateNetwork: product.affiliate_network,
          cookieDuration: product.cookie_duration,
          termsAndConditions: product.terms_and_conditions,
          serviceType: product.service_type,
          serviceDuration: product.service_duration,
          serviceDeliverables: product.service_deliverables,
          serviceTurnaroundTime: product.service_turnaround_time,
          serviceRevisions: product.service_revisions,
          ticketType: product.ticket_type || 'physical',
          venue: product.venue,
          venueAddress: product.venue_address,
          eventDate: product.event_date,
          eventTime: product.event_time,
          ticketQuantity: product.ticket_quantity,
          ticketOptions: product.ticket_options || [],
          seatingChart: product.seating_chart,
          ticketDeliveryMethod: product.ticket_delivery_method || 'email',
          ticketTransferable: product.ticket_transferable !== undefined ? product.ticket_transferable : true,
          ticketRefundPolicy: product.ticket_refund_policy
        });
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to load product data.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle product type selection
  const handleProductTypeSelect = (type: ProductType) => {
    setFormData(prev => ({
      ...prev,
      type
    }));
  };
  
  // Upload thumbnail image
  const handleThumbnailUpload = async (file: File) => {
    if (!file) return;
    
    setThumbnailFile(file);
    setUploadingThumbnail(true);
    
    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, file);
        
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filePath);
        
      setFormData(prev => ({
        ...prev,
        thumbnail: urlData.publicUrl
      }));
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
      setError('Failed to upload thumbnail. Please try again.');
    } finally {
      setUploadingThumbnail(false);
    }
  };
  
  // Upload product file (for download products)
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setProductFile(file);
    setUploadingFile(true);
    
    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `product-files/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-files')
        .upload(filePath, file);
        
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('product-files')
        .getPublicUrl(filePath);
        
      setFormData(prev => ({
        ...prev,
        fileUrl: urlData.publicUrl,
        fileSize: file.size,
        fileType: file.type
      }));
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };
  
  // Upload lead magnet file
  const handleLeadMagnetUpload = async (file: File) => {
    if (!file) return;
    
    setLeadMagnetFile(file);
    setUploadingLeadMagnet(true);
    
    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `lead-magnet-${uuidv4()}.${fileExt}`;
      const filePath = `product-files/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-files')
        .upload(filePath, file);
        
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('product-files')
        .getPublicUrl(filePath);
        
      setFormData(prev => ({
        ...prev,
        leadMagnetFile: urlData.publicUrl
      }));
    } catch (err) {
      console.error('Error uploading lead magnet file:', err);
      setError('Failed to upload lead magnet file. Please try again.');
    } finally {
      setUploadingLeadMagnet(false);
    }
  };
  
  // Clear thumbnail
  const clearThumbnail = () => {
    setFormData(prev => ({
      ...prev,
      thumbnail: undefined
    }));
    setThumbnailFile(null);
  };
  
  // Clear product file
  const clearFile = () => {
    setFormData(prev => ({
      ...prev,
      fileUrl: undefined,
      fileSize: undefined,
      fileType: undefined
    }));
    setProductFile(null);
  };
  
  // Clear lead magnet file
  const clearLeadMagnetFile = () => {
    setFormData(prev => ({
      ...prev,
      leadMagnetFile: undefined
    }));
    setLeadMagnetFile(null);
  };
  
  // Handle course modules update
  const handleModulesChange = (modules: CourseModule[]) => {
    // Calculate total duration from all lessons
    const totalDuration = modules.reduce((total, module) => {
      return total + module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
    }, 0);
    
    setFormData(prev => ({
      ...prev,
      modules,
      totalDuration
    }));
  };
  
  // Handle membership benefits update
  const handleBenefitsChange = (benefits: Benefit[]) => {
    setFormData(prev => ({
      ...prev,
      benefits
    }));
  };
  
  // Handle webinar schedule update
  const handleWebinarScheduleChange = (updates: {
    startDate: string;
    endDate: string;
    meetingUrl: string;
    maxAttendees?: number;
  }) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  // Handle external link settings update
  const handleExternalLinkSettingsChange = (updates: {
    targetUrl: string;
    linkType: any;
    linkText: string;
    commissionRate?: number;
  }) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  // Handle lead magnet settings update
  const handleLeadMagnetSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle AMA settings update
  const handleAMASettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle physical product settings update
  const handlePhysicalProductSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle affiliate product settings update
  const handleAffiliateProductSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle service settings update
  const handleServiceSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle ticket settings update
  const handleTicketSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Navigate to next step
  const handleNextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.type) {
        setError('Please select a product type.');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.name?.trim()) {
        setError('Product name is required.');
        return;
      }
      if (!formData.description?.trim()) {
        setError('Product description is required.');
        return;
      }
      
      // Type-specific validations
      if (formData.type === 'download' && !formData.fileUrl) {
        setError('Please upload a file for your download product.');
        return;
      }
      
      if (formData.type === 'external_link' && !formData.targetUrl) {
        setError('Destination URL is required for external link products.');
        return;
      }
      
      if (formData.type === 'lead_magnet' && !formData.leadMagnetFile) {
        setError('Please upload a file for your lead magnet.');
        return;
      }
      
      if (formData.type === 'lead_magnet' && !formData.emailListName) {
        setError('Email list name is required for lead magnets.');
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
    setError(null);
  };
  
  // Navigate to previous step
  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };
  
  // Save the product
  const handleSave = async (publish: boolean = false) => {
    if (!creatorId) {
      setError('Creator ID not found. Please try again.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Prepare product data
      const productData: Partial<Product> = {
        ...formData,
        creatorId,
        publishedAt: publish ? new Date() : undefined
      };
      
      // Create or update the product
      if (isEditing && productId) {
        await updateProduct(productId, productData);
      } else {
        await createProduct(productData);
      }
      
      // Navigate back to products list
      navigate('/creator/products');
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product. Please try again.');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Product' : 'Create New Product'}
        </h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/creator/products')}
        >
          Cancel
        </Button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            currentStep >= 2 ? 'bg-purple-600' : 'bg-gray-200'
          }`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            currentStep >= 3 ? 'bg-purple-600' : 'bg-gray-200'
          }`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            currentStep >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm font-medium text-gray-600">Product Type</span>
          <span className="text-sm font-medium text-gray-600">Product Details</span>
          <span className="text-sm font-medium text-gray-600">Review & Publish</span>
        </div>
      </div>
      
      {/* Step 1: Product Type */}
      {currentStep === 1 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Product Type</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === 'download' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('download')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Download className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">Digital Download</div>
                </div>
                <p className="text-xs text-gray-500">Sell downloadable files like PDFs, audio, video, or software</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === 'course' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('course')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">Online Course</div>
                </div>
                <p className="text-xs text-gray-500">Create structured courses with modules and lessons</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === 'membership' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('membership')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">Membership</div>
                </div>
                <p className="text-xs text-gray-500">Recurring subscription with exclusive benefits</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === 'webinar' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('webinar')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <Video className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">Webinar</div>
                </div>
                <p className="text-xs text-gray-500">Host live online events with registration</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === '1on1call' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('1on1call')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Phone className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">1-on-1 Call</div>
                </div>
                <p className="text-xs text-gray-500">Sell personal consultation or coaching calls</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === 'external_link' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('external_link')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-pink-100 p-2 rounded-full">
                    <Link className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">External Link</div>
                </div>
                <p className="text-xs text-gray-500">Link to external websites or affiliate products</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === 'lead_magnet' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('lead_magnet')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-teal-100 p-2 rounded-full">
                    <Mail className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">Lead Magnet</div>
                </div>
                <p className="text-xs text-gray-500">Free download in exchange for email signup</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === 'ama' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('ama')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">Ask Me Anything</div>
                </div>
                <p className="text-xs text-gray-500">Paid Q&A service with guaranteed responses</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === 'physical' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('physical')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">Physical Product</div>
                </div>
                <p className="text-xs text-gray-500">Sell physical merchandise with shipping</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === 'affiliate' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('affiliate')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-red-100 p-2 rounded-full">
                    <ExternalLink className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">Affiliate Product</div>
                </div>
                <p className="text-xs text-gray-500">Promote products and earn commission</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === 'service' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('service')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-cyan-100 p-2 rounded-full">
                    <Briefcase className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">Digital Service</div>
                </div>
                <p className="text-xs text-gray-500">Offer professional services like design or consulting</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  formData.type === 'ticket' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductTypeSelect('ticket')}
              >
                <div className="flex items-center mb-2">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <Ticket className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="ml-3 font-medium text-gray-900">Event Tickets</div>
                </div>
                <p className="text-xs text-gray-500">Sell tickets for online or in-person events</p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button 
                onClick={handleNextStep}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Step 2: Product Details */}
      {currentStep === 2 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Details</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Describe your product"
                  required
                />
              </div>
              
              {formData.type !== 'lead_magnet' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Price* {formData.type === 'membership' && '(per billing period)'}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="0.00"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">USD</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="discountPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Price (optional)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="discountPrice"
                        name="discountPrice"
                        value={formData.discountPrice || ''}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">USD</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Thumbnail
                </label>
                <FileUploader
                  onFileSelected={handleThumbnailUpload}
                  onClear={clearThumbnail}
                  accept="image/*"
                  maxSize={10}
                  currentFileName={thumbnailFile?.name || formData.thumbnail}
                  isUploading={uploadingThumbnail}
                  isImage={true}
                  imagePreviewUrl={formData.thumbnail}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="featured"
                  name="featured"
                  type="checkbox"
                  checked={formData.featured}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                  Feature this product on your store homepage
                </label>
              </div>
              
              {/* Product type specific fields */}
              {formData.type === 'download' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Downloadable File*
                  </label>
                  <FileUploader
                    onFileSelected={handleFileUpload}
                    onClear={clearFile}
                    currentFileName={productFile?.name || formData.fileUrl}
                    isUploading={uploadingFile}
                  />
                </div>
              )}
              
              {formData.type === 'course' && (
                <CourseModuleEditor
                  modules={formData.modules || []}
                  onChange={handleModulesChange}
                />
              )}
              
              {formData.type === 'membership' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Interval
                    </label>
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <input
                          id="interval-monthly"
                          name="interval"
                          type="radio"
                          value="monthly"
                          checked={formData.interval === 'monthly'}
                          onChange={handleChange}
                          className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
                        />
                        <label htmlFor="interval-monthly" className="ml-2 block text-sm text-gray-700">
                          Monthly
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="interval-yearly"
                          name="interval"
                          type="radio"
                          value="yearly"
                          checked={formData.interval === 'yearly'}
                          onChange={handleChange}
                          className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
                        />
                        <label htmlFor="interval-yearly" className="ml-2 block text-sm text-gray-700">
                          Yearly
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <MembershipBenefitEditor
                    benefits={formData.benefits || []}
                    onChange={handleBenefitsChange}
                  />
                </div>
              )}
              
              {formData.type === 'webinar' && (
                <WebinarScheduler
                  startDate={formData.startDate || ''}
                  endDate={formData.endDate || ''}
                  meetingUrl={formData.meetingUrl || ''}
                  maxAttendees={formData.maxAttendees}
                  onChange={handleWebinarScheduleChange}
                />
              )}
              
              {formData.type === '1on1call' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="callDuration" className="block text-sm font-medium text-gray-700 mb-1">
                      Call Duration (minutes)*
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="callDuration"
                        name="callDuration"
                        value={formData.callDuration}
                        onChange={handleChange}
                        min="5"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="callPlatform" className="block text-sm font-medium text-gray-700 mb-1">
                      Call Platform*
                    </label>
                    <select
                      id="callPlatform"
                      name="callPlatform"
                      value={formData.callPlatform}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                      required
                    >
                      <option value="zoom">Zoom</option>
                      <option value="meet">Google Meet</option>
                      <option value="teams">Microsoft Teams</option>
                      <option value="skype">Skype</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Days*
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <div key={day} className="flex items-center">
                          <input
                            id={`day-${day}`}
                            type="checkbox"
                            checked={formData.availableDays?.includes(day) || false}
                            onChange={(e) => {
                              const days = formData.availableDays || [];
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  availableDays: [...days, day]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  availableDays: days.filter(d => d !== day)
                                }));
                              }
                            }}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`day-${day}`} className="ml-2 block text-sm text-gray-700">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Time Slots*
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                        <div key={time} className="flex items-center">
                          <input
                            id={`time-${time}`}
                            type="checkbox"
                            checked={formData.callTimeSlots?.includes(time) || false}
                            onChange={(e) => {
                              const slots = formData.callTimeSlots || [];
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  callTimeSlots: [...slots, time]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  callTimeSlots: slots.filter(t => t !== time)
                                }));
                              }
                            }}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`time-${time}`} className="ml-2 block text-sm text-gray-700">
                            {time}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Select the time slots when you're available for calls (in your local timezone)
                    </p>
                  </div>
                </div>
              )}
              
              {formData.type === 'external_link' && (
                <ExternalLinkSettings
                  targetUrl={formData.targetUrl || ''}
                  linkType={formData.linkType || 'affiliate'}
                  linkText={formData.linkText || ''}
                  commissionRate={formData.commissionRate}
                  onChange={handleExternalLinkSettingsChange}
                />
              )}
              
              {formData.type === 'lead_magnet' && (
                <LeadMagnetSettings
                  leadMagnetFile={leadMagnetFile}
                  currentFileName={formData.leadMagnetFile}
                  onFileSelected={handleLeadMagnetUpload}
                  onFileClear={clearLeadMagnetFile}
                  emailListName={formData.emailListName || ''}
                  onEmailListNameChange={(value) => handleLeadMagnetSettingsChange('emailListName', value)}
                  thankYouMessage={formData.thankYouMessage || ''}
                  onThankYouMessageChange={(value) => handleLeadMagnetSettingsChange('thankYouMessage', value)}
                  redirectUrl={formData.redirectUrl}
                  onRedirectUrlChange={(value) => handleLeadMagnetSettingsChange('redirectUrl', value)}
                  optInTextRequired={formData.optInRequired}
                  onOptInTextRequiredChange={(value) => handleLeadMagnetSettingsChange('optInRequired', value)}
                  optInText={formData.optInText}
                  onOptInTextChange={(value) => handleLeadMagnetSettingsChange('optInText', value)}
                />
              )}
              
              {formData.type === 'ama' && (
                <AMASettings
                  responseTime={formData.responseTime || 24}
                  onResponseTimeChange={(value) => handleAMASettingsChange('responseTime', value)}
                  maxQuestionLength={formData.maxQuestionLength}
                  onMaxQuestionLengthChange={(value) => handleAMASettingsChange('maxQuestionLength', value)}
                  topicCategories={formData.topicCategories || []}
                  onTopicCategoriesChange={(value) => handleAMASettingsChange('topicCategories', value)}
                  allowAttachments={formData.allowAttachments || false}
                  onAllowAttachmentsChange={(value) => handleAMASettingsChange('allowAttachments', value)}
                  attachmentTypes={formData.attachmentTypes || []}
                  onAttachmentTypesChange={(value) => handleAMASettingsChange('attachmentTypes', value)}
                  anonymousAllowed={formData.anonymousAllowed || false}
                  onAnonymousAllowedChange={(value) => handleAMASettingsChange('anonymousAllowed', value)}
                />
              )}
              
              {formData.type === 'physical' && (
                <PhysicalProductSettings
                  sku={formData.sku || ''}
                  onSkuChange={(value) => handlePhysicalProductSettingsChange('sku', value)}
                  brand={formData.brand || ''}
                  onBrandChange={(value) => handlePhysicalProductSettingsChange('brand', value)}
                  weight={formData.weight || 0}
                  onWeightChange={(value) => handlePhysicalProductSettingsChange('weight', value)}
                  dimensions={formData.dimensions || { length: 0, width: 0, height: 0 }}
                  onDimensionsChange={(value) => handlePhysicalProductSettingsChange('dimensions', value)}
                  inventory={formData.inventory || 0}
                  onInventoryChange={(value) => handlePhysicalProductSettingsChange('inventory', value)}
                  lowStockThreshold={formData.lowStockThreshold || 5}
                  onLowStockThresholdChange={(value) => handlePhysicalProductSettingsChange('lowStockThreshold', value)}
                  shippingWeight={formData.shippingWeight || 0}
                  onShippingWeightChange={(value) => handlePhysicalProductSettingsChange('shippingWeight', value)}
                  shippingDimensions={formData.shippingDimensions || { length: 0, width: 0, height: 0 }}
                  onShippingDimensionsChange={(value) => handlePhysicalProductSettingsChange('shippingDimensions', value)}
                  shippingClass={formData.shippingClass || ''}
                  onShippingClassChange={(value) => handlePhysicalProductSettingsChange('shippingClass', value)}
                  freeShipping={formData.freeShipping || false}
                  onFreeShippingChange={(value) => handlePhysicalProductSettingsChange('freeShipping', value)}
                  handlingTime={formData.handlingTime || 1}
                  onHandlingTimeChange={(value) => handlePhysicalProductSettingsChange('handlingTime', value)}
                  additionalImages={formData.additionalImages || []}
                  onAdditionalImagesChange={(value) => handlePhysicalProductSettingsChange('additionalImages', value)}
                />
              )}
              
              {formData.type === 'affiliate' && (
                <AffiliateProductSettings
                  targetUrl={formData.targetUrl || ''}
                  onTargetUrlChange={(value) => handleAffiliateProductSettingsChange('targetUrl', value)}
                  affiliateNetwork={formData.affiliateNetwork || ''}
                  onAffiliateNetworkChange={(value) => handleAffiliateProductSettingsChange('affiliateNetwork', value)}
                  commissionRate={formData.commissionRate || 0}
                  onCommissionRateChange={(value) => handleAffiliateProductSettingsChange('commissionRate', value)}
                  cookieDuration={formData.cookieDuration || 30}
                  onCookieDurationChange={(value) => handleAffiliateProductSettingsChange('cookieDuration', value)}
                  termsAndConditions={formData.termsAndConditions || ''}
                  onTermsAndConditionsChange={(value) => handleAffiliateProductSettingsChange('termsAndConditions', value)}
                  linkText={formData.linkText || ''}
                  onLinkTextChange={(value) => handleAffiliateProductSettingsChange('linkText', value)}
                />
              )}
              
              {formData.type === 'service' && (
                <ServiceSettings
                  serviceType={formData.serviceType || ''}
                  onServiceTypeChange={(value) => handleServiceSettingsChange('serviceType', value)}
                  serviceDuration={formData.serviceDuration || 1}
                  onServiceDurationChange={(value) => handleServiceSettingsChange('serviceDuration', value)}
                  serviceDeliverables={formData.serviceDeliverables || []}
                  onServiceDeliverablesChange={(value) => handleServiceSettingsChange('serviceDeliverables', value)}
                  serviceTurnaroundTime={formData.serviceTurnaroundTime || 3}
                  onServiceTurnaroundTimeChange={(value) => handleServiceSettingsChange('serviceTurnaroundTime', value)}
                  serviceRevisions={formData.serviceRevisions || 2}
                  onServiceRevisionsChange={(value) => handleServiceSettingsChange('serviceRevisions', value)}
                />
              )}
              
              {formData.type === 'ticket' && (
                <TicketSettings
                  ticketType={formData.ticketType || 'physical'}
                  onTicketTypeChange={(value) => handleTicketSettingsChange('ticketType', value)}
                  venue={formData.venue || ''}
                  onVenueChange={(value) => handleTicketSettingsChange('venue', value)}
                  venueAddress={formData.venueAddress || ''}
                  onVenueAddressChange={(value) => handleTicketSettingsChange('venueAddress', value)}
                  eventDate={formData.eventDate ? (typeof formData.eventDate === 'string' ? formData.eventDate : formData.eventDate.toISOString().split('T')[0]) : ''}
                  onEventDateChange={(value) => handleTicketSettingsChange('eventDate', value)}
                  eventTime={formData.eventTime || ''}
                  onEventTimeChange={(value) => handleTicketSettingsChange('eventTime', value)}
                  ticketQuantity={formData.ticketQuantity || 100}
                  onTicketQuantityChange={(value) => handleTicketSettingsChange('ticketQuantity', value)}
                  ticketOptions={formData.ticketOptions || []}
                  onTicketOptionsChange={(value) => handleTicketSettingsChange('ticketOptions', value)}
                  seatingChart={formData.seatingChart || null}
                  onSeatingChartChange={(value) => handleTicketSettingsChange('seatingChart', value)}
                  ticketDeliveryMethod={formData.ticketDeliveryMethod || 'email'}
                  onTicketDeliveryMethodChange={(value) => handleTicketSettingsChange('ticketDeliveryMethod', value)}
                  ticketTransferable={formData.ticketTransferable !== undefined ? formData.ticketTransferable : true}
                  onTicketTransferableChange={(value) => handleTicketSettingsChange('ticketTransferable', value)}
                  ticketRefundPolicy={formData.ticketRefundPolicy || ''}
                  onTicketRefundPolicyChange={(value) => handleTicketSettingsChange('ticketRefundPolicy', value)}
                />
              )}
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button 
                variant="outline"
                onClick={handlePreviousStep}
                leftIcon={<ArrowLeft className="h-5 w-5" />}
              >
                Back
              </Button>
              <Button 
                onClick={handleNextStep}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Step 3: Review & Publish */}
      {currentStep === 3 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Review & Publish</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{formData.name}</h3>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                    {formData.type === 'download' ? 'Digital Download' :
                     formData.type === 'course' ? 'Online Course' :
                     formData.type === 'membership' ? 'Membership' :
                     formData.type === 'webinar' ? 'Webinar' :
                     formData.type === '1on1call' ? '1-on-1 Call' :
                     formData.type === 'external_link' ? 'External Link' :
                     formData.type === 'lead_magnet' ? 'Lead Magnet' :
                     formData.type === 'ama' ? 'Ask Me Anything' :
                     formData.type === 'physical' ? 'Physical Product' :
                     formData.type === 'affiliate' ? 'Affiliate Product' :
                     formData.type === 'service' ? 'Digital Service' :
                     formData.type === 'ticket' ? 'Event Tickets' : 
                     'Product'}
                  </span>
                  {formData.featured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{formData.description}</p>
                
                {formData.type !== 'lead_magnet' && (
                  <div className="text-lg font-bold text-gray-900 mb-4">
                    {formData.discountPrice ? (
                      <div className="flex items-center">
                        <span>${(formData.discountPrice / 100).toFixed(2)}</span>
                        <span className="ml-2 text-sm text-gray-500 line-through">${(formData.price / 100).toFixed(2)}</span>
                      </div>
                    ) : (
                      <span>${(formData.price / 100).toFixed(2)}</span>
                    )}
                    {formData.type === 'membership' && (
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        / {formData.interval === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center">
                  {formData.thumbnail ? (
                    <img 
                      src={formData.thumbnail} 
                      alt={formData.name} 
                      className="h-24 w-24 object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-24 w-24 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No thumbnail</span>
                    </div>
                  )}
                  
                  <div className="ml-4">
                    {formData.type === 'download' && (
                      <div className="text-sm text-gray-500">
                        {formData.fileUrl ? (
                          <>
                            <span className="font-medium">File:</span> {formData.fileUrl.split('/').pop()}
                            {formData.fileSize && (
                              <span className="ml-2">({Math.round(formData.fileSize / 1024)} KB)</span>
                            )}
                          </>
                        ) : (
                          <span className="text-red-500">No file uploaded</span>
                        )}
                      </div>
                    )}
                    
                    {formData.type === 'course' && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Modules:</span> {formData.modules?.length || 0}
                        <span className="ml-2 font-medium">Total Duration:</span> {formData.totalDuration || 0} minutes
                      </div>
                    )}
                    
                    {formData.type === 'membership' && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Billing:</span> {formData.interval === 'monthly' ? 'Monthly' : 'Yearly'}
                        <span className="ml-2 font-medium">Benefits:</span> {formData.benefits?.length || 0}
                      </div>
                    )}
                    
                    {formData.type === 'webinar' && (
                      <div className="text-sm text-gray-500">
                        {formData.startDate ? (
                          <>
                            <span className="font-medium">Date:</span> {new Date(formData.startDate).toLocaleDateString()}
                            <span className="ml-2 font-medium">Time:</span> {new Date(formData.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </>
                        ) : (
                          <span className="text-red-500">No date/time set</span>
                        )}
                      </div>
                    )}
                    
                    {formData.type === '1on1call' && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Duration:</span> {formData.callDuration} minutes
                        <span className="ml-2 font-medium">Platform:</span> {formData.callPlatform}
                      </div>
                    )}
                    
                    {formData.type === 'external_link' && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">URL:</span> {formData.targetUrl || 'Not set'}
                        <span className="ml-2 font-medium">Type:</span> {formData.linkType}
                      </div>
                    )}
                    
                    {formData.type === 'lead_magnet' && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">File:</span> {formData.leadMagnetFile ? 'Uploaded' : 'Not uploaded'}
                        <span className="ml-2 font-medium">List:</span> {formData.emailListName || 'Not set'}
                      </div>
                    )}
                    
                    {formData.type === 'ama' && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Response Time:</span> {formData.responseTime} hours
                        <span className="ml-2 font-medium">Topics:</span> {formData.topicCategories?.length || 0}
                      </div>
                    )}
                    
                    {formData.type === 'physical' && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">SKU:</span> {formData.sku || 'Not set'}
                        <span className="ml-2 font-medium">Inventory:</span> {formData.inventory || 0} units
                      </div>
                    )}
                    
                    {formData.type === 'affiliate' && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">URL:</span> {formData.targetUrl || 'Not set'}
                        <span className="ml-2 font-medium">Commission:</span> {formData.commissionRate}%
                      </div>
                    )}
                    
                    {formData.type === 'service' && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Type:</span> {formData.serviceType || 'Not set'}
                        <span className="ml-2 font-medium">Turnaround:</span> {formData.serviceTurnaroundTime || 0} days
                      </div>
                    )}
                    
                    {formData.type === 'ticket' && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Event Date:</span> {formData.eventDate ? new Date(formData.eventDate).toLocaleDateString() : 'Not set'}
                        <span className="ml-2 font-medium">Tickets:</span> {formData.ticketQuantity || 0}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Before Publishing</h3>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-5">
                  <li>Make sure all required information is complete and accurate</li>
                  <li>Double-check pricing and product details</li>
                  <li>Ensure your product description clearly explains what customers will receive</li>
                  <li>Add a compelling thumbnail image to attract customers</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button 
                variant="outline"
                onClick={handlePreviousStep}
                leftIcon={<ArrowLeft className="h-5 w-5" />}
              >
                Back
              </Button>
              <div className="space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => handleSave(false)}
                  isLoading={saving}
                >
                  Save as Draft
                </Button>
                <Button 
                  onClick={() => handleSave(true)}
                  isLoading={saving}
                >
                  {isEditing ? 'Update & Publish' : 'Publish Product'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};