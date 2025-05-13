import React, { useState } from 'react';
import { FileText, Mail, Users, AlertTriangle, Link, Check } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { FileUploader } from './FileUploader';

interface LeadMagnetSettingsProps {
  leadMagnetFile: File | null;
  currentFileName?: string;
  onFileSelected: (file: File) => void;
  onFileClear: () => void;
  emailListName: string;
  onEmailListNameChange: (value: string) => void;
  thankYouMessage: string;
  onThankYouMessageChange: (value: string) => void;
  redirectUrl?: string;
  onRedirectUrlChange: (value: string) => void;
  optInTextRequired?: boolean;
  onOptInTextRequiredChange?: (value: boolean) => void;
  optInText?: string;
  onOptInTextChange?: (value: string) => void;
}

export const LeadMagnetSettings: React.FC<LeadMagnetSettingsProps> = ({
  leadMagnetFile,
  currentFileName,
  onFileSelected,
  onFileClear,
  emailListName,
  onEmailListNameChange,
  thankYouMessage,
  onThankYouMessageChange,
  redirectUrl,
  onRedirectUrlChange,
  optInTextRequired = true,
  onOptInTextRequiredChange,
  optInText = "Yes, I agree to receive newsletters and promotional emails. I understand I can unsubscribe at any time.",
  onOptInTextChange
}) => {
  const [isValidUrl, setIsValidUrl] = useState<boolean>(true);

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty URL is valid (it's optional)
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const valid = validateUrl(url);
    setIsValidUrl(valid);
    onRedirectUrlChange(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Magnet Settings</h3>
        
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <label htmlFor="leadMagnetFile" className="block text-sm font-medium text-gray-700 mb-1">
                Downloadable Resource*
              </label>
              <FileUploader
                onFileSelected={onFileSelected}
                onClear={onFileClear}
                currentFileName={leadMagnetFile?.name || currentFileName}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.mp3,.mp4"
                maxSize={50} // 50MB max
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload the free resource you'll provide in exchange for the user's email.
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, MP3, MP4.
              </p>
            </div>
            
            <div>
              <label htmlFor="emailListName" className="block text-sm font-medium text-gray-700 mb-1">
                Email List Name*
              </label>
              <input
                type="text"
                id="emailListName"
                value={emailListName}
                onChange={(e) => onEmailListNameChange(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Newsletter Subscribers"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Name of the list where collected emails will be stored.
              </p>
            </div>
            
            <div>
              <label htmlFor="thankYouMessage" className="block text-sm font-medium text-gray-700 mb-1">
                Thank You Message
              </label>
              <textarea
                id="thankYouMessage"
                value={thankYouMessage}
                onChange={(e) => onThankYouMessageChange(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Thank you for subscribing! Check your email to download your free resource."
              />
              <p className="mt-1 text-xs text-gray-500">
                Message displayed after a user subscribes.
              </p>
            </div>
            
            <div>
              <label htmlFor="redirectUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Redirect URL (Optional)
              </label>
              <input
                type="url"
                id="redirectUrl"
                value={redirectUrl || ''}
                onChange={handleUrlChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  isValidUrl ? 'border-gray-300' : 'border-red-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                placeholder="https://example.com/thank-you"
              />
              {!isValidUrl && (
                <p className="mt-1 text-sm text-red-600">Please enter a valid URL</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Where to redirect users after they sign up (optional).
              </p>
            </div>
            
            {onOptInTextRequiredChange && onOptInTextChange && (
              <>
                <div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="optInTextRequired"
                        name="optInTextRequired"
                        type="checkbox"
                        checked={optInTextRequired}
                        onChange={(e) => onOptInTextRequiredChange(e.target.checked)}
                        className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="optInTextRequired" className="font-medium text-gray-700">Require opt-in consent</label>
                      <p className="text-gray-500">Users must explicitly consent to join your email list</p>
                    </div>
                  </div>
                </div>
                
                {optInTextRequired && (
                  <div>
                    <label htmlFor="optInText" className="block text-sm font-medium text-gray-700 mb-1">
                      Opt-in Text
                    </label>
                    <textarea
                      id="optInText"
                      value={optInText}
                      onChange={(e) => onOptInTextChange(e.target.value)}
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Text shown alongside the opt-in checkbox. Be clear about how you'll use their email.
                    </p>
                  </div>
                )}
              </>
            )}
            
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 flex items-center text-sm">
                <Users className="mr-2 h-4 w-4 text-blue-500" />
                Email Collection Preview
              </h4>
              <div className="mt-2">
                <div className="bg-white p-3 rounded border border-blue-100">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="email"
                        disabled
                        className="bg-gray-50 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-500"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  
                  {optInTextRequired && (
                    <div className="flex items-start mb-3">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          disabled
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label className="font-medium text-gray-700">{optInText}</label>
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    disabled
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 opacity-80"
                  >
                    Download Free Resource
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 flex items-center mb-2">
            <Mail className="h-4 w-4 mr-2" />
            Lead Magnet Best Practices
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-5">
            <li>Provide genuine value in your free downloadable resource</li>
            <li>Create a compelling headline and description that clearly states the benefit</li>
            <li>Keep your opt-in form simple - just ask for the email (and maybe name)</li>
            <li>Be transparent about how you'll use their email and offer an easy way to unsubscribe</li>
            <li>Consider following up with an email sequence to nurture these leads</li>
          </ul>
        </div>
        
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex items-center text-gray-600">
            <AlertTriangle className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium">Important Privacy Notice</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Collecting email addresses means you're processing personal data. Ensure you comply with applicable privacy laws like GDPR, CCPA, or other regulations in your jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
};