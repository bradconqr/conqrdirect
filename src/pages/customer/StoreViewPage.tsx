import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ProductCard } from '../../components/products/ProductCard';
import { Product } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { usePublishedProducts, useCreatorStore } from '../../hooks/useRealtimeData';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, Instagram, Twitter, Youtube, Globe, LogIn, Video, Image as ImageIcon, Moon, Sun } from 'lucide-react';
import { User } from 'lucide-react';

interface ThemeSettings {
  theme?: string;
  gradient?: string;
  primaryColor?: string;
  accentColor?: string;
  customCss?: string;
  layout?: string;
  showFeaturedProducts?: boolean;
  productsPerPage?: number;
  showFilters?: boolean;
  headingFont?: string;
  bodyFont?: string;
  fontSize?: 'small' | 'medium' | 'large';
  storeLogo?: string | null;
  storeFavicon?: string | null;
  displayImage?: string | null;
  storeHeaderImage?: string | null;
  headerVideo?: string | null;
  socialImage?: string | null;
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string | null;
  darkMode?: boolean;
  productRows?: ProductRow[];
}

interface ProductRow {
  id: string;
  title: string;
  type: 'featured' | 'all' | 'new' | 'custom';
  visible: boolean;
  productIds?: string[];
  limit?: number;
  sortOrder: number;
}

export const StoreViewPage: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { addToCart, removeFromCart } = useCartStore();
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({});
  const [headerStyle, setHeaderStyle] = useState({
    background: 'linear-gradient(to right, #111827, #1f2937)',
    color: 'white'
  });
  const [headerBackgroundType, setHeaderBackgroundType] = useState<'color' | 'image' | 'video' | 'gradient'>('color');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [backgroundType, setBackgroundType] = useState<'color' | 'gradient' | 'image'>('color');
  
  // Use real-time data hooks
  const { creatorStore, isLoading: creatorLoading, error: creatorError } =
    useCreatorStore(creatorId || null);
  
  const { products, isLoading: productsLoading, error: productsError } =
    usePublishedProducts(creatorId || null);
  
  // Combined loading and error states
  const isLoading = creatorLoading || productsLoading;
  const error = creatorError || productsError;

  // Apply theme settings when creatorStore changes
  useEffect(() => {
    if (creatorStore?.theme_settings) {
      try {
        // Parse theme settings if it's a string, otherwise use as is
        const settings = typeof creatorStore.theme_settings === 'string' 
          ? JSON.parse(creatorStore.theme_settings) 
          : creatorStore.theme_settings;
        
        setThemeSettings(settings);
        
        // Set background color from settings
        if (settings.backgroundColor) {
          setBackgroundColor(settings.backgroundColor);
          setBackgroundType('color');
        } else if (settings.backgroundGradient) {
          setBackgroundType('gradient');
        } else if (settings.backgroundImage) {
          setBackgroundType('image');
        } else {
          setBackgroundColor('#000000'); // Default black
          setBackgroundType('color');
        }
        
        // Apply theme settings to the store view
        applyThemeSettings(settings);
        
        // Set header style based on theme settings
        updateHeaderStyle(settings);
        
        // Determine header background type
        if (settings.storeHeaderImage) {
          setHeaderBackgroundType('image');
        } else if (settings.headerVideo) {
          setHeaderBackgroundType('video');
        } else {
          if (settings.gradient) {
            setHeaderBackgroundType('gradient');
          } else {
            setHeaderBackgroundType('color');
          }
        }
      } catch (err) {
        console.error('Error parsing theme settings:', err);
      }
    }
  }, [creatorStore]);

  // Update header style based on theme settings
  const updateHeaderStyle = (settings: ThemeSettings) => {
    const newStyle: any = {
      color: 'white',
      background: settings.gradient || 'linear-gradient(to right, #6366f1, #8b5cf6)'
    };
    
    setHeaderStyle(newStyle);
  };

  // Function to apply theme settings to the store
  const applyThemeSettings = (settings: ThemeSettings) => {
    // Create a style element for custom CSS
    let styleEl = document.getElementById('store-custom-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'store-custom-styles';
      document.head.appendChild(styleEl);
    }
    
    // Build CSS based on theme settings
    let css = '';
    
    // Apply background color
    if (settings.backgroundColor) {
      css += `
        body {
          background-color: ${settings.backgroundColor} !important;
          color: #f9fafb !important;
        }
        .bg-white { background-color: ${adjustColor(settings.backgroundColor, isColorDark(settings.backgroundColor) ? 20 : -20)} !important; }
        .bg-gray-50 { background-color: ${settings.backgroundColor} !important; }
        .bg-gray-100 { background-color: ${adjustColor(settings.backgroundColor, isColorDark(settings.backgroundColor) ? 20 : -20)} !important; }
        .text-gray-900 { color: ${isColorDark(settings.backgroundColor) ? '#f9fafb' : '#111827'} !important; }
        .text-gray-800 { color: ${isColorDark(settings.backgroundColor) ? '#f3f4f6' : '#1f2937'} !important; }
        .text-gray-700 { color: ${isColorDark(settings.backgroundColor) ? '#e5e7eb' : '#374151'} !important; }
        .text-gray-600 { color: ${isColorDark(settings.backgroundColor) ? '#d1d5db' : '#4b5563'} !important; }
        .text-gray-500 { color: ${isColorDark(settings.backgroundColor) ? '#9ca3af' : '#6b7280'} !important; }
        .border-gray-200 { border-color: ${adjustColor(settings.backgroundColor, isColorDark(settings.backgroundColor) ? 30 : -30)} !important; }
        .border-gray-300 { border-color: ${adjustColor(settings.backgroundColor) ? 40 : -40} !important; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.9) !important; }
        .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.9) !important; }
      `;
    } else if (settings.backgroundGradient) {
      // Apply background gradient
      css += `
        body {
          background: ${settings.backgroundGradient} !important;
          color: #f9fafb !important;
        }
        .bg-white { background-color: rgba(18, 18, 18, 0.8) !important; }
        .bg-gray-50 { background-color: rgba(0, 0, 0, 0.5) !important; }
        .bg-gray-100 { background-color: rgba(18, 18, 18, 0.8) !important; }
        .text-gray-900 { color: #f9fafb !important; }
        .text-gray-800 { color: #f3f4f6 !important; }
        .text-gray-700 { color: #e5e7eb !important; }
        .text-gray-600 { color: #d1d5db !important; }
        .text-gray-500 { color: #9ca3af !important; }
        .border-gray-200 { border-color: rgba(31, 31, 31, 0.8) !important; }
        .border-gray-300 { border-color: rgba(42, 42, 42, 0.8) !important; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.9) !important; }
        .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.9) !important; }
      `;
    } else if (settings.backgroundImage) {
      // Apply background image
      css += `
        body {
          background-image: url(${settings.backgroundImage}) !important;
          background-size: cover !important;
          background-attachment: fixed !important;
          background-position: center center !important;
          color: #f9fafb !important;
        }
        .bg-white { background-color: rgba(18, 18, 18, 0.8) !important; }
        .bg-gray-50 { background-color: rgba(0, 0, 0, 0.5) !important; }
        .bg-gray-100 { background-color: rgba(18, 18, 18, 0.8) !important; }
        .text-gray-900 { color: #f9fafb !important; }
        .text-gray-800 { color: #f3f4f6 !important; }
        .text-gray-700 { color: #e5e7eb !important; }
        .text-gray-600 { color: #d1d5db !important; }
        .text-gray-500 { color: #9ca3af !important; }
        .border-gray-200 { border-color: rgba(31, 31, 31, 0.8) !important; }
        .border-gray-300 { border-color: rgba(42, 42, 42, 0.8) !important; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.9) !important; }
        .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.9) !important; }
      `;
    } else {
      // Default dark mode
      css += `
        body {
          background-color: #000000 !important;
          color: #f9fafb !important;
        }
        .bg-white { background-color: #121212 !important; }
        .bg-gray-50 { background-color: #000000 !important; }
        .bg-gray-100 { background-color: #121212 !important; }
        .text-gray-900 { color: #f9fafb !important; }
        .text-gray-800 { color: #f3f4f6 !important; }
        .text-gray-700 { color: #e5e7eb !important; }
        .text-gray-600 { color: #d1d5db !important; }
        .text-gray-500 { color: #9ca3af !important; }
        .border-gray-200 { border-color: #1f1f1f !important; }
        .border-gray-300 { border-color: #2a2a2a !important; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.9) !important; }
        .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.9) !important; }
      `;
    }
    
    // Apply primary and accent colors
    if (settings.primaryColor) {
      const gradient = settings.gradient || `linear-gradient(to right, ${settings.primaryColor}, ${settings.accentColor})`;
      
      css += `
        .bg-purple-700, .bg-purple-600, .bg-blue-600, .bg-green-600, .bg-teal-600, .bg-orange-600, .bg-indigo-600, .bg-pink-600 { 
          background: ${gradient} !important; 
        }
        .text-purple-700, .text-purple-600, .text-blue-600, .text-green-600, .text-teal-600, .text-orange-600, .text-indigo-600, .text-pink-600 { 
          color: ${settings.primaryColor} !important; 
        }
        .text-purple-300, .text-blue-300, .text-green-300, .text-teal-300, .text-orange-300, .text-indigo-300, .text-pink-300 { 
          color: ${settings.accentColor} !important; 
        }
        .border-purple-700, .border-blue-600, .border-green-600, .border-teal-600, .border-orange-600, .border-indigo-600, .border-pink-600 { 
          border-color: ${settings.primaryColor} !important; 
        }
        .hover\\:bg-purple-700:hover, .hover\\:bg-blue-600:hover, .hover\\:bg-green-600:hover, .hover\\:bg-teal-600:hover, .hover\\:bg-orange-600:hover, .hover\\:bg-indigo-600:hover, .hover\\:bg-pink-600:hover { 
          background: ${settings.accentColor} !important; 
        }
        
        /* Featured badges */
        .bg-blue-100, .bg-purple-100, .bg-green-100, .bg-yellow-100 {
          background-color: ${settings.primaryColor}20 !important;
        }
        .text-blue-800, .text-purple-800, .text-green-800, .text-yellow-800 {
          color: ${settings.primaryColor} !important;
        }
        
        /* Button styles */
        .bg-white.text-gray-900 {
          background: white !important;
          color: #111827 !important;
        }
        
        /* Product type badges */
        .bg-black\\/60 {
          background-color: rgba(0, 0, 0, 0.6) !important;
        }
        
        /* Card glow effects */
        .group:hover .bg-gradient-to-r {
          background-image: ${gradient} !important;
          opacity: 0.2;
        }
        
        @keyframes cardGlow {
          0% {
            box-shadow: 0 0 15px ${settings.primaryColor}33 !important;
          }
          50% {
            box-shadow: 0 0 25px ${settings.accentColor}66 !important;
          }
          100% {
            box-shadow: 0 0 15px ${settings.primaryColor}33 !important;
          }
        }
        
        .hover\\:shadow-\\[0_0_30px_rgba\\(128\\,0\\,255\\,0\\.3\\)\\]:hover {
          box-shadow: 0 0 30px ${settings.primaryColor}4D !important;
        }
        
        /* Product card styles */
        .netflix-card:hover {
          animation: cardGlow 3s infinite !important;
        }
        
        /* Override all icon colors */
        svg:not(.text-white):not(.text-gray-400):not(.text-gray-500) {
          color: ${settings.primaryColor} !important;
        }
        
        /* Override button colors */
        .bg-purple-600, button.bg-purple-600 {
          background: ${gradient} !important;
        }
        
        /* Override featured badge colors */
        .bg-purple-500\\/80 {
          background-color: ${settings.primaryColor}CC !important;
        }
      `;
    }
    
    // Apply font settings
    if (settings.headingFont) {
      css += `
        h1, h2, h3, h4, h5, h6 { 
          font-family: ${settings.headingFont}, system-ui, sans-serif !important; 
        }
      `;
    }
    
    if (settings.bodyFont) {
      css += `
        body, p, div, span { 
          font-family: ${settings.bodyFont}, system-ui, sans-serif !important; 
        }
      `;
    }
    
    // Apply font size
    if (settings.fontSize) {
      const sizeFactor = settings.fontSize === 'small' ? 0.9 : 
                         settings.fontSize === 'large' ? 1.1 : 1;
      
      css += `
        body { font-size: ${sizeFactor}rem !important; }
      `;
    }
    
    // Add any custom CSS
    if (settings.customCss) {
      css += settings.customCss;
    }
    
    // Apply the CSS
    styleEl.textContent = css;
    
    // Apply favicon with theme color if available
    if (settings.storeFavicon) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      
      // If the favicon is an SVG and we have a primary color, we can dynamically color it
      if (settings.storeFavicon.endsWith('.svg') && settings.primaryColor) {
        // Fetch the SVG content and replace the fill color
        fetch(settings.storeFavicon)
          .then(response => response.text())
          .then(svgText => {
            // Replace fill colors with the primary color
            const coloredSvg = svgText.replace(/fill="[^"]*"/g, `fill="${settings.primaryColor}"`);
            // Create a data URL from the modified SVG
            const dataUrl = `data:image/svg+xml;base64,${btoa(coloredSvg)}`;
            favicon.href = dataUrl;
          })
          .catch(() => {
            // If fetching fails, use the original favicon
            favicon.href = settings.storeFavicon;
          });
      } else {
        favicon.href = settings.storeFavicon;
      }
    }
    
    // Update document title with store name if available
    if (creatorStore?.store_name) {
      document.title = creatorStore.store_name;
    }
  };

  // Helper function to adjust color brightness
  const adjustColor = (color: string, amount: number): string => {
    // Remove the # if it exists
    color = color.replace('#', '');
    
    // Parse the color
    let r = parseInt(color.substring(0, 2), 16);
    let g = parseInt(color.substring(2, 4), 16);
    let b = parseInt(color.substring(4, 6), 16);
    
    // Adjust the brightness
    r = Math.min(255, Math.max(0, r + amount));
    g = Math.min(255, Math.max(0, g + amount));
    b = Math.min(255, Math.max(0, b + amount));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Toggle between light and dark background
  const toggleBackgroundMode = () => {
    // Always set to black (dark mode only)
    const newColor = '#0a0a0a';
    setBackgroundColor(newColor);
    
    // Update theme settings
    const updatedSettings = {
      ...themeSettings,
      backgroundColor: newColor,
      // Remove any conflicting background settings
      backgroundGradient: undefined,
      backgroundImage: undefined
    };
    
    // Apply updated settings
    applyThemeSettings(updatedSettings);
    
    // Save to database if we have a creator ID
    if (creatorId) {
      saveThemeSettings(updatedSettings);
    }
  };
  
  const saveThemeSettings = async (settings: ThemeSettings) => {
    try {
      if (!creatorId) return;
      
      const { error } = await supabase
        .from('creators')
        .update({
          theme_settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', creatorId);
        
      if (error) throw error;
    } catch (err) {
      console.error('Error saving theme settings:', err);
    }
  };
  const viewProductDetails = (product: Product) => {
    // Navigate to product details page
    window.location.href = `/product/${product.id}`;
  };
  
  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const handleSignup = () => {
    navigate(`/auth/store/${creatorId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin h-8 w-8 border-4 border-white rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error || !creatorStore) {
    return (
      <div className="bg-gray-900 text-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-900 text-red-200 p-4 rounded-md">
            {error || "Creator not found"}
          </div>
          <div className="mt-6">
            <Button onClick={() => navigate('/')}>Back to CONQR Direct</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ 
      backgroundColor: backgroundType === 'color' ? backgroundColor : 'transparent',
      background: backgroundType === 'gradient' ? (themeSettings.backgroundGradient || 'linear-gradient(to bottom, #0a0a0a, #161616)') : undefined,
      backgroundImage: backgroundType === 'image' && themeSettings.backgroundImage ? `url(${themeSettings.backgroundImage})` : undefined,
      backgroundSize: backgroundType === 'image' ? 'cover' : undefined,
      backgroundAttachment: backgroundType === 'image' ? 'fixed' : undefined,
      backgroundPosition: backgroundType === 'image' ? 'center center' : undefined,
      color: backgroundType === 'color' ? (isColorDark(backgroundColor) ? '#ffffff' : '#000000') : '#ffffff'
    }}>
      {/* Full-width header with no rounded corners */}
      <header 
        className="w-full min-h-[400px] md:min-h-[600px] lg:min-h-[700px] text-white relative overflow-hidden" 
        style={headerStyle}
      >
        {headerBackgroundType === 'image' && themeSettings.storeHeaderImage && (
          <div className="absolute inset-0">
            <img 
              src={themeSettings.storeHeaderImage} 
              alt="Store header" 
              className="w-full h-full object-cover object-center brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-purple-950/80 to-black">
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
            </div>
          </div>
        )}
        
        {headerBackgroundType === 'video' && themeSettings.headerVideo && (
          <div className="absolute inset-0">
            <video 
              src={themeSettings.headerVideo} 
              autoPlay 
              muted 
              loop 
              className="w-full h-full object-cover object-center scale-110 brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-purple-950/80 to-black">
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
            </div>
          </div>
        )}
        
        <div className="absolute top-0 right-0 p-4 z-20">
          {/* Dark mode button removed - only dark mode is available */}
        </div>
        
        <div className="max-w-7xl mx-auto h-full flex flex-col justify-center px-4 sm:px-8 py-16">
          <div className="w-full relative z-10 text-center">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center justify-center mb-6">
                {themeSettings.storeLogo && (
                  <img
                    src={themeSettings.storeLogo} 
                    alt={creatorStore?.store_name || 'Store logo'} 
                    className="h-20 object-contain bg-black/40 p-3 rounded shadow-lg"
                  />
                )}
                {!themeSettings.storeLogo && themeSettings.displayImage && (
                  <div className={`h-32 w-32 rounded-full overflow-hidden border-4 shadow-lg`} style={{ borderColor: themeSettings.primaryColor || '#6366f1' }}>
                    <img
                      src={themeSettings.displayImage}
                      alt={creatorStore?.store_name || 'Store owner'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                {!themeSettings.storeLogo && !themeSettings.displayImage && (
                  <div className={`h-32 w-32 rounded-full overflow-hidden border-4 flex items-center justify-center bg-black/40 shadow-lg`} style={{ borderColor: themeSettings.primaryColor || '#6366f1' }}>
                    <User className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
              
              <h1 className={(themeSettings.storeLogo || themeSettings.displayImage) ? "text-5xl font-bold tracking-tight" : "sr-only"}>
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">{creatorStore?.store_name || 'Creator Store'}</span>
              </h1>
              
              {creatorStore?.store_description && (
                <p className="mt-4 text-white text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto px-2">{creatorStore?.store_description}</p>
              )}
              
              {creatorStore?.social_links && Object.values(creatorStore?.social_links).some(link => link) && (
                <div className="mt-6 sm:mt-8 flex space-x-4 sm:space-x-6 justify-center">
                  {creatorStore?.social_links.twitter && (
                    <a 
                      href={`https://twitter.com/${creatorStore?.social_links.twitter}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-opacity-80 transition-opacity"
                    >
                      <Twitter className="h-5 w-5 sm:h-7 sm:w-7" />
                    </a>
                  )}
                  {creatorStore?.social_links.instagram && (
                    <a 
                      href={`https://instagram.com/${creatorStore?.social_links.instagram}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-opacity-80 transition-opacity"
                    >
                      <Instagram className="h-5 w-5 sm:h-7 sm:w-7" />
                    </a>
                  )}
                  {creatorStore?.social_links.youtube && (
                    <a 
                      href={creatorStore?.social_links.youtube}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-opacity-80 transition-opacity"
                    >
                      <Youtube className="h-5 w-5 sm:h-7 sm:w-7" />
                    </a>
                  )}
                  {creatorStore?.social_links.website && (
                    <a 
                      href={creatorStore?.social_links.website}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-opacity-80 transition-opacity"
                    >
                      <Globe className="h-5 w-5 sm:h-7 sm:w-7" />
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {!session && (
              <div className="mt-6 sm:mt-10">
                <Button
                  size="md"
                  className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white
                  shadow-lg hover:shadow-purple-500/20 transition-all duration-300 font-semibold px-4 sm:px-8 py-2 text-sm sm:text-base"
                  leftIcon={<LogIn className="h-5 w-5" />}
                  onClick={handleSignup}
                >
                  Join This Store
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 lg:px-8">
          {/* Only show back button on product page, not on store homepage */}
          {location.pathname !== `/store/${creatorId}` && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-6"
              leftIcon={<ChevronLeft className="h-4 w-4" />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          )}

          {products.length === 0 ? (
            <div className="text-center py-16 border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-sm">
              <h2 className="text-lg font-medium">No products available</h2>
              <p className="mt-1 text-sm text-gray-400">
                This creator hasn't published any products yet.
              </p>
            </div>
          ) : (
            <>
              {/* Render product rows based on theme settings */}
              {themeSettings.productRows && themeSettings.productRows.length > 0 ? (
                // Sort rows by sortOrder
                themeSettings.productRows
                  .filter(row => row.visible)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((row, index) => {
                    // Get products for this row
                    let rowProducts: Product[] = [];
                    
                    switch (row.type) {
                      case 'featured':
                        rowProducts = products.filter(product => product.featured);
                        break;
                      case 'all':
                        rowProducts = [...products];
                        break;
                      case 'new':
                        // Sort by creation date and take the newest
                        rowProducts = [...products].sort((a, b) => 
                          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        );
                        break;
                      case 'custom':
                        // Filter by specific product IDs
                        if (row.productIds && row.productIds.length > 0) {
                          rowProducts = products.filter(product => 
                            row.productIds?.includes(product.id)
                          );
                        }
                        break;
                    }
                    
                    // Apply limit if specified
                    if (row.limit && row.limit > 0) {
                      rowProducts = rowProducts.slice(0, row.limit);
                    }
                    
                    // Only render row if it has products
                    if (rowProducts.length === 0) return null;
                    
                    return (
                      <div key={row.id} className={index > 0 ? "mt-20" : ""}>
                        <h2 className="text-3xl font-bold mb-8 text-white" id={row.id}>{row.title}</h2>
                        <div className={`mt-4 sm:mt-6 grid grid-cols-1 gap-y-6 sm:gap-y-10 gap-x-4 sm:gap-x-8 sm:grid-cols-2 ${
                          themeSettings.layout === 'grid' ? 'lg:grid-cols-4 xl:grid-cols-5' : 
                          themeSettings.layout === 'minimal' ? 'lg:grid-cols-2 xl:grid-cols-3' : 
                          'lg:grid-cols-3 xl:grid-cols-4'
                        }`}>
                          {rowProducts.map((product) => (
                            <ProductCard 
                              key={product.id} 
                              product={product} 
                              onAdd={handleAddToCart} 
                              onView={viewProductDetails}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
              ) : (
                // Fallback to default layout if no product rows defined
                <>
                  {products.some(product => product.featured) && (themeSettings.showFeaturedProducts !== false) && (
                    <>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-8 text-white" id="featured">Featured Products</h2>
                      <div className="mt-3 sm:mt-4 md:mt-6 grid grid-cols-1 gap-y-4 sm:gap-y-6 md:gap-y-10 gap-x-3 sm:gap-x-4 md:gap-x-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products
                          .filter(product => product.featured)
                          .map((product) => (
                            <ProductCard 
                              key={product.id} 
                              product={product} 
                              onAdd={handleAddToCart} 
                              onView={viewProductDetails}
                            />
                          ))
                        }
                      </div>
                    </>
                  )}
                  
                  <h2 className="mt-20 text-3xl font-bold mb-8 text-white" id="products">All Products</h2>
                  <div className={`mt-6 grid grid-cols-1 gap-y-6 sm:gap-y-10 gap-x-4 sm:gap-x-8 sm:grid-cols-2 ${
                    themeSettings.layout === 'grid' ? 'lg:grid-cols-4 xl:grid-cols-5' : 
                    themeSettings.layout === 'minimal' ? 'lg:grid-cols-2 xl:grid-cols-3' : 
                    'lg:grid-cols-3 xl:grid-cols-4'
                  }`}>
                    {products.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAdd={handleAddToCart} 
                        onView={viewProductDetails}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          </div>
        </div>
    </div>
  );
};

// Helper function to determine if a color is dark
function isColorDark(color: string): boolean {
  if (!color) return true; // Default to dark if no color provided
  
  // Remove the # if it exists
  color = color.replace('#', '');
  
  // Parse the color
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Calculate the brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return true if the color is dark
  return brightness < 128;
}