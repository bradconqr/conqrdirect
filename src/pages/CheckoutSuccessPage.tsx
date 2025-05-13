import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { Button } from '../components/ui/Button';

export const CheckoutSuccessPage: React.FC = () => {
  const { clearCart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Clear the cart when the user reaches this page
    clearCart();
    
    // Check if we have a session_id in the URL (from Stripe redirect)
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    
    if (sessionId) {
      // You could verify the session with your backend here if needed
      console.log('Checkout session ID:', sessionId);
    }
  }, [clearCart, location]);
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
          Thank you for your purchase!
        </h1>
        
        <p className="mt-4 text-lg text-gray-500">
          Your order has been successfully processed.
        </p>
        
        <p className="mt-2 text-gray-500">
          You will receive an email confirmation shortly with details of your purchase.
        </p>
        
        <div className="mt-10">
          <h2 className="text-lg font-medium text-gray-900">What's next?</h2>
          
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Access your purchase</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Your digital products are now available in your account.
                </p>
                <div className="mt-3">
                  <Link to="/purchases">
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      View Purchases
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Explore more</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Discover more products from your favorite creators.
                </p>
                <div className="mt-3">
                  <Link to="/">
                    <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100">
            <Package className="h-5 w-5 mr-2" />
            <span>Order ID: {location.search.includes('session_id=') ? location.search.split('session_id=')[1].split('&')[0] : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};