'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout in milliseconds (60 minutes)
const SESSION_TIMEOUT = 60 * 60 * 1000;
const ACTIVITY_KEY = 'lastActivity';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    }
  }, []);

  // Check if session has expired due to inactivity
  const checkSessionExpiry = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const lastActivity = localStorage.getItem(ACTIVITY_KEY);
    if (!lastActivity) return false;
    
    const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
    return timeSinceActivity > SESSION_TIMEOUT;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Check for session expiry due to inactivity
      if (checkSessionExpiry()) {
        console.log('Session expired due to inactivity');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem(ACTIVITY_KEY);
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await getCurrentUser();
      if (response.success && response.data) {
        const userData = response.data as any;
        setUser({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
        });
        // Update localStorage to keep it in sync
        localStorage.setItem('user', JSON.stringify(userData));
        // Update activity on successful auth
        updateActivity();
      } else {
        // Only clear if we get an explicit auth error, not network errors
        // Check if the user data exists in localStorage as a fallback
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser({
              id: userData.id,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
            });
          } catch {
            // Invalid stored data
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // On network error, try to use stored user data
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser({
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
          });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [checkSessionExpiry, updateActivity]);

  // Set up activity tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check for session expiry periodically
    const checkInterval = setInterval(() => {
      if (user && checkSessionExpiry()) {
        console.log('Session expired due to inactivity');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem(ACTIVITY_KEY);
        setUser(null);
        router.push('/login');
      }
    }, 60000); // Check every minute

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(checkInterval);
    };
  }, [user, checkSessionExpiry, updateActivity, router]);

  useEffect(() => {
    // Check for existing token and validate it
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      // Initialize activity timestamp if not set
      if (!localStorage.getItem(ACTIVITY_KEY)) {
        updateActivity();
      }
      // Validate token by fetching current user
      refreshUser();
    } else {
      setLoading(false);
    }
    
    // Also listen for focus events to refresh auth state when user returns to tab
    const handleFocus = () => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (currentToken) {
        // Update activity when user returns to tab
        updateActivity();
        if (!user) {
          refreshUser();
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Listen for storage changes (e.g., login from another tab or same tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | Event) => {
      // Handle both StorageEvent (cross-tab) and custom events (same-tab)
      if (e instanceof StorageEvent) {
        if (e.key === 'token' || e.key === 'user') {
          const token = localStorage.getItem('token');
          if (token) {
            refreshUser();
          } else {
            setUser(null);
          }
        }
      } else {
        // Custom event (same-tab login/logout)
        const token = localStorage.getItem('token');
        if (token) {
          refreshUser();
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom storage events
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(ACTIVITY_KEY);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        setUser,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
