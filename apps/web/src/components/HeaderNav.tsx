'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  HiShoppingCart, 
  HiBars3, 
  HiXMark, 
  HiSun, 
  HiMoon,
  HiHome,
  HiShoppingBag,
  HiClipboardDocumentList,
  HiCog6Tooth,
  HiArrowRightOnRectangle,
  HiMagnifyingGlass,
  HiUser,
} from 'react-icons/hi2';

export default function HeaderNav() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  const navLinks = user ? (
    isAdmin ? [
      { href: '/admin/dashboard', label: 'Dashboard', icon: HiCog6Tooth },
      { href: '/admin/orders', label: 'Orders', icon: HiClipboardDocumentList },
      { href: '/products', label: 'Products', icon: HiShoppingBag },
    ] : [
      { href: '/products', label: 'Products', icon: HiShoppingBag },
      { href: '/orders', label: 'My Orders', icon: HiClipboardDocumentList },
      { href: '/track-order', label: 'Track Order', icon: HiMagnifyingGlass },
    ]
  ) : [
    { href: '/products', label: 'Products', icon: HiShoppingBag },
    { href: '/track-order', label: 'Track Order', icon: HiMagnifyingGlass },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[rgb(var(--foreground))]/70 
                       hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                       transition-all duration-200"
          >
            <link.icon className="w-4 h-4" />
            <span className="font-medium">{link.label}</span>
          </Link>
        ))}

        {!isAdmin && (
          <Link 
            href="/cart" 
            className="relative p-2 rounded-xl text-[rgb(var(--foreground))]/70 
                       hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                       transition-all duration-200"
          >
            <HiShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-dark text-white text-xs 
                             font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center
                             animate-scale-in">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-[rgb(var(--foreground))]/70 
                     hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                     transition-all duration-200"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <HiSun className="w-5 h-5 text-yellow-400" />
          ) : (
            <HiMoon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {user ? (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[rgb(var(--border))]">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">
              {user.firstName || user.email?.split('@')[0]}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-red-500 
                         hover:bg-red-50 dark:hover:bg-red-900/20
                         transition-all duration-200 text-sm font-medium"
            >
              <HiArrowRightOnRectangle className="w-4 h-4" />
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 ml-2 px-4 py-2 rounded-xl
                       bg-primary-dark text-white font-medium
                       hover:bg-primary-dark/90 transition-all duration-200"
          >
            <HiUser className="w-4 h-4" />
            Login
          </Link>
        )}
      </nav>

      {/* Mobile Navigation Button */}
      <div className="flex md:hidden items-center gap-2">
        {!isAdmin && (
          <Link href="/cart" className="relative p-2">
            <HiShoppingCart className="w-6 h-6 text-[rgb(var(--foreground))]" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-dark text-white text-xs 
                             font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
        )}
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <HiSun className="w-5 h-5 text-yellow-400" />
          ) : (
            <HiMoon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <HiXMark className="w-6 h-6 text-[rgb(var(--foreground))]" />
          ) : (
            <HiBars3 className="w-6 h-6 text-[rgb(var(--foreground))]" />
          )}
        </button>
      </div>

      {/* Full-Screen Mobile Menu */}
      <div
        className={`fixed inset-0 bg-[rgb(var(--background))] z-50 
                    transform transition-all duration-300 ease-out md:hidden
                    ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
      >
        <div className="flex flex-col h-full safe-top safe-bottom">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border))]">
            <span className="font-bold text-xl gradient-text">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors"
            >
              <HiXMark className="w-7 h-7" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-4 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50">
              <p className="font-semibold text-[rgb(var(--foreground))]">
                {user.firstName || 'User'}
              </p>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">{user.email}</p>
              {isAdmin && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium 
                               bg-primary-dark text-white rounded-full">
                  Admin
                </span>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-6 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-4 px-6 py-4 rounded-2xl
                         text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                         transition-all duration-200 text-lg"
            >
              <div className="p-2 rounded-xl bg-primary-light/20">
                <HiHome className="w-6 h-6 text-primary-dark" />
              </div>
              <span className="font-semibold">Home</span>
            </Link>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl
                           text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                           transition-all duration-200 text-lg"
              >
                <div className="p-2 rounded-xl bg-primary-light/20">
                  <link.icon className="w-6 h-6 text-primary-dark" />
                </div>
                <span className="font-semibold">{link.label}</span>
              </Link>
            ))}

            {!isAdmin && (
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl
                           text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                           transition-all duration-200 text-lg"
              >
                <div className="p-2 rounded-xl bg-primary-light/20">
                  <HiShoppingCart className="w-6 h-6 text-primary-dark" />
                </div>
                <span className="font-semibold">Cart</span>
                {itemCount > 0 && (
                  <span className="ml-auto bg-primary-dark text-white text-sm 
                                 font-bold px-3 py-1 rounded-full">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}
          </nav>

          {/* Footer Actions */}
          <div className="p-6 border-t border-[rgb(var(--border))] space-y-3">
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 
                           rounded-2xl bg-red-500/10 text-red-500 font-semibold text-lg
                           hover:bg-red-500/20 transition-all duration-200"
              >
                <HiArrowRightOnRectangle className="w-6 h-6" />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 
                           rounded-2xl bg-primary-dark text-white font-semibold text-lg
                           hover:bg-primary-dark/90 transition-all duration-200"
              >
                <HiUser className="w-6 h-6" />
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
