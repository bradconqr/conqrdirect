import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Zap, ChevronRight, Check, ArrowLeft, Shield } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../lib/checkout';
import { supabase } from '../lib/supabase';
import { StripePaymentForm } from '../components/payment/StripePaymentForm';
import { generateStoreSlug } from '../lib/adminService';

export const TronCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{plan: string, price: number} | null>(null); 
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [userData, setUserData] = useState<{
    email: string;
    password: string;
    fullName: string;
    storeName: string;
    storeDescription: string;
  } | null>(null);
  
  // Initialize Stripe
  useEffect(() => {
    const loadStripeJs = async () => {
      try {
        const stripe = await getStripe();
        setStripePromise(stripe);
      } catch (error) {
        console.error('Error loading Stripe:', error);
        setError('Failed to load payment processor. Please try again later.');
      }
    };
    
    loadStripeJs();
  }, []);
  
  // Get plan information and user data from location state
  useEffect(() => {
    if (location.state) {
      if (location.state.plan) {
        setSelectedPlan({
          plan: location.state.plan,
          price: location.state.price || 0
        });
      }
      
      if (location.state.userData) {
        setUserData(location.state.userData);
      } else {
        // If no user data, redirect back to signup
        navigate('/signup');
      }
    } else {
      // If no state at all, redirect back to home
      navigate('/');
    }
  }, [location, navigate]);
    
  const handlePaymentSubmit = async (paymentMethod: any) => {
    if (!selectedPlan || !userData) {
      setError('Missing plan or user information');
      return;
    }
    
    setPaymentProcessing(true);
    setError(null);
    
    try {
      // Generate a store slug from the store name
      const storeSlug = await generateStoreSlug(userData.storeName);
      
      // Check if store slug exists
      const { data: existingCreator } = await supabase
        .from('creators')
        .select('store_slug')
        .eq('store_slug', storeSlug)
        .maybeSingle();

      if (existingCreator) {
        throw new Error('This store name is already taken. Please choose a different name.');
      }
      
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            is_creator: true,
            subscription_plan: selectedPlan.plan,
            subscription_price: selectedPlan.price
          }
        }
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Create creator profile
        const { error: creatorError } = await supabase
          .from('creators')
          .insert({
            user_id: authData.user.id,
            store_name: userData.storeName,
            store_description: userData.storeDescription || '',
            store_slug: storeSlug,
          });
          
        if (creatorError) {
          throw creatorError;
        }
        
        // Create Stripe customer and subscription
        try {
          const response = await supabase.functions.invoke('create-stripe-customer', {
            body: {
              userId: authData.user.id,
              email: userData.email,
              name: userData.fullName,
              paymentMethodId: paymentMethod.id,
              plan: selectedPlan.plan,
              price: selectedPlan.price
            }
          });
          
          if (!response.data?.success) {
            throw new Error(response.data?.message || 'Failed to create Stripe customer');
          }
          
          console.log('Stripe customer created:', response.data);
        } catch (stripeError: any) {
          console.error('Error creating Stripe customer:', stripeError);
          throw new Error(stripeError.message || 'Failed to set up payment method');
        }
        
        // Show success message
        setPaymentComplete(true);
        
        // Wait a moment to show the success message
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Sign in the user
        await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });
        
        // Success! Redirect to creator dashboard
        navigate('/creator');
      }
    } catch (error: any) {
      console.error('Error during checkout:', error);
      setError(error.message || 'An error occurred during checkout');
    } finally {
      setPaymentProcessing(false);
    }
  };
  
  if (!selectedPlan || !userData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="tron-header fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <Zap className="h-8 w-8 text-[#4de2ff]" />
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text tracking-wider">CONQR DIRECT</span>
              </Link>
            </div>
            
            <Link to="/login" className="text-white hover:text-[#4de2ff] transition-colors">
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="tron-container pt-32 pb-20 relative min-h-screen">
        <div className="tron-grid"></div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
              Complete Your Purchase
            </h1>
            <p className="mt-2 text-gray-300">
              You're just one step away from launching your creator business
            </p>
          </div>
          
          <div className="tron-card p-6 rounded-lg">
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {paymentComplete ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
                <p className="text-gray-300 mb-4">
                  Your account is being created. You'll be redirected to your dashboard in a moment.
                </p>
                <div className="animate-pulse">
                  <div className="h-2 w-32 bg-indigo-600 rounded mx-auto"></div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-indigo-900 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-indigo-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-white">Secure Checkout</h3>
                      <p className="text-sm text-gray-400">Your payment information is encrypted and secure</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-800 pt-6">
                    {stripePromise ? (
                      <Elements stripe={stripePromise}>
                        <StripePaymentForm 
                          amount={selectedPlan?.price || 29} 
                          onSubmit={handlePaymentSubmit}
                          isProcessing={paymentProcessing}
                        />
                      </Elements>
                    ) : (
                      <div className="text-center py-4">
                        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent mx-auto mb-4"></div>
                        <p>Loading payment form...</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Need help? <a href="#" className="text-indigo-500 hover:text-purple-500 hover:underline">Contact support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TronCheckoutPage;