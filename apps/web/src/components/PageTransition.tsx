'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [prevPath, setPrevPath] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Skip loading on initial mount
    if (isInitialLoad) {
      setPrevPath(pathname);
      setIsInitialLoad(false);
      return;
    }

    // Only show loading if pathname actually changed
    if (pathname !== prevPath && prevPath !== null) {
      setLoading(true);
      
      // Show loading for 1.5-2 seconds (randomized between 1.5 and 2)
      const loadingTime = 1500 + Math.random() * 500; // 1500ms to 2000ms
      
      const timer = setTimeout(() => {
        setLoading(false);
        setPrevPath(pathname);
      }, loadingTime);

      return () => {
        clearTimeout(timer);
        setLoading(false);
      };
    } else if (prevPath === null) {
      setPrevPath(pathname);
    }
  }, [pathname, prevPath, isInitialLoad]);

  // Don't show loading on initial mount
  if (isInitialLoad) {
    return <>{children}</>;
  }

  return (
    <>
      {loading && <LoadingSpinner message="Loading page..." />}
      <div className={loading ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity duration-300'}>
        {children}
      </div>
    </>
  );
}
