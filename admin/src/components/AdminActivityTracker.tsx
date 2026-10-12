import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface AdminInfo {
  id: string;
  email: string;
  name: string;
}

interface LogEvent {
  timestamp: string;
  event: string;
  page: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  meta: Record<string, any>;
}

interface TrackerContextType {
  trackEvent: (eventName: string, metadata?: Record<string, any>) => void;
}

const TrackerContext = createContext<TrackerContextType | null>(null);

const rawBase = import.meta.env.VITE_BASE_URL || 'https://api.dataknowledge.in';
const BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export const useAdminTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useAdminTracker must be used within an AdminTrackerProvider');
  }
  return context;
};

export const AdminTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const queueRef = useRef<LogEvent[]>([]);
  const timerRef = useRef<number | null>(null);

  // Helper to fetch admin info safely from localStorage
  const getAdminInfo = (): AdminInfo => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          id: user.id || user._id || 'unknown_admin',
          email: user.email || 'unknown_email',
          name: user.name || user.fullName || 'Admin',
        };
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
    return { id: 'unknown_admin', email: 'unknown_email', name: 'Admin' };
  };

  // Enqueue log and flush if limit reached
  const trackEvent = (eventName: string, metadata: Record<string, any> = {}) => {
    const admin = getAdminInfo();
    const eventLog: LogEvent = {
      timestamp: new Date().toISOString(),
      event: eventName,
      page: location.pathname,
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      meta: {
        ...metadata,
        userAgent: navigator.userAgent,
      },
    };

    queueRef.current.push(eventLog);

    if (queueRef.current.length >= 10) {
      flushLogs();
    }
  };

  // Transmit queued logs to backend
  const flushLogs = () => {
    if (queueRef.current.length === 0) return;

    const payload = JSON.stringify({ logs: [...queueRef.current] });
    queueRef.current = []; // Clear queue

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    fetch(`${BASE}/admin-activity-logs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: payload,
    }).catch((err) => {
      console.warn('[AdminTracker] Failed to transmit logs:', err);
    });
  };

  // Synchronous flush on page exit
  const flushOnUnload = () => {
    if (queueRef.current.length === 0) return;

    const payload = JSON.stringify({ logs: [...queueRef.current] });
    queueRef.current = [];

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${BASE}/admin-activity-logs/beacon`, blob);
    } else {
      fetch(`${BASE}/admin-activity-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  };

  // Setup periodic buffer flush (every 5 seconds)
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      flushLogs();
    }, 5000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  // Track page transitions automatically
  useEffect(() => {
    trackEvent('page_view', { path: location.pathname });
  }, [location.pathname]);

  // Capture global click events on interactive components
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Scan up DOM tree for interactive elements
      const interactiveEl = target.closest('button, a, input, select, textarea, [role="button"], [data-track]');
      if (interactiveEl) {
        const tag = interactiveEl.tagName.toLowerCase();
        const type = (interactiveEl as HTMLInputElement).type || '';
        const id = interactiveEl.id || '';
        const className = interactiveEl.className || '';
        const text = interactiveEl.textContent?.trim().substring(0, 50) || '';
        const trackLabel = interactiveEl.getAttribute('data-track') || '';

        // Exclude passwords from meta values
        let val = '';
        if (tag === 'input' && type !== 'password') {
          val = (interactiveEl as HTMLInputElement).value || '';
        }

        trackEvent('click', {
          element: tag,
          type,
          id,
          class: className,
          text,
          trackLabel,
          value: val,
        });
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    window.addEventListener('beforeunload', flushOnUnload);

    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
      window.removeEventListener('beforeunload', flushOnUnload);
    };
  }, [location.pathname]);

  return (
    <TrackerContext.Provider value={{ trackEvent }}>
      {children}
    </TrackerContext.Provider>
  );
};
