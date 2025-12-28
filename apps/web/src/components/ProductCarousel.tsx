'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HiChevronLeft, HiChevronRight, HiSparkles } from 'react-icons/hi2';

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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Auto-advance carousel every 6 seconds
  useEffect(() => {
    if (!isAutoPlaying || products.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [products.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [products.length]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
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
    <div 
      className="relative w-full py-8"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
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
                  className="block bg-[rgb(var(--card))] rounded-2xl shadow-xl hover:shadow-2xl 
                           transition-all duration-500 ease-out overflow-hidden group
                           border border-[rgb(var(--border))]"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-56 sm:h-64 md:h-80 rounded-t-2xl overflow-hidden bg-[rgb(var(--muted))]">
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
                      <div className="w-full h-full flex items-center justify-center">
                        <HiSparkles className="w-16 h-16 text-[rgb(var(--muted-foreground))]/30" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-primary-dark text-white 
                                  px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold shadow-lg">
                      Featured
                    </div>
                    
                    {/* Sale badge */}
                    {product.compareAtPrice && toNumber(product.compareAtPrice) > toNumber(product.price) && (
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-red-500 text-white 
                                    px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg">
                        Sale
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 sm:p-6">
                    <div className="mb-2">
                      <span className="text-xs text-primary-dark font-semibold uppercase tracking-wide">
                        {product.category.name}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[rgb(var(--foreground))] mb-2 
                                 group-hover:text-primary-dark transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    {product.shortDescription && (
                      <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4 line-clamp-2 hidden sm:block">
                        {product.shortDescription}
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-bold text-primary-dark">
                          R{toNumber(product.price).toFixed(2)}
                        </span>
                        {product.compareAtPrice && toNumber(product.compareAtPrice) > toNumber(product.price) && (
                          <span className="text-sm text-[rgb(var(--muted-foreground))] line-through">
                            R{toNumber(product.compareAtPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {product.inventory && product.inventory.quantity > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                       bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                          In Stock
                        </span>
                      )}
                    </div>
                    {isCenter && (
                      <div className="text-center">
                        <span className="inline-flex items-center gap-1 text-primary-dark font-semibold 
                                       text-sm group-hover:gap-2 transition-all">
                          View Product
                          <HiChevronRight className="w-4 h-4" />
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
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 
                     bg-[rgb(var(--card))]/90 hover:bg-[rgb(var(--card))] 
                     text-[rgb(var(--foreground))] p-2 sm:p-3 rounded-full 
                     shadow-lg transition-all hover:scale-110 z-30
                     border border-[rgb(var(--border))] touch-target"
            aria-label="Previous product"
          >
            <HiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 
                     bg-[rgb(var(--card))]/90 hover:bg-[rgb(var(--card))] 
                     text-[rgb(var(--foreground))] p-2 sm:p-3 rounded-full 
                     shadow-lg transition-all hover:scale-110 z-30
                     border border-[rgb(var(--border))] touch-target"
            aria-label="Next product"
          >
            <HiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {products.length > 1 && (
        <div className="flex justify-center gap-2 mt-6 z-30">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-300 touch-target ${
                index === currentIndex
                  ? 'bg-primary-dark w-8'
                  : 'bg-[rgb(var(--muted-foreground))]/30 hover:bg-[rgb(var(--muted-foreground))]/50 w-2.5'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
