import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice } = useCartStore();
  const { session } = useAuthStore();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
  };
  
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(productId, newQuantity);
    }
  };
  
  const handleCheckout = () => {
    if (!session) {
      navigate('/auth');
    } else {
      navigate('/checkout');
    }
  };
  
  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h2>
          <p className="mt-1 text-sm text-gray-500">
            Looks like you haven't added any products to your cart yet.
          </p>
          <div className="mt-6">
            <Link to="/">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
      
      <div className="mt-8">
        <div className="flow-root">
          <ul className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <li key={item.product.id} className="py-6 flex">
                <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden">
                  {item.product.thumbnail ? (
                    <img
                      src={item.product.thumbnail}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
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
                    <div className="flex items-center">
                      <button
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        className="p-1 rounded-md hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="mx-2 text-gray-500">Qty {item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        className="p-1 rounded-md hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="font-medium text-purple-600 hover:text-purple-500 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-10 border-t border-gray-200 pt-6">
        <div className="flex justify-between text-base font-medium text-gray-900">
          <p>Subtotal</p>
          <p>{formatPrice(getTotalPrice())}</p>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">
          Shipping and taxes calculated at checkout.
        </p>
        
        <div className="mt-6">
          <Button fullWidth onClick={handleCheckout}>
            Proceed to Checkout
          </Button>
        </div>
        
        <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
          <p>
            or{" "}
            <Link to="/" className="text-purple-600 font-medium hover:text-purple-500">
              Continue Shopping
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};