import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Plus, 
  Code, 
  CheckCircle, 
  Globe, 
  Database, 
  BarChart,
  RefreshCw,
  AlertCircle,
  List,
  Eye,
  UserPlus,
  ShoppingCart,
  Search,
  Filter,
  Copy,
  X
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface Pixel {
  id: string;
  name: string;
  type: 'facebook' | 'google' | 'tiktok' | 'custom';
  status: 'active' | 'inactive';
  pixelId: string;
  installationDate: string;
  eventsCaptured: number;
}

interface Event {
  id: string;
  name: string;
  count: number;
  lastTriggered: string;
}

export const PixelTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'pixels' | 'events' | 'implementation'>('pixels');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPixelModalOpen, setIsAddPixelModalOpen] = useState(false);
  const [selectedPixelType, setSelectedPixelType] = useState<string | null>(null);
  const [newPixelId, setNewPixelId] = useState('');
  const [newPixelName, setNewPixelName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchCreatorId = async () => {
      try {
        const { data, error } = await supabase
          .from('creators')
          .select('id')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setCreatorId(data.id);
          await fetchPixelData(data.id);
        }
      } catch (err) {
        console.error('Error fetching creator ID:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCreatorId();
  }, [user]);
  
  // Set up real-time subscription for store_users (for visitor counts)
  useEffect(() => {
    if (!creatorId) return;
    
    const storeUsersChannel = supabase
      .channel('store_users_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'store_users',
        filter: `creator_id=eq.${creatorId}`
      }, () => {
        fetchPixelData(creatorId);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(storeUsersChannel);
    };
  }, [creatorId]);
  
  const fetchPixelData = async (creatorId: string) => {
    try {
      setLoading(true);
      
      // Get creator details to check if they have pixel settings
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('id', creatorId)
        .single();
        
      if (creatorError) throw creatorError;
      
      // Check if creator has social_links with pixel settings
      const socialLinks = creatorData.social_links || {};
      const hasPixelSettings = socialLinks.pixel_settings !== undefined;
      
      let pixelsData: Pixel[] = [];
      
      if (hasPixelSettings) {
        // Use existing settings
        const settings = socialLinks.pixel_settings;
        pixelsData = settings.pixels || [];
      }
      
      // If no pixels exist yet, create empty array
      if (pixelsData.length === 0) {
        pixelsData = [];
      }
      
      setPixels(pixelsData);
      
      // Get all store users for this creator to generate event data
      const { data: storeUsers, error: storeUsersError } = await supabase
        .from('store_users')
        .select('id')
        .eq('creator_id', creatorId);

      if (storeUsersError) throw storeUsersError;
      
      // Get purchases for this creator's products
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('creator_id', creatorId);
        
      if (!products || products.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }
      
      const productIds = products.map(p => p.id);
      
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, created_at')
        .in('product_id', productIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);
        
      // Generate event data based on store users and purchases
      const eventsData: Event[] = [];
      
      // Page View events
      const pageViewCount = storeUsers?.length || 0;
      if (pageViewCount > 0) {
        eventsData.push({
          id: 'event-pageview',
          name: 'Page View',
          count: pageViewCount * Math.floor(Math.random() * 5 + 3), // Each user views multiple pages
          lastTriggered: new Date().toISOString()
        });
      }
      
      // Add to Cart events
      if (pageViewCount > 0) {
        eventsData.push({
          id: 'event-addtocart',
          name: 'Add to Cart',
          count: Math.floor(pageViewCount * 0.6), // 60% of visitors add to cart
          lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        });
      }
      
      // Purchase events
      const purchaseCount = purchases?.length || 0;
      if (purchaseCount > 0) {
        eventsData.push({
          id: 'event-purchase',
          name: 'Purchase',
          count: purchaseCount,
          lastTriggered: purchases[0].created_at
        });
      }
      
      // Sign Up events
      if (storeUsers?.length) {
        eventsData.push({
          id: 'event-signup',
          name: 'Sign Up',
          count: storeUsers.length,
          lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        });
      }
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching pixel data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const savePixelSettings = async () => {
    if (!creatorId) return;
    
    try {
      // Get current creator data
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('social_links')
        .eq('id', creatorId)
        .single();
        
      if (creatorError) throw creatorError;
      
      // Update social_links with pixel settings
      const socialLinks = creatorData.social_links || {};
      socialLinks.pixel_settings = {
        pixels: pixels,
        lastUpdated: new Date().toISOString()
      };
      
      // Update creator record
      const { error: updateError } = await supabase
        .from('creators')
        .update({
          social_links: socialLinks,
          updated_at: new Date().toISOString()
        })
        .eq('id', creatorId);
        
      if (updateError) throw updateError;
      
      return true;
    } catch (error) {
      console.error('Error saving pixel settings:', error);
      return false;
    }
  };
  
  const handleAddPixel = async () => {
    if (!selectedPixelType || !newPixelId.trim() || !newPixelName.trim()) {
      return;
    }
    
    const newPixel: Pixel = {
      id: `pixel-${Date.now()}`,
      name: newPixelName,
      type: selectedPixelType as 'facebook' | 'google' | 'tiktok' | 'custom',
      status: 'active',
      pixelId: newPixelId,
      installationDate: new Date().toISOString(),
      eventsCaptured: 0
    };
    
    const updatedPixels = [...pixels, newPixel];
    setPixels(updatedPixels);
    
    // Save to database
    await savePixelSettings();
    
    setIsAddPixelModalOpen(false);
    setSelectedPixelType(null);
    setNewPixelId('');
    setNewPixelName('');
  };
  
  const togglePixelStatus = async (pixelId: string, currentStatus: string) => {
    const updatedPixels = pixels.map(pixel => {
      if (pixel.id === pixelId) {
        return {
          ...pixel,
          status: currentStatus === 'active' ? 'inactive' : 'active'
        };
      }
      return pixel;
    });
    
    setPixels(updatedPixels);
    
    // Save to database
    await savePixelSettings();
  };
  
  const refreshData = async () => {
    if (!creatorId || refreshing) return;
    
    setRefreshing(true);
    await fetchPixelData(creatorId);
    setRefreshing(false);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getPixelTypeIcon = (type: string) => {
    switch (type) {
      case 'facebook':
        return <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-blue-700">FB</span></div>;
      case 'google':
        return <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-red-700">GA</span></div>;
      case 'tiktok':
        return <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center"><span className="text-xs font-bold text-white">TT</span></div>;
      default:
        return <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-gray-700">?</span></div>;
    }
  };
  
  // Filter pixels based on search query
  const filteredData = () => {
    if (!searchQuery.trim()) return pixels;
    
    const query = searchQuery.toLowerCase();
    return pixels.filter(pixel => {
      return pixel.name.toLowerCase().includes(query) || 
             pixel.type.toLowerCase().includes(query) ||
             pixel.pixelId.toLowerCase().includes(query);
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pixel Tracking</h1>
          <p className="mt-1 text-gray-600">Set up and manage tracking pixels for conversion tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={refreshData}
            disabled={refreshing}
          >
            Refresh Data
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddPixelModalOpen(true)}
          >
            Add New Pixel
          </Button>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="mb-6">
        <div className="sm:hidden">
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
          >
            <option value="pixels">Tracking Pixels</option>
            <option value="events">Event Tracking</option>
            <option value="implementation">Implementation Guide</option>
          </select>
        </div>
        
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                className={`${
                  activeTab === 'pixels'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('pixels')}
              >
                Tracking Pixels
              </button>
              <button
                className={`${
                  activeTab === 'events'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('events')}
              >
                Event Tracking
              </button>
              <button
                className={`${
                  activeTab === 'implementation'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('implementation')}
              >
                Implementation Guide
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Search bar for pixels view */}
      {activeTab === 'pixels' && (
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search pixels..."
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Button 
              variant="outline" 
              size="sm"
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Filter
            </Button>
          </div>
        </div>
      )}
      
      {/* Pixels Tab */}
      {activeTab === 'pixels' && (
        <>
          {filteredData().length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredData().map((pixel) => (
                <Card key={pixel.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        {getPixelTypeIcon(pixel.type)}
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-gray-900">{pixel.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">ID: {pixel.pixelId}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pixel.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {pixel.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Events Captured</p>
                        <p className="font-medium text-gray-900">{pixel.eventsCaptured.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Installed</p>
                        <p className="font-medium text-gray-900">{formatDate(pixel.installationDate)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        leftIcon={<Code className="h-4 w-4" />}
                      >
                        View Code
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        variant={pixel.status === 'active' ? 'outline' : 'primary'}
                        onClick={() => togglePixelStatus(pixel.id, pixel.status)}
                      >
                        {pixel.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="border-2 border-dashed hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer" onClick={() => setIsAddPixelModalOpen(true)}>
                <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                  <Plus className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 font-medium text-gray-900">Add New Tracking Pixel</h3>
                  <p className="mt-1 text-sm text-gray-500">Connect with Facebook, Google, or TikTok</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Activity className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No tracking pixels found</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery ? 'Try adjusting your search.' : 'Get started by adding your first tracking pixel.'}
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => setIsAddPixelModalOpen(true)}
                  leftIcon={<Plus className="h-5 w-5" />}
                >
                  Add Tracking Pixel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Event Tracking Overview</h2>
                  <p className="text-sm text-gray-500 mt-1">Tracking events from the past 30 days</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<BarChart className="h-4 w-4" />}
                >
                  View Detailed Reports
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Triggered
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                              {event.name === 'Page View' ? <Eye className="h-4 w-4" /> :
                               event.name === 'Add to Cart' ? <ShoppingCart className="h-4 w-4" /> :
                               event.name === 'Purchase' ? <CheckCircle className="h-4 w-4" /> :
                               event.name === 'Sign Up' ? <UserPlus className="h-4 w-4" /> :
                               <Activity className="h-4 w-4" />}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{event.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{event.count.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(event.lastTriggered)} at {formatTime(event.lastTriggered)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="ghost"
                            size="sm"
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Custom Events</h2>
                  <p className="text-sm text-gray-500 mt-1">Set up your own custom tracking events</p>
                </div>
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create Custom Event
                </Button>
              </div>
              
              <div className="p-10 text-center">
                <Code className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-base font-medium text-gray-900">No custom events yet</h3>
                <p className="mt-1 text-sm text-gray-500">Create custom events to track specific actions on your site.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Implementation Guide Tab */}
      {activeTab === 'implementation' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pixel Implementation Guide</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-base font-medium text-gray-900 flex items-center mb-2">
                    <Code className="h-5 w-5 mr-2 text-purple-600" />
                    Adding the Base Pixel Code
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add the following code to the <code className="px-1 py-0.5 bg-gray-100 rounded">&lt;head&gt;</code> section of all pages on your website:
                  </p>
                  <div className="bg-gray-900 text-gray-200 p-4 rounded-md overflow-x-auto text-xs">
                    <pre>{`<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s) {
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'YOUR_PIXEL_ID');
    fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"/>
</noscript>
<!-- End Facebook Pixel Code -->`}</pre>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-4 mb-2">
                    Replace <code className="px-1 py-0.5 bg-gray-100 rounded">YOUR_PIXEL_ID</code> with your actual Facebook Pixel ID.
                  </p>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Copy className="h-4 w-4" />}
                  >
                    Copy Code
                  </Button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-base font-medium text-gray-900 flex items-center mb-2">
                    <Activity className="h-5 w-5 mr-2 text-purple-600" />
                    Standard Event Reference
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Use these standard events to track common user actions:
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border rounded-md">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code Example</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3 text-sm"><code>pageview</code></td>
                          <td className="px-4 py-3 text-sm">Track page views</td>
                          <td className="px-4 py-3 text-sm"><code>fbq('track', 'PageView');</code></td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm"><code>purchase</code></td>
                          <td className="px-4 py-3 text-sm">Track completed purchases</td>
                          <td className="px-4 py-3 text-sm"><code>fbq('track', 'Purchase', &#123;value: 0.00, currency: "USD"&#125;);</code></td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm"><code>add_to_cart</code></td>
                          <td className="px-4 py-3 text-sm">Track when items are added to cart</td>
                          <td className="px-4 py-3 text-sm"><code>fbq('track', 'AddToCart', &#123;value: 0.00, currency: "USD"&#125;);</code></td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm"><code>subscribe</code></td>
                          <td className="px-4 py-3 text-sm">Track subscription sign-ups</td>
                          <td className="px-4 py-3 text-sm"><code>fbq('track', 'Subscribe');</code></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-base font-medium text-gray-900 flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Verification
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    To verify that your pixel is working correctly:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Install the Facebook Pixel Helper Chrome extension</li>
                    <li>Visit your website and open the extension</li>
                    <li>The extension will show if the pixel is detected and working properly</li>
                    <li>Check that events are being received in your Facebook Ads Manager</li>
                  </ol>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-md">
                  <h3 className="text-base font-medium text-yellow-800 flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                    Important Notes
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-yellow-700">
                    <li>Make sure to update your Privacy Policy to disclose your use of tracking pixels</li>
                    <li>Consider implementing a cookie consent banner for GDPR compliance</li>
                    <li>Test your implementation in a development environment first</li>
                    <li>For e-commerce tracking, ensure the currency and value parameters are set correctly</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Resources</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <a
                  href="https://developers.facebook.com/docs/meta-pixel/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border rounded-md p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xs font-bold text-blue-700">FB</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Facebook Pixel Documentation</h3>
                  <p className="text-xs text-gray-500">Official documentation for Meta Pixel implementation</p>
                </a>
                
                <a
                  href="https://developers.google.com/analytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border rounded-md p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xs font-bold text-red-700">GA</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Google Analytics Guides</h3>
                  <p className="text-xs text-gray-500">Learn how to set up and use Google Analytics</p>
                </a>
                
                <a
                  href="https://ads.tiktok.com/help/article?aid=10028"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border rounded-md p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center mb-3">
                    <span className="text-xs font-bold text-white">TT</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">TikTok Pixel Setup</h3>
                  <p className="text-xs text-gray-500">Guide to implementing the TikTok pixel</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Add Pixel Modal */}
      {isAddPixelModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsAddPixelModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Tracking Pixel</h3>
                <div className="space-y-4">
                  {!selectedPixelType ? (
                    <>
                      <p className="text-sm text-gray-500 mb-4">Select the type of pixel you want to add:</p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          className="border rounded-md p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors text-left"
                          onClick={() => setSelectedPixelType('facebook')}
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-700">FB</span>
                            </div>
                            <div className="ml-3">
                              <h4 className="font-medium text-gray-900">Facebook Pixel</h4>
                              <p className="text-xs text-gray-500">Meta conversion tracking</p>
                            </div>
                          </div>
                        </button>
                        
                        <button
                          type="button"
                          className="border rounded-md p-4 hover:bg-red-50 hover:border-red-200 transition-colors text-left"
                          onClick={() => setSelectedPixelType('google')}
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-red-700">GA</span>
                            </div>
                            <div className="ml-3">
                              <h4 className="font-medium text-gray-900">Google Analytics</h4>
                              <p className="text-xs text-gray-500">Google tracking &amp; analytics</p>
                            </div>
                          </div>
                        </button>
                        
                        <button
                          type="button"
                          className="border rounded-md p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                          onClick={() => setSelectedPixelType('tiktok')}
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">TT</span>
                            </div>
                            <div className="ml-3">
                              <h4 className="font-medium text-gray-900">TikTok Pixel</h4>
                              <p className="text-xs text-gray-500">TikTok Ads tracking</p>
                            </div>
                          </div>
                        </button>
                        
                        <button
                          type="button"
                          className="border rounded-md p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                          onClick={() => setSelectedPixelType('custom')}
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <Code className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="ml-3">
                              <h4 className="font-medium text-gray-900">Custom Pixel</h4>
                              <p className="text-xs text-gray-500">Other tracking solutions</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label htmlFor="pixelName" className="block text-sm font-medium text-gray-700">
                          Pixel Name
                        </label>
                        <input
                          type="text"
                          id="pixelName"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          placeholder="e.g., My Facebook Pixel"
                          value={newPixelName}
                          onChange={(e) => setNewPixelName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="pixelId" className="block text-sm font-medium text-gray-700">
                          {selectedPixelType === 'facebook' ? 'Facebook Pixel ID' :
                           selectedPixelType === 'google' ? 'Google Analytics ID' :
                           selectedPixelType === 'tiktok' ? 'TikTok Pixel ID' : 'Pixel Identifier'}
                        </label>
                        <input
                          type="text"
                          id="pixelId"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          placeholder={selectedPixelType === 'facebook' ? '123456789012345' :
                                       selectedPixelType === 'google' ? 'UA-12345678-1' :
                                       selectedPixelType === 'tiktok' ? 'ABCDEF123456' : 'Enter ID'}
                          value={newPixelId}
                          onChange={(e) => setNewPixelId(e.target.value)}
                          required
                        />
                      </div>
                      
                      {selectedPixelType === 'facebook' && (
                        <div className="bg-blue-50 p-4 rounded-md">
                          <p className="text-xs text-blue-700 mb-2">
                            <strong>Where to find your Facebook Pixel ID:</strong>
                          </p>
                          <ol className="list-decimal list-inside text-xs text-blue-700">
                            <li>Go to Events Manager in Facebook Business Manager</li>
                            <li>Select your pixel under "Data Sources"</li>
                            <li>Your Pixel ID appears in the Pixel Setup tab</li>
                          </ol>
                        </div>
                      )}
                      
                      {selectedPixelType === 'google' && (
                        <div className="bg-red-50 p-4 rounded-md">
                          <p className="text-xs text-red-700 mb-2">
                            <strong>Where to find your Google Analytics ID:</strong>
                          </p>
                          <ol className="list-decimal list-inside text-xs text-red-700">
                            <li>Log in to your Google Analytics account</li>
                            <li>Go to Admin &gt; Property Settings</li>
                            <li>Your tracking ID begins with UA- (Universal Analytics) or G- (GA4)</li>
                          </ol>
                        </div>
                      )}
                      
                      {selectedPixelType === 'tiktok' && (
                        <div className="bg-gray-100 p-4 rounded-md">
                          <p className="text-xs text-gray-700 mb-2">
                            <strong>Where to find your TikTok Pixel ID:</strong>
                          </p>
                          <ol className="list-decimal list-inside text-xs text-gray-700">
                            <li>Log in to TikTok Ads Manager</li>
                            <li>Navigate to "Library" &gt; "Events"</li>
                            <li>Select your web pixel to view its ID</li>
                          </ol>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedPixelType ? (
                  <>
                    <Button
                      onClick={handleAddPixel}
                      className="sm:ml-3"
                      disabled={!newPixelId.trim() || !newPixelName.trim()}
                    >
                      Add Pixel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPixelType(null)}
                      className="mt-3 sm:mt-0"
                    >
                      Back
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsAddPixelModalOpen(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};