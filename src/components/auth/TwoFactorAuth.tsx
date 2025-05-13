import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface TwoFactorAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onSuccess, onCancel }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code) {
      setError('Please enter the verification code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // This is a placeholder for actual 2FA verification
      // In a real implementation, you would verify the code with Supabase or another 2FA provider
      // Here we're simulating success for demonstration purposes
      
      // Simulated 2FA verification
      if (code === '123456') { // Example valid code
        onSuccess();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error: any) {
      console.error('Error during 2FA verification:', error);
      setError(error.message || 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Two-factor authentication</h3>
      
      <p className="text-sm text-gray-600 mb-6">
        Please enter the verification code sent to your device to complete the login process.
      </p>
      
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            fullWidth 
            isLoading={loading}
          >
            Verify
          </Button>
        </div>
      </form>
    </div>
  );
};