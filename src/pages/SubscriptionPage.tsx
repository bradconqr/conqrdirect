import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Check, X, Shield, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { products } from '../stripe-config';
import { Subscription, useSubscription } from '../hooks/useSubscription';
import { SubscriptionStatus } from '../components/payment/SubscriptionStatus';
import { createSubscriptionCheckout } from '../lib/checkout';
import { supabase } from '../lib/supabase';

export const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleSelectPlan = async (priceId: string) => {
    setProcessingPlan(priceId);
    setError(null);
    
    try {
      const result = await createSubscriptionCheckout(priceId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout session');
      }
      
      // Redirect happens in the createSubscriptionCheckout function
    } catch (err: any) {
      console.error('Error selecting plan:', err);
      setError(err.message || 'An error occurred while processing your request');
      setProcessingPlan(null);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (!subscription || !subscription.subscriptionId) {
      setError('No active subscription found');
      return;
    }
    
    setCancellingSubscription(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId: subscription.priceId }
      });
      
      if (error || !data.success) {
        throw new Error(error?.message || data?.message || 'Failed to cancel subscription');
      }
      
      setSuccess('Your subscription has been cancelled. You will still have access until the end of your current billing period.');
      
      // Refresh subscription data
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      setError(err.message || 'An error occurred while cancelling your subscription. Please try again.');
    } finally {
      setCancellingSubscription(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="tron-header fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-[#4de2ff]" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text tracking-wider">CONQR DIRECT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="tron-container pt-32 pb-20 relative min-h-screen">
        <div className="tron-grid"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
              Subscription Management
            </h1>
            <p className="mt-4 text-xl text-gray-300">
              Manage your CONQR Direct subscription
            </p>
          </div>
          
          {error && (
            <div className="mb-8 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-md flex items-start">
              <div className="flex items-start">
                <X className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-8 p-4 bg-green-900/30 border border-green-500 text-green-200 rounded-md flex items-start">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Success</p>
                  <p className="text-sm">{success}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Current Subscription Status */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">Current Subscription</h2>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-32 bg-gray-800 rounded-lg"></div>
              </div>
            ) : (
              <SubscriptionStatus />
            )}
          </div>

          {/* Subscription Management */}
          {subscription && subscription.status !== 'canceled' && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4">Manage Your Subscription</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Cancel Subscription</h3>
                      <p className="text-gray-400 mb-4 md:mb-0">
                        {subscription.status === 'trialing' 
                          ? "Cancel your free trial. You won't be charged." 
                          : "You'll still have access until the end of your current billing period."}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleCancelSubscription}
                      isLoading={cancellingSubscription}
                      className="border-red-500 text-red-500 hover:bg-red-900/20"
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Available Plans */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Starter Plan */}
              <Card className="tron-pricing-card rounded-lg overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-indigo-600 mb-2">Starter</h3>
                  <div className="flex items-end mb-4">
                    <span className="text-4xl font-bold text-white">$29</span>
                    <span className="text-gray-400 ml-1">/month</span>
                  </div>
                  <p className="text-gray-300 mb-6">Perfect for creators just getting started</p>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>5 digital products</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Basic analytics</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Email support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>500 GB bandwidth</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Custom domain</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Affiliate program</span>
                    </li>
                  </ul>
                  
                  <Button 
                    onClick={() => handleSelectPlan(products.starter.priceId)}
                    isLoading={processingPlan === products.starter.priceId}
                    disabled={subscription?.priceId === products.starter.priceId || subscription?.status === 'canceled'}
                    fullWidth
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {subscription?.priceId === products.starter.priceId 
                      ? 'Current Plan' 
                      : subscription?.status === 'canceled'
                        ? 'Reactivate Plan'
                        : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Professional Plan */}
              <Card className="tron-pricing-card tron-pricing-popular rounded-lg overflow-hidden transform scale-105">
                <div className="bg-[#ff6d10] text-black text-center py-1 font-bold text-sm">
                  MOST POPULAR
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-[#ff6d10] mb-2">Professional</h3>
                  <div className="flex items-end mb-4">
                    <span className="text-4xl font-bold text-white">$79</span>
                    <span className="text-gray-400 ml-1">/month</span>
                  </div>
                  <p className="text-gray-300 mb-6">For growing creators and businesses</p>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-[#ff6d10] mr-2 flex-shrink-0 mt-0.5" />
                      <span>Unlimited digital products</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-[#ff6d10] mr-2 flex-shrink-0 mt-0.5" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-[#ff6d10] mr-2 flex-shrink-0 mt-0.5" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-[#ff6d10] mr-2 flex-shrink-0 mt-0.5" />
                      <span>2 TB bandwidth</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-[#ff6d10] mr-2 flex-shrink-0 mt-0.5" />
                      <span>Custom domain</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-[#ff6d10] mr-2 flex-shrink-0 mt-0.5" />
                      <span>Affiliate program</span>
                    </li>
                  </ul>
                  
                  <Button 
                    onClick={() => handleSelectPlan(products.professional.priceId)}
                    isLoading={processingPlan === products.professional.priceId}
                    disabled={subscription?.priceId === products.professional.priceId || subscription?.status === 'canceled'}
                    fullWidth
                    className="w-full py-2 rounded-md bg-[#ff6d10] text-black font-bold hover:bg-[#ff8c40] transition-colors"
                  >
                    {subscription?.priceId === products.professional.priceId 
                      ? 'Current Plan' 
                      : subscription?.status === 'canceled'
                        ? 'Reactivate Plan'
                        : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Enterprise Plan */}
              <Card className="tron-pricing-card rounded-lg overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-indigo-600 mb-2">Enterprise</h3>
                  <div className="flex items-end mb-4">
                    <span className="text-4xl font-bold text-white">$199</span>
                    <span className="text-gray-400 ml-1">/month</span>
                  </div>
                  <p className="text-gray-300 mb-6">For established businesses and power users</p>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Unlimited everything</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Custom reporting</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Dedicated support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Unlimited bandwidth</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Custom domain</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Affiliate program</span>
                    </li>
                  </ul>
                  
                  <Button 
                    onClick={() => handleSelectPlan(products.enterprise.priceId)}
                    isLoading={processingPlan === products.enterprise.priceId}
                    disabled={subscription?.priceId === products.enterprise.priceId || subscription?.status === 'canceled'}
                    fullWidth
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {subscription?.priceId === products.enterprise.priceId 
                      ? 'Current Plan' 
                      : subscription?.status === 'canceled'
                        ? 'Reactivate Plan'
                        : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Payment Security Notice */}
          <div className="mt-12 bg-indigo-900/20 border border-indigo-800 rounded-lg p-6">
            <div className="flex items-start">
              <Shield className="h-6 w-6 text-indigo-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-white">Secure Payments</h3>
                <p className="text-gray-300 mt-1">
                  All payments are processed securely through Stripe. Your payment information is never stored on our servers.
                </p>
                <div className="mt-3 flex items-center">
                  <CreditCard className="h-5 w-5 text-indigo-400 mr-2" />
                  <span className="text-gray-400">We accept all major credit cards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;