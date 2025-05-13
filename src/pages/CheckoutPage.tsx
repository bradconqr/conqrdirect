import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { createCheckoutSession, getStripe } from '../lib/checkout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ShoppingBag, CreditCard, ArrowRight, AlertCircle } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCartStore();
  const { user, session } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // If cart is empty, redirect to cart page
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
  };
  
  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create checkout session
      const { id, url } = await createCheckoutSession(
        cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        user?.id || 'guest'
      );

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        // If we have a session ID but no URL, use the Stripe client to redirect
        const stripe = await getStripe();
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: id });
        }
      }
    } catch (error: any) {
      console.error('Error during checkout:', error);
      setError(error.message || 'An error occurred during checkout');
      setIsLoading(false);
    }
  };
  
  if (cartItems.length === 0) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
      
      {!session && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Checking out as a guest</h3>
          <p className="text-sm text-blue-700">
            You're checking out as a guest. You'll be able to complete your purchase without creating an account.
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-12 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
        <div className="lg:col-span-7">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-gray-900">Order summary</h2>
              
              <ul className="mt-6 divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <li key={item.product.id} className="py-4 flex">
                    <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                      {item.product.thumbnail ? (
                        <img
                          src={item.product.thumbnail}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>{item.product.name}</h3>
                          <p className="ml-4">
                            {formatPrice(
                              (item.product.discountPrice || item.product.price) * item.quantity
                            )}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.product.type.charAt(0).toUpperCase() + item.product.type.slice(1)}
                        </p>
                      </div>
                      
                      <div className="flex-1 flex items-end justify-between text-sm">
                        <p className="text-gray-500">Qty {item.quantity}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Subtotal</p>
                  <p>{formatPrice(getTotalPrice())}</p>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  Shipping and taxes will be calculated at the next step.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-10 lg:mt-0 lg:col-span-5">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-gray-900">Payment</h2>
              
              <div className="mt-6">
                <Button 
                  fullWidth 
                  onClick={handleCheckout} 
                  isLoading={isLoading}
                  leftIcon={<CreditCard className="h-5 w-5" />}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Proceed to Payment
                </Button>
                
                <p className="mt-4 text-sm text-gray-500 text-center">
                  By proceeding to checkout, you agree to our terms of service and privacy policy.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};