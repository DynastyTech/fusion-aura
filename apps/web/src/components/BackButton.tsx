'use client';

import { useRouter } from 'next/navigation';
import { HiArrowLeft } from 'react-icons/hi2';

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
}

export default function BackButton({ 
  fallbackHref = '/', 
  label = 'Back',
  className = ''
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's browser history to go back to
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl
                 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]
                 hover:bg-[rgb(var(--muted))] transition-all duration-200
                 font-medium ${className}`}
    >
      <HiArrowLeft className="w-5 h-5" />
      {label}
    </button>
  );
}

