'use client';

import Link from 'next/link';
import { HiXCircle } from 'react-icons/hi2';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <HiXCircle className="w-16 h-16 text-[rgb(var(--muted-foreground))] mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Order Cancelled</h1>
          <p className="text-gray-600 mb-8">Your order was not completed.</p>
          <Link href="/cart" className="text-primary-dark hover:underline">
            Return to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
