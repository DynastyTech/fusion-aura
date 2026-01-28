'use client';

import { usePathname, useRouter } from 'next/navigation';
import { HiArrowLeft } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Don't show on homepage
  const isHomePage = pathname === '/';
  
  // Don't show on admin pages (they have their own navigation)
  const isAdminPage = pathname?.startsWith('/admin');
  
  const shouldShow = !isHomePage && !isAdminPage;

  const handleBack = () => {
    // If there's history, go back; otherwise go to home
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring' as const, damping: 20, stiffness: 300 }}
          onClick={handleBack}
          className="fixed bottom-6 right-6 z-50 md:hidden
                     w-14 h-14 rounded-full bg-[#569330] text-white
                     shadow-lg shadow-[#569330]/30
                     flex items-center justify-center
                     active:scale-95 transition-transform
                     touch-manipulation"
          aria-label="Go back"
        >
          <HiArrowLeft className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
