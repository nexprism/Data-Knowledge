import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getApiBaseUrl } from '../utils/apiConfig';

const TrackerContext = createContext(null);

const rawBase = getApiBaseUrl();
const BASE = rawBase.includes('/api/v1') ? rawBase : `${rawBase}`;

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    // Return a fallback log function if called outside context
    return { trackEvent: () => {} };
  }
  return context;
};

export const TrackerProvider = ({ children }) => {
  const location = useLocation();
  const eventQueue = useRef([]);
  const timerRef = useRef(null);

  // Helper to fetch user ID safely from localStorage
  const getUserId = () => {
    try {
      const userStr = localStorage.getItem('edrilla_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || user._id || 'guest';
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
    return 'guest';
  };

  // Send batch of logs to the server
  const sendBatch = async () => {
    if (eventQueue.current.length === 0) return;

    const batch = [...eventQueue.current];
    eventQueue.current = []; // Clear queue immediately to prevent race conditions

    try {
      await fetch(`${BASE}/activity-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: batch }),
      });
    } catch (error) {
      // Silently discard to prevent network choking and infinite loops
    }
  };

  // Push new event to batch queue
  const trackEvent = (eventName, metadata = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: eventName,
      page: location.pathname + location.search,
      userId: getUserId(),
      meta: metadata,
    };

    eventQueue.current.push(logEntry);

    // If queue gets too full, flush immediately
    if (eventQueue.current.length >= 10) {
      sendBatch();
    }
  };

  // Flush remaining events before unloading page using keepalive fetch
  const flushBeforeUnload = () => {
    if (eventQueue.current.length === 0) return;

    const batch = [...eventQueue.current];
    eventQueue.current = [];

    const payload = JSON.stringify({ logs: batch });
    
    // Attempt navigator.sendBeacon first (ideal for unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${BASE}/activity-logs/beacon`, blob);
    } else {
      // Fallback to fetch keepalive
      fetch(`${BASE}/activity-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  };

  // Setup periodic batch transmission timer
  useEffect(() => {
    timerRef.current = setInterval(sendBatch, 5000);

    const handleUnload = () => flushBeforeUnload();
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('beforeunload', handleUnload);
      flushBeforeUnload();
    };
  }, [location.pathname]);

  // Track page transitions automatically
  useEffect(() => {
    trackEvent('page_view', {
      title: document.title,
    });
  }, [location.pathname]);

  // Global click tracking listener
  useEffect(() => {
    const handleGlobalClick = (event) => {
      // Search upwards for interactive elements
      const target = event.target.closest('button, a, [role="button"], [data-track]');
      if (!target) return;

      const trackName = target.getAttribute('data-track') || 
                        target.innerText?.trim() || 
                        target.getAttribute('aria-label') || 
                        target.id || 
                        'interactive_element';

      // Keep text metadata clean and small
      const textVal = target.innerText?.trim()?.substring(0, 60) || '';

      trackEvent('click', {
        element: target.tagName.toLowerCase(),
        text: textVal,
        id: target.id || undefined,
        class: target.className || undefined,
        name: trackName,
      });
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [location.pathname]);

  return (
    <TrackerContext.Provider value={{ trackEvent }}>
      {children}
    </TrackerContext.Provider>
  );
};
