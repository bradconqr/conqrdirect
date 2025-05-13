import React, { useState } from 'react';
import { Calendar, Clock, Users, Video, Link, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface WebinarSchedulerProps {
  startDate: string;
  endDate: string;
  meetingUrl: string;
  maxAttendees?: number;
  timezone?: string;
  location?: string;
  onChange: (updates: {
    startDate: string;
    endDate: string;
    meetingUrl: string;
    maxAttendees?: number;
    timezone?: string;
    location?: string;
  }) => void;
}

export const WebinarScheduler: React.FC<WebinarSchedulerProps> = ({
  startDate,
  endDate,
  meetingUrl,
  maxAttendees,
  timezone = 'UTC',
  location,
  onChange
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const numValue = type === 'number' ? (value ? parseInt(value) : undefined) : undefined;
    
    onChange({
      startDate,
      endDate,
      meetingUrl,
      maxAttendees,
      timezone,
      location,
      [name]: numValue !== undefined ? numValue : value
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = () => {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    if (end <= start) return 'Invalid time range';
    
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : ''} ${minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`.trim();
  };
  
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-gray-900 mb-4">Webinar Schedule</h3>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    value={startDate}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    value={endDate}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="meetingUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Meeting URL
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Video className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  id="meetingUrl"
                  name="meetingUrl"
                  value={meetingUrl}
                  onChange={handleChange}
                  placeholder="https://zoom.us/j/123456789"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Zoom, Google Meet, Microsoft Teams, or any other meeting URL
              </p>
            </div>
            
            <div className="mt-4">
              <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Attendees
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="maxAttendees"
                  name="maxAttendees"
                  value={maxAttendees || ''}
                  onChange={handleChange}
                  placeholder="Unlimited"
                  min="1"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Leave empty for unlimited attendees
              </p>
            </div>
            
            <div className="mt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-purple-600"
              >
                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </Button>
            </div>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={timezone}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Physical Location (optional)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={location || ''}
                      onChange={handleChange}
                      placeholder="Online event"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Preview card */}
      {(startDate && endDate) && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Event Preview</h4>
          <div className="space-y-2">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{formatDate(startDate)}</p>
                <p className="text-sm text-gray-500">
                  {formatTime(startDate)} - {formatTime(endDate)} ({calculateDuration()})
                </p>
              </div>
            </div>
            
            {meetingUrl && (
              <div className="flex items-start">
                <Link className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex items-center">
                  <p className="text-sm text-purple-600 truncate max-w-xs">{meetingUrl}</p>
                  <ExternalLink className="h-4 w-4 ml-1 text-purple-600" />
                </div>
              </div>
            )}
            
            {maxAttendees && (
              <div className="flex items-start">
                <Users className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-gray-700">Limited to {maxAttendees} attendees</p>
              </div>
            )}
            
            {location && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-gray-700">{location}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};