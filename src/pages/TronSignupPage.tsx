import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Zap, ChevronRight, Check, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const TronSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const [selectedPlan, setSelectedPlan] = useState<{plan: string, price: number} | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    storeName: '',
    storeDescription: '',
    acceptTerms: false,
    cardNumber: '',
    cardExpiry: '',
    cardCvc: ''
  });

  // Get plan information from location state
  useEffect(() => {
    if (location.state && location.state.plan) {
      setSelectedPlan({
        plan: location.state.plan,
        price: location.state.price || 0
      });
    }
  }, [location]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };
  
  const validateStep1 = () => {
    // Reset error
    setError(null);
    
    // Validate email
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Validate password
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumbers = /\d/.test(formData.password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
    
    if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
      setError('Password must include uppercase, lowercase, number, and special character');
      return false;
    }
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Validate full name
    if (!formData.fullName) {
      setError('Full name is required');
      return false;
    }
    
    return true;
  };
  
  const validateStep2 = () => {
    // Reset error
    setError(null);
    
    // Validate store name
    if (!formData.storeName) {
      setError('Store name is required');
      return false;
    }
    
    // Validate terms acceptance
    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions');
      return false;
    }
    
    return true;
  };
  
  const validateStep3 = () => {
    // Reset error
    setError(null);
    
    // Validate card number (simple validation for demo)
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Please enter a valid 16-digit card number');
      return false;
    }
    
    // Validate expiry date (MM/YY format)
    if (!formData.cardExpiry || !/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
      setError('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    
    // Validate CVC (3 or 4 digits)
    if (!formData.cardCvc || !/^\d{3,4}$/.test(formData.cardCvc)) {
      setError('Please enter a valid CVC code');
      return false;
    }
    
    return true;
  };
  
  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setFormSubmitting(true);
    
    if (!validateStep2()) {
      setFormSubmitting(false);
      return;
    }
    
    // Proceed to checkout with user data
    navigate('/checkout', {
      state: {
        plan: selectedPlan?.plan || 'starter',
        price: selectedPlan?.price || 29,
        userData: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          storeName: formData.storeName,
          storeDescription: formData.storeDescription || ''
        }
      }
    });
  };
  
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
            
            <Link to="/auth" className="text-white hover:text-[#4de2ff] transition-colors">
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="tron-container pt-32 pb-20 relative min-h-screen">
        <div className="tron-grid"></div>
        <div className="max-w-md mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
              Create Your Account
            </h1>
            <p className="mt-2 text-gray-300">
              Start selling your digital products in minutes
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  1
                </div>
                <span className={`mt-2 text-sm ${
                  currentStep >= 1 ? 'text-indigo-500' : 'text-gray-500'
                }`}>Account</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 ${
                currentStep >= 2 ? 'bg-indigo-600' : 'bg-gray-700'
              }`}></div>
              
              <div className="flex flex-col items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  2
                </div>
                <span className={`mt-2 text-sm ${
                  currentStep >= 2 ? 'text-indigo-500' : 'text-gray-500'
                }`}>Store</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 ${
                currentStep >= 3 ? 'bg-indigo-600' : 'bg-gray-700'
              }`}></div>
              
              <div className="flex flex-col items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  3
                </div>
                <span className={`mt-2 text-sm ${
                  currentStep >= 3 ? 'text-indigo-500' : 'text-gray-500'
                }`}>Payment</span>
              </div>
            </div>
          </div>
          
          {/* Form */}
          <div className="tron-card p-6 rounded-lg">
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-indigo-500 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="tron-input w-full px-3 py-2 rounded-md bg-black"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-indigo-500 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="tron-input w-full px-3 py-2 rounded-md bg-black pr-10"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Must be at least 8 characters with uppercase, lowercase, number, and special character.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-indigo-500 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="tron-input w-full px-3 py-2 rounded-md bg-black"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-indigo-500 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="tron-input w-full px-3 py-2 rounded-md bg-black"
                      required
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-full py-2 rounded-md shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center"
                    >
                      <span>Continue</span>
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="storeName" className="block text-sm font-medium text-indigo-500 mb-1">
                      Store Name
                    </label>
                    <input
                      type="text"
                      id="storeName"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      className="tron-input w-full px-3 py-2 rounded-md bg-black"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="storeDescription" className="block text-sm font-medium text-indigo-500 mb-1">
                      Store Description (Optional)
                    </label>
                    <textarea
                      id="storeDescription"
                      name="storeDescription"
                      value={formData.storeDescription}
                      onChange={handleChange}
                      rows={3}
                      className="tron-input w-full px-3 py-2 rounded-md bg-black"
                    ></textarea>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-gray-600 rounded"
                    />
                    <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-300">
                      I agree to the <Link to="/terms" className="text-indigo-500 hover:text-purple-500 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-indigo-500 hover:text-purple-500 hover:underline">Privacy Policy</Link>
                    </label>
                  </div>
                  
                  <div className="pt-4 flex space-x-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-2 rounded-md border border-gray-600 text-white hover:border-[#4de2ff] hover:text-[#4de2ff] transition-colors flex items-center justify-center"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      <span>Back</span>
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 rounded-md shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center"
                    >
                      {loading || formSubmitting ? (
                        <span>Creating Account...</span>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ChevronRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
            </form>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Already have an account? <Link to="/auth" className="text-indigo-500 hover:text-purple-500 hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TronSignupPage;