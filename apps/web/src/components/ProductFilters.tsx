'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
  onFilterChange?: () => void;
}

export default function ProductFilters({ categories, onFilterChange }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy) params.set('sort', sortBy);
    if (priceRange.min) params.set('minPrice', priceRange.min);
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    
    const search = searchParams.get('search');
    if (search) params.set('search', search);
    
    router.push(`/products?${params.toString()}`);
    onFilterChange?.();
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSortBy('newest');
    setPriceRange({ min: '', max: '' });
    router.push('/products');
    onFilterChange?.();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Filter Products</h3>
      
      <div className="space-y-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range (ZAR)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
            />
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={applyFilters}
            className="flex-1 bg-primary-dark text-white py-2 rounded-lg hover:bg-primary-dark/90"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

