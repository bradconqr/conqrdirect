import React, { useState } from 'react';
import { CreditCard, Calendar, Lock } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  onSubmit: (formData: PaymentFormData) => void;
  isProcessing: boolean;
}

export interface PaymentFormData {
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardholderName: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSubmit, isProcessing }) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardholderName: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim();
      
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    
    // Format expiry date with slash
    if (name === 'cardExpiry') {
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
      }
      
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate card number
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    // Validate expiry date
    if (!formData.cardExpiry || !/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
      newErrors.cardExpiry = 'Please enter a valid expiry date (MM/YY)';
    }
    
    // Validate CVC
    if (!formData.cardCvc || !/^\d{3,4}$/.test(formData.cardCvc)) {
      newErrors.cardCvc = 'Please enter a valid CVC code';
    }
    
    // Validate cardholder name
    if (!formData.cardholderName) {
      newErrors.cardholderName = 'Please enter the cardholder name';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-indigo-900/30 p-4 rounded-md mb-6">
        <h3 className="text-lg font-bold text-white mb-2">
          Payment Summary
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Monthly subscription</span>
          <span className="text-xl font-bold text-white">${amount}/mo</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cardholderName" className="block text-sm font-medium text-indigo-500 mb-1">
            Cardholder Name
          </label>
          <input
            type="text"
            id="cardholderName"
            name="cardholderName"
            value={formData.cardholderName}
            onChange={handleChange}
            placeholder="John Doe"
            className="tron-input w-full px-3 py-2 rounded-md bg-black"
            required
          />
          {errors.cardholderName && (
            <p className="mt-1 text-xs text-red-500">{errors.cardholderName}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-indigo-500 mb-1">
            Card Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              className="tron-input w-full pl-10 pr-3 py-2 rounded-md bg-black"
              maxLength={19}
              required
            />
          </div>
          {errors.cardNumber && (
            <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cardExpiry" className="block text-sm font-medium text-indigo-500 mb-1">
              Expiry Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                id="cardExpiry"
                name="cardExpiry"
                value={formData.cardExpiry}
                onChange={handleChange}
                placeholder="MM/YY"
                className="tron-input w-full pl-10 pr-3 py-2 rounded-md bg-black"
                maxLength={5}
                required
              />
            </div>
            {errors.cardExpiry && (
              <p className="mt-1 text-xs text-red-500">{errors.cardExpiry}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="cardCvc" className="block text-sm font-medium text-indigo-500 mb-1">
              CVC
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                id="cardCvc"
                name="cardCvc"
                value={formData.cardCvc}
                onChange={handleChange}
                placeholder="123"
                className="tron-input w-full pl-10 pr-3 py-2 rounded-md bg-black"
                maxLength={4}
                required
              />
            </div>
            {errors.cardCvc && (
              <p className="mt-1 text-xs text-red-500">{errors.cardCvc}</p>
            )}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isProcessing}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-full py-3 rounded-md shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center mt-6"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Payment...
            </div>
          ) : (
            <>Complete Purchase</>
          )}
        </button>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Your card will be charged ${amount} today. You can cancel anytime.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            By completing your purchase, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </form>
    </div>
  );
};