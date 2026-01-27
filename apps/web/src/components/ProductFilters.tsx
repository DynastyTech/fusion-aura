'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HiMagnifyingGlass, HiXMark, HiAdjustmentsHorizontal, HiChevronDown } from 'react-icons/hi2';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
  totalProducts: number;
}

export default function ProductFilters({ categories, totalProducts }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.get('search') || '')) {
        updateFilters({ search });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const updateFilters = useCallback((newFilters: { search?: string; category?: string; sortBy?: string }) => {
    setIsSearching(true);
    const params = new URLSearchParams(searchParams.toString());
    
    // Update search
    if (newFilters.search !== undefined) {
      if (newFilters.search) {
        params.set('search', newFilters.search);
      } else {
        params.delete('search');
      }
    }
    
    // Update category
    if (newFilters.category !== undefined) {
      if (newFilters.category) {
        params.set('category', newFilters.category);
      } else {
        params.delete('category');
      }
    }
    
    // Update sortBy
    if (newFilters.sortBy !== undefined) {
      if (newFilters.sortBy && newFilters.sortBy !== 'newest') {
        params.set('sortBy', newFilters.sortBy);
      } else {
        params.delete('sortBy');
      }
    }

    router.push(`/products?${params.toString()}`, { scroll: false });
    setTimeout(() => setIsSearching(false), 300);
  }, [router, searchParams]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    updateFilters({ category: newCategory });
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    updateFilters({ sortBy: newSort });
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setSortBy('newest');
    router.push('/products', { scroll: false });
  };

  const hasActiveFilters = search || category || (sortBy && sortBy !== 'newest');

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-xl border border-[rgb(var(--border))] 
                     bg-[rgb(var(--card))] text-[rgb(var(--foreground))]
                     focus:outline-none focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark
                     transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                updateFilters({ search: '' });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full 
                       hover:bg-[rgb(var(--muted))] transition-colors"
            >
              <HiXMark className="w-5 h-5 text-[rgb(var(--muted-foreground))]" />
            </button>
          )}
        </div>

        {/* Desktop Filters */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 rounded-xl border border-[rgb(var(--border))] 
                       bg-[rgb(var(--card))] text-[rgb(var(--foreground))]
                       focus:outline-none focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark
                       cursor-pointer transition-all duration-200 min-w-[160px]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))] pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 rounded-xl border border-[rgb(var(--border))] 
                       bg-[rgb(var(--card))] text-[rgb(var(--foreground))]
                       focus:outline-none focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark
                       cursor-pointer transition-all duration-200 min-w-[180px]"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
            <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))] pointer-events-none" />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-3 rounded-xl 
                       text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]
                       hover:bg-[rgb(var(--muted))] transition-all duration-200"
            >
              <HiXMark className="w-5 h-5" />
              Clear
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-xl 
                   border border-[rgb(var(--border))] bg-[rgb(var(--card))]
                   text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]
                   transition-all duration-200"
        >
          <HiAdjustmentsHorizontal className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary-dark" />
          )}
        </button>
      </div>

      {/* Mobile Filters Panel */}
      {showFilters && (
        <div className="lg:hidden p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-[rgb(var(--border))] 
                         bg-[rgb(var(--background))] text-[rgb(var(--foreground))]
                         focus:outline-none focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))] pointer-events-none" />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
              Sort By
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-[rgb(var(--border))] 
                         bg-[rgb(var(--background))] text-[rgb(var(--foreground))]
                         focus:outline-none focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
              </select>
              <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))] pointer-events-none" />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl 
                       text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]
                       border border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]
                       transition-all duration-200"
            >
              <HiXMark className="w-5 h-5" />
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-[rgb(var(--muted-foreground))]">
          {isSearching ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
              Searching...
            </span>
          ) : (
            <>
              Showing <span className="font-semibold text-[rgb(var(--foreground))]">{totalProducts}</span> 
              {totalProducts === 1 ? ' product' : ' products'}
              {search && (
                <span> for &quot;<span className="font-semibold text-[rgb(var(--foreground))]">{search}</span>&quot;</span>
              )}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
