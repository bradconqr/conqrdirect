import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileUploader } from './FileUploader';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Ticket, 
  Users, 
  Plus, 
  Trash2, 
  DollarSign, 
  AlertTriangle,
  Mail,
  Smartphone,
  Printer,
  UserCheck,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { TicketOption, TicketType } from '../../types';

interface TicketSettingsProps {
  ticketType: TicketType;
  onTicketTypeChange: (value: TicketType) => void;
  venue: string;
  onVenueChange: (value: string) => void;
  venueAddress: string;
  onVenueAddressChange: (value: string) => void;
  eventDate: string;
  onEventDateChange: (value: string) => void;
  eventTime: string;
  onEventTimeChange: (value: string) => void;
  ticketQuantity: number;
  onTicketQuantityChange: (value: number) => void;
  ticketOptions: TicketOption[];
  onTicketOptionsChange: (value: TicketOption[]) => void;
  seatingChart: string | null;
  onSeatingChartChange: (value: string | null) => void;
  ticketDeliveryMethod: 'email' | 'print' | 'will_call' | 'mobile';
  onTicketDeliveryMethodChange: (value: 'email' | 'print' | 'will_call' | 'mobile') => void;
  ticketTransferable: boolean;
  onTicketTransferableChange: (value: boolean) => void;
  ticketRefundPolicy: string;
  onTicketRefundPolicyChange: (value: string) => void;
}

export const TicketSettings: React.FC<TicketSettingsProps> = ({
  ticketType,
  onTicketTypeChange,
  venue,
  onVenueChange,
  venueAddress,
  onVenueAddressChange,
  eventDate,
  onEventDateChange,
  eventTime,
  onEventTimeChange,
  ticketQuantity,
  onTicketQuantityChange,
  ticketOptions,
  onTicketOptionsChange,
  seatingChart,
  onSeatingChartChange,
  ticketDeliveryMethod,
  onTicketDeliveryMethodChange,
  ticketTransferable,
  onTicketTransferableChange,
  ticketRefundPolicy,
  onTicketRefundPolicyChange
}) => {
  const [newTicketOption, setNewTicketOption] = useState<Partial<TicketOption>>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    availableQuantity: 0
  });
  const [showAddTicketOption, setShowAddTicketOption] = useState(false);

  const handleAddTicketOption = () => {
    if (!newTicketOption.name || newTicketOption.price === undefined || newTicketOption.quantity === undefined) {
      return;
    }

    const newOption: TicketOption = {
      id: `ticket-option-${Date.now()}`,
      name: newTicketOption.name,
      description: newTicketOption.description || '',
      price: newTicketOption.price,
      quantity: newTicketOption.quantity,
      availableQuantity: newTicketOption.quantity
    };

    onTicketOptionsChange([...ticketOptions, newOption]);
    setNewTicketOption({
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      availableQuantity: 0
    });
    setShowAddTicketOption(false);
  };

  const handleRemoveTicketOption = (id: string) => {
    onTicketOptionsChange(ticketOptions.filter(option => option.id !== id));
  };

  const handleSeatingChartUpload = (file: File) => {
    // In a real implementation, you would upload the file to storage
    // and get back a URL. For now, we'll create a temporary URL.
    const imageUrl = URL.createObjectURL(file);
    onSeatingChartChange(imageUrl);
  };

  const clearSeatingChart = () => {
    onSeatingChartChange(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Event Details</h3>
        
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Type*
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer ${
                    ticketType === 'online' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onTicketTypeChange('online')}
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Smartphone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-3 font-medium text-gray-900">Online Event</div>
                  </div>
                  <p className="text-xs text-gray-500">Virtual events with digital tickets</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer ${
                    ticketType === 'physical' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onTicketTypeChange('physical')}
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3 font-medium text-gray-900">In-Person Event</div>
                  </div>
                  <p className="text-xs text-gray-500">Physical events at a venue</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer ${
                    ticketType === 'hybrid' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onTicketTypeChange('hybrid')}
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3 font-medium text-gray-900">Hybrid Event</div>
                  </div>
                  <p className="text-xs text-gray-500">Both in-person and online attendance</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date*
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="eventDate"
                    value={eventDate}
                    onChange={(e) => onEventDateChange(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="eventTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Time*
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    id="eventTime"
                    value={eventTime}
                    onChange={(e) => onEventTimeChange(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
            </div>
            
            {(ticketType === 'physical' || ticketType === 'hybrid') && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
                    Venue Name*
                  </label>
                  <input
                    type="text"
                    id="venue"
                    value={venue}
                    onChange={(e) => onVenueChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="e.g., The Grand Hall"
                    required={ticketType === 'physical' || ticketType === 'hybrid'}
                  />
                </div>
                
                <div>
                  <label htmlFor="venueAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Venue Address
                  </label>
                  <textarea
                    id="venueAddress"
                    value={venueAddress}
                    onChange={(e) => onVenueAddressChange(e.target.value)}
                    rows={2}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="Full address including city, state, and zip code"
                  />
                </div>
              </div>
            )}
            
            {ticketType === 'online' && (
              <div>
                <label htmlFor="meetingUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Online Event URL
                </label>
                <input
                  type="url"
                  id="meetingUrl"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="https://zoom.us/j/123456789"
                />
                <p className="mt-1 text-xs text-gray-500">
                  You can add this later if you don't have it yet
                </p>
              </div>
            )}
            
            <div>
              <label htmlFor="ticketQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                Total Ticket Quantity*
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Ticket className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="ticketQuantity"
                  value={ticketQuantity || ''}
                  onChange={(e) => onTicketQuantityChange(parseInt(e.target.value) || 0)}
                  min="1"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="100"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Maximum number of tickets available for this event
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ticket Options
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddTicketOption(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Ticket Type
                </Button>
              </div>
              
              {ticketOptions.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {ticketOptions.map((option) => (
                    <div key={option.id} className="border rounded-md p-3 bg-gray-50">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{option.name}</h4>
                          {option.description && (
                            <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                          )}
                        </div>
                        <div className="flex items-start space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(option.price)}</div>
                            <div className="text-xs text-gray-500">{option.availableQuantity} available</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTicketOption(option.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border border-dashed border-gray-300 rounded-md mb-4">
                  <Ticket className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-1 text-sm text-gray-500">No ticket options added yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddTicketOption(true)}
                    className="mt-2"
                  >
                    Add Ticket Type
                  </Button>
                </div>
              )}
              
              {showAddTicketOption && (
                <div className="border rounded-md p-4 bg-white mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Add Ticket Option</h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="ticketName" className="block text-xs font-medium text-gray-700 mb-1">
                        Ticket Name*
                      </label>
                      <input
                        type="text"
                        id="ticketName"
                        value={newTicketOption.name}
                        onChange={(e) => setNewTicketOption({...newTicketOption, name: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="e.g., VIP, General Admission"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="ticketDescription" className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        id="ticketDescription"
                        value={newTicketOption.description}
                        onChange={(e) => setNewTicketOption({...newTicketOption, description: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="e.g., Includes early access and swag bag"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="ticketPrice" className="block text-xs font-medium text-gray-700 mb-1">
                          Price*
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            id="ticketPrice"
                            value={newTicketOption.price || ''}
                            onChange={(e) => setNewTicketOption({...newTicketOption, price: parseFloat(e.target.value) || 0})}
                            min="0"
                            step="0.01"
                            className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="ticketQuantity" className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity*
                        </label>
                        <input
                          type="number"
                          id="ticketQuantity"
                          value={newTicketOption.quantity || ''}
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value) || 0;
                            setNewTicketOption({
                              ...newTicketOption, 
                              quantity: quantity,
                              availableQuantity: quantity
                            });
                          }}
                          min="1"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          placeholder="50"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAddTicketOption(false);
                          setNewTicketOption({
                            name: '',
                            description: '',
                            price: 0,
                            quantity: 0,
                            availableQuantity: 0
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddTicketOption}
                        disabled={!newTicketOption.name || newTicketOption.price === undefined || newTicketOption.quantity === undefined || newTicketOption.quantity < 1}
                      >
                        Add Ticket Option
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {(ticketType === 'physical' || ticketType === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seating Chart (optional)
                </label>
                {seatingChart ? (
                  <div className="relative w-full h-48 mb-4">
                    <img 
                      src={seatingChart} 
                      alt="Seating Chart" 
                      className="w-full h-full object-contain border rounded-md"
                    />
                    <button
                      type="button"
                      onClick={clearSeatingChart}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    <FileUploader
                      onFileSelected={handleSeatingChartUpload}
                      onClear={() => {}}
                      accept="image/*"
                      maxSize={5}
                      isImage={true}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Upload an image of your venue's seating chart to help customers choose their seats
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Delivery Method*
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div 
                  className={`border rounded-md p-3 cursor-pointer ${
                    ticketDeliveryMethod === 'email' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onTicketDeliveryMethodChange('email')}
                >
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">Email</span>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-md p-3 cursor-pointer ${
                    ticketDeliveryMethod === 'print' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onTicketDeliveryMethodChange('print')}
                >
                  <div className="flex items-center">
                    <Printer className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">Print at Home</span>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-md p-3 cursor-pointer ${
                    ticketDeliveryMethod === 'will_call' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onTicketDeliveryMethodChange('will_call')}
                >
                  <div className="flex items-center">
                    <UserCheck className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">Will Call</span>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-md p-3 cursor-pointer ${
                    ticketDeliveryMethod === 'mobile' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onTicketDeliveryMethodChange('mobile')}
                >
                  <div className="flex items-center">
                    <Smartphone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">Mobile</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center">
                <input
                  id="ticketTransferable"
                  name="ticketTransferable"
                  type="checkbox"
                  checked={ticketTransferable}
                  onChange={(e) => onTicketTransferableChange(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="ticketTransferable" className="ml-2 block text-sm text-gray-700">
                  Allow ticket transfer
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                If enabled, customers can transfer their tickets to someone else
              </p>
            </div>
            
            <div>
              <label htmlFor="ticketRefundPolicy" className="block text-sm font-medium text-gray-700 mb-1">
                Refund Policy
              </label>
              <textarea
                id="ticketRefundPolicy"
                value={ticketRefundPolicy}
                onChange={(e) => onTicketRefundPolicyChange(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="e.g., Full refund available up to 7 days before the event. No refunds after that date."
              />
              <p className="mt-1 text-xs text-gray-500">
                Clearly state your refund policy for this event
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 flex items-center text-sm">
                <Ticket className="mr-2 h-4 w-4 text-purple-500" />
                Event Summary
              </h4>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Event Type:</span> {ticketType === 'online' ? 'Online Event' : ticketType === 'physical' ? 'In-Person Event' : 'Hybrid Event'}
                </p>
                {eventDate && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Date & Time:</span> {new Date(eventDate).toLocaleDateString()} at {eventTime}
                  </p>
                )}
                {(ticketType === 'physical' || ticketType === 'hybrid') && venue && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Venue:</span> {venue}
                  </p>
                )}
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Total Tickets:</span> {ticketQuantity}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Delivery Method:</span> {ticketDeliveryMethod === 'email' ? 'Email' : 
                                                                        ticketDeliveryMethod === 'print' ? 'Print at Home' : 
                                                                        ticketDeliveryMethod === 'will_call' ? 'Will Call' : 
                                                                        'Mobile'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 flex items-center mb-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Important Ticket Selling Guidelines
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-5">
            <li>Ensure you have the legal right to sell tickets for this event</li>
            <li>Be clear about any restrictions or requirements (age limits, dress code, etc.)</li>
            <li>Include important details like parking information in your product description</li>
            <li>Consider offering early bird pricing or group discounts</li>
            <li>Make your refund policy clear and easily accessible</li>
            <li>For physical events, ensure venue capacity matches your ticket quantity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};