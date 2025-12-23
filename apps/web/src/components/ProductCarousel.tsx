'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  images: string[];
  category: {
    name: string;
  };
  shortDescription: string | null;
  compareAtPrice: number | string | null;
  inventory: {
    quantity: number;
  } | null;
}

interface ProductCarouselProps {
  products: Product[];
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : Number(value);
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance carousel every 6 seconds (slower for smoother experience)
  useEffect(() => {
    if (!isAutoPlaying || products.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (products.length === 0) return null;

  // Get visible products (current, previous, next)
  const getVisibleProducts = () => {
    const visible = [];
    for (let i = -1; i <= 1; i++) {
      const index = (currentIndex + i + products.length) % products.length;
      visible.push({ product: products[index], position: i });
    }
    return visible;
  };

  return (
    <div className="relative w-full py-8">
      {/* Carousel Container with 3D Perspective */}
      <div className="relative overflow-hidden" style={{ perspective: '1000px' }}>
        <div className="flex items-center justify-center gap-4 md:gap-8">
          {getVisibleProducts().map(({ product, position }) => {
            const isCenter = position === 0;
            const isLeft = position === -1;
            const isRight = position === 1;

            return (
              <div
                key={`${product.id}-${position}`}
                className={`transition-all duration-700 ease-out ${
                  isCenter
                    ? 'w-full md:w-1/2 z-20 scale-100 opacity-100'
                    : isLeft
                    ? 'w-1/4 md:w-1/3 z-10 scale-75 opacity-60 -translate-x-4 md:-translate-x-8'
                    : 'w-1/4 md:w-1/3 z-10 scale-75 opacity-60 translate-x-4 md:translate-x-8'
                } ${isCenter ? '' : 'hidden md:block'}`}
                style={{
                  transform: isCenter
                    ? 'translateZ(0)'
                    : isLeft
                    ? 'translateZ(-100px) rotateY(15deg)'
                    : 'translateZ(-100px) rotateY(-15deg)',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease-out, scale 0.7s ease-out',
                }}
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="block bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out overflow-hidden group"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-64 md:h-80 rounded-t-2xl overflow-hidden bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className={`object-cover transition-transform duration-700 ease-out ${
                          isCenter ? 'group-hover:scale-110' : ''
                        }`}
                        priority={isCenter && currentIndex === 0}
                        loading={isCenter ? 'eager' : 'lazy'}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-primary-dark text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Featured
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="mb-2">
                      <span className="text-xs text-primary-dark font-semibold uppercase tracking-wide">
                        {product.category.name}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-dark transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    {product.shortDescription && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.shortDescription}</p>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-primary-dark">
                          R{toNumber(product.price).toFixed(2)}
                        </span>
                        {product.compareAtPrice && toNumber(product.compareAtPrice) > toNumber(product.price) && (
                          <span className="text-sm text-gray-500 line-through">
                            R{toNumber(product.compareAtPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {product.inventory && product.inventory.quantity > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          In Stock
                        </span>
                      )}
                    </div>
                    {isCenter && (
                      <div className="text-center">
                        <span className="inline-block text-primary-dark font-semibold text-sm group-hover:underline">
                          View Product →
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows */}
      {products.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-lg transition-all hover:scale-110 z-30"
            aria-label="Previous product"
          >
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-lg transition-all hover:scale-110 z-30"
            aria-label="Next product"
          >
            <HiChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {products.length > 1 && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex space-x-2 z-30 mt-4">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-primary-dark w-8'
                  : 'bg-gray-300 hover:bg-gray-400 w-2'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
