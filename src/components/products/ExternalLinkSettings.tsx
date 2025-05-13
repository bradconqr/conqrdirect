import React, { useState } from 'react';
import { LinkType } from '../../types';
import { Link, ExternalLink, DollarSign } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface ExternalLinkSettingsProps {
  targetUrl: string;
  linkType: LinkType;
  linkText: string;
  commissionRate?: number;
  onChange: (updates: {
    targetUrl: string;
    linkType: LinkType;
    linkText: string;
    commissionRate?: number;
  }) => void;
}

export const ExternalLinkSettings: React.FC<ExternalLinkSettingsProps> = ({
  targetUrl,
  linkType,
  linkText,
  commissionRate,
  onChange
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
    
    onChange({
      targetUrl: url,
      linkType,
      linkText,
      commissionRate
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as LinkType;
    
    onChange({
      targetUrl,
      linkType: newType,
      linkText,
      commissionRate: newType === 'affiliate' ? commissionRate || 10 : undefined
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      targetUrl,
      linkType,
      linkText: e.target.value,
      commissionRate
    });
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = e.target.value ? parseFloat(e.target.value) : undefined;
    
    onChange({
      targetUrl,
      linkType,
      linkText,
      commissionRate: rate
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">External Link Settings</h3>
        
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
                  placeholder="https://example.com/your-page"
                  required
                />
              </div>
              {!isValidUrl && (
                <p className="mt-1 text-sm text-red-600">Please enter a valid URL</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Enter the full URL where customers will be directed when they click on this product.
              </p>
            </div>
            
            <div>
              <label htmlFor="linkType" className="block text-sm font-medium text-gray-700 mb-1">
                Link Type*
              </label>
              <select
                id="linkType"
                value={linkType}
                onChange={handleTypeChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                required
              >
                <option value="affiliate">Affiliate Link</option>
                <option value="personal">Personal Website</option>
                <option value="subscription">Subscription Service</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {linkType === 'affiliate' 
                  ? 'Affiliate links let you earn commission from partner products or services'
                  : linkType === 'personal' 
                    ? 'Direct customers to your personal website or blog'
                    : 'Send customers to a subscription-based service or platform'}
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
                onChange={handleTextChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Visit Website"
              />
              <p className="mt-1 text-xs text-gray-500">
                Custom text for the button or link. If left empty, we'll use "Visit Website" as the default.
              </p>
            </div>
            
            {linkType === 'affiliate' && (
              <div>
                <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Rate (%)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="commissionRate"
                    value={commissionRate !== undefined ? commissionRate : ''}
                    onChange={handleCommissionChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="10"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  The percentage commission you earn from this affiliate link (for your records only).
                </p>
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 flex items-center text-sm">
                <Link className="mr-2 h-4 w-4 text-purple-500" />
                Link Preview
              </h4>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {linkText || 'Visit Website'} → {targetUrl || 'https://example.com'}
                </p>
                {linkType === 'affiliate' && commissionRate && (
                  <p className="mt-1 text-xs text-gray-500">
                    Commission: {commissionRate}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 flex items-center mb-2">
            <ExternalLink className="h-4 w-4 mr-2" />
            External Link Notes
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-5">
            <li>External link products direct customers to third-party websites</li>
            <li>You are responsible for the content and reliability of external destinations</li>
            {linkType === 'affiliate' && (
              <li>For affiliate links, ensure you comply with the affiliate program's terms and disclosure requirements</li>
            )}
            <li>Consider adding appropriate disclaimers in your product description</li>
          </ul>
        </div>
      </div>
    </div>
  );
};