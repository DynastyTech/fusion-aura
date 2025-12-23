'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/api';
import { getGuestCart } from '@/lib/guestCart';

interface CartContextType {
  itemCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0);

  const refreshCart = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (token) {
        // Authenticated user - fetch from API
        interface CartData {
          items: Array<{ quantity: number }>;
          itemCount?: number;
        }
        
        const response = await apiRequest<CartData>('/api/cart');
        if (response.success && response.data) {
          // Calculate total quantity (sum of all item quantities)
          const items = response.data.items || [];
          const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          const count = response.data.itemCount || totalQuantity || items.length;
          setItemCount(count);
        } else {
          setItemCount(0);
        }
      } else {
        // Guest user - get from localStorage
        const guestItems = getGuestCart();
        // Calculate total quantity
        const totalQuantity = guestItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setItemCount(totalQuantity);
      }
    } catch (error) {
      // If API fails, try guest cart
      const guestItems = getGuestCart();
      const totalQuantity = guestItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setItemCount(totalQuantity);
    }
  };

  useEffect(() => {
    refreshCart();
    
    // Listen for storage changes (cart updates)
    const handleStorageChange = () => {
      refreshCart();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events
    window.addEventListener('cartUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleStorageChange);
    };
  }, []);

  return (
    <CartContext.Provider value={{ itemCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

