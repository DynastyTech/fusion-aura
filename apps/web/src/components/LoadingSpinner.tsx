'use client';

import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({ fullScreen = true, message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${
        fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0'
      } bg-white/95 backdrop-blur-sm flex items-center justify-center`}
    >
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-primary-dark border-r-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

