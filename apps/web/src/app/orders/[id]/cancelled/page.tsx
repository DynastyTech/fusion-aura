'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HiXCircle, HiArrowRight } from 'react-icons/hi2';

export default function PaymentCancelledPage() {
  const params = useParams();
  const orderId = params.id as string;

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Cancelled Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto bg-[rgb(var(--muted))] rounded-full flex items-center justify-center">
            <HiXCircle className="w-16 h-16 text-[rgb(var(--muted-foreground))]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[rgb(var(--foreground))] mb-4">
          Payment Cancelled
        </h1>
        
        <p className="text-[rgb(var(--muted-foreground))] mb-8">
          Your payment was cancelled. Don&apos;t worry, your cart items are still saved.
          You can try again or choose a different payment method.
        </p>

        <div className="space-y-4">
          <Link 
            href="/checkout"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            Try Again
            <HiArrowRight className="w-5 h-5" />
          </Link>
          
          <Link 
            href="/cart"
            className="btn-secondary w-full"
          >
            Back to Cart
          </Link>
          
          <Link 
            href="/products"
            className="text-primary-dark hover:underline block mt-4"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="mt-8 p-4 bg-[rgb(var(--muted))]/50 border border-[rgb(var(--border))] rounded-xl">
          <p className="text-[rgb(var(--muted-foreground))] text-sm">
            <strong>Tip:</strong> If you&apos;re having trouble with online payment, 
            please try again or contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}

