import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Outfit, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageLoader from '@/components/PageLoader';
import ScrollOptimizer from '@/components/ScrollOptimizer';

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FusionAura - Sustainable Life, Timeless Remedies, Trusted Care',
  description: 'FusionAura offers sustainable, timeless remedies and trusted care for your wellness journey.',
  keywords: ['sustainable', 'wellness', 'remedies', 'natural', 'health'],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body className={`${outfit.variable} ${spaceGrotesk.variable} font-sans antialiased overflow-x-hidden`}>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
              <ScrollOptimizer />
              <Suspense fallback={null}>
                <PageLoader />
              </Suspense>
              <div className="flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden w-full">
                <Header />
                <main className="flex-1 overflow-x-hidden">
                  {children}
                </main>
                <Footer />
              </div>
            </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
