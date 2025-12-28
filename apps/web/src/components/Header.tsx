'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import HeaderNav from './HeaderNav';
import { FaLeaf } from 'react-icons/fa';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300
                  ${scrolled 
                    ? 'bg-[rgb(var(--background))]/80 backdrop-blur-xl shadow-lg border-b border-[rgb(var(--border))]' 
                    : 'bg-transparent'
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

