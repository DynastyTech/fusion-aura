'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
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
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for existing token and validate it
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      // Validate token by fetching current user
      refreshUser();
    } else {
      setLoading(false);
    }
    
    // Also listen for focus events to refresh auth state when user returns to tab
    const handleFocus = () => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (currentToken && !user) {
        refreshUser();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

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
