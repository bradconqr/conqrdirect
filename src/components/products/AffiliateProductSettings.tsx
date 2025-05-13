import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Link, ExternalLink, DollarSign, Clock, AlertCircle, Globe } from 'lucide-react';

interface AffiliateProductSettingsProps {
  targetUrl: string;
  onTargetUrlChange: (url: string) => void;
  affiliateNetwork: string;
  onAffiliateNetworkChange: (network: string) => void;
  commissionRate: number;
  onCommissionRateChange: (rate: number) => void;
  cookieDuration: number;
  onCookieDurationChange: (days: number) => void;
  termsAndConditions: string;
  onTermsAndConditionsChange: (terms: string) => void;
  linkText: string;
  onLinkTextChange: (text: string) => void;
}

export const AffiliateProductSettings: React.FC<AffiliateProductSettingsProps> = ({
  targetUrl,
  onTargetUrlChange,
  affiliateNetwork,
  onAffiliateNetworkChange,
  commissionRate,
  onCommissionRateChange,
  cookieDuration,
  onCookieDurationChange,
  termsAndConditions,
  onTermsAndConditionsChange,
  linkText,
  onLinkTextChange
}) => {
  const [isValidUrl, setIsValidUrl] = useState<boolean>(true);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const valid = url === '' || validateUrl(url);
    setIsValidUrl(valid);
    onTargetUrlChange(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Affiliate Product Settings</h3>
        
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Destination URL*
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ExternalLink className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  id="targetUrl"
                  value={targetUrl}
                  onChange={handleUrlChange}
                  className={`block w-full pl-10 pr-3 py-2 sm:text-sm border ${
                    isValidUrl ? 'border-gray-300' : 'border-red-300'
                  } rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                  placeholder="https://example.com/affiliate-link"
                  required
                />
              </div>
              {!isValidUrl && (
                <p className="mt-1 text-sm text-red-600">Please enter a valid URL</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Enter the full affiliate URL where customers will be directed.
              </p>
            </div>
            
            <div>
              <label htmlFor="affiliateNetwork" className="block text-sm font-medium text-gray-700 mb-1">
                Affiliate Network
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="affiliateNetwork"
                  value={affiliateNetwork}
                  onChange={(e) => onAffiliateNetworkChange(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Amazon Associates, ShareASale, etc."
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                The affiliate network or program this link belongs to.
              </p>
            </div>
            
            <div>
              <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-1">
                Commission Rate (%)*
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="commissionRate"
                  value={commissionRate !== undefined ? commissionRate : ''}
                  onChange={(e) => onCommissionRateChange(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="10"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                The percentage commission you earn from this affiliate link.
              </p>
            </div>
            
            <div>
              <label htmlFor="cookieDuration" className="block text-sm font-medium text-gray-700 mb-1">
                Cookie Duration (days)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="cookieDuration"
                  value={cookieDuration !== undefined ? cookieDuration : ''}
                  onChange={(e) => onCookieDurationChange(parseInt(e.target.value) || 0)}
                  min="0"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="30"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                How long the affiliate cookie lasts after clicking your link.
              </p>
            </div>
            
            <div>
              <label htmlFor="linkText" className="block text-sm font-medium text-gray-700 mb-1">
                Call-to-Action Text
              </label>
              <input
                type="text"
                id="linkText"
                value={linkText}
                onChange={(e) => onLinkTextChange(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Shop Now"
              />
              <p className="mt-1 text-xs text-gray-500">
                Custom text for the button or link. If left empty, we'll use "Shop Now" as the default.
              </p>
            </div>
            
            <div>
              <label htmlFor="termsAndConditions" className="block text-sm font-medium text-gray-700 mb-1">
                Terms & Conditions
              </label>
              <textarea
                id="termsAndConditions"
                value={termsAndConditions}
                onChange={(e) => onTermsAndConditionsChange(e.target.value)}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Enter any specific terms or conditions for this affiliate link..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Any specific terms or restrictions for this affiliate program.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 flex items-center text-sm">
                <Link className="mr-2 h-4 w-4 text-purple-500" />
                Affiliate Link Preview
              </h4>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {linkText || 'Shop Now'} → {targetUrl || 'https://example.com'}
                </p>
                {commissionRate > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Commission: {commissionRate}%
                  </p>
                )}
                {cookieDuration > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Cookie Duration: {cookieDuration} days
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 flex items-center mb-2">
            <AlertCircle className="h-4 w-4 mr-2" />
            Affiliate Disclosure Requirements
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-5">
            <li>You must disclose your affiliate relationships to your audience</li>
            <li>Include a clear disclosure statement in your product description</li>
            <li>Familiarize yourself with FTC guidelines on affiliate marketing</li>
            <li>Ensure you're complying with the affiliate program's terms of service</li>
            <li>Keep records of your affiliate earnings for tax purposes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};