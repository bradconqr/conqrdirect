import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tab } from '@headlessui/react';
import { cn } from '../utils/cn';
import { CustomerRegistration } from '../components/auth/CustomerRegistration';
import { PasswordRecovery } from '../components/auth/PasswordRecovery';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { creatorId } = useParams();
  const { session } = useAuthStore();
  const [mode, setMode] = useState<'signin' | 'signup' | 'recovery'>('signin');
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // If user is already logged in, redirect to store or home
    if (session) {
      if (creatorId) {
        navigate(`/store/${creatorId}`);
      } else {
        navigate('/');
      }
    }
    
    // If creatorId is provided, fetch creator details
    if (creatorId) {
      fetchCreatorDetails();
    } else {
      setLoading(false);
    }
  }, [session, navigate, creatorId]);
  
  const fetchCreatorDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('id, store_name, store_description')
        .eq('id', creatorId)
        .single();
        
      if (error) throw error;
      
      setCreator(data);
    } catch (err) {
      console.error('Error fetching creator:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackToLogin = () => {
    setMode('signin');
  };
  
  const handleForgotPassword = () => {
    setMode('recovery');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {creatorId && creator ? (
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              {mode === 'signin' ? 'Sign in to' : mode === 'signup' ? 'Join' : 'Reset password for'}
            </h2>
            <h1 className="mt-1 text-2xl font-bold text-purple-700">
              {creator.store_name}
            </h1>
            {creator.store_description && (
              <p className="mt-2 text-sm text-gray-600">
                {creator.store_description}
              </p>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              CONQR Direct
            </h2>
            <h3 className="text-center text-xl font-bold text-gray-700 mt-2">
              {mode === 'signin' ? 'Sign in to your account' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
            </h3>
            {mode === 'signin' && (
              <p className="mt-2 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="mt-2 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Sign in
                </button>
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="py-8 px-4 sm:px-10">
            {mode === 'recovery' ? (
              <>
                <button
                  onClick={handleBackToLogin}
                  className="flex items-center font-medium text-purple-600 hover:text-purple-500 mb-6"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to login
                </button>
                <PasswordRecovery />
              </>
            ) : mode === 'signin' ? (
              <div>
                <SupabaseAuth
                  supabaseClient={supabase}
                  appearance={{ 
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: '#7e22ce',
                          brandAccent: '#6b21a8',
                        },
                      },
                    },
                  }}
                  theme="light"
                  providers={[]}
                  redirectTo={window.location.origin + (creatorId ? `/store/${creatorId}` : '')}
                />
                <div className="mt-4">
                  <button
                    onClick={handleForgotPassword}
                    className="font-medium text-sm text-purple-600 hover:text-purple-500"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <CustomerRegistration 
                  onSuccess={() => setMode('signin')} 
                  creatorId={creatorId}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};