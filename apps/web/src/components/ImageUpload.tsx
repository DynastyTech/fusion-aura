'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { apiRequest } from '@/lib/api';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload/image`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        return data.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedUrls]);
      
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-[rgb(var(--foreground))]">
        Product Images {images.length > 0 && `(${images.length}/${maxImages})`}
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                width={128}
                height={128}
                className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 sm:p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-target"
                aria-label={`Remove image ${index + 1}`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button - Mobile Optimized */}
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex flex-col items-center justify-center w-full h-32 sm:h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors touch-target
              border-[rgb(var(--border))] bg-[rgb(var(--muted))] hover:bg-[rgb(var(--muted))]/80
              active:bg-[rgb(var(--muted))]/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[rgb(var(--muted-foreground))]">Uploading...</span>
                </div>
              ) : (
                <>
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 mb-2 text-[rgb(var(--muted-foreground))]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-sm sm:text-base font-semibold text-[rgb(var(--foreground))]">
                    Tap to upload images
                  </p>
                  <p className="text-xs sm:text-sm text-[rgb(var(--muted-foreground))] text-center px-4">
                    PNG, JPG, WEBP, GIF (MAX. 10MB each)
                  </p>
                  {images.length > 0 && (
                    <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                      {maxImages - images.length} more {maxImages - images.length === 1 ? 'image' : 'images'} allowed
                    </p>
                  )}
                </>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

