import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Palette, Image, Upload, Trash, Check, X, Sun, Moon, Layout, Type, Grid3X3, Grid2X2, Rows, Columns, Paintbrush, Droplets, Layers, Search, Plus, ArrowUp, ArrowDown, Eye, EyeOff, Edit, Save, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';

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

export const StoreCustomizationPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'theme' | 'layout' | 'media' | 'rows'>('theme');
  const [products, setProducts] = useState<any[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [newRowTitle, setNewRowTitle] = useState('');
  const [newRowType, setNewRowType] = useState<'featured' | 'all' | 'new' | 'custom'>('featured');
  const [newRowLimit, setNewRowLimit] = useState(8);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    theme: 'default',
    primaryColor: '#6366f1',
    accentColor: '#8b5cf6',
    gradient: 'linear-gradient(to right, #6366f1, #8b5cf6)',
    layout: 'standard',
    fontSize: 'medium',
    backgroundColor: '#000000',
    darkMode: true,
    showFeaturedProducts: true,
    productRows: []
  });
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  
  // Media upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false);
  const [uploadingHeaderVideo, setUploadingHeaderVideo] = useState(false);
  const [uploadingBackgroundImage, setUploadingBackgroundImage] = useState(false);
  const [uploadingDisplayImage, setUploadingDisplayImage] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchCreatorData = async () => {
      try {
        // Get creator ID
        const { data: creatorData, error: creatorError } = await supabase
          .from('creators')
          .select('id, theme_settings')
          .eq('user_id', user.id)
          .single();
          
        if (creatorError) throw creatorError;
        
        if (creatorData) {
          setCreatorId(creatorData.id);
          
          // Parse theme settings if available
          if (creatorData.theme_settings) {
            const settings = typeof creatorData.theme_settings === 'string'
              ? JSON.parse(creatorData.theme_settings)
              : creatorData.theme_settings;
              
            setThemeSettings(settings);
            setProductRows(settings.productRows || []);
          }
        }
      } catch (err) {
        console.error('Error parsing theme settings:', err);
        setError('Failed to load theme settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCreatorData();
  }, [user]);

  // Fetch products for the creator
  useEffect(() => {
    if (!creatorId) return;

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, thumbnail, type, featured, published_at')
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false });

        if (!error && data) setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, [creatorId]);

  const handleSave = async () => {
    if (!creatorId) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    const settings = {
      ...themeSettings,
      productRows
    };

    try {
      const { error } = await supabase
        .from('creators')
        .update({
          theme_settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', creatorId);
        
      if (error) throw error;
      
      setSuccess('Your store customization settings have been saved successfully.');
    } catch (err) {
      console.error('Error saving theme settings:', err);
      setError('Failed to save your settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Product row management functions
  const addProductRow = () => {
    if (!newRowTitle.trim()) return;

    const newRow: ProductRow = {
      id: `row-${Date.now()}`,
      title: newRowTitle,
      type: newRowType,
      visible: true,
      limit: newRowLimit,
      sortOrder: productRows.length,
      productIds: newRowType === 'custom' ? selectedProductIds : undefined
    };

    setProductRows([...productRows, newRow]);
    setNewRowTitle('');
    setNewRowType('featured');
    setNewRowLimit(8);
    setSelectedProductIds([]);
    setShowProductSelector(false);
  };

  const updateProductRow = (rowId: string, updates: Partial<ProductRow>) => {
    setProductRows(productRows.map(row => 
      row.id === rowId ? { ...row, ...updates } : row
    ));
  };

  const deleteProductRow = (rowId: string) => {
    setProductRows(productRows.filter(row => row.id !== rowId));
    setEditingRowId(null);
  };

  const moveRowUp = (index: number) => {
    if (index === 0) return;
    
    const newRows = [...productRows];
    [newRows[index - 1], newRows[index]] = [newRows[index], newRows[index - 1]];
    
    // Update sort orders
    newRows.forEach((row, idx) => {
      row.sortOrder = idx;
    });
    
    setProductRows(newRows);
  };

  const moveRowDown = (index: number) => {
    if (index === productRows.length - 1) return;
    
    const newRows = [...productRows];
    [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]];
    
    // Update sort orders
    newRows.forEach((row, idx) => {
      row.sortOrder = idx;
    });
    
    setProductRows(newRows);
  };

  const toggleRowVisibility = (rowId: string) => {
    setProductRows(productRows.map(row => 
      row.id === rowId ? { ...row, visible: !row.visible } : row
    ));
  };

  const toggleRowExpanded = (rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const handleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const startEditingRow = (row: ProductRow) => {
    setEditingRowId(row.id);
    setNewRowTitle(row.title);
    setNewRowType(row.type);
    setNewRowLimit(row.limit || 8);
    setSelectedProductIds(row.productIds || []);
  };

  const saveRowEdits = (rowId: string) => {
    updateProductRow(rowId, { title: newRowTitle, type: newRowType, limit: newRowLimit, productIds: selectedProductIds });
    setEditingRowId(null);
  };

  // Helper function to safely capitalize the first letter of a string
  const capitalizeFirstLetter = (str: string | undefined) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // File upload handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: keyof ThemeSettings, setUploading: (loading: boolean) => void) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !creatorId) return;
    
    const file = files[0];
    setUploading(true);
    
    try {
      // Determine the appropriate storage bucket based on file type
      const bucket = file.type.startsWith('video/') ? 'thumbnails' : 'thumbnails';
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${creatorId}/${type}_${Date.now()}.${fileExt}`;
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
        
      // Update theme settings with the new URL
      setThemeSettings(prev => ({
        ...prev,
        [type]: urlData.publicUrl
      }));
      
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      setError(`Failed to upload ${type}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (type: keyof ThemeSettings) => {
    setThemeSettings(prev => ({
      ...prev,
      [type]: null
    }));
  };

  const updateThemeSetting = (key: keyof ThemeSettings, value: any) => {
    setThemeSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Store Customization</h1>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
      
      <div className="mt-8 space-y-8">
        {/* Tab navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${
                activeTab === 'theme'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              onClick={() => setActiveTab('theme')}
            >
              <Palette className="h-5 w-5 mr-2" />
              Theme
            </button>
            <button
              className={`${
                activeTab === 'layout'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              onClick={() => setActiveTab('layout')}
            >
              <Layout className="h-5 w-5 mr-2" />
              Layout
            </button>
            <button
              className={`${
                activeTab === 'media'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              onClick={() => setActiveTab('media')}
            >
              <Image className="h-5 w-5 mr-2" />
              Media
            </button>
            <button
              className={`${
                activeTab === 'rows'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              onClick={() => setActiveTab('rows')}
            >
              <Rows className="h-5 w-5 mr-2" />
              Product Rows
            </button>
          </nav>
        </div>

        {/* Theme Settings */}
        {activeTab === 'theme' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Theme Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Scheme
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer ${
                        themeSettings.theme === 'default' ? 'ring-2 ring-purple-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateThemeSetting('theme', 'default')}
                    >
                      <div className="h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded mb-2"></div>
                      <p className="text-sm font-medium">Default</p>
                      <p className="text-xs text-gray-500">Purple & Indigo</p>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer ${
                        themeSettings.theme === 'dark' ? 'ring-2 ring-purple-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        updateThemeSetting('theme', 'dark');
                        updateThemeSetting('backgroundColor', '#000000');
                        updateThemeSetting('primaryColor', '#6366f1');
                        updateThemeSetting('accentColor', '#8b5cf6');
                        updateThemeSetting('gradient', 'linear-gradient(to right, #6366f1, #8b5cf6)');
                      }}
                    >
                      <div className="h-8 bg-black rounded mb-2"></div>
                      <p className="text-sm font-medium">Dark</p>
                      <p className="text-xs text-gray-500">Black background</p>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer ${
                        themeSettings.theme === 'light' ? 'ring-2 ring-purple-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        updateThemeSetting('theme', 'light');
                        updateThemeSetting('backgroundColor', '#ffffff');
                        updateThemeSetting('primaryColor', '#6366f1');
                        updateThemeSetting('accentColor', '#8b5cf6');
                        updateThemeSetting('gradient', 'linear-gradient(to right, #6366f1, #8b5cf6)');
                      }}
                    >
                      <div className="h-8 bg-white border rounded mb-2"></div>
                      <p className="text-sm font-medium">Light</p>
                      <p className="text-xs text-gray-500">White background</p>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer ${
                        themeSettings.theme === 'custom' ? 'ring-2 ring-purple-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateThemeSetting('theme', 'custom')}
                    >
                      <div className="h-8 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 rounded mb-2"></div>
                      <p className="text-sm font-medium">Custom</p>
                      <p className="text-xs text-gray-500">Your own colors</p>
                    </div>
                  </div>
                </div>
                
                {themeSettings.theme === 'custom' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
                          Primary Color
                        </label>
                        <div className="flex">
                          <input
                            type="color"
                            id="primaryColor"
                            value={themeSettings.primaryColor || '#6366f1'}
                            onChange={(e) => updateThemeSetting('primaryColor', e.target.value)}
                            className="h-10 w-10 rounded-l-md border border-gray-300"
                          />
                          <input
                            type="text"
                            value={themeSettings.primaryColor || '#6366f1'}
                            onChange={(e) => updateThemeSetting('primaryColor', e.target.value)}
                            className="flex-1 rounded-r-md border border-l-0 border-gray-300 px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700 mb-1">
                          Accent Color
                        </label>
                        <div className="flex">
                          <input
                            type="color"
                            id="accentColor"
                            value={themeSettings.accentColor || '#8b5cf6'}
                            onChange={(e) => updateThemeSetting('accentColor', e.target.value)}
                            className="h-10 w-10 rounded-l-md border border-gray-300"
                          />
                          <input
                            type="text"
                            value={themeSettings.accentColor || '#8b5cf6'}
                            onChange={(e) => updateThemeSetting('accentColor', e.target.value)}
                            className="flex-1 rounded-r-md border border-l-0 border-gray-300 px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="gradient" className="block text-sm font-medium text-gray-700 mb-1">
                        Gradient
                      </label>
                      <input
                        type="text"
                        id="gradient"
                        value={themeSettings.gradient || 'linear-gradient(to right, #6366f1, #8b5cf6)'}
                        onChange={(e) => updateThemeSetting('gradient', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        CSS gradient for buttons and accents (e.g., linear-gradient(to right, #6366f1, #8b5cf6))
                      </p>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer ${
                        !themeSettings.backgroundImage && !themeSettings.backgroundGradient ? 'ring-2 ring-purple-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        updateThemeSetting('backgroundImage', null);
                        updateThemeSetting('backgroundGradient', null);
                      }}
                    >
                      <div className="flex items-center mb-2">
                        <div className="h-8 w-8 bg-gray-900 rounded mr-2"></div>
                        <div>
                          <p className="text-sm font-medium">Solid Color</p>
                          <p className="text-xs text-gray-500">Clean, simple background</p>
                        </div>
                      </div>
                      <div className="flex mt-2">
                        <button 
                          className="flex-1 py-1 text-xs border rounded-l-md bg-black text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateThemeSetting('backgroundColor', '#000000');
                            updateThemeSetting('darkMode', true);
                          }}
                        >
                          Dark
                        </button>
                        <button 
                          className="flex-1 py-1 text-xs border-t border-r border-b rounded-r-md bg-white text-black"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateThemeSetting('backgroundColor', '#ffffff');
                            updateThemeSetting('darkMode', false);
                          }}
                        >
                          Light
                        </button>
                      </div>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer ${
                        themeSettings.backgroundGradient ? 'ring-2 ring-purple-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        updateThemeSetting('backgroundGradient', 'linear-gradient(to bottom right, #111827, #312e81)');
                        updateThemeSetting('backgroundImage', null);
                      }}
                    >
                      <div className="flex items-center mb-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-gray-900 to-indigo-900 rounded mr-2"></div>
                        <div>
                          <p className="text-sm font-medium">Gradient</p>
                          <p className="text-xs text-gray-500">Smooth color transition</p>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={themeSettings.backgroundGradient || 'linear-gradient(to bottom right, #111827, #312e81)'}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateThemeSetting('backgroundGradient', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 w-full text-xs px-2 py-1 border rounded"
                      />
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer ${
                        themeSettings.backgroundImage ? 'ring-2 ring-purple-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => document.getElementById('background-image-upload')?.click()}
                    >
                      <div className="flex items-center mb-2">
                        <div className="h-8 w-8 bg-gray-200 rounded mr-2 flex items-center justify-center">
                          <Image className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Image</p>
                          <p className="text-xs text-gray-500">Custom background image</p>
                        </div>
                      </div>
                      
                      <input
                        id="background-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'backgroundImage', setUploadingBackgroundImage)}
                      />
                      
                      {themeSettings.backgroundImage ? (
                        <div className="relative mt-2 h-12 rounded overflow-hidden">
                          <img 
                            src={themeSettings.backgroundImage} 
                            alt="Background" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile('backgroundImage');
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 border border-dashed rounded p-2 text-center">
                          <p className="text-xs text-gray-500">
                            {uploadingBackgroundImage ? 'Uploading...' : 'Click to upload'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Typography
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="headingFont" className="block text-sm font-medium text-gray-700 mb-1">
                        Heading Font
                      </label>
                      <select
                        id="headingFont"
                        value={themeSettings.headingFont || ''}
                        onChange={(e) => updateThemeSetting('headingFont', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      >
                        <option value="">Default</option>
                        <option value="'Poppins'">Poppins</option>
                        <option value="'Montserrat'">Montserrat</option>
                        <option value="'Playfair Display'">Playfair Display</option>
                        <option value="'Roboto'">Roboto</option>
                        <option value="'Open Sans'">Open Sans</option>
                        <option value="'Lato'">Lato</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="bodyFont" className="block text-sm font-medium text-gray-700 mb-1">
                        Body Font
                      </label>
                      <select
                        id="bodyFont"
                        value={themeSettings.bodyFont || ''}
                        onChange={(e) => updateThemeSetting('bodyFont', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      >
                        <option value="">Default</option>
                        <option value="'Roboto'">Roboto</option>
                        <option value="'Open Sans'">Open Sans</option>
                        <option value="'Lato'">Lato</option>
                        <option value="'Nunito'">Nunito</option>
                        <option value="'Source Sans Pro'">Source Sans Pro</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Size
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={themeSettings.fontSize === 'small'}
                        onChange={() => updateThemeSetting('fontSize', 'small')}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Small</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={themeSettings.fontSize === 'medium' || !themeSettings.fontSize}
                        onChange={() => updateThemeSetting('fontSize', 'medium')}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Medium</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={themeSettings.fontSize === 'large'}
                        onChange={() => updateThemeSetting('fontSize', 'large')}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Large</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="customCss" className="block text-sm font-medium text-gray-700 mb-1">
                    Custom CSS (Advanced)
                  </label>
                  <textarea
                    id="customCss"
                    value={themeSettings.customCss || ''}
                    onChange={(e) => updateThemeSetting('customCss', e.target.value)}
                    rows={5}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm font-mono"
                    placeholder="/* Add your custom CSS here */"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    For advanced users. Add custom CSS to further customize your store's appearance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Layout Settings */}
        {activeTab === 'layout' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Layout Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Layout
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer ${
                        themeSettings.layout === 'standard' || !themeSettings.layout ? 'ring-2 ring-purple-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateThemeSetting('layout', 'standard')}
                    >
                      <div className="flex items-center mb-2">
                        <Grid3X3 className="h-5 w-5 text-gray-400 mr-2" />
                        <p className="text-sm font-medium">Standard</p>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="aspect-square bg-gray-200 rounded"></div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">3 products per row (desktop)</p>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer ${
                        themeSettings.layout === 'grid' ? 'ring-2 ring-purple-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateThemeSetting('layout', 'grid')}
                    >
                      <div className="flex items-center mb-2">
                        <Grid2X2 className="h-5 w-5 text-gray-400 mr-2" />
                        <p className="text-sm font-medium">Grid</p>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="aspect-square bg-gray-200 rounded"></div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">4 products per row (desktop)</p>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer ${
                        themeSettings.layout === 'minimal' ? 'ring-2 ring-purple-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateThemeSetting('layout', 'minimal')}
                    >
                      <div className="flex items-center mb-2">
                        <Columns className="h-5 w-5 text-gray-400 mr-2" />
                        <p className="text-sm font-medium">Minimal</p>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="aspect-square bg-gray-200 rounded"></div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">2 products per row (desktop)</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Options
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={themeSettings.showFeaturedProducts !== false}
                        onChange={(e) => updateThemeSetting('showFeaturedProducts', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show Featured Products Section</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={themeSettings.showFilters === true}
                        onChange={(e) => updateThemeSetting('showFilters', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show Product Filters</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="productsPerPage" className="block text-sm font-medium text-gray-700 mb-1">
                    Products Per Page
                  </label>
                  <input
                    type="number"
                    id="productsPerPage"
                    value={themeSettings.productsPerPage || 12}
                    onChange={(e) => updateThemeSetting('productsPerPage', parseInt(e.target.value) || 12)}
                    min="4"
                    max="48"
                    step="4"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Number of products to display per page (if pagination is enabled)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media Settings */}
        {activeTab === 'media' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Media Settings</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Logo
                    </label>
                    <div className="border rounded-lg p-4">
                      {themeSettings.storeLogo ? (
                        <div className="relative">
                          <img 
                            src={themeSettings.storeLogo} 
                            alt="Store Logo" 
                            className="h-16 object-contain mx-auto"
                          />
                          <button
                            onClick={() => handleRemoveFile('storeLogo')}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="mt-3">
                            <label
                              htmlFor="logo-upload"
                              className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                            >
                              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                            </label>
                            <input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, 'storeLogo', setUploadingLogo)}
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Favicon
                    </label>
                    <div className="border rounded-lg p-4">
                      {themeSettings.storeFavicon ? (
                        <div className="relative">
                          <img 
                            src={themeSettings.storeFavicon} 
                            alt="Favicon" 
                            className="h-16 object-contain mx-auto"
                          />
                          <button
                            onClick={() => handleRemoveFile('storeFavicon')}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="mt-3">
                            <label
                              htmlFor="favicon-upload"
                              className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                            >
                              {uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}
                            </label>
                            <input
                              id="favicon-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, 'storeFavicon', setUploadingFavicon)}
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">PNG, ICO, SVG recommended</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header Background
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Header Image
                      </label>
                      <div className="border rounded-lg p-4">
                        {themeSettings.storeHeaderImage ? (
                          <div className="relative">
                            <img 
                              src={themeSettings.storeHeaderImage} 
                              alt="Header" 
                              className="h-32 w-full object-cover rounded"
                            />
                            <button
                              onClick={() => handleRemoveFile('storeHeaderImage')}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="mx-auto h-32 w-full flex items-center justify-center rounded bg-gray-100">
                              <Image className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="mt-3">
                              <label
                                htmlFor="header-image-upload"
                                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                              >
                                {uploadingHeaderImage ? 'Uploading...' : 'Upload Header Image'}
                              </label>
                              <input
                                id="header-image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'storeHeaderImage', setUploadingHeaderImage)}
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Recommended size: 1920x600px</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Header Video
                      </label>
                      <div className="border rounded-lg p-4">
                        {themeSettings.headerVideo ? (
                          <div className="relative">
                            <video 
                              src={themeSettings.headerVideo} 
                              className="h-32 w-full object-cover rounded"
                              controls
                            />
                            <button
                              onClick={() => handleRemoveFile('headerVideo')}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="mx-auto h-32 w-full flex items-center justify-center rounded bg-gray-100">
                              <Video className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="mt-3">
                              <label
                                htmlFor="header-video-upload"
                                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                              >
                                {uploadingHeaderVideo ? 'Uploading...' : 'Upload Header Video'}
                              </label>
                              <input
                                id="header-video-upload"
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'headerVideo', setUploadingHeaderVideo)}
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">MP4 format, max 50MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Image
                  </label>
                  <div className="border rounded-lg p-4">
                    {themeSettings.displayImage ? (
                      <div className="relative">
                        <img 
                          src={themeSettings.displayImage} 
                          alt="Profile" 
                          className="h-32 w-32 object-cover rounded-full mx-auto"
                        />
                        <button
                          onClick={() => handleRemoveFile('displayImage')}
                          className="absolute top-0 right-1/2 transform translate-x-12 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto h-32 w-32 flex items-center justify-center rounded-full bg-gray-100">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="mt-3">
                          <label
                            htmlFor="profile-image-upload"
                            className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                          >
                            {uploadingDisplayImage ? 'Uploading...' : 'Upload Profile Image'}
                          </label>
                          <input
                            id="profile-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'displayImage', setUploadingDisplayImage)}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Square image recommended</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Rows */}
        {activeTab === 'rows' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Rows</h2>
              <p className="text-sm text-gray-600 mb-6">
                Customize how products are displayed on your store page.
              </p>

              {/* Existing rows */}
              {productRows.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {productRows.map((row, index) => (
                    <div key={row.id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-4 bg-gray-50">
                        <div className="flex items-center">
                          <button 
                            onClick={() => toggleRowExpanded(row.id)}
                            className="mr-2 text-gray-500 hover:text-gray-700"
                          >
                            {expandedRows[row.id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </button>
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium text-gray-900">{row.title}</h3>
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${row.visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {row.visible ? 'Visible' : 'Hidden'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Type: {capitalizeFirstLetter(row.type)}
                              {row.limit ? ` • Limit: ${row.limit} products` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => toggleRowVisibility(row.id)}
                            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            title={row.visible ? "Hide row" : "Show row"}
                          >
                            {row.visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                          <button 
                            onClick={() => moveRowUp(index)}
                            disabled={index === 0}
                            className={`p-1 rounded-md ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                            title="Move up"
                          >
                            <ArrowUp className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => moveRowDown(index)}
                            disabled={index === productRows.length - 1}
                            className={`p-1 rounded-md ${index === productRows.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                            title="Move down"
                          >
                            <ArrowDown className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => startEditingRow(row)}
                            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            title="Edit row"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => deleteProductRow(row.id)}
                            className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-100"
                            title="Delete row"
                          >
                            <Trash className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded row details */}
                      {expandedRows[row.id] && (
                        <div className="p-4 border-t">
                          {editingRowId === row.id ? (
                            <div className="space-y-4">
                              <div>
                                <label htmlFor={`row-title-${row.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                  Row Title
                                </label>
                                <input
                                  type="text"
                                  id={`row-title-${row.id}`}
                                  value={newRowTitle}
                                  onChange={(e) => setNewRowTitle(e.target.value)}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor={`row-type-${row.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                  Row Type
                                </label>
                                <select
                                  id={`row-type-${row.id}`}
                                  value={newRowType}
                                  onChange={(e) => setNewRowType(e.target.value as any)}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                >
                                  <option value="featured">Featured Products</option>
                                  <option value="all">All Products</option>
                                  <option value="new">New Arrivals</option>
                                  <option value="custom">Custom Selection</option>
                                </select>
                              </div>
                              
                              <div>
                                <label htmlFor={`row-limit-${row.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                  Product Limit
                                </label>
                                <input
                                  type="number"
                                  id={`row-limit-${row.id}`}
                                  value={newRowLimit}
                                  onChange={(e) => setNewRowLimit(parseInt(e.target.value) || 0)}
                                  min="0"
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  Set to 0 for unlimited products
                                </p>
                              </div>
                              
                              {newRowType === 'custom' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Products
                                  </label>
                                  <div className="border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
                                    {products.length > 0 ? (
                                      products
                                        .filter(product => product.published_at)
                                        .map(product => (
                                          <div key={product.id} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                                            <input
                                              type="checkbox"
                                              id={`product-${product.id}`}
                                              checked={selectedProductIds.includes(product.id)}
                                              onChange={() => handleProductSelection(product.id)}
                                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor={`product-${product.id}`} className="ml-3 flex items-center cursor-pointer">
                                              {product.thumbnail ? (
                                                <img src={product.thumbnail} alt={product.name} className="h-8 w-8 object-cover rounded" />
                                              ) : (
                                                <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                                                  <Layers className="h-4 w-4 text-gray-500" />
                                                </div>
                                              )}
                                              <span className="ml-2 text-sm">{product.name}</span>
                                            </label>
                                          </div>
                                        ))
                                    ) : (
                                      <p className="text-sm text-gray-500 text-center py-4">No products available</p>
                                    )}
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {selectedProductIds.length} products selected
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex justify-end space-x-3 pt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingRowId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => saveRowEdits(row.id)}
                                  disabled={!newRowTitle.trim()}
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700">Row Type</h4>
                                  <p className="text-sm text-gray-600">{capitalizeFirstLetter(row.type)}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700">Product Limit</h4>
                                  <p className="text-sm text-gray-600">{row.limit || 'Unlimited'}</p>
                                </div>
                              </div>
                              
                              {row.type === 'custom' && row.productIds && row.productIds.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Products</h4>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {row.productIds.map(productId => {
                                      const product = products.find(p => p.id === productId);
                                      if (!product) return null;
                                      
                                      return (
                                        <div key={productId} className="flex items-center p-2 bg-gray-50 rounded">
                                          {product.thumbnail ? (
                                            <img src={product.thumbnail} alt={product.name} className="h-8 w-8 object-cover rounded" />
                                          ) : (
                                            <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                                              <Layers className="h-4 w-4 text-gray-500" />
                                            </div>
                                          )}
                                          <span className="ml-2 text-xs truncate">{product.name}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg mb-6">
                  <Layers className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">No product rows defined yet</p>
                  <p className="text-xs text-gray-500">Add rows to customize how products appear on your store</p>
                </div>
              )}

              {/* Add new row */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Product Row</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="new-row-title" className="block text-sm font-medium text-gray-700 mb-1">
                      Row Title
                    </label>
                    <input
                      type="text"
                      id="new-row-title"
                      value={newRowTitle}
                      onChange={(e) => setNewRowTitle(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="e.g., New Arrivals, Best Sellers, etc."
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="new-row-type" className="block text-sm font-medium text-gray-700 mb-1">
                      Row Type
                    </label>
                    <select
                      id="new-row-type"
                      value={newRowType}
                      onChange={(e) => {
                        setNewRowType(e.target.value as any);
                        if (e.target.value === 'custom') {
                          setShowProductSelector(true);
                        } else {
                          setShowProductSelector(false);
                        }
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    >
                      <option value="featured">Featured Products</option>
                      <option value="all">All Products</option>
                      <option value="new">New Arrivals</option>
                      <option value="custom">Custom Selection</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="new-row-limit" className="block text-sm font-medium text-gray-700 mb-1">
                      Product Limit
                    </label>
                    <input
                      type="number"
                      id="new-row-limit"
                      value={newRowLimit}
                      onChange={(e) => setNewRowLimit(parseInt(e.target.value) || 0)}
                      min="0"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Set to 0 for unlimited products
                    </p>
                  </div>
                  
                  {newRowType === 'custom' && showProductSelector && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Products
                      </label>
                      <div className="border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
                        {products.length > 0 ? (
                          products
                            .filter(product => product.published_at)
                            .map(product => (
                              <div key={product.id} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                                <input
                                  type="checkbox"
                                  id={`new-product-${product.id}`}
                                  checked={selectedProductIds.includes(product.id)}
                                  onChange={() => handleProductSelection(product.id)}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`new-product-${product.id}`} className="ml-3 flex items-center cursor-pointer">
                                  {product.thumbnail ? (
                                    <img src={product.thumbnail} alt={product.name} className="h-8 w-8 object-cover rounded" />
                                  ) : (
                                    <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                                      <Layers className="h-4 w-4 text-gray-500" />
                                    </div>
                                  )}
                                  <span className="ml-2 text-sm">{product.name}</span>
                                </label>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">No products available</p>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedProductIds.length} products selected
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-3">
                    <Button
                      onClick={addProductRow}
                      disabled={!newRowTitle.trim() || (newRowType === 'custom' && selectedProductIds.length === 0)}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add Row
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Changes */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} isLoading={saving}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};