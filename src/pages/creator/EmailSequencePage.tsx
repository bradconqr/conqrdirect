import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, 
  PlusCircle, 
  Play, 
  Pause, 
  Clock, 
  Users, 
  ArrowRight, 
  Mail,
  Calendar,
  FileText,
  Settings,
  ChevronRight,
  ChevronDown,
  Edit,
  Copy,
  Trash2,
  Check,
  X,
  Search,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface EmailSequence {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  steps: number;
  subscribers: number;
  completionRate: number;
  triggers: string[];
  created: string;
  lastModified: string;
}

interface SequenceStep {
  id: string;
  name: string;
  subject: string;
  template: string;
  delay: number;
  delayType: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  };
}

interface SequenceDetail {
  id: string;
  name: string;
  description: string;
  status: string;
  triggers: string[];
  steps: SequenceStep[];
}

const EmailSequencePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<SequenceDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newSequenceData, setNewSequenceData] = useState({
    name: '',
    description: '',
    trigger: 'new-subscriber'
  });
  
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
          await fetchEmailSequences(data.id);
        }
      } catch (err) {
        console.error('Error fetching creator ID:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCreatorId();
  }, [user]);
  
  // Set up real-time subscription for store_users (for subscriber counts)
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
        fetchEmailSequences(creatorId);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(storeUsersChannel);
    };
  }, [creatorId]);
  
  const fetchEmailSequences = async (creatorId: string) => {
    try {
      setLoading(true);
      
      // Get all store users for this creator to count subscribers
      const { data: storeUsers, error: storeUsersError } = await supabase
        .from('store_users')
        .select('id, is_subscribed')
        .eq('creator_id', creatorId);

      if (storeUsersError) throw storeUsersError;
      
      // Count subscribed users
      const subscribedCount = storeUsers?.filter(user => user.is_subscribed).length || 0;
      
      // Get products for this creator to determine sequence types
      const { data: products } = await supabase
        .from('products')
        .select('id, name, type')
        .eq('creator_id', creatorId);
        
      // Create email sequences based on creator's products and subscribers
      const sequences: EmailSequence[] = [];
      
      // Welcome sequence for all creators
      sequences.push({
        id: `seq-welcome-${creatorId}`,
        name: 'Welcome Sequence',
        description: 'Onboarding sequence for new subscribers',
        status: 'active',
        steps: 4,
        subscribers: subscribedCount,
        completionRate: subscribedCount > 0 ? Math.floor(Math.random() * 30) + 50 : 0, // Random between 50-80%
        triggers: ['New subscriber'],
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      });
      
      // Check if creator has courses
      const hasCourses = products?.some(p => p.type === 'course');
      if (hasCourses) {
        sequences.push({
          id: `seq-course-${creatorId}`,
          name: 'Course Drip Content',
          description: 'Content delivery for online course',
          status: 'active',
          steps: 8,
          subscribers: Math.floor(subscribedCount * 0.6), // Assume 60% of subscribers are in course
          completionRate: 65,
          triggers: ['Course purchase'],
          created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
          lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
        });
      }
      
      // Re-engagement campaign for all creators
      sequences.push({
        id: `seq-reengagement-${creatorId}`,
        name: 'Re-engagement Campaign',
        description: 'Win back inactive subscribers',
        status: 'paused',
        steps: 3,
        subscribers: Math.floor(subscribedCount * 0.3), // Assume 30% are inactive
        completionRate: 18,
        triggers: ['No activity for 30 days'],
        created: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
        lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      });
      
      // Check if creator has products to create a product launch sequence
      if (products && products.length > 0) {
        sequences.push({
          id: `seq-launch-${creatorId}`,
          name: 'Product Launch',
          description: 'Sequence for upcoming product launch',
          status: 'draft',
          steps: 5,
          subscribers: 0,
          completionRate: 0,
          triggers: ['Tag: interested-in-launch'],
          created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          lastModified: new Date().toISOString() // Today
        });
      }
      
      setSequences(sequences);
    } catch (error) {
      console.error('Error fetching email sequences:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSequenceDetails = async (sequenceId: string) => {
    try {
      // In a real implementation, we would fetch sequence details from the database
      // For now, we'll create a sample sequence detail based on the sequence ID
      
      const sequence = sequences.find(seq => seq.id === sequenceId);
      if (!sequence) return null;
      
      // Create steps based on sequence type
      const steps: SequenceStep[] = [];
      
      if (sequence.name.includes('Welcome')) {
        steps.push(
          {
            id: `step-1-${sequenceId}`,
            name: 'Welcome Email',
            subject: 'Welcome to our community!',
            template: 'Welcome Email Template',
            delay: 0,
            delayType: 'days',
            stats: {
              sent: sequence.subscribers,
              opened: Math.floor(sequence.subscribers * 0.85),
              clicked: Math.floor(sequence.subscribers * 0.6),
              openRate: 85.9,
              clickRate: 62.8
            }
          },
          {
            id: `step-2-${sequenceId}`,
            name: 'Resources Introduction',
            subject: 'Helpful resources to get you started',
            template: 'Resources Email Template',
            delay: 2,
            delayType: 'days',
            stats: {
              sent: Math.floor(sequence.subscribers * 0.9),
              opened: Math.floor(sequence.subscribers * 0.75),
              clicked: Math.floor(sequence.subscribers * 0.5),
              openRate: 82.1,
              clickRate: 63.4
            }
          },
          {
            id: `step-3-${sequenceId}`,
            name: 'First Value Email',
            subject: 'A special guide just for you',
            template: 'Free Guide Email Template',
            delay: 4,
            delayType: 'days',
            stats: {
              sent: Math.floor(sequence.subscribers * 0.8),
              opened: Math.floor(sequence.subscribers * 0.65),
              clicked: Math.floor(sequence.subscribers * 0.45),
              openRate: 79.2,
              clickRate: 60.0
            }
          },
          {
            id: `step-4-${sequenceId}`,
            name: 'Introduction to Products',
            subject: 'Discover our products and services',
            template: 'Product Introduction Template',
            delay: 7,
            delayType: 'days',
            stats: {
              sent: Math.floor(sequence.subscribers * 0.7),
              opened: Math.floor(sequence.subscribers * 0.55),
              clicked: Math.floor(sequence.subscribers * 0.35),
              openRate: 73.2,
              clickRate: 50.0
            }
          }
        );
      } else if (sequence.name.includes('Course')) {
        // Create course drip content steps
        for (let i = 1; i <= sequence.steps; i++) {
          const stepSubscribers = Math.floor(sequence.subscribers * (1 - (i * 0.05)));
          const openRate = Math.max(50, 90 - (i * 3));
          const clickRate = Math.max(30, 70 - (i * 4));
          
          steps.push({
            id: `step-${i}-${sequenceId}`,
            name: `Module ${i} Content`,
            subject: `Your Module ${i} Content is Ready`,
            template: `Course Module ${i} Template`,
            delay: (i - 1) * 7,
            delayType: 'days',
            stats: {
              sent: stepSubscribers,
              opened: Math.floor(stepSubscribers * (openRate / 100)),
              clicked: Math.floor(stepSubscribers * (clickRate / 100)),
              openRate: openRate,
              clickRate: clickRate
            }
          });
        }
      } else if (sequence.name.includes('Re-engagement')) {
        steps.push(
          {
            id: `step-1-${sequenceId}`,
            name: 'We Miss You',
            subject: 'We miss you! Here\'s what you\'ve been missing',
            template: 'Re-engagement Template 1',
            delay: 0,
            delayType: 'days',
            stats: {
              sent: sequence.subscribers,
              opened: Math.floor(sequence.subscribers * 0.25),
              clicked: Math.floor(sequence.subscribers * 0.1),
              openRate: 25.0,
              clickRate: 10.0
            }
          },
          {
            id: `step-2-${sequenceId}`,
            name: 'Special Offer',
            subject: 'A special offer just for you',
            template: 'Re-engagement Template 2',
            delay: 3,
            delayType: 'days',
            stats: {
              sent: Math.floor(sequence.subscribers * 0.9),
              opened: Math.floor(sequence.subscribers * 0.2),
              clicked: Math.floor(sequence.subscribers * 0.08),
              openRate: 22.0,
              clickRate: 8.0
            }
          },
          {
            id: `step-3-${sequenceId}`,
            name: 'Last Chance',
            subject: 'Last chance: We\'d hate to see you go',
            template: 'Re-engagement Template 3',
            delay: 7,
            delayType: 'days',
            stats: {
              sent: Math.floor(sequence.subscribers * 0.8),
              opened: Math.floor(sequence.subscribers * 0.15),
              clicked: Math.floor(sequence.subscribers * 0.05),
              openRate: 18.0,
              clickRate: 5.0
            }
          }
        );
      } else if (sequence.name.includes('Launch')) {
        // For draft sequences, create empty steps
        steps.push(
          {
            id: `step-1-${sequenceId}`,
            name: 'Teaser Email',
            subject: 'Something exciting is coming...',
            template: 'Launch Teaser Template',
            delay: 0,
            delayType: 'days',
            stats: {
              sent: 0,
              opened: 0,
              clicked: 0,
              openRate: 0,
              clickRate: 0
            }
          },
          {
            id: `step-2-${sequenceId}`,
            name: 'Announcement',
            subject: 'Introducing our new product!',
            template: 'Launch Announcement Template',
            delay: 2,
            delayType: 'days',
            stats: {
              sent: 0,
              opened: 0,
              clicked: 0,
              openRate: 0,
              clickRate: 0
            }
          },
          {
            id: `step-3-${sequenceId}`,
            name: 'Features & Benefits',
            subject: 'Here\'s why you\'ll love our new product',
            template: 'Launch Features Template',
            delay: 4,
            delayType: 'days',
            stats: {
              sent: 0,
              opened: 0,
              clicked: 0,
              openRate: 0,
              clickRate: 0
            }
          },
          {
            id: `step-4-${sequenceId}`,
            name: 'Social Proof',
            subject: 'See what others are saying',
            template: 'Launch Social Proof Template',
            delay: 6,
            delayType: 'days',
            stats: {
              sent: 0,
              opened: 0,
              clicked: 0,
              openRate: 0,
              clickRate: 0
            }
          },
          {
            id: `step-5-${sequenceId}`,
            name: 'Last Chance',
            subject: 'Last chance to get in on this',
            template: 'Launch Last Chance Template',
            delay: 8,
            delayType: 'days',
            stats: {
              sent: 0,
              opened: 0,
              clicked: 0,
              openRate: 0,
              clickRate: 0
            }
          }
        );
      }
      
      return {
        id: sequence.id,
        name: sequence.name,
        description: sequence.description,
        status: sequence.status,
        triggers: sequence.triggers,
        steps: steps
      };
    } catch (error) {
      console.error('Error fetching sequence details:', error);
      return null;
    }
  };
  
  const toggleExpandStep = (stepId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleSelectSequence = async (sequenceId: string) => {
    // In a real app, you would fetch the sequence details from the API
    // Here we're just using mock data
    const sequenceDetail = await fetchSequenceDetails(sequenceId);
    if (sequenceDetail) {
      setSelectedSequence(sequenceDetail);
    }
  };
  
  const handleBackToList = () => {
    setSelectedSequence(null);
  };
  
  const handleCreateSequence = () => {
    if (!newSequenceData.name.trim()) return;
    
    const newSequence = {
      id: `seq-${Date.now()}`,
      name: newSequenceData.name,
      description: newSequenceData.description,
      status: 'draft',
      steps: 0,
      subscribers: 0,
      completionRate: 0,
      triggers: [newSequenceData.trigger === 'new-subscriber' ? 'New subscriber' : 'Custom trigger'],
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    setSequences([newSequence, ...sequences]);
    setIsCreateModalOpen(false);
    setNewSequenceData({
      name: '',
      description: '',
      trigger: 'new-subscriber'
    });
  };
  
  const handleToggleStatus = (sequenceId: string, currentStatus: string) => {
    setSequences(sequences.map(seq => {
      if (seq.id === sequenceId) {
        return {
          ...seq,
          status: currentStatus === 'active' ? 'paused' : 'active'
        };
      }
      return seq;
    }));
  };
  
  const refreshData = async () => {
    if (!creatorId || refreshing) return;
    
    setRefreshing(true);
    await fetchEmailSequences(creatorId);
    setRefreshing(false);
  };
  
  // Filter sequences based on search query
  const filteredSequences = sequences.filter(sequence => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      sequence.name.toLowerCase().includes(query) ||
      sequence.description.toLowerCase().includes(query) ||
      sequence.triggers.some(trigger => trigger.toLowerCase().includes(query))
    );
  });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (selectedSequence) {
    // Show sequence detail view
    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={handleBackToList}
            className="text-purple-600 hover:text-purple-800 font-medium flex items-center"
          >
            <ChevronRight className="h-5 w-5 rotate-180 mr-1" />
            Back to sequences
          </button>
        </div>
        
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedSequence.name}</h1>
                <p className="mt-1 text-gray-600">{selectedSequence.description}</p>
                <div className="mt-3 flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedSequence.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : selectedSequence.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedSequence.status.charAt(0).toUpperCase() + selectedSequence.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedSequence.steps.length} steps
                  </span>
                  <span className="text-xs text-gray-500">
                    Trigger: {selectedSequence.triggers.join(', ')}
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  leftIcon={<Settings className="h-4 w-4" />}
                >
                  Edit Settings
                </Button>
                {selectedSequence.status === 'active' ? (
                  <Button
                    variant="outline"
                    leftIcon={<Pause className="h-4 w-4" />}
                  >
                    Pause Sequence
                  </Button>
                ) : (
                  <Button
                    leftIcon={<Play className="h-4 w-4" />}
                  >
                    Activate Sequence
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-6 py-5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Email Sequence Steps</h2>
              <Button
                size="sm"
                leftIcon={<PlusCircle className="h-4 w-4" />}
              >
                Add Step
              </Button>
            </div>
            
            <div className="space-y-4">
              {selectedSequence.steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className="border rounded-lg bg-white"
                >
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleExpandStep(step.id)}
                  >
                    <div className="flex items-center">
                      <div className="flex items-center justify-center bg-purple-100 h-8 w-8 rounded-full text-purple-700 font-medium mr-4">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{step.name}</h3>
                        <p className="text-sm text-gray-500">{step.subject}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="hidden sm:flex items-center">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="ml-1 text-sm text-gray-500">
                          {step.delay > 0 ? 
                            `Wait ${step.delay} ${step.delayType}` : 
                            'Send immediately'}
                        </span>
                      </div>
                      
                      <div className="hidden sm:flex items-center">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="ml-1 text-sm text-gray-500">
                          {step.stats.openRate}% opens
                        </span>
                      </div>
                      
                      <button>
                        {expandedSteps[step.id] ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {expandedSteps[step.id] && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex flex-col md:flex-row md:space-x-6">
                        <div className="md:w-1/2 mb-4 md:mb-0">
                          <h4 className="font-medium text-gray-900 mb-3">Email Content</h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 mb-1">Subject: {step.subject}</p>
                            <p className="text-xs text-gray-500 mb-3">Template: {step.template}</p>
                            <Button size="sm" leftIcon={<Edit className="h-4 w-4" />}>Edit Content</Button>
                          </div>
                          
                          <h4 className="font-medium text-gray-900 mt-4 mb-3">Delay Settings</h4>
                          <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                            <Clock className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              {step.delay > 0 ? (
                                <p className="text-sm text-gray-700">
                                  Wait {step.delay} {step.delayType} after previous step
                                </p>
                              ) : (
                                <p className="text-sm text-gray-700">
                                  Send immediately after trigger
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="md:w-1/2">
                          <h4 className="font-medium text-gray-900 mb-3">Performance</h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-500">Sent</p>
                                <p className="text-lg font-medium text-gray-900">{step.stats.sent}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Opened</p>
                                <p className="text-lg font-medium text-gray-900">{step.stats.opened} <span className="text-xs text-gray-500">({step.stats.openRate}%)</span></p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Clicked</p>
                                <p className="text-lg font-medium text-gray-900">{step.stats.clicked} <span className="text-xs text-gray-500">({step.stats.clickRate}%)</span></p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex space-x-2">
                            <Button size="sm" variant="outline" leftIcon={<Copy className="h-4 w-4" />}>
                              Duplicate
                            </Button>
                            <Button size="sm" variant="outline" leftIcon={<Trash2 className="h-4 w-4" />} className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <PlusCircle className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="mt-2 text-sm font-medium text-gray-900">Add another email to this sequence</p>
                <p className="text-xs text-gray-500 mt-1">Continue the journey for your subscribers</p>
                <Button className="mt-3" size="sm">
                  Add Email Step
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Sequence Performance</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 mb-4 md:mb-0">
                <h3 className="text-base font-medium text-gray-900 mb-4">Subscriber Journey</h3>
                <div className="space-y-4">
                  {selectedSequence.steps.map((step, index) => {
                    // Calculate percentage of total
                    const firstStepSent = selectedSequence.steps[0].stats.sent;
                    const percentage = firstStepSent > 0 ? ((step.stats.sent / firstStepSent) * 100) : 0;
                    
                    return (
                      <div key={step.id} className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-medium">
                          {index + 1}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-900">{step.name}</p>
                            <p className="text-sm font-medium text-gray-900">{step.stats.sent}</p>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-purple-600 h-2.5 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="md:w-2/3 md:pl-8 md:border-l md:border-gray-200">
                <h3 className="text-base font-medium text-gray-900 mb-4">Overall Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Total Subscribers</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {selectedSequence.steps[0].stats.sent}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Average Open Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {Math.round(selectedSequence.steps.reduce((acc, step) => acc + step.stats.openRate, 0) / selectedSequence.steps.length)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Average Click Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {Math.round(selectedSequence.steps.reduce((acc, step) => acc + step.stats.clickRate, 0) / selectedSequence.steps.length)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show sequence list view
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Sequences</h1>
          <p className="mt-1 text-gray-600">Create and manage your email sequences</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={refreshing ? 'animate-spin' : ''} />}
            onClick={refreshData}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<PlusCircle className="h-5 w-5" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Sequence
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search sequences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSequences.map(sequence => (
          <Card key={sequence.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{sequence.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{sequence.description}</p>
                </div>
                <button
                  onClick={() => handleToggleStatus(sequence.id, sequence.status)}
                  className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    sequence.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : sequence.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {sequence.status.charAt(0).toUpperCase() + sequence.status.slice(1)}
                </button>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Layers className="h-5 w-5 mr-2 text-gray-400" />
                  {sequence.steps} steps
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-5 w-5 mr-2 text-gray-400" />
                  {sequence.subscribers} subscribers
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                  Created {formatDate(sequence.created)}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {sequence.completionRate}% completion rate
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectSequence(sequence.id)}
                    className="ml-4"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Create New Sequence Card */}
        <Card 
          className="border-2 border-dashed hover:border-purple-500 hover:bg-purple-50 transition-colors duration-200 cursor-pointer"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Sequence</h3>
            <p className="text-sm text-gray-600">
              Start building a new email sequence for your subscribers
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Create Sequence Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Sequence</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sequence Name
                </label>
                <input
                  type="text"
                  value={newSequenceData.name}
                  onChange={(e) => setNewSequenceData({ ...newSequenceData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Welcome Sequence"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newSequenceData.description}
                  onChange={(e) => setNewSequenceData({ ...newSequenceData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe the purpose of this sequence"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger
                </label>
                <select
                  value={newSequenceData.trigger}
                  onChange={(e) => setNewSequenceData({ ...newSequenceData, trigger: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="new-subscriber">New Subscriber</option>
                  <option value="custom">Custom Trigger</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSequence}
                disabled={!newSequenceData.name.trim()}
              >
                Create Sequence
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSequencePage;

export { EmailSequencePage }