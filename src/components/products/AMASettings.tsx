import React, { useState } from 'react';
import { Clock, MessageSquare, Tag, FileText, User, Check, Plus, X } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface AMASettingsProps {
  responseTime: number;
  onResponseTimeChange: (time: number) => void;
  maxQuestionLength?: number;
  onMaxQuestionLengthChange: (length: number | undefined) => void;
  topicCategories: string[];
  onTopicCategoriesChange: (categories: string[]) => void;
  allowAttachments: boolean;
  onAllowAttachmentsChange: (allow: boolean) => void;
  attachmentTypes: string[];
  onAttachmentTypesChange: (types: string[]) => void;
  anonymousAllowed: boolean;
  onAnonymousAllowedChange: (allow: boolean) => void;
}

export const AMASettings: React.FC<AMASettingsProps> = ({
  responseTime,
  onResponseTimeChange,
  maxQuestionLength,
  onMaxQuestionLengthChange,
  topicCategories,
  onTopicCategoriesChange,
  allowAttachments,
  onAllowAttachmentsChange,
  attachmentTypes,
  onAttachmentTypesChange,
  anonymousAllowed,
  onAnonymousAllowedChange
}) => {
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    // Don't add duplicates
    if (topicCategories.includes(newCategory.trim())) {
      setNewCategory('');
      return;
    }
    
    onTopicCategoriesChange([...topicCategories, newCategory.trim()]);
    setNewCategory('');
  };

  const handleRemoveCategory = (category: string) => {
    onTopicCategoriesChange(topicCategories.filter(c => c !== category));
  };

  const handleAttachmentTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      onAttachmentTypesChange([...attachmentTypes, type]);
    } else {
      onAttachmentTypesChange(attachmentTypes.filter(t => t !== type));
    }
  };

  const commonResponseTimes = [24, 48, 72, 168]; // in hours (24, 48, 72 hours, 1 week)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ask Me Anything Settings</h3>
        
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <label htmlFor="responseTime" className="block text-sm font-medium text-gray-700 mb-1">
                Response Time (hours)*
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {commonResponseTimes.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => onResponseTimeChange(time)}
                    className={`inline-flex items-center px-3 py-1.5 border ${
                      responseTime === time
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    } rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                  >
                    {time === 24 ? '24 hours' : 
                     time === 48 ? '2 days' :
                     time === 72 ? '3 days' :
                     time === 168 ? '1 week' : `${time} hours`}
                  </button>
                ))}
                
                <input
                  type="number"
                  id="responseTime"
                  value={responseTime}
                  onChange={(e) => onResponseTimeChange(parseInt(e.target.value) || 24)}
                  min="1"
                  className="block w-20 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Maximum time you commit to responding to questions.
              </p>
            </div>
            
            <div>
              <label htmlFor="maxQuestionLength" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Question Length (characters)
              </label>
              <input
                type="number"
                id="maxQuestionLength"
                value={maxQuestionLength || ''}
                onChange={(e) => onMaxQuestionLengthChange(e.target.value ? parseInt(e.target.value) : undefined)}
                min="100"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="1000"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional. Leave empty for no limit. Recommended: 1000-2000 characters.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic Categories (Optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {topicCategories.map(category => (
                  <div key={category} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                    <Tag className="h-3.5 w-3.5 text-gray-500 mr-1" />
                    <span>{category}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category)}
                      className="ml-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add a topic category"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
                <Button
                  type="button"
                  onClick={handleAddCategory}
                  className="rounded-l-none"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Topics you're willing to answer questions about.
              </p>
            </div>
            
            <div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="allowAttachments"
                    name="allowAttachments"
                    type="checkbox"
                    checked={allowAttachments}
                    onChange={(e) => onAllowAttachmentsChange(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="allowAttachments" className="font-medium text-gray-700">Allow Attachments</label>
                  <p className="text-gray-500">Let users attach files to their questions</p>
                </div>
              </div>
              
              {allowAttachments && (
                <div className="mt-3 ml-7">
                  <p className="text-sm font-medium text-gray-700 mb-2">Allowed Attachment Types</p>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={attachmentTypes.includes('image')}
                        onChange={(e) => handleAttachmentTypeChange('image', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Images (JPG, PNG, GIF)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={attachmentTypes.includes('document')}
                        onChange={(e) => handleAttachmentTypeChange('document', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Documents (PDF, DOC, TXT)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={attachmentTypes.includes('audio')}
                        onChange={(e) => handleAttachmentTypeChange('audio', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Audio Files (MP3, WAV)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={attachmentTypes.includes('video')}
                        onChange={(e) => handleAttachmentTypeChange('video', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Video Files (MP4, MOV)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="anonymousAllowed"
                    name="anonymousAllowed"
                    type="checkbox"
                    checked={anonymousAllowed}
                    onChange={(e) => onAnonymousAllowedChange(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="anonymousAllowed" className="font-medium text-gray-700">Allow Anonymous Questions</label>
                  <p className="text-gray-500">Let users submit questions without revealing their identity</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 flex items-center text-sm">
                <MessageSquare className="mr-2 h-4 w-4 text-purple-500" />
                AMA Preview
              </h4>
              <div className="mt-2">
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Response time:</span> Within {responseTime} hours
                </p>
                {maxQuestionLength && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Question length:</span> Up to {maxQuestionLength} characters
                  </p>
                )}
                {topicCategories.length > 0 && (
                  <div className="flex items-start mb-1">
                    <span className="font-medium text-sm text-gray-700 mr-2">Topics:</span>
                    <div className="flex flex-wrap gap-1">
                      {topicCategories.map(cat => (
                        <span key={cat} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Attachments:</span> {allowAttachments ? `Allowed (${attachmentTypes.join(', ')})` : 'Not allowed'}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Anonymous questions:</span> {anonymousAllowed ? 'Allowed' : 'Not allowed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 flex items-center mb-2">
            <MessageSquare className="h-4 w-4 mr-2" />
            Ask Me Anything Tips
          </h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
            <li>Set a realistic response time you can commit to</li>
            <li>Consider limiting question length to keep responses manageable</li>
            <li>Define clear topic categories to set expectations about what you will answer</li>
            <li>If allowing attachments, be clear about what types you'll accept</li>
            <li>Consider whether anonymity aligns with your community guidelines</li>
            <li>You'll receive notifications when new questions are submitted</li>
          </ul>
        </div>
      </div>
    </div>
  );
};