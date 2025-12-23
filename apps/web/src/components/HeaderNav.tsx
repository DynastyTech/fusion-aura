'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { HiShoppingCart } from 'react-icons/hi2';

export default function HeaderNav() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav className="flex items-center space-x-6">
      <Link href="/products" className="text-gray-700 hover:text-primary-dark">
        Products
      </Link>
      {!isAdmin && (
        <Link href="/cart" className="relative text-gray-700 hover:text-primary-dark">
          <HiShoppingCart className="w-6 h-6" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary-dark text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </Link>
      )}
      {user ? (
        <>
          {!isAdmin && (
            <Link href="/orders" className="text-gray-700 hover:text-primary-dark">
              My Orders
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/dashboard" className="text-gray-700 hover:text-primary-dark">
              Admin Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/orders" className="text-gray-700 hover:text-primary-dark">
              Orders Management
            </Link>
          )}
          <span className="text-sm text-gray-600">{user.firstName || user.email}</span>
          <button
            onClick={logout}
            className="text-gray-700 hover:text-primary-dark text-sm"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/track-order" className="text-gray-700 hover:text-primary-dark">
            Track Order
          </Link>
          <Link href="/login" className="text-gray-700 hover:text-primary-dark">
            Login
          </Link>
        </>
      )}
    </nav>
  );
}

