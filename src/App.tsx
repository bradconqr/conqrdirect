import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore';
import { useCartStore } from './stores/cartStore';

// Layouts
import { CustomerLayout } from './components/layout/CustomerLayout';
import { CreatorLayout } from './components/layout/CreatorLayout';

// Authentication Pages
import { AuthPage } from './pages/AuthPage';
import { PasswordResetForm } from './components/auth/PasswordResetForm';
import { CreatorOnboarding } from './pages/CreatorOnboarding';

// Subscription Management
import SubscriptionPage from './pages/SubscriptionPage';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CheckoutSuccessPage } from './pages/CheckoutSuccessPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { StoreViewPage } from './pages/customer/StoreViewPage';
import { ProductDetailsPage } from './pages/customer/ProductDetailsPage';
import { BrowseProductsPage } from './pages/customer/BrowseProductsPage';

// Creator Pages
import { CreatorDashboardPage } from './pages/creator/CreatorDashboardPage';
import { ProductsList } from './pages/admin/ProductsList';
import { ProductForm } from './pages/admin/ProductForm';
import { CreatorAnalyticsPage } from './pages/creator/CreatorAnalyticsPage';
import { CreatorSettingsPage } from './pages/creator/CreatorSettingsPage';
import { CreatorCustomersPage } from './pages/creator/CreatorCustomersPage';
import { CreatorOrdersPage } from './pages/creator/CreatorOrdersPage';
import { CreatorDiscountsPage } from './pages/creator/CreatorDiscountsPage';
import { CreatorCommunityPage } from './pages/creator/CreatorCommunityPage';
import { UpsellPage } from './pages/creator/UpsellPage';
import { BundlePage } from './pages/creator/BundlePage';

// Marketing Pages
import { MarketingToolsPage } from './pages/creator/MarketingToolsPage';
import { EmailManagementPage } from './pages/creator/EmailManagementPage';
import { EmailSequencePage } from './pages/creator/EmailSequencePage';
import { AffiliateManagementPage } from './pages/creator/AffiliateManagementPage';
import { PixelTrackingPage } from './pages/creator/PixelTrackingPage';
import { ContactManagementPage } from './pages/creator/ContactManagementPage';
import { StoreCustomizationPage } from './pages/creator/StoreCustomizationPage';

// Tron Pages
import TronHomePage from './pages/TronHomePage';
import TronSignupPage from './pages/TronSignupPage';
import TronLoginPage from './pages/TronLoginPage';
import TronCheckoutPage from './pages/TronCheckoutPage';

// Component to handle store auth redirects with proper access to route params
function StoreAuthRedirect() {
  const { creatorId } = useParams();
  const { session } = useAuthStore();
  
  return session ? <Navigate to={`/store/${creatorId}`} /> : <AuthPage />;
}

function App() {
  const navigate = useNavigate();
  const { session, user, isCreator, setSession, setUser, setIsCreator } = useAuthStore();
  const { cartItems } = useCartStore();
  const location = useLocation();

  useEffect(() => {
    // Check for an existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        checkIfCreator(session.user.id);
      } else {
        // Clear session data if no valid session exists
        handleSignOut();
      }
    });

    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          handleSignOut();
        } else if (session?.user) {
          setSession(session);
          setUser(session.user);
          checkIfCreator(session.user.id);
        }
      }
    );

    // Set up session refresh interval
    const refreshInterval = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error);
        handleSignOut();
      } else if (session) {
        setSession(session);
      }
    }, 4 * 60 * 1000); // Refresh every 4 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const handleSignOut = () => {
    setSession(null);
    setUser(null);
    setIsCreator(false);
    
    // If on a protected route, redirect to home
    if (window.location.pathname.startsWith('/creator') || 
        window.location.pathname === '/purchases') {
      navigate('/');
    }
  };

  useEffect(() => {
    // Redirect creators to the creator dashboard if they try to access customer routes
    // But don't redirect if they're viewing their own store
    if (isCreator && session && 
        !window.location.pathname.startsWith('/creator') && 
        !window.location.pathname.startsWith('/auth') &&
        !window.location.pathname.startsWith('/store/')) {
      navigate('/creator');
    }
  }, [isCreator, session, navigate, location.pathname]);

  const checkIfCreator = async (userId: string) => {
    const { data, error } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching creator data:", error);
      setIsCreator(false);
    } else if (data && !window.location.pathname.startsWith('/store/')) {
      setIsCreator(true);
      // Auto-redirect creators to the creator dashboard when they log in
      if (!window.location.pathname.startsWith('/creator') && 
          !window.location.pathname.startsWith('/store/')) {
        navigate('/creator');
      }
    } else {
      setIsCreator(false);
    }
  };

  // If the user is a creator, only show them the creator UI
  if (session && isCreator) {
    return (
      <Routes>
        {/* Authentication Routes - Essential for all users */}
        <Route path="/auth" element={<Navigate to="/creator" />} />
        <Route path="/auth/reset-password" element={<PasswordResetForm />} />
        <Route path="/auth/store/:creatorId" element={<Navigate to="/creator" />} />
        
        {/* Subscription Management */}
        <Route path="/subscription" element={<SubscriptionPage />} />
        
        {/* Creator Routes - Admin UI only */}
        <Route path="/creator/*" element={<CreatorLayout />}>
          <Route index element={<CreatorDashboardPage />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/edit/:productId" element={<ProductForm />} />
          <Route path="analytics" element={<CreatorAnalyticsPage />} />
          <Route path="customers" element={<CreatorCustomersPage />} />
          <Route path="orders" element={<CreatorOrdersPage />} />
          <Route path="discounts" element={<CreatorDiscountsPage />} />
          
          {/* Upsell and Bundle Routes */}
          <Route path="upsells" element={<UpsellPage />} />
          <Route path="bundles" element={<BundlePage />} />
          
          <Route path="community" element={<CreatorCommunityPage />} />
          
          {/* Marketing Tools Routes */}
          <Route path="marketing" element={<MarketingToolsPage />} />
          <Route path="marketing/email" element={<EmailManagementPage />} />
          <Route path="marketing/sequences" element={<EmailSequencePage />} />
          <Route path="marketing/affiliates" element={<AffiliateManagementPage />} />
          <Route path="marketing/pixels" element={<PixelTrackingPage />} />
          <Route path="marketing/contacts" element={<ContactManagementPage />} />
          <Route path="store-customization" element={<StoreCustomizationPage />} />
          
          <Route path="settings" element={<CreatorSettingsPage />} />
        </Route>
        
        {/* Redirect all other routes to creator dashboard */}
        <Route path="*" element={<Navigate to="/creator" />} />
      </Routes>
    );
  }

  // Standard customer routing for non-creator users
  return (
    <Routes>
      {/* Tron Pages */}
      <Route path="/" element={<TronHomePage />} />
      <Route path="/signup" element={<TronSignupPage />} />
      <Route path="/login" element={<TronLoginPage />} />
      <Route path="/checkout" element={<TronCheckoutPage />} />
      <Route path="/subscription" element={<SubscriptionPage />} />
      
      {/* Authentication Routes */}
      <Route path="/auth" element={session ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/auth/store/:creatorId" element={<StoreAuthRedirect />} />
      <Route path="/auth/reset-password" element={<PasswordResetForm />} />
      
      {/* Subscription Management */}
      <Route path="/subscription" element={<SubscriptionPage />} />
      
      {/* Creator Onboarding */}
      <Route path="/creator-onboarding" element={session ? <CreatorOnboarding /> : <Navigate to="/auth" />} />

      {/* Customer Routes */}
      <Route path="/" element={<CustomerLayout />}>
        <Route path="products" element={<BrowseProductsPage />} />
        <Route path="product/:productId" element={<ProductDetailsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="purchases" element={session ? <PurchasesPage /> : <Navigate to="/" />} />
      </Route>
      
      {/* Store Routes */}
      <Route path="/store/:creatorId" element={<StoreViewPage />} />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;