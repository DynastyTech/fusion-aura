'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProductSearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ProductSearch({ onSearch, placeholder = 'Search products...', className = '' }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSearch) {
        onSearch(query);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
      />
      <svg
        className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}

