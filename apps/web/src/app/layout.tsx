import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { PageTransition } from '@/components/PageTransition';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FusionAura - Sustainable Life, Timeless Remedies, Trusted Care',
  description: 'FusionAura offers sustainable, timeless remedies and trusted care for your wellness journey.',
  keywords: ['sustainable', 'wellness', 'remedies', 'natural', 'health'],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <PageTransition>
              {children}
            </PageTransition>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

