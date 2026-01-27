'use client';

import Link from 'next/link';
import { HiCheckCircle } from 'react-icons/hi2';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <HiCheckCircle className="w-16 h-16 text-[#569330] mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Order Successful!</h1>
          <p className="text-gray-600 mb-8">Thank you for your purchase.</p>
          <a href="/orders" className="text-primary-dark hover:underline">
            View Orders
          </a>
        </div>
      </div>
    </div>
  );
}

