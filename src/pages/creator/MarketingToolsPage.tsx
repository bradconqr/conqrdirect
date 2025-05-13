import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Users, 
  TrendingUp, 
  Activity, 
  ArrowRight, 
  Zap, 
  Share2, 
  RefreshCw, 
  Bell,
  BarChart, 
  Calendar,
  Layers,
  MegaphoneIcon
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { AnalyticsCard } from '../../components/dashboard/AnalyticsCard';

export const MarketingToolsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [emailStats, setEmailStats] = useState({
    subscribers: 0,
    openRate: 0,
    clickRate: 0
  });
  const [affiliateStats, setAffiliateStats] = useState({
    activeAffiliates: 0,
    totalCommission: 0,
    conversionRate: 0
  });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  
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
          
          // Once we have the creator ID, we can fetch marketing data
          // For now, we'll use mock data
          generateMockData();
        }
      } catch (err) {
        console.error('Error fetching creator ID:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCreatorId();
  }, [user]);
  
  // Function to generate mock data for the demo
  const generateMockData = () => {
    // Mock email statistics
    setEmailStats({
      subscribers: Math.floor(Math.random() * 1000) + 500,
      openRate: Math.floor(Math.random() * 30) + 20,
      clickRate: Math.floor(Math.random() * 15) + 5
    });
    
    // Mock affiliate statistics
    setAffiliateStats({
      activeAffiliates: Math.floor(Math.random() * 50) + 10,
      totalCommission: Math.floor(Math.random() * 5000) + 1000,
      conversionRate: Math.floor(Math.random() * 10) + 2
    });
    
    // Mock recent campaigns
    const campaignTypes = ['Newsletter', 'Product Launch', 'Special Offer', 'Welcome Series', 'Affiliate Promotion'];
    
    const mockCampaigns = Array(4).fill(null).map((_, i) => {
      const daysAgo = i * 3;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      return {
        id: `campaign-${i}`,
        name: `${campaignTypes[i % campaignTypes.length]} Campaign`,
        sentDate: date.toISOString(),
        opens: Math.floor(Math.random() * 500) + 100,
        clicks: Math.floor(Math.random() * 200) + 50,
        status: i === 0 ? 'In Progress' : 'Completed'
      };
    });
    
    setRecentCampaigns(mockCampaigns);
    
    // Mock top performers
    const mockPerformers = [
      {
        id: 'af-1',
        name: 'Jane Smith',
        sales: Math.floor(Math.random() * 50) + 20,
        commission: Math.floor(Math.random() * 1000) + 500,
        conversionRate: Math.floor(Math.random() * 15) + 10
      },
      {
        id: 'af-2',
        name: 'John Doe',
        sales: Math.floor(Math.random() * 40) + 15,
        commission: Math.floor(Math.random() * 800) + 400,
        conversionRate: Math.floor(Math.random() * 10) + 8
      },
      {
        id: 'af-3',
        name: 'Alice Johnson',
        sales: Math.floor(Math.random() * 30) + 10,
        commission: Math.floor(Math.random() * 600) + 300,
        conversionRate: Math.floor(Math.random() * 8) + 5
      }
    ];
    
    setTopPerformers(mockPerformers);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
          <h1 className="text-3xl font-bold text-gray-900">Marketing Tools</h1>
          <p className="mt-1 text-gray-600">Grow your audience and increase your sales with powerful marketing tools</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            leftIcon={<Calendar className="h-4 w-4" />}
            onClick={() => navigate('/creator/marketing/email')}
          >
            Schedule Campaign
          </Button>
          <Button
            leftIcon={<Zap className="h-4 w-4" />}
            onClick={() => navigate('/creator/marketing/email')}
          >
            Create Newsletter
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <AnalyticsCard 
          title="Email Subscribers" 
          value={emailStats.subscribers.toString()}
          change={7.2}
          icon={<Mail className="h-5 w-5 text-purple-700" />}
        />
        <AnalyticsCard 
          title="Email Open Rate" 
          value={`${emailStats.openRate}%`}
          change={2.1}
          icon={<Bell className="h-5 w-5 text-green-600" />}
        />
        <AnalyticsCard 
          title="Affiliate Partners" 
          value={affiliateStats.activeAffiliates.toString()}
          change={12.3}
          icon={<Share2 className="h-5 w-5 text-blue-600" />}
        />
        <AnalyticsCard 
          title="Affiliate Commission" 
          value={formatCurrency(affiliateStats.totalCommission)}
          change={8.5}
          icon={<BarChart className="h-5 w-5 text-orange-600" />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Email Marketing */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Email Marketing</h2>
                  <p className="text-sm text-gray-500">Engage with your audience directly</p>
                </div>
              </div>
              <Button 
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => navigate('/creator/marketing/email')}
              >
                Manage
              </Button>
            </div>
            
            <div className="space-y-4 mb-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Email Performance</h3>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-gray-500">Open Rate</p>
                    <p className="font-medium text-gray-900">{emailStats.openRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Click Rate</p>
                    <p className="font-medium text-gray-900">{emailStats.clickRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Subscribers</p>
                    <p className="font-medium text-gray-900">{emailStats.subscribers}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/creator/marketing/email')}
                  >
                    Send Newsletter
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/creator/marketing/sequences')}
                  >
                    Create Sequence
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Affiliate Program */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Share2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Affiliate Program</h2>
                  <p className="text-sm text-gray-500">Let others promote your products</p>
                </div>
              </div>
              <Button 
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => navigate('/creator/marketing/affiliates')}
              >
                Manage
              </Button>
            </div>
            
            <div className="space-y-4 mb-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Affiliate Performance</h3>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-gray-500">Active Affiliates</p>
                    <p className="font-medium text-gray-900">{affiliateStats.activeAffiliates}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Conversion Rate</p>
                    <p className="font-medium text-gray-900">{affiliateStats.conversionRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Commission</p>
                    <p className="font-medium text-gray-900">{formatCurrency(affiliateStats.totalCommission)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/creator/marketing/affiliates')}
                  >
                    Invite Affiliates
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/creator/marketing/affiliates')}
                  >
                    Review Commissions
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pixel Tracking */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Pixel Tracking</h2>
                  <p className="text-sm text-gray-500">Track customer behavior and conversions</p>
                </div>
              </div>
              <Button 
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => navigate('/creator/marketing/pixels')}
              >
                Manage
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Installed Pixels</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-gray-100">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-blue-700">FB</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Facebook Pixel</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Connected</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-gray-100">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-red-700">GA</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Google Analytics</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Connected</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => navigate('/creator/marketing/pixels')}
                >
                  Add Tracking Pixel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Email Sequences */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-full mr-4">
                  <Layers className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Email Sequences</h2>
                  <p className="text-sm text-gray-500">Automate email workflows</p>
                </div>
              </div>
              <Button 
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => navigate('/creator/marketing/sequences')}
              >
                Manage
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Active Sequences</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-gray-100">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Welcome Sequence</p>
                      <div className="flex space-x-2 text-xs text-gray-500">
                        <span>4 emails</span>
                        <span>•</span>
                        <span>75% completion rate</span>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Active</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-gray-100">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Course Onboarding</p>
                      <div className="flex space-x-2 text-xs text-gray-500">
                        <span>6 emails</span>
                        <span>•</span>
                        <span>82% completion rate</span>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Active</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => navigate('/creator/marketing/sequences')}
                >
                  Create New Sequence
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Campaigns */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Campaigns</h2>
                <Button 
                  variant="ghost"
                  size="sm"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => generateMockData()}
                >
                  Refresh
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Campaign
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Opens
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clicks
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentCampaigns.map((campaign) => (
                        <tr key={campaign.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {campaign.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(campaign.sentDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campaign.opens}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campaign.clicks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              campaign.status === 'In Progress' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {campaign.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/creator/marketing/email')}
                  >
                    View All Campaigns
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Top Affiliate Performers */}
        <div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Top Affiliates</h2>
                <Link to="/creator/marketing/affiliates" className="text-sm text-purple-600 hover:text-purple-800">
                  View All
                </Link>
              </div>
              
              <div className="space-y-4">
                {topPerformers.map((affiliate) => (
                  <div 
                    key={affiliate.id}
                    className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-medium text-blue-700">
                            {affiliate.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{affiliate.name}</p>
                          <p className="text-xs text-gray-500">{affiliate.sales} sales</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(affiliate.commission)}</p>
                        <p className="text-xs text-gray-500">{affiliate.conversionRate}% conversion</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline"
                  fullWidth
                  onClick={() => navigate('/creator/marketing/affiliates')}
                >
                  Manage Affiliates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};