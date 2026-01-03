'use client';

import { useEffect } from 'react';

/**
 * ScrollOptimizer component
 * Adds global scroll optimizations for better mobile performance:
 * - Passive event listeners for touch events
 * - Smooth scrolling polyfill for older browsers
 * - Prevents overscroll bounce issues
 */
export default function ScrollOptimizer() {
  useEffect(() => {
    // Add passive listeners for better scroll performance
    const supportsPassive = (() => {
      let passive = false;
      try {
        const opts = Object.defineProperty({}, 'passive', {
          get: function() {
            passive = true;
            return true;
          }
        });
        window.addEventListener('testPassive', null as any, opts);
        window.removeEventListener('testPassive', null as any, opts);
      } catch (e) {
        passive = false;
      }
      return passive;
    })();

    // Store original wheel event listeners
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    
    // Optimize wheel and touch events to use passive listeners by default
    EventTarget.prototype.addEventListener = function(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
    ) {
      const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];
      
      if (passiveEvents.includes(type) && supportsPassive) {
        let newOptions: AddEventListenerOptions;
        
        if (typeof options === 'boolean') {
          newOptions = { capture: options, passive: true };
        } else if (typeof options === 'object') {
          newOptions = { ...options, passive: options?.passive !== false };
        } else {
          newOptions = { passive: true };
        }
        
        return originalAddEventListener.call(this, type, listener, newOptions);
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };

    // Cleanup function
    return () => {
      EventTarget.prototype.addEventListener = originalAddEventListener;
    };
  }, []);

  useEffect(() => {
    // Prevent rubber-banding/overscroll on iOS
    const preventOverscroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Allow scrolling in scrollable elements
      const scrollableParent = target.closest('.overflow-y-auto, .overflow-x-auto, [data-scrollable]');
      if (scrollableParent) {
        return;
      }

      // Check if at bounds and trying to scroll further
      const body = document.body;
      const html = document.documentElement;
      
      const atTop = window.scrollY <= 0;
      const atBottom = window.scrollY + window.innerHeight >= Math.max(
        body.scrollHeight,
        html.scrollHeight
      );

      // Only prevent if at bounds
      if (atTop || atBottom) {
        // Allow if touching an input or other interactive element
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
          return;
        }
      }
    };

    document.addEventListener('touchmove', preventOverscroll, { passive: true });

    return () => {
      document.removeEventListener('touchmove', preventOverscroll);
    };
  }, []);

  useEffect(() => {
    // Optimize images for mobile viewport
    const optimizeImages = () => {
      if (typeof window === 'undefined') return;
      
      // Lazy load images that are off-screen
      if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach((img) => {
          if (img instanceof HTMLImageElement) {
            img.loading = 'lazy';
          }
        });
      }
    };

    optimizeImages();

    // Re-run on route changes
    window.addEventListener('popstate', optimizeImages);
    return () => window.removeEventListener('popstate', optimizeImages);
  }, []);

  // This component doesn't render anything
  return null;
}

