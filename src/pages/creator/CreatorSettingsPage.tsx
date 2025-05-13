import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { SubscriptionStatus } from '../../components/payment/SubscriptionStatus';
import { useSubscription } from '../../hooks/useSubscription';
import { getSubscriptionDetails } from '../../lib/checkout';
import { CreditCard, Key, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export const CreatorSettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);
  const [creatorProfile, setCreatorProfile] = useState({
    id: '',
    storeName: '',
    storeDescription: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      youtube: '',
      website: '',
    },
    customDomain: '',
    stripeConnectedAccountId: '',
    stripePublishableKey: '',
    stripeSecretKey: '',
  });

  useEffect(() => {
    if (!user) return;

    const fetchCreatorData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('creators')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setCreatorProfile({
            id: data.id,
            storeName: data.store_name,
            storeDescription: data.store_description || '',
            socialLinks: data.social_links || {
              twitter: '',
              instagram: '',
              youtube: '',
              website: '',
            },
            customDomain: data.custom_domain || '',
            stripeConnectedAccountId: data.stripe_connected_account_id || '',
            stripePublishableKey: data.social_links?.stripe_publishable_key || '',
            stripeSecretKey: data.social_links?.stripe_secret_key || '',
          });
        }
      } catch (err: any) {
        console.error('Error fetching creator data:', err);
        setError('Failed to load your creator profile. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social.')) {
      const platform = name.split('.')[1];
      setCreatorProfile(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [platform]: value
        }
      }));
    } else {
      setCreatorProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleStripeKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConnectionStatus(null);
    setStripeError(null);
    setCreatorProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updatedSocialLinks = {
        ...creatorProfile.socialLinks,
        stripe_publishable_key: creatorProfile.stripePublishableKey,
        stripe_secret_key: creatorProfile.stripeSecretKey,
      };

      const { error } = await supabase
        .from('creators')
        .update({
          store_name: creatorProfile.storeName,
          store_description: creatorProfile.storeDescription || null,
          social_links: updatedSocialLinks,
          custom_domain: creatorProfile.customDomain || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', creatorProfile.id);
        
      if (error) throw error;
      
      setSuccess('Your settings have been updated successfully.');
    } catch (err: any) {
      console.error('Error updating creator profile:', err);
      setError('Failed to update your settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const testStripeConnection = async () => {
    if (!creatorProfile.stripePublishableKey || !creatorProfile.stripeSecretKey) {
      setStripeError('Both publishable key and secret key are required');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus(null);
    setStripeError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-stripe-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          publishableKey: creatorProfile.stripePublishableKey,
          secretKey: creatorProfile.stripeSecretKey,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to test connection');
      }
      
      setConnectionStatus('success');
    } catch (err: any) {
      console.error('Error testing Stripe connection:', err);
      setConnectionStatus('error');
      setStripeError(err.message || 'Failed to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  // Get subscription plan details
  const subscriptionPlan = subscription?.priceId 
    ? getSubscriptionDetails(subscription.priceId)
    : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Creator Settings</h1>
      <p className="mt-2 text-gray-600">Manage your store settings and profile</p>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      {/* Subscription Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription</h2>
        <SubscriptionStatus />
        
        {subscriptionPlan && (
          <div className="mt-4 bg-indigo-50 p-4 rounded-md">
            <p className="text-sm text-indigo-800">
              Your {subscriptionPlan.name} includes: {subscriptionPlan.description}
            </p>
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/subscription'}
              >
                Manage Subscription
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Stripe Integration Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Payment Settings</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="h-5 w-5 text-purple-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Stripe API Keys</h3>
            </div>
            
            <p className="text-gray-400 mb-6">
              Connect your Stripe account to process payments for your products. Your API keys are securely stored and used to activate your products in Stripe.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="stripePublishableKey" className="block text-sm font-medium text-gray-300 mb-1">
                  Publishable Key
                </label>
                <input
                  type="text"
                  id="stripePublishableKey"
                  name="stripePublishableKey"
                  value={creatorProfile.stripePublishableKey}
                  onChange={handleStripeKeyChange}
                  placeholder="pk_test_..."
                  className="block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your Stripe publishable key starts with 'pk_test_' or 'pk_live_'
                </p>
              </div>
              
              <div>
                <label htmlFor="stripeSecretKey" className="block text-sm font-medium text-gray-300 mb-1">
                  Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? "text" : "password"}
                    id="stripeSecretKey"
                    name="stripeSecretKey"
                    value={creatorProfile.stripeSecretKey}
                    onChange={handleStripeKeyChange}
                    placeholder="sk_test_..."
                    className="block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  >
                    {showSecretKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your Stripe secret key starts with 'sk_test_' or 'sk_live_'
                </p>
              </div>
              
              {stripeError && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500 text-red-300 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                    <p>{stripeError}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={testStripeConnection}
                  isLoading={testingConnection}
                  leftIcon={<Key className="h-4 w-4" />}
                  disabled={!creatorProfile.stripePublishableKey || !creatorProfile.stripeSecretKey}
                >
                  Test Connection
                </Button>
                
                {connectionStatus === 'success' && (
                  <div className="flex items-center text-green-500">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Connection successful</span>
                  </div>
                )}
                
                {connectionStatus === 'error' && (
                  <div className="flex items-center text-red-500">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Connection failed</span>
                  </div>
                )}
              </div>
              
              <div className="bg-indigo-900/20 p-4 rounded-md border border-indigo-800/50 mt-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-indigo-400 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-indigo-300">Important Security Note</h4>
                    <p className="mt-1 text-xs text-indigo-300/80">
                      Your Stripe secret key gives full access to your Stripe account. We securely encrypt this key and only use it for processing payments. Never share your secret key with anyone else.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Store Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name
                </label>
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={creatorProfile.storeName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              <div>
                <label htmlFor="storeDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Store Description
                </label>
                <textarea
                  id="storeDescription"
                  name="storeDescription"
                  value={creatorProfile.storeDescription}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="social.twitter" className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  <input
                    type="text"
                    id="social.twitter"
                    name="social.twitter"
                    value={creatorProfile.socialLinks.twitter}
                    onChange={handleChange}
                    placeholder="@username"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="social.instagram" className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    id="social.instagram"
                    name="social.instagram"
                    value={creatorProfile.socialLinks.instagram}
                    onChange={handleChange}
                    placeholder="@username"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="social.youtube" className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube
                  </label>
                  <input
                    type="text"
                    id="social.youtube"
                    name="social.youtube"
                    value={creatorProfile.socialLinks.youtube}
                    onChange={handleChange}
                    placeholder="Channel URL"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="social.website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    id="social.website"
                    name="social.website"
                    value={creatorProfile.socialLinks.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="customDomain" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Domain (optional)
                </label>
                <input
                  type="text"
                  id="customDomain"
                  name="customDomain"
                  value={creatorProfile.customDomain}
                  onChange={handleChange}
                  placeholder="yourstore.com"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Connect a custom domain to your store (configuration steps will be provided).
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSave} 
                isLoading={saving}
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-8 mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="block w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                  {user?.email}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  To change your email, please contact support.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Password</h3>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};