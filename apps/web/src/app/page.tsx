import Link from 'next/link';
import Image from 'next/image';
import ProductCarousel from '@/components/ProductCarousel';
import { HiArrowRight } from 'react-icons/hi2';

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number | string;
  compareAtPrice: number | string | null;
  images: string[];
  category: {
    name: string;
  };
  inventory: {
    quantity: number;
  } | null;
}

// Mark page as dynamic to allow no-store fetches
export const dynamic = 'force-dynamic';

async function getFeaturedProducts(): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const res = await fetch(`${apiUrl}/api/products?isFeatured=true&limit=6`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch featured products:', res.statusText);
      return [];
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <main className="min-h-screen overflow-x-hidden w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Effects - hidden on mobile for performance */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/20 via-transparent to-primary-dark/10 dark:from-primary-dark/10 dark:via-transparent dark:to-primary-light/5" />
        <div className="hidden md:block absolute top-0 left-1/4 w-96 h-96 bg-primary-light/30 rounded-full blur-3xl animate-float" />
        <div className="hidden md:block absolute bottom-0 right-1/4 w-80 h-80 bg-primary-dark/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8 animate-fade-in-down">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-light to-primary-dark blur-3xl opacity-30 scale-150" />
              <Image
                src="/FusionAuraLogo.png"
                alt="FusionAura Logo"
                width={350}
                height={175}
                className="relative object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Tagline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <span className="gradient-text">Sustainable Life</span>
            <br />
            <span className="text-[rgb(var(--foreground))]">Timeless Remedies</span>
          </h1>

          <p className="text-lg sm:text-xl text-[rgb(var(--muted-foreground))] max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Link
              href="/products"
              className="group btn-primary px-8 py-4 text-lg animate-pulse-glow"
              style={{ 
                backgroundColor: 'rgb(34, 197, 94)',
                backgroundImage: 'linear-gradient(135deg, rgb(163, 230, 53), rgb(34, 197, 94))'
              }}
            >
              Shop Now
              <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/track-order"
              className="btn-secondary px-8 py-4 text-lg"
            >
              Track Your Order
            </Link>
          </div>

          </div>
      </section>

      

      {/* Featured Products Carousel */}
      {featuredProducts.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">

            
            <ProductCarousel products={featuredProducts} />
            
            <div className="text-center mt-12">
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 text-lg font-semibold 
                           text-primary-dark hover:text-primary-dark/80 transition-colors"
              >
                View All Products
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

    </main>
  );
}
