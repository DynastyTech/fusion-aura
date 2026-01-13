'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 sm:h-[500px] bg-[rgb(var(--muted))] rounded-lg flex items-center justify-center">
        <svg
          className="w-32 h-32 text-[rgb(var(--muted-foreground))]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full h-96 sm:h-[500px] bg-[rgb(var(--muted))] rounded-lg overflow-hidden">
        <Image
          src={images[selectedIndex]}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          priority={selectedIndex === 0}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      
      {/* Thumbnail Gallery (if more than 1 image) */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
          {images.map((imageUrl, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all touch-target ${
                index === selectedIndex
                  ? 'border-primary-dark ring-2 ring-primary-dark/50'
                  : 'border-transparent hover:border-primary-dark/50 active:border-primary-dark'
              }`}
              aria-label={`View ${productName} image ${index + 1}`}
            >
              <Image
                src={imageUrl}
                alt={`${productName} - Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 25vw, 20vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
