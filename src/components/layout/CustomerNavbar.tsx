import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Package, LogOut, Grid, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';

interface CustomerNavbarProps {
  storeName?: string;
  creatorId?: string;
}

export const CustomerNavbar: React.FC<CustomerNavbarProps> = ({ 
  storeName = "CONQR Direct",
  creatorId
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, user, isCreator, setSession, setUser, setIsCreator } = useAuthStore();
  const { cartItems } = useCartStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // Force client-side logout even if server request fails
        setSession(null);
        setUser(null);
        setIsCreator(false);
      }
      
      // If we're in a specific store, stay there after logout
      if (creatorId) {
        navigate(`/store/${creatorId}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force client-side logout on error
      setSession(null);
      setUser(null);
      setIsCreator(false);
      
      if (creatorId) {
        navigate(`/store/${creatorId}`);
      } else {
        navigate('/');
      }
    }
  };

  const handleLogin = () => {
    // If we're in a specific store, redirect to store-specific login
    if (creatorId) {
      navigate(`/auth/store/${creatorId}`);
    } else {
      navigate('/auth');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Determine if we're in a specific store context
  const isStoreSpecificPage = location.pathname.includes('/store/') || !!creatorId;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {creatorId ? (
              <Link to={`/store/${creatorId}`} className="flex-shrink-0 flex items-center">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text font-bold text-xl">{storeName}</span>
              </Link>
            ) : (
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text font-bold text-xl">{storeName}</span>
              </Link>
            )}
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {creatorId ? (
                // Store-specific navigation
                <>
                  <Link
                    to={`/store/${creatorId}`}
                    className={`border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === `/store/${creatorId}` ? 'border-indigo-500 text-indigo-600' : ''
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to={`/store/${creatorId}#products`}
                    className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Products
                  </Link>
                </>
              ) : (
                // Platform navigation
                <>
                  <Link
                    to="/"
                    className={`border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === '/' ? 'border-indigo-500 text-indigo-600' : ''
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/products"
                    className={`border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === '/products' ? 'border-indigo-500 text-indigo-600' : ''
                    }`}
                  >
                    Products
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Search bar - Desktop */}
          <div className="hidden md:flex md:flex-1 md:justify-center md:max-w-md">
            <form onSubmit={handleSearch} className="w-full max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </form>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {user ? (
              <>
                <Link to="/cart">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    leftIcon={<ShoppingCart className="h-5 w-5" />}
                  >
                    Cart {getTotalItems() > 0 && `(${getTotalItems()})`}
                  </Button>
                </Link>
                <Link to="/purchases">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Package className="h-5 w-5" />}
                  >
                    My Purchases
                  </Button>
                </Link>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<User className="h-5 w-5" />}
                  >
                    {user.user_metadata?.full_name || 'Account'}
                  </Button>
                </div>
                {isCreator && (
                  <Link to="/creator">
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      Creator Dashboard
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<LogOut className="h-5 w-5" />}
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogin}
                >
                  Log in
                </Button>
                <Button 
                  size="sm"
                  onClick={handleLogin}
                >
                  Sign up
                </Button>
              </>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {creatorId ? (
              <>
                <Link
                  to={`/store/${creatorId}`}
                  className="bg-indigo-50 border-indigo-500 text-indigo-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                >
                  Home
                </Link>
                <Link
                  to={`/store/${creatorId}#products`}
                  className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                >
                  Products
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={`${location.pathname === '/' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  Home
                </Link>
                <Link
                  to="/products"
                  className={`${location.pathname === '/products' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  All Products
                </Link>
              </>
            )}

            {/* Mobile search */}
            <div className="px-4 py-2">
              <form onSubmit={handleSearch} className="flex">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Grid className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.user_metadata?.full_name || 'User'}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/purchases"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    My Purchases
                  </Link>
                  <Link
                    to="/cart"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Cart {getTotalItems() > 0 && `(${getTotalItems()})`}
                  </Link>
                  {isCreator && (
                    <Link
                      to="/creator"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    >
                      Creator Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1 px-4">
                <Button 
                  variant="outline" 
                  fullWidth 
                  className="mb-2"
                  onClick={handleLogin}
                >
                  Log in
                </Button>
                <Button 
                  fullWidth
                  onClick={handleLogin}
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};