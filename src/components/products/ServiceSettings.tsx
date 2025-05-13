import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Clock, FileCheck, RefreshCw, Repeat, Briefcase, AlertTriangle } from 'lucide-react';

interface ServiceSettingsProps {
  serviceType: string;
  onServiceTypeChange: (value: string) => void;
  serviceDuration: number;
  onServiceDurationChange: (value: number) => void;
  serviceDeliverables: string[];
  onServiceDeliverablesChange: (value: string[]) => void;
  serviceTurnaroundTime: number;
  onServiceTurnaroundTimeChange: (value: number) => void;
  serviceRevisions: number;
  onServiceRevisionsChange: (value: number) => void;
}

export const ServiceSettings: React.FC<ServiceSettingsProps> = ({
  serviceType,
  onServiceTypeChange,
  serviceDuration,
  onServiceDurationChange,
  serviceDeliverables,
  onServiceDeliverablesChange,
  serviceTurnaroundTime,
  onServiceTurnaroundTimeChange,
  serviceRevisions,
  onServiceRevisionsChange
}) => {
  const [newDeliverable, setNewDeliverable] = useState('');

  const handleAddDeliverable = () => {
    if (newDeliverable.trim()) {
      onServiceDeliverablesChange([...serviceDeliverables, newDeliverable.trim()]);
      setNewDeliverable('');
    }
  };

  const handleRemoveDeliverable = (index: number) => {
    const updatedDeliverables = [...serviceDeliverables];
    updatedDeliverables.splice(index, 1);
    onServiceDeliverablesChange(updatedDeliverables);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDeliverable();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Digital Service Details</h3>
        
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
                Service Type*
              </label>
              <select
                id="serviceType"
                value={serviceType}
                onChange={(e) => onServiceTypeChange(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                required
              >
                <option value="">Select a service type</option>
                <option value="design">Graphic Design</option>
                <option value="writing">Content Writing</option>
                <option value="development">Web Development</option>
                <option value="consulting">Consulting</option>
                <option value="coaching">Coaching</option>
                <option value="editing">Editing/Proofreading</option>
                <option value="translation">Translation</option>
                <option value="voiceover">Voice Over</option>
                <option value="custom">Custom Service</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select the category that best describes your service
              </p>
            </div>
            
            <div>
              <label htmlFor="serviceDuration" className="block text-sm font-medium text-gray-700 mb-1">
                Service Duration (hours)*
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="serviceDuration"
                  value={serviceDuration || ''}
                  onChange={(e) => onServiceDurationChange(parseInt(e.target.value) || 0)}
                  min="0"
                  step="0.5"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="1"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Estimated time to complete the service (can be fractional hours)
              </p>
            </div>
            
            <div>
              <label htmlFor="serviceTurnaroundTime" className="block text-sm font-medium text-gray-700 mb-1">
                Turnaround Time (days)*
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <RefreshCw className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="serviceTurnaroundTime"
                  value={serviceTurnaroundTime || ''}
                  onChange={(e) => onServiceTurnaroundTimeChange(parseInt(e.target.value) || 0)}
                  min="1"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="3"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                How many days it will take you to deliver the completed service
              </p>
            </div>
            
            <div>
              <label htmlFor="serviceRevisions" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Revisions
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Repeat className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="serviceRevisions"
                  value={serviceRevisions || ''}
                  onChange={(e) => onServiceRevisionsChange(parseInt(e.target.value) || 0)}
                  min="0"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="2"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Number of revision rounds included in the service
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Deliverables*
              </label>
              <p className="text-xs text-gray-500 mb-2">
                List what the customer will receive with this service
              </p>
              
              <div className="space-y-2 mb-3">
                {serviceDeliverables.map((deliverable, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center">
                      <FileCheck className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">{deliverable}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex">
                <input
                  type="text"
                  value={newDeliverable}
                  onChange={(e) => setNewDeliverable(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="block w-full rounded-l-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="e.g., 5 high-resolution logo files"
                />
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 flex items-center text-sm">
                <Briefcase className="mr-2 h-4 w-4 text-purple-500" />
                Service Summary
              </h4>
              <div className="mt-2">
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Type:</span> {serviceType ? serviceType.charAt(0).toUpperCase() + serviceType.slice(1) : 'Not specified'}
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Duration:</span> {serviceDuration} hours
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Turnaround:</span> {serviceTurnaroundTime} days
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Revisions:</span> {serviceRevisions}
                </p>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Deliverables:</span>
                  {serviceDeliverables.length > 0 ? (
                    <ul className="list-disc list-inside mt-1 ml-2 text-xs">
                      {serviceDeliverables.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="ml-1 text-gray-500">None specified</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 flex items-center mb-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Service Delivery Tips
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-5">
            <li>Be clear and specific about what's included in your service</li>
            <li>Set realistic turnaround times that you can consistently meet</li>
            <li>Consider offering different service tiers (basic, standard, premium)</li>
            <li>Clearly define the scope to avoid misunderstandings with clients</li>
            <li>Include information about your process in the product description</li>
          </ul>
        </div>
      </div>
    </div>
  );
};