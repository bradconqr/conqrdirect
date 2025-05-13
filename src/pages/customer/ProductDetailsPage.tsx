import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { BookOpen, Calendar, Clock, Download, Package, ShoppingCart, Users, Video, Phone, Link, ExternalLink, Mail, FileText, Check, ChevronRight, MessageSquare, Tag } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useCartStore } from '../../stores/cartStore';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardContent } from '../../components/ui/Card';
import { useProductDetails } from '../../hooks/useRealtimeData';
import { CoursePreview } from '../../components/products/CoursePreview';
import { WebinarScheduler } from '../../components/products/WebinarScheduler';
import { BookingCalendar } from '../../components/booking/BookingCalendar';

export const ProductDetailsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const { cartItems, addToCart, removeFromCart } = useCartStore();
  const { session } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  
  // Use the real-time product details hook
  const { product, isLoading, error: productError } = useProductDetails(productId || null);
  
  // Lead magnet specific state
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [email, setEmail] = useState('');
  const [agreedToOptIn, setAgreedToOptIn] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  
  // AMA specific state
  const [question, setQuestion] = useState('');
  const [questionAttachment, setQuestionAttachment] = useState<File | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionSuccess, setQuestionSuccess] = useState(false);
  
  const formatPrice = (price: number, discountPrice?: number) => {
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);

    if (discountPrice) {
      const formattedDiscountPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(discountPrice / 100);
      
      return (
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">{formattedDiscountPrice}</span>
          <span className="ml-2 text-lg text-gray-500 line-through">{formattedPrice}</span>
        </div>
      );
    }

    return <span className="text-3xl font-bold text-gray-900">{formattedPrice}</span>;
  };
  
  const getProductIcon = (type: string) => {
    switch (type) {
      case 'download':
        return <Download className="h-12 w-12 text-purple-600 product-icon" />;
      case 'course':
        return <BookOpen className="h-12 w-12 text-purple-600 product-icon" />;
      case 'membership':
        return <Users className="h-12 w-12 text-purple-600 product-icon" />;
      case 'webinar':
        return <Video className="h-12 w-12 text-purple-600 product-icon" />;
      case '1on1call':
        return <Phone className="h-12 w-12 text-purple-600 product-icon" />;
      case 'external_link':
        return <Link className="h-12 w-12 text-purple-600 product-icon" />;
      case 'lead_magnet':
        return <Mail className="h-12 w-12 text-purple-600 product-icon" />;
      case 'ama':
        return <MessageSquare className="h-12 w-12 text-purple-600 product-icon" />;
      default:
        return <Package className="h-12 w-12 text-purple-600 product-icon" />;
    }
  };
  
  const getProductTypeDetails = (product: Product) => {
    switch (product.type) {
      case 'download':
        return (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Download className="h-4 w-4" />
            <span>Instant download</span>
          </div>
        );
      case 'course':
        return (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{product.totalDuration ? `${product.totalDuration} minutes of content` : 'Self-paced course'}</span>
          </div>
        );
      case 'membership':
        return (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{product.interval ? `${product.interval.charAt(0).toUpperCase() + product.interval.slice(1)} subscription` : 'Membership'}</span>
          </div>
        );
      case 'webinar':
        return (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>
              {product.startDate 
                ? new Date(product.startDate).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })
                : 'Upcoming webinar'}
            </span>
          </div>
        );
      case '1on1call':
        return (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Phone className="h-4 w-4" />
            <span>
              {product.callDuration 
                ? `${product.callDuration} minute 1-on-1 call`
                : 'Private consultation call'}
            </span>
          </div>
        );
      case 'external_link':
        return (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link className="h-4 w-4" />
            <span>
              {product.linkType === 'affiliate' 
                ? 'Affiliate Link' 
                : product.linkType === 'subscription' 
                ? 'Subscription Service' 
                : 'External Website'}
            </span>
          </div>
        );
      case 'lead_magnet':
        return (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Mail className="h-4 w-4" />
            <span>Free download (email required)</span>
          </div>
        );
      case 'ama':
        return (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <MessageSquare className="h-4 w-4" />
            <span>
              Ask questions, get answers within {product.responseTime} hours
            </span>
          </div>
        );
      default:
        return null;
    }
  };
  
  const isInCart = (): boolean => {
    return cartItems.some(item => item.product.id === product?.id);
  };
  
  const handleAddToCart = () => {
    if (product) {
      if (isInCart()) {
        removeFromCart(product.id);
      } else {
        addToCart(product);
      }
    }
  };
  
  const handleBuyNow = () => {
    if (product) {
      if (!isInCart()) {
        addToCart(product);
      }
      // Navigate to checkout without requiring login
      window.location.href = '/checkout';
    }
  };

  const handleVisitExternalLink = () => {
    if (product?.targetUrl) {
      window.open(product.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLeadMagnetRequest = () => {
    setShowLeadForm(true);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !email) return;
    
    if (product.optInRequired && !agreedToOptIn) {
      return; // Don't submit if opt-in is required but not checked
    }
    
    setLeadSubmitting(true);
    
    try {
      // In a real implementation, you would:
      // 1. Submit the email to your database or email service
      // 2. Create a temporary download link or send an email with the download
      
      // For this example, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLeadSuccess(true);
      setShowLeadForm(false);
      
      // If there's a redirect URL, navigate after a delay
      if (product.redirectUrl) {
        setTimeout(() => {
          window.location.href = product.redirectUrl as string;
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error submitting lead:', err);
      setError('Failed to process your request. Please try again.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!product || !question || !session) return;
    
    setQuestionSubmitting(true);
    
    try {
      // In a real implementation, call the submit_ama_question function
      // For this demo, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setQuestionSuccess(true);
      setQuestion('');
      setQuestionAttachment(null);
      setIsAnonymous(false);
    } catch (err: any) {
      console.error('Error submitting question:', err);
      setError('Failed to submit your question. Please try again.');
    } finally {
      setQuestionSubmitting(false);
    }
  };
  
  const handleBookingComplete = (bookingId: string) => {
    setBookingSuccess(true);
    // Optionally scroll to the success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const renderProductDetailsContent = () => {
    if (!product) return null;
    
    switch (product.type) {
      case 'course':
        return (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Course Content</h3>
            <CoursePreview modules={product.modules || []} />
            
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">What You'll Learn</h4>
              <div className="text-gray-600">
                <p>This course includes {product.modules?.length || 0} modules with {product.modules?.reduce((count, module) => count + module.lessons.length, 0) || 0} lessons.</p>
                <p className="mt-1">Total content duration: {product.totalDuration || 0} minutes</p>
              </div>
            </div>
          </div>
        );
      
      case 'membership':
        return (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Membership Benefits</h3>
            
            {product.benefits && product.benefits.length > 0 ? (
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {product.benefits.map((benefit, index) => (
                      <li key={benefit.id || index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <p className="ml-3 text-gray-700">{benefit.description}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No specific benefits listed
                </CardContent>
              </Card>
            )}
            
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Subscription Details</h4>
              <p className="text-blue-700">
                {product.interval === 'monthly' ? 'Monthly subscription' : 'Yearly subscription'} - {formatPrice(product.price)} {product.interval === 'monthly' ? 'per month' : 'per year'}
              </p>
            </div>
          </div>
        );
        
      case 'webinar':
        return (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Webinar Details</h3>
            
            {product.startDate && product.endDate && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(product.startDate).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-gray-500">
                          {new Date(product.startDate).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })} - {new Date(product.endDate).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {product.maxAttendees && (
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-gray-400 mr-3" />
                        <p className="text-gray-700">Limited to {product.maxAttendees} attendees</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
        
      case '1on1call':
        return (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">1-on-1 Call Details</h3>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Call Duration</p>
                      <p className="text-gray-700">{product.callDuration} minutes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Video className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Call Platform</p>
                      <p className="text-gray-700">
                        {product.callPlatform === 'zoom' ? 'Zoom' : 
                         product.callPlatform === 'meet' ? 'Google Meet' : 
                         product.callPlatform === 'teams' ? 'Microsoft Teams' : 
                         'Video conferencing'}
                      </p>
                    </div>
                  </div>
                  
                  {product.availableDays && product.availableDays.length > 0 && (
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Available Days</p>
                        <p className="text-gray-700">{product.availableDays.join(', ')}</p>
                      </div>
                    </div>
                  )}
                  
                  {product.callTimeSlots && product.callTimeSlots.length > 0 && (
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Available Time Slots</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {product.callTimeSlots.map(timeSlot => (
                            <span 
                              key={timeSlot}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {timeSlot}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-medium text-indigo-900 mb-2">How It Works</h4>
              <ol className="text-indigo-700 space-y-2 list-decimal pl-4">
                <li>Purchase this product to book a 1-on-1 call</li>
                <li>After purchase, you'll receive a booking link to select your preferred time slot</li>
                <li>The creator will confirm your booking and send you the call details</li>
                <li>Connect at the scheduled time for your private consultation</li>
              </ol>
            </div>

            {session && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Book Your Call</h3>
                <BookingCalendar 
                  productId={product.id}
                  creatorId={product.creatorId}
                  availableDays={product.availableDays || []}
                  timeSlots={product.callTimeSlots || []}
                  callDuration={product.callDuration || 30}
                  onBookingComplete={handleBookingComplete}
                />
              </div>
            )}
            
            {!session && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Book Your Call</h3>
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-gray-700 mb-4">
                    You can purchase this call without creating an account.
                  </p>
                  <Button
                    onClick={() => {
                      addToCart(product);
                      window.location.href = '/checkout';
                    }}
                    leftIcon={<ShoppingCart className="h-5 w-5" />}
                  >
                    Add to Cart & Checkout
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'external_link':
        return (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">External Link Details</h3>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Link className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Link Type</p>
                      <p className="text-gray-700">
                        {product.linkType === 'affiliate' ? 'Affiliate Link' : 
                         product.linkType === 'subscription' ? 'Subscription Service' : 
                         'Personal Website'}
                      </p>
                    </div>
                  </div>
                  
                  {product.linkType === 'affiliate' && product.commissionRate && (
                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Commission Information</p>
                        <p className="text-gray-700">This affiliate link earns the creator {product.commissionRate}% commission on purchases</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 bg-gray-100 p-4 rounded-lg flex flex-col items-center">
                    <p className="text-gray-800 mb-3 text-center">Visit the external website:</p>
                    <Button
                      size="lg"
                      leftIcon={<ExternalLink className="h-5 w-5" />}
                      onClick={handleVisitExternalLink}
                    >
                      {product.linkText || 'Visit Website'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      This will open {product.targetUrl} in a new tab
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">External Link Notice</h4>
              <p className="text-yellow-700">
                This link will take you to an external website. Please note that clicking this link will redirect you away from our platform. The creator has provided this link for your convenience, but we cannot guarantee the content or security of external websites.
                {product.linkType === 'affiliate' && (
                  <span className="block mt-2">This is an affiliate link, which means the creator may earn a commission from any purchases you make after clicking.</span>
                )}
              </p>
            </div>
          </div>
        );

      case 'lead_magnet':
        return (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Free Resource Details</h3>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Resource Type</p>
                      <p className="text-gray-700">
                        Free downloadable {product.leadMagnetFile?.split('.').pop()?.toUpperCase() || 'resource'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Access Method</p>
                      <p className="text-gray-700">
                        Enter your email to get instant access to this free resource
                      </p>
                    </div>
                  </div>
                  
                  {leadSuccess ? (
                    <div className="bg-green-50 p-6 rounded-lg text-center">
                      <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        {product.thankYouMessage || 'Thank you for your interest!'}
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Your download link has been sent to your email.
                      </p>
                      {product.redirectUrl && (
                        <p className="text-sm text-gray-500">
                          You will be redirected shortly...
                        </p>
                      )}
                    </div>
                  ) : showLeadForm ? (
                    <form onSubmit={handleLeadSubmit} className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Get Your Free Download</h4>
                      
                      <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address*
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      {product.optInRequired && (
                        <div className="mb-4">
                          <label className="flex items-start">
                            <input
                              type="checkbox"
                              checked={agreedToOptIn}
                              onChange={(e) => setAgreedToOptIn(e.target.checked)}
                              className="h-4 w-4 mt-1 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              required={!!product.optInRequired}
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {product.optInText || 'Yes, I agree to receive newsletters and promotional emails. I understand I can unsubscribe at any time.'}
                            </span>
                          </label>
                        </div>
                      )}
                      
                      <div className="flex justify-center">
                        <Button
                          type="submit" 
                          isLoading={leadSubmitting}
                          leftIcon={<Download className="h-5 w-5" />}
                        >
                          Get Free Download
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Button
                        size="lg" 
                        onClick={handleLeadMagnetRequest}
                        leftIcon={<Download className="h-5 w-5" />}
                      >
                        Download Free Resource
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Why Share Your Email?</h4>
              <p className="text-blue-700 mb-2">
                By sharing your email, you'll get:
              </p>
              <ul className="text-blue-700 space-y-1 list-disc pl-5">
                <li>Immediate access to this valuable resource</li>
                <li>Notification about new free resources</li>
                <li>Helpful content related to this topic</li>
                <li>Special offers from the creator (you can unsubscribe anytime)</li>
              </ul>
            </div>
          </div>
        );
        
      case 'ama':
        return (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Ask Me Anything</h3>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Response Time</p>
                      <p className="text-gray-700">
                        Get answers within {product.responseTime} hours
                      </p>
                    </div>
                  </div>
                  
                  {product.maxQuestionLength && (
                    <div className="flex items-start">
                      <MessageSquare className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Question Length</p>
                        <p className="text-gray-700">
                          Up to {product.maxQuestionLength} characters
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {product.topicCategories && product.topicCategories.length > 0 && (
                    <div className="flex items-start">
                      <Tag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Topics</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {product.topicCategories.map(topic => (
                            <span key={topic} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {questionSuccess ? (
                    <div className="bg-green-50 p-6 rounded-lg text-center">
                      <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Question Submitted Successfully!
                      </h4>
                      <p className="text-gray-600">
                        You'll receive a response within {product.responseTime} hours.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Ask Your Question</h4>
                      
                      <div className="mb-4">
                        <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                          Your Question*
                        </label>
                        <textarea
                          id="question"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          maxLength={product.maxQuestionLength}
                          rows={4}
                          required
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                        {product.maxQuestionLength && (
                          <p className="mt-1 text-sm text-gray-500">
                            {question.length}/{product.maxQuestionLength} characters
                          </p>
                        )}
                      </div>
                      
                      {product.allowAttachments && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Attachment (Optional)
                          </label>
                          <input
                            type="file"
                            onChange={(e) => setQuestionAttachment(e.target.files?.[0] || null)}
                            accept={product.attachmentTypes?.join(',')}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                          {product.attachmentTypes && (
                            <p className="mt-1 text-sm text-gray-500">
                              Allowed file types: {product.attachmentTypes.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {product.anonymousAllowed && (
                        <div className="mb-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isAnonymous}
                              onChange={(e) => setIsAnonymous(e.target.checked)}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Ask anonymously
                            </span>
                          </label>
                        </div>
                      )}
                      
                      <div className="flex justify-center">
                        <Button
                          onClick={handleAskQuestion}
                          isLoading={questionSubmitting}
                          leftIcon={<MessageSquare className="h-5 w-5" />}
                          disabled={!question.trim()}
                        >
                          Submit Question
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">How It Works</h4>
              <ol className="text-purple-700 space-y-2 list-decimal pl-4">
                <li>Submit your question using the form above</li>
                <li>The creator will receive your question immediately</li>
                <li>You'll receive a response within {product.responseTime} hours</li>
                <li>You can ask follow-up questions if needed</li>
              </ol>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !product) {
    return <div>Error loading product details</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {bookingSuccess && (
        <div className="mb-8 bg-green-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Booking Successful
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your booking has been confirmed. Check your email for the details.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
        {/* Product image */}
        <div className="aspect-w-1 aspect-h-1 w-full">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              className="w-full h-full object-center object-cover sm:rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center sm:rounded-lg">
              {getProductIcon(product.type)}
            </div>
          )}
        </div>

        {/* Product details */}
        <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
          
          <div className="mt-3">
            {getProductTypeDetails(product)}
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Description</h3>
            <div className="text-base text-gray-700 space-y-6">
              <p>{product.description}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col">
            <div className="mt-6">
              {formatPrice(product.price, product.discountPrice)}
            </div>

            <div className="mt-6 flex space-x-3">
              {product.type === 'external_link' ? (
                <Button
                  size="lg"
                  className="w-full"
                  leftIcon={<ExternalLink className="h-5 w-5" />}
                  onClick={handleVisitExternalLink}
                >
                  {product.linkText || 'Visit Website'}
                </Button>
              ) : product.type === 'lead_magnet' ? (
                <Button
                  size="lg"
                  className="w-full"
                  leftIcon={<Download className="h-5 w-5" />}
                  onClick={handleLeadMagnetRequest}
                >
                  Download Free Resource
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant={isInCart() ? 'outline' : 'default'}
                    className="w-full"
                    leftIcon={<ShoppingCart className="h-5 w-5" />}
                    onClick={handleAddToCart}
                  >
                    {isInCart() ? 'Remove from Cart' : 'Add to Cart'}
                  </Button>
                  <Button
                    size="lg"
                    variant="default"
                    className="w-full"
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional product details */}
      {renderProductDetailsContent()}
    </div>
  );
};