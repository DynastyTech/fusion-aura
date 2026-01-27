'use client';

import Link from 'next/link';
import { FaLeaf, FaTools, FaArrowLeft } from 'react-icons/fa';

interface UnderConstructionProps {
  pageName: string;
}

export default function UnderConstruction({ pageName }: UnderConstructionProps) {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center px-4">
      <div className="text-center max-w-lg mx-auto">
        {/* Animated Icon */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-light to-primary-dark 
                          rounded-full blur-2xl opacity-30 animate-pulse" />
          <div className="relative bg-gradient-to-r from-primary-light to-primary-dark 
                          p-6 rounded-full animate-bounce-gentle">
            <FaTools className="w-12 h-12 text-white" />
          </div>
          
          {/* Floating leaves */}
          <div className="absolute -top-4 -right-4 animate-float">
            <FaLeaf className="w-6 h-6 text-primary-light" />
          </div>
          <div className="absolute -bottom-2 -left-4 animate-float-slow">
            <FaLeaf className="w-5 h-5 text-primary-dark" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--foreground))] mb-4 animate-fade-in-up">
          {pageName}
        </h1>

        {/* Message */}
        <div className="space-y-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-xl text-primary-dark font-semibold flex items-center justify-center gap-2">
            <FaLeaf className="w-5 h-5" />
            Under Maintenance
            <FaLeaf className="w-5 h-5" />
          </p>
          <p className="text-[rgb(var(--muted-foreground))]">
            We&apos;re working hard to bring you something amazing. 
            This page will be live soon!
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="h-2 bg-[rgb(var(--muted))] rounded-full overflow-hidden max-w-xs mx-auto">
            <div className="h-full bg-gradient-to-r from-primary-light to-primary-dark rounded-full 
                            animate-pulse" style={{ width: '60%' }} />
          </div>
          <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
            Coming soon...
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" 
             style={{ animationDelay: '0.3s' }}>
          <Link href="/" className="btn-primary">
            <FaArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link href="/products" className="btn-secondary">
            Browse Products
          </Link>
        </div>

        {/* Contact info */}
        <p className="mt-8 text-sm text-[rgb(var(--muted-foreground))] animate-fade-in-up"
           style={{ animationDelay: '0.4s' }}>
          Questions? Contact us at{' '}
          <a href="mailto:fusionauraza@gmail.com" 
             className="text-primary-dark hover:underline">
            fusionauraza@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

