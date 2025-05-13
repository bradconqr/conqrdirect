import React, { useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { getProductByPriceId } from '../../stripe-config';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';

export const SubscriptionStatus: React.FC = () => {
  const { subscription, loading, error, getCurrentPlan } = useSubscription();
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <div>
                <p className="font-medium">Error loading subscription</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="bg-gray-900 border border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white">No Active Subscription</h3>
              <p className="text-gray-400 mt-1">You don't have an active subscription plan.</p>
            </div>
            <Button onClick={() => window.location.href = '/subscription'}>Subscribe Now</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const product = subscription.priceId ? getProductByPriceId(subscription.priceId) : getCurrentPlan();
  const planName = product?.name || 'Unknown Plan';
  
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'trialing':
        return <Badge variant="info">Trial</Badge>;
      case 'past_due':
        return <Badge variant="warning">Past Due</Badge>;
      case 'canceled':
        return <Badge variant="error">Canceled</Badge>;
      default:
        return <Badge>{subscription.status}</Badge>;
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription.subscriptionId) {
      setActionError('No active subscription found');
      return;
    }
    
    setCancellingSubscription(true);
    setActionError(null);
    setActionSuccess(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId: subscription.priceId }
      });
      
      if (error || !data.success) {
        throw new Error(error?.message || data?.message || 'Failed to cancel subscription');
      }
      
      setActionSuccess('Your subscription has been cancelled. You will still have access until the end of your current billing period.');
      
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      setActionError(err.message || 'An error occurred while cancelling your subscription. Please try again.');
    } finally {
      setCancellingSubscription(false);
    }
  };

  return (
    <Card className="bg-gray-900 border border-gray-800">
      <CardContent className="p-6">
        {actionError && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-200 rounded-md flex items-start">
            <div className="flex items-start">
              <X className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <p className="text-sm">{actionError}</p>
            </div>
          </div>
        )}
        
        {actionSuccess && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-500 text-green-200 rounded-md flex items-start">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
              <p className="text-sm">{actionSuccess}</p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-white">{planName}</h3>
              <div className="ml-3">{getStatusBadge()}</div>
            </div>
            
            <div className="mt-2 space-y-1">
              {subscription.status === 'trialing' && (
                <div className="flex items-center text-sm text-gray-400">
                  <Clock className="h-4 w-4 mr-1.5 text-indigo-400" />
                  <span>Your 14-day free trial ends on {formatDate(subscription.currentPeriodEnd)}</span>
                </div>
              )}
              
              {subscription.status === 'active' && (
                <div className="flex items-center text-sm text-gray-400">
                  <Calendar className="h-4 w-4 mr-1.5 text-indigo-400" />
                  <span>
                    {subscription.cancelAtPeriodEnd 
                      ? `Access until ${formatDate(subscription.currentPeriodEnd)}`
                      : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
                  </span>
                </div>
              )}
              
              {subscription.paymentMethodBrand && subscription.paymentMethodLast4 && (
                <div className="flex items-center text-sm text-gray-400">
                  <CreditCard className="h-4 w-4 mr-1.5 text-indigo-400" />
                  <span>
                    {subscription.paymentMethodBrand.charAt(0).toUpperCase() + subscription.paymentMethodBrand.slice(1)} ending in {subscription.paymentMethodLast4}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelSubscription}
                isLoading={cancellingSubscription}
              >
                Cancel Subscription
              </Button>
            )}
            
            {subscription.status === 'active' && subscription.cancelAtPeriodEnd && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/subscription'}
              >
                Manage Plan
              </Button>
            )}
            
            {subscription.status === 'past_due' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/subscription'}
              >
                Update Payment
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};