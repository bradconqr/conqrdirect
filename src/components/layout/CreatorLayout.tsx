import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { 
  Layers, 
  BarChart2, 
  Tag, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ExternalLink,
  ShoppingBag,
  Percent,
  MessageSquare,
  Mail,
  MegaphoneIcon,
  Share2,
  ActivityIcon,
  UserPlus,
  Palette,
  Layout,
  Package,
  Gift,
  Zap
} from 'lucide-react';
import { Button } from '../ui/Button';

export const CreatorLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setSession, setUser, setIsCreator } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creatorData, setCreatorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchCreatorProfile = async () => {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching creator profile:', error);
      } else {
        setCreatorData(data);
      }
      
      setLoading(false);
    };
    
    fetchCreatorProfile();
  }, [user]);
  
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
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force client-side logout on error
      setSession(null);
      setUser(null);
      setIsCreator(false);
      navigate('/auth');
    }
  };
  
  const isActivePath = (path: string) => {
    if (path === '/creator' && location.pathname === '/creator') {
      return true;
    }
    if (path !== '/creator' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const handleViewStore = () => {
    // Open store in a new tab if we have a creator ID
    if (creatorData?.id) {
      window.open(`/store/${creatorData.id}`, '_blank');
    } else {
      window.open('/', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-gray-900 border-b border-gray-800 shadow-sm z-10">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button
                type="button"
                className="px-4 text-gray-400 md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex-shrink-0 flex items-center">
                <Link to="/creator" className="text-lg font-bold text-purple-700">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">CONQR Direct Dashboard</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewStore}
                leftIcon={<ExternalLink className="h-4 w-4" />}
              >
                View Store
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<LogOut className="h-4 w-4" />}
                onClick={handleLogout}
              >
                Log out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              {renderSidebar()}
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow border-r border-gray-800 pt-5 pb-4 bg-gray-900 overflow-y-auto">
              {renderSidebar()}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
  
  function renderSidebar() {
    return (
      <nav className="mt-5 flex-1 px-2 space-y-1 text-gray-300">
        <Link
          to="/creator"
          className={`${
            isActivePath('/creator') && location.pathname === '/creator'
              ? 'bg-indigo-900 text-indigo-300'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          <Layers
            className={`${
              isActivePath('/creator') && location.pathname === '/creator' ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-300'
            } mr-3 h-5 w-5`}
          />
          Dashboard
        </Link>

        <Link
          to="/creator/products"
          className={`${
            isActivePath('/creator/products')
              ? 'bg-indigo-900 text-indigo-300'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          <Tag
            className={`${
              isActivePath('/creator/products') ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-300'
            } mr-3 h-5 w-5`}
          />
          Products
        </Link>

        <Link
          to="/creator/orders"
          className={`${
            isActivePath('/creator/orders')
              ? 'bg-purple-900 text-purple-300'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          <ShoppingBag
            className={`${
              isActivePath('/creator/orders') ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
            } mr-3 h-5 w-5`}
          />
          Orders
        </Link>

        <Link
          to="/creator/discounts"
          className={`${
            isActivePath('/creator/discounts')
              ? 'bg-purple-900 text-purple-300'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          <Percent
            className={`${
              isActivePath('/creator/discounts') ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
            } mr-3 h-5 w-5`}
          />
          Discounts
        </Link>

        {/* Upsells & Bundles */}
        <Link
          to="/creator/upsells"
          className={`${
            isActivePath('/creator/upsells')
              ? 'bg-purple-900 text-purple-300'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          <Zap
            className={`${
              isActivePath('/creator/upsells') ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
            } mr-3 h-5 w-5`}
          />
          Upsells
        </Link>

        <Link
          to="/creator/bundles"
          className={`${
            isActivePath('/creator/bundles')
              ? 'bg-purple-900 text-purple-300'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          <Gift
            className={`${
              isActivePath('/creator/bundles') ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
            } mr-3 h-5 w-5`}
          />
          Bundles
        </Link>

        <Link
          to="/creator/customers"
          className={`${
            isActivePath('/creator/customers')
              ? 'bg-purple-900 text-purple-300'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          <Users
            className={`${
              isActivePath('/creator/customers') ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
            } mr-3 h-5 w-5`}
          />
          Customers
        </Link>

        <Link
          to="/creator/community"
          className={`${
            isActivePath('/creator/community')
              ? 'bg-purple-900 text-purple-300'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          <MessageSquare
            className={`${
              isActivePath('/creator/community') ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
            } mr-3 h-5 w-5`}
          />
          Community
        </Link>

        {/* Marketing Tools Section */}
        <div className="py-1 mt-4">
          <h3 className="px-2 text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Marketing</h3>

          <Link
            to="/creator/marketing"
            className={`${
              location.pathname === '/creator/marketing'
                ? 'bg-purple-900 text-purple-300'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
          >
            <MegaphoneIcon
              className={`${
                location.pathname === '/creator/marketing' ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
              } mr-3 h-5 w-5`}
            />
            Marketing Hub
          </Link>

          <Link
            to="/creator/marketing/contacts"
            className={`${
              location.pathname === '/creator/marketing/contacts'
                ? 'bg-purple-900 text-purple-300'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } group flex items-center px-2 py-2 text-sm font-medium pl-9 rounded-md`}
          >
            <UserPlus
              className={`${
                location.pathname === '/creator/marketing/contacts' ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
              } mr-3 h-5 w-5`}
            />
            Contacts
          </Link>

          <Link
            to="/creator/marketing/email"
            className={`${
              location.pathname === '/creator/marketing/email'
                ? 'bg-purple-900 text-purple-300'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } group flex items-center px-2 py-2 text-sm font-medium pl-9 rounded-md`}
          >
            <Mail
              className={`${
                location.pathname === '/creator/marketing/email' ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
              } mr-3 h-5 w-5`}
            />
            Email Management
          </Link>

          <Link
            to="/creator/marketing/sequences"
            className={`${
              location.pathname === '/creator/marketing/sequences'
                ? 'bg-purple-900 text-purple-300'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } group flex items-center px-2 py-2 text-sm font-medium pl-9 rounded-md`}
          >
            <ActivityIcon
              className={`${
                location.pathname === '/creator/marketing/sequences' ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
              } mr-3 h-5 w-5`}
            />
            Email Sequences
          </Link>

          <Link
            to="/creator/marketing/affiliates"
            className={`${
              location.pathname === '/creator/marketing/affiliates'
                ? 'bg-purple-900 text-purple-300'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } group flex items-center px-2 py-2 text-sm font-medium pl-9 rounded-md`}
          >
            <Share2
              className={`${
                location.pathname === '/creator/marketing/affiliates' ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
              } mr-3 h-5 w-5`}
            />
            Affiliate Program
          </Link>

          <Link
            to="/creator/marketing/pixels"
            className={`${
              location.pathname === '/creator/marketing/pixels'
                ? 'bg-purple-900 text-purple-300'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } group flex items-center px-2 py-2 text-sm font-medium pl-9 rounded-md`}
          >
            <ActivityIcon
              className={`${
                location.pathname === '/creator/marketing/pixels' ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
              } mr-3 h-5 w-5`}
            />
            Pixel Tracking
          </Link>
        </div>

        {/* Store Customization Link */}
        <Link
          to="/creator/store-customization"
          className={`${
            isActivePath('/creator/store-customization')
              ? 'bg-purple-900 text-purple-300'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          <Layout
            className={`${
              isActivePath('/creator/store-customization') ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
            } mr-3 h-5 w-5`}
          />
          Store Customization
        </Link>

        <Link
          to="/creator/analytics"
          className={`${
            isActivePath('/creator/analytics')
              ? 'bg-purple-900 text-purple-300'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          <BarChart2
            className={`${
              isActivePath('/creator/analytics') ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
            } mr-3 h-5 w-5`}
          />
          Analytics
        </Link>

        <Link
          to="/creator/settings"
          className={`${
            isActivePath('/creator/settings')
              ? 'bg-purple-900 text-purple-300'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          <Settings
            className={`${
              isActivePath('/creator/settings') ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
            } mr-3 h-5 w-5`}
          />
          Settings
        </Link>
      </nav>
    );
  }
};