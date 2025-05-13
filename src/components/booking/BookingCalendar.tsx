import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  X,
  AlertCircle,
  MapPin
} from 'lucide-react';

interface BookingCalendarProps {
  productId: string;
  creatorId: string;
  availableDays: string[];
  timeSlots: string[];
  callDuration: number;
  onBookingComplete?: (bookingId: string) => void;
  className?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  productId,
  creatorId,
  availableDays,
  timeSlots,
  callDuration,
  onBookingComplete,
  className
}) => {
  const { user, session } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Handle month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Check if a day is available for booking
  const isDayAvailable = (date: Date) => {
    // Convert day of week to string representation
    const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const dayMap: Record<number, string> = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
    };
    
    const dayName = dayMap[dayIndex];
    return availableDays.includes(dayName);
  };

  // Check if a date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Format a date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Format a time slot nicely
  const formatTimeSlot = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return time;
    }
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + durationMinutes);
    
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Fetch available slots for a specific date
  const fetchAvailableSlots = async (date: Date) => {
    if (!date || !productId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const formattedDate = formatDate(date);
      
      // API version - use RPC function
      const { data, error } = await supabase.rpc(
        'get_available_slots',
        { 
          p_product_id: productId,
          p_date: formattedDate
        }
      );
      
      if (error) throw error;
      
      setAvailableSlots(data || []);
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setError('Failed to load available time slots. Please try again.');
      // Fall back to client-side check
      checkSlotsAvailability(date);
    } finally {
      setLoading(false);
    }
  };

  // Fallback - check availability without using the RPC function
  const checkSlotsAvailability = async (date: Date) => {
    if (!date || !productId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const formattedDate = formatDate(date);
      
      // Get already booked slots for this date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('start_time')
        .eq('product_id', productId)
        .eq('booking_date', formattedDate)
        .neq('status', 'cancelled');
        
      if (bookingsError) throw bookingsError;
      
      // Find which slots are booked
      const bookedSlots = new Set(bookings?.map(b => b.start_time) || []);
      
      // Create available slots array
      const slots: TimeSlot[] = timeSlots.map(start => ({
        start,
        end: calculateEndTime(start, callDuration),
        isAvailable: !bookedSlots.has(start)
      }));
      
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error checking slot availability:', err);
      setError('Failed to load available time slots. Please try again.');
      
      // Fallback - show all slots as available
      const slots: TimeSlot[] = timeSlots.map(start => ({
        start,
        end: calculateEndTime(start, callDuration),
        isAvailable: true
      }));
      
      setAvailableSlots(slots);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, productId]);

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isPastDate(date) || !isDayAvailable(date)) {
      return;
    }
    
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  // Handle slot selection
  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setError(null);
  };

  // Handle booking submission
  const handleBooking = async () => {
    if (!session) {
      setError('You must be logged in to book a call.');
      return;
    }
    
    if (!selectedDate || !selectedSlot) {
      setError('Please select a date and time slot.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Format the date as YYYY-MM-DD
      const formattedDate = formatDate(selectedDate);
      
      // Create the booking
      const { data, error } = await supabase.rpc(
        'create_booking',
        {
          p_product_id: productId,
          p_booking_date: formattedDate,
          p_start_time: selectedSlot,
          p_notes: notes
        }
      );
      
      if (error) throw error;
      
      setSuccess('Your booking has been confirmed! Please check your email for details.');
      setConfirming(false);
      
      // Refetch available slots to reflect the new booking
      fetchAvailableSlots(selectedDate);
      
      // Reset form
      setSelectedSlot(null);
      setNotes('');
      
      // Call the callback if provided
      if (onBookingComplete && data) {
        onBookingComplete(data);
      }
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render the calendar
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    // Build the days
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;
      
      const isAvailable = isDayAvailable(date);
      const isPast = isPastDate(date);
      
      days.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => handleDateSelect(date)}
          disabled={isPast || !isAvailable}
          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm
            ${isSelected 
              ? 'bg-purple-600 text-white font-semibold' 
              : isPast
                ? 'text-gray-400 cursor-not-allowed'
                : !isAvailable
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-purple-100'
            }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const confirmBooking = () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please select a date and time slot before booking.');
      return;
    }
    
    if (!session) {
      setError('Please log in to book this call.');
      return;
    }
    
    setConfirming(true);
  };

  const cancelConfirmation = () => {
    setConfirming(false);
  };

  return (
    <div className={className}>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:space-x-6">
            {/* Calendar Section */}
            <div className="md:w-1/2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5 text-purple-600" />
                  Select a Date
                </h3>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                <p>Available days: {availableDays.join(', ')}</p>
                <p>Call duration: {callDuration} minutes</p>
              </div>
            </div>
            
            {/* Time Slots Section */}
            <div className="mt-6 md:mt-0 md:w-1/2">
              <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                <Clock className="mr-2 h-5 w-5 text-purple-600" />
                Select a Time
              </h3>
              
              {selectedDate ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Selected Date: <span className="font-medium">{selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric'
                    })}</span>
                  </p>
                  
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No available time slots for this day.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => handleSlotSelect(slot.start)}
                          className={`p-3 text-center rounded-md text-sm font-medium
                            ${selectedSlot === slot.start
                              ? 'bg-purple-600 text-white' 
                              : !slot.isAvailable
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-purple-50'
                            }`}
                        >
                          {formatTimeSlot(slot.start)} - {formatTimeSlot(slot.end)}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">Please select a date to view available time slots.</p>
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start">
              <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{success}</p>
            </div>
          )}
          
          {selectedDate && selectedSlot && !confirming && !success && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button 
                onClick={confirmBooking}
                fullWidth
                className="mt-2"
              >
                Book This Time Slot
              </Button>
            </div>
          )}
          
          {confirming && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Your Booking</h3>
              <div className="bg-purple-50 border border-purple-100 rounded-md p-4 mb-4">
                <p className="text-sm font-medium text-purple-800">
                  {selectedDate?.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-purple-800">
                  {selectedSlot && formatTimeSlot(selectedSlot)} - {selectedSlot && formatTimeSlot(calculateEndTime(selectedSlot, callDuration))}
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Let the creator know if you have any specific requests or questions."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                ></textarea>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={cancelConfirmation}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBooking}
                  isLoading={loading}
                  className="flex-1"
                >
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};