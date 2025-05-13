import React, { useState, useEffect } from 'react';
import { 
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe, 
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Calendar, Lock, CheckCircle } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  onSubmit: (paymentMethod: any) => void;
  isProcessing: boolean;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ 
  amount, 
  onSubmit, 
  isProcessing 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);
  const [cardElementsLoaded, setCardElementsLoaded] = useState(true);

  // Remove the useEffect that was causing issues

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    if (!cardholderName) {
      setError('Please enter the cardholder name');
      return;
    }

    setError(null);

    const cardNumberElement = elements.getElement(CardNumberElement);
    
    if (!cardNumberElement) {
      setError('Card number element not found');
      return;
    }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumberElement,
      billing_details: {
        name: cardholderName,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'An error occurred with your payment');
      return;
    }

    onSubmit(paymentMethod);
  };

  const cardElementStyle = {
    style: {
      base: {
        color: 'white',
        fontFamily: '"Rajdhani", sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        lineHeight: '42px',
        '::placeholder': {
          color: '#aab7c4',
        },
        ':-webkit-autofill': {
          color: 'white',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };

  const isFormComplete = cardholderName && cardNumberComplete && cardExpiryComplete && cardCvcComplete;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-indigo-900/30 p-4 rounded-md mb-6">
        <h3 className="text-lg font-bold text-white mb-2">Payment Summary</h3>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Monthly subscription</span>
          <span className="text-xl font-bold text-white">${amount}/mo</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Your 14-day free trial starts today. You won't be charged until your trial ends.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cardholderName" className="block text-sm font-medium text-indigo-500 mb-1">
            Cardholder Name
          </label>
          <input
            type="text"
            id="cardholderName"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="John Doe"
            className="tron-input w-full px-3 py-2 rounded-md bg-black" 
            required
          />
        </div>
        
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-indigo-500 mb-1">
            Card Number
          </label>
          <div className="tron-input w-full px-3 py-2 rounded-md bg-black relative flex items-center">
            <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
            <CardNumberElement 
              options={cardElementStyle}
              onChange={(e) => setCardNumberComplete(e.complete)}
              className="w-full"
            />
            {cardNumberComplete && (
              <CheckCircle className="h-4 w-4 text-green-500 absolute right-3" />
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cardExpiry" className="block text-sm font-medium text-indigo-500 mb-1">
              Expiration Date
            </label>
            <div className="tron-input w-full px-3 py-2 rounded-md bg-black relative flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <CardExpiryElement 
                options={cardElementStyle}
                onChange={(e) => setCardExpiryComplete(e.complete)}
                className="w-full"
              />
              {cardExpiryComplete && (
                <CheckCircle className="h-4 w-4 text-green-500 absolute right-3" />
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="cardCvc" className="block text-sm font-medium text-indigo-500 mb-1">
              CVC
            </label>
            <div className="tron-input w-full px-3 py-2 rounded-md bg-black relative flex items-center">
              <Lock className="h-5 w-5 text-gray-400 mr-2" />
              <CardCvcElement 
                options={cardElementStyle}
                onChange={(e) => setCardCvcComplete(e.complete)}
                className="w-full"
              />
              {cardCvcComplete && (
                <CheckCircle className="h-4 w-4 text-green-500 absolute right-3" />
              )}
            </div>
          </div>
        </div>
        
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
        
        <button
          type="submit"
          disabled={!stripe || isProcessing || !isFormComplete}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-full py-4 rounded-md shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
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
            <>Start 14-Day Free Trial</>
          )}
        </button>
        
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Lock className="h-4 w-4 text-indigo-500 mr-2" />
            <p className="text-xs text-gray-400">
              Secure payment powered by Stripe
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Your card will be charged ${amount}/mo after your free trial. Cancel anytime.
          </p>
        </div>
      </form>
    </div>
  );
};