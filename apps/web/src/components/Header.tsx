'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import HeaderNav from './HeaderNav';
import { FaLeaf } from 'react-icons/fa';
import { useOptimizedScroll } from '@/hooks/useDebounce';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  // Use optimized scroll with passive listener and requestAnimationFrame
  const handleScroll = useCallback((scrollY: number) => {
    setScrolled(scrollY > 20);
  }, []);

  useOptimizedScroll(handleScroll);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-200
                  ${scrolled 
                    ? 'bg-[rgb(var(--background))]/95 backdrop-blur-md shadow-lg border-b border-[rgb(var(--border))]' 
                    : 'bg-[rgb(var(--background))]/80 backdrop-blur-sm'
                  }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-light to-primary-dark 
                            rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gradient-to-r from-primary-light to-primary-dark 
                            p-2 rounded-xl">
                <FaLeaf className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold">
              <span className="text-primary-light">Fusion</span>
              <span className="text-primary-dark">Aura</span>
            </span>
          </Link>

          {/* Navigation */}
          <HeaderNav />
        </div>
      </div>
    </header>
  );
}

