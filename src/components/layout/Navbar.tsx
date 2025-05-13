import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Settings, LogOut, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';

interface NavbarProps {
  userLoggedIn?: boolean;
  isCreator?: boolean;
  storeName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  userLoggedIn = false, 
  isCreator = false,
  storeName = "CONQR Direct"
}) => {
  const navigate = useNavigate();
  const { setSession, setUser, setIsCreator } = useAuthStore();
  const { cartItems } = useCartStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force client-side logout on error
      setSession(null);
      setUser(null);
      setIsCreator(false);
      navigate('/');
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-purple-700 font-bold text-xl">{storeName}</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Products
              </Link>
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Courses
              </Link>
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Community
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {userLoggedIn ? (
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
                    Account
                  </Button>
                </div>
                {isCreator && (
                  <Link to="/admin/products">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Settings className="h-5 w-5" />}
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
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">
                    Sign up
                  </Button>
                </Link>
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
            <Link
              to="/"
              className="bg-purple-50 border-purple-500 text-purple-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              Home
            </Link>
            <Link
              to="/"
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              Products
            </Link>
            <Link
              to="/"
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              Courses
            </Link>
            <Link
              to="/"
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              Community
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {userLoggedIn ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">User Name</div>
                    <div className="text-sm font-medium text-gray-500">user@example.com</div>
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
                      to="/admin/products"
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
                <Link to="/auth">
                  <Button variant="outline" fullWidth className="mb-2">
                    Log in
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button fullWidth>
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};