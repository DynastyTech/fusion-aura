'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiRequest } from '@/lib/api';

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  compareAtPrice: number | string | null;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  inventory: {
    quantity: number;
  } | null;
}

interface WishlistItem {
  id: string;
  productId: string;
  product: WishlistProduct;
  addedAt: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  count: number;
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  moveToCart: (productId: string, quantity?: number) => Promise<boolean>;
  clearWishlist: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Local storage key for guest wishlist
const GUEST_WISHLIST_KEY = 'fusionaura_guest_wishlist';

// Guest wishlist helpers
function getGuestWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(GUEST_WISHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveGuestWishlist(productIds: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(productIds));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [guestWishlist, setGuestWishlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshWishlist = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      setIsAuthenticated(true);
      try {
        const response = await apiRequest<{ items: WishlistItem[]; count: number }>('/api/wishlist');
        if (response.success && response.data) {
          setItems(response.data.items);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      }
    } else {
      setIsAuthenticated(false);
      // Load guest wishlist from localStorage
      const guestItems = getGuestWishlist();
      setGuestWishlist(guestItems);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshWishlist();
    
    // Listen for auth changes
    const handleStorageChange = () => {
      refreshWishlist();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, [refreshWishlist]);

  const isInWishlist = useCallback((productId: string): boolean => {
    if (isAuthenticated) {
      return items.some((item) => item.productId === productId);
    }
    return guestWishlist.includes(productId);
  }, [items, guestWishlist, isAuthenticated]);

  const addToWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (isAuthenticated) {
      try {
        const response = await apiRequest('/api/wishlist/add', {
          method: 'POST',
          body: JSON.stringify({ productId }),
        });
        if (response.success) {
          await refreshWishlist();
          return true;
        }
      } catch (error) {
        console.error('Error adding to wishlist:', error);
      }
      return false;
    } else {
      // Guest wishlist
      const newWishlist = [...guestWishlist, productId];
      saveGuestWishlist(newWishlist);
      setGuestWishlist(newWishlist);
      return true;
    }
  }, [isAuthenticated, guestWishlist, refreshWishlist]);

  const removeFromWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (isAuthenticated) {
      try {
        const response = await apiRequest(`/api/wishlist/remove/${productId}`, {
          method: 'DELETE',
        });
        if (response.success) {
          await refreshWishlist();
          return true;
        }
      } catch (error) {
        console.error('Error removing from wishlist:', error);
      }
      return false;
    } else {
      // Guest wishlist
      const newWishlist = guestWishlist.filter((id) => id !== productId);
      saveGuestWishlist(newWishlist);
      setGuestWishlist(newWishlist);
      return true;
    }
  }, [isAuthenticated, guestWishlist, refreshWishlist]);

  const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (isInWishlist(productId)) {
      return removeFromWishlist(productId);
    } else {
      return addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  const moveToCart = useCallback(async (productId: string, quantity = 1): Promise<boolean> => {
    if (!isAuthenticated) {
      // For guests, just remove from wishlist - they'll add to cart separately
      return removeFromWishlist(productId);
    }
    
    try {
      const response = await apiRequest('/api/wishlist/move-to-cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
      if (response.success) {
        await refreshWishlist();
        // Trigger cart refresh
        window.dispatchEvent(new Event('cartUpdated'));
        return true;
      }
    } catch (error) {
      console.error('Error moving to cart:', error);
    }
    return false;
  }, [isAuthenticated, refreshWishlist, removeFromWishlist]);

  const clearWishlist = useCallback(async (): Promise<void> => {
    if (isAuthenticated) {
      try {
        await apiRequest('/api/wishlist/clear', { method: 'DELETE' });
        setItems([]);
      } catch (error) {
        console.error('Error clearing wishlist:', error);
      }
    } else {
      saveGuestWishlist([]);
      setGuestWishlist([]);
    }
  }, [isAuthenticated]);

  const count = isAuthenticated ? items.length : guestWishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        count,
        isLoading,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        moveToCart,
        clearWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

