import { supabase } from '../lib/supabase';

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

let sessionTimeoutId: number | null = null;
let lastActivityTime = Date.now();

// Track user activity
export const trackUserActivity = () => {
  lastActivityTime = Date.now();
};

// Set up event listeners to track user activity
export const setupActivityTracking = () => {
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  
  events.forEach(event => {
    window.addEventListener(event, trackUserActivity);
  });
  
  // Start timeout check
  startSessionTimeout();
};

// Clean up event listeners
export const cleanupActivityTracking = () => {
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  
  events.forEach(event => {
    window.removeEventListener(event, trackUserActivity);
  });
  
  if (sessionTimeoutId) {
    window.clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }
};

// Start session timeout check
export const startSessionTimeout = () => {
  // Clear any existing timeout
  if (sessionTimeoutId) {
    window.clearTimeout(sessionTimeoutId);
  }
  
  // Set new timeout
  sessionTimeoutId = window.setTimeout(() => {
    checkSessionTimeout();
  }, 60 * 1000); // Check every minute
};

// Check if session has timed out
const checkSessionTimeout = async () => {
  const currentTime = Date.now();
  const timeSinceLastActivity = currentTime - lastActivityTime;
  
  if (timeSinceLastActivity >= SESSION_TIMEOUT) {
    // Session has timed out, sign out
    await supabase.auth.signOut();
    
    // Show timeout message
    alert('Your session has expired due to inactivity. Please sign in again.');
    
    // Redirect to auth page
    window.location.href = '/auth';
  } else {
    // Continue checking
    startSessionTimeout();
  }
};

// Get the remaining session time in seconds
export const getSessionTimeRemaining = () => {
  const currentTime = Date.now();
  const timeSinceLastActivity = currentTime - lastActivityTime;
  const timeRemaining = SESSION_TIMEOUT - timeSinceLastActivity;
  
  return Math.max(0, Math.floor(timeRemaining / 1000));
};