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
  HiEnvelope,
  HiInformationCircle,
} from 'react-icons/hi2';
import { FaLeaf } from 'react-icons/fa';

export default function HeaderNav() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [mobileMenuOpen]);

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

      {/* Full-Screen Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Full-Screen Mobile Menu */}
      <div
        className={`fixed top-0 left-0 right-0 bottom-0 w-full h-full 
                    bg-[rgb(var(--background))] z-[999] md:hidden
                    transform transition-transform duration-300 ease-out
                    ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ minHeight: '100vh', minHeight: '100dvh' }}
      >
        <div className="flex flex-col h-full min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-r from-primary-light to-primary-dark">
                <FaLeaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">
                <span className="text-primary-light">Fusion</span>
                <span className="text-primary-dark">Aura</span>
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors"
              aria-label="Close menu"
            >
              <HiXMark className="w-7 h-7 text-[rgb(var(--foreground))]" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-6 py-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/30">
              <p className="font-semibold text-lg text-[rgb(var(--foreground))]">
                Welcome, {user.firstName || 'User'}
              </p>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">{user.email}</p>
              {isAdmin && (
                <span className="inline-block mt-2 px-3 py-1 text-xs font-medium 
                               bg-primary-dark text-white rounded-full">
                  Administrator
                </span>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl
                         text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                         active:bg-[rgb(var(--muted))] transition-all duration-200"
            >
              <div className="p-3 rounded-xl bg-primary-light/20">
                <HiHome className="w-6 h-6 text-primary-dark" />
              </div>
              <span className="font-semibold text-lg">Home</span>
            </Link>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl
                           text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                           active:bg-[rgb(var(--muted))] transition-all duration-200"
              >
                <div className="p-3 rounded-xl bg-primary-light/20">
                  <link.icon className="w-6 h-6 text-primary-dark" />
                </div>
                <span className="font-semibold text-lg">{link.label}</span>
              </Link>
            ))}

            {!isAdmin && (
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl
                           text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                           active:bg-[rgb(var(--muted))] transition-all duration-200"
              >
                <div className="p-3 rounded-xl bg-primary-light/20">
                  <HiShoppingCart className="w-6 h-6 text-primary-dark" />
                </div>
                <span className="font-semibold text-lg">Cart</span>
                {itemCount > 0 && (
                  <span className="ml-auto bg-primary-dark text-white text-sm 
                                 font-bold px-3 py-1 rounded-full">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Divider */}
            <div className="my-4 border-t border-[rgb(var(--border))]" />

            {/* Secondary Links */}
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl
                         text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                         active:bg-[rgb(var(--muted))] transition-all duration-200"
            >
              <div className="p-3 rounded-xl bg-blue-500/20">
                <HiEnvelope className="w-6 h-6 text-blue-500" />
              </div>
              <span className="font-semibold text-lg">Contact Us</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl
                         text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                         active:bg-[rgb(var(--muted))] transition-all duration-200"
            >
              <div className="p-3 rounded-xl bg-purple-500/20">
                <HiInformationCircle className="w-6 h-6 text-purple-500" />
              </div>
              <span className="font-semibold text-lg">About Us</span>
            </Link>

            {/* Theme Toggle in Menu */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl w-full
                         text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                         active:bg-[rgb(var(--muted))] transition-all duration-200"
            >
              <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-yellow-500/20' : 'bg-slate-500/20'}`}>
                {theme === 'dark' ? (
                  <HiSun className="w-6 h-6 text-yellow-500" />
                ) : (
                  <HiMoon className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <span className="font-semibold text-lg">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
          </nav>

          {/* Footer Actions */}
          <div className="p-6 border-t border-[rgb(var(--border))] bg-[rgb(var(--background))]">
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 
                           rounded-2xl bg-red-500 text-white font-semibold text-lg
                           hover:bg-red-600 active:bg-red-700 transition-all duration-200"
              >
                <HiArrowRightOnRectangle className="w-6 h-6" />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 
                           rounded-2xl bg-gradient-to-r from-primary-light to-primary-dark 
                           text-white font-semibold text-lg
                           hover:opacity-90 active:opacity-80 transition-all duration-200
                           shadow-lg shadow-primary-dark/30"
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
