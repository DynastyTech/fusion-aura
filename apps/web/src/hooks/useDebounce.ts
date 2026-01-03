'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Custom hook that returns a debounced version of the provided value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook that returns a debounced callback function
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update the callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Custom hook that returns a throttled callback function
 * Better for scroll events as it fires at consistent intervals
 * @param callback - The function to throttle
 * @param delay - Minimum delay between calls in milliseconds
 */
export function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update the callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule a trailing call
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastRun);
      }
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * Custom hook for optimized scroll handling with passive listeners
 * @param callback - Function to call on scroll
 * @param options - Configuration options
 */
export function useOptimizedScroll(
  callback: (scrollY: number) => void,
  options: { throttle?: number; debounce?: number } = {}
) {
  const { throttle = 16, debounce } = options; // 16ms = ~60fps
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      lastScrollY.current = window.scrollY;

      if (debounce) {
        // Debounced mode
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(lastScrollY.current);
        }, debounce);
      } else if (!ticking.current) {
        // Throttled mode using requestAnimationFrame
        window.requestAnimationFrame(() => {
          callback(lastScrollY.current);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, debounce, throttle]);

  return lastScrollY;
}

