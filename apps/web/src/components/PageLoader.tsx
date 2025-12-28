'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Show loader on initial page load
  useEffect(() => {
    if (isInitialLoad) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setIsInitialLoad(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  // Show loader on route changes
  useEffect(() => {
    if (!isInitialLoad) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isInitialLoad]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgb(var(--background))]"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Logo with animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-light to-primary-dark blur-3xl opacity-30 scale-150 animate-pulse" />
              
              {/* Logo */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="relative"
              >
                <Image
                  src="/FusionAuraLogo.png"
                  alt="FusionAura"
                  width={200}
                  height={100}
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-col items-center gap-4"
            >
              {/* Animated dots */}
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary-light to-primary-dark"
                  />
                ))}
              </div>

              {/* Loading text */}
              <p className="text-sm text-[rgb(var(--muted-foreground))] font-medium">
                Loading...
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

