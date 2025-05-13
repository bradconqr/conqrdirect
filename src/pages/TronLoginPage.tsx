import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Zap, ChevronRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const TronLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'recovery'>('login');
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  // Recovery form data
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError(null);
    
    // Validate form
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (error) throw error;
      
      // Check if user is a creator
      if (data.user) {
        const { data: creatorData } = await supabase
          .from('creators')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();
        
        if (creatorData) {
          // User is a creator, redirect to creator dashboard
          navigate('/creator');
        } else {
          // Regular user, redirect to home
          navigate('/');
        }
      }
    } catch (error: any) {
      console.error('Error during login:', error);
      setError(error.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setRecoverySuccess(false);
    
    // Validate email
    if (!recoveryEmail) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      // Show success message
      setRecoverySuccess(true);
    } catch (error: any) {
      console.error('Error during password recovery:', error);
      setError(error.message || 'Failed to send recovery email');
    } finally {
      setLoading(false);
    }
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
            
            <Link to="/signup" className="text-white hover:text-[#4de2ff] transition-colors">
              Don't have an account? Sign up
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
              {mode === 'login' ? 'Welcome Back' : 'Reset Password'}
            </h1>
            <p className="mt-2 text-gray-300">
              {mode === 'login' 
                ? 'Log in to access your account' 
                : 'Enter your email to receive a password reset link'}
            </p>
          </div>
          
          {/* Form */}
          <div className="tron-card p-6 rounded-lg">
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#4de2ff] mb-1">
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
                  <label htmlFor="password" className="block text-sm font-medium text-[#4de2ff] mb-1">
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
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#4de2ff] focus:ring-[#4de2ff] border-gray-600 rounded"
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-300">
                      Remember me
                    </label>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setMode('recovery')}
                    className="text-sm text-indigo-500 hover:text-purple-500 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-full py-2 rounded-md shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center"
                  >
                    {loading ? (
                      <span>Logging in...</span>
                    ) : (
                      <>
                        <span>Log In</span>
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRecovery} className="space-y-4">
                {recoverySuccess ? (
                  <div className="p-3 bg-green-900/50 border border-green-500 text-green-200 rounded-md text-sm">
                    Password reset link sent! Check your email inbox.
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="recoveryEmail" className="block text-sm font-medium text-[#4de2ff] mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="recoveryEmail"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="tron-input w-full px-3 py-2 rounded-md bg-black"
                        required
                      />
                    </div>
                    
                    <div className="pt-4 flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
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
                        {loading ? (
                          <span>Sending...</span>
                        ) : (
                          <>
                            <span>Send Reset Link</span>
                            <ChevronRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Don't have an account? <Link to="/signup" className="text-indigo-500 hover:text-purple-500 hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TronLoginPage;