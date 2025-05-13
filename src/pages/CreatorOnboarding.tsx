import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Check, ArrowRight } from 'lucide-react';

export const CreatorOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, isCreator } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [creator, setCreator] = useState<any>(null);
  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      youtube: '',
      website: '',
    },
    customDomain: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchCreatorData = async () => {
      try {
        const { data, error } = await supabase
          .from('creators')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setCreator(data);
          // Pre-fill form data from existing creator profile
          setFormData({
            storeName: data.store_name || '',
            storeDescription: data.store_description || '',
            socialLinks: data.social_links || {
              twitter: '',
              instagram: '',
              youtube: '',
              website: '',
            },
            customDomain: data.custom_domain || '',
          });
        }
      } catch (error) {
        console.error('Error fetching creator data:', error);
        setError('Could not fetch your creator profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social.')) {
      const socialPlatform = name.split('.')[1];
      setFormData({
        ...formData,
        socialLinks: {
          ...formData.socialLinks,
          [socialPlatform]: value,
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to complete onboarding');
      navigate('/auth');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('creators')
        .update({
          store_name: formData.storeName,
          store_description: formData.storeDescription,
          social_links: formData.socialLinks,
          custom_domain: formData.customDomain,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        // Completed all steps
        navigate('/admin/products');
      }
    } catch (error: any) {
      console.error('Error updating creator profile:', error);
      setError(error.message || 'Failed to update your creator profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
          Set Up Your Creator Store
        </h1>
        
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${currentStep >= step 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-600'}`}
                >
                  {currentStep > step ? <Check className="h-5 w-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 ${currentStep > step ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 max-w-md mx-auto">
            <span className={currentStep >= 1 ? 'text-purple-600 font-medium' : ''}>Profile</span>
            <span className={currentStep >= 2 ? 'text-purple-600 font-medium' : ''}>Social</span>
            <span className={currentStep >= 3 ? 'text-purple-600 font-medium' : ''}>Finish</span>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-semibold mb-4">Store Information</h2>
                <div className="mb-4">
                  <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name
                  </label>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="storeDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Store Description
                  </label>
                  <textarea
                    id="storeDescription"
                    name="storeDescription"
                    value={formData.storeDescription}
                    onChange={handleChange}
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Describe what customers can expect from your store.
                  </p>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button type="submit" rightIcon={<ArrowRight className="h-5 w-5" />} isLoading={saving}>
                    Continue
                  </Button>
                </div>
              </form>
            )}
            
            {currentStep === 2 && (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-semibold mb-4">Social Media & Online Presence</h2>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="social.twitter" className="block text-sm font-medium text-gray-700 mb-1">
                      Twitter
                    </label>
                    <input
                      type="text"
                      id="social.twitter"
                      name="social.twitter"
                      value={formData.socialLinks.twitter}
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
                      value={formData.socialLinks.instagram}
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
                      value={formData.socialLinks.youtube}
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
                      value={formData.socialLinks.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label htmlFor="customDomain" className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Domain (optional)
                  </label>
                  <input
                    type="text"
                    id="customDomain"
                    name="customDomain"
                    value={formData.customDomain}
                    onChange={handleChange}
                    placeholder="yourstore.com"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Connect a custom domain to your store (configuration steps will be provided later).
                  </p>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
                    Back
                  </Button>
                  <Button type="submit" rightIcon={<ArrowRight className="h-5 w-5" />} isLoading={saving}>
                    Continue
                  </Button>
                </div>
              </form>
            )}
            
            {currentStep === 3 && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                
                <h2 className="mt-4 text-xl font-semibold text-gray-900">Your creator store is ready!</h2>
                
                <p className="mt-2 text-gray-600 mb-6">
                  Congratulations! You've successfully set up your creator profile. You can now start adding products and customizing your store.
                </p>
                
                <Button 
                  onClick={() => navigate('/admin/products')}
                  size="lg"
                >
                  Go to Creator Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};