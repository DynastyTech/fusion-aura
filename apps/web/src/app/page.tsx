import Link from 'next/link';
import Image from 'next/image';
import HeaderNav from '@/components/HeaderNav';
import ProductCarousel from '@/components/ProductCarousel';
import { HiPhone, HiEnvelope, HiSparkles, HiClock, HiShieldCheck } from 'react-icons/hi2';

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

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : Number(value);
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
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-primary-light">Fusion</span>
                <span className="text-2xl font-bold text-primary-dark">Aura</span>
              </div>
            </Link>
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-light/20 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/FusionAuraLogo.png"
              alt="FusionAura Logo"
              width={400}
              height={200}
              className="object-contain"
              priority
            />
          </div>
          <Link
            href="/products"
            className="inline-block bg-primary-dark text-white px-8 py-3 rounded-lg hover:bg-primary-dark/90 transition"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Products Carousel */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Featured Products</h2>
              <p className="text-gray-600 text-lg">Discover our most popular items</p>
            </div>
            <ProductCarousel products={featuredProducts} />
            <div className="text-center mt-8">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-primary-dark text-white px-8 py-3 rounded-lg hover:bg-primary-dark/90 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                View All Products
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-4 rounded-full">
                  <HiSparkles className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Sustainable</h3>
              <p className="text-gray-600">Eco-friendly products for a better tomorrow</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <HiClock className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Timeless</h3>
              <p className="text-gray-600">Proven remedies that stand the test of time</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-center mb-4">
                <div className="bg-purple-100 p-4 rounded-full">
                  <HiShieldCheck className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Trusted</h3>
              <p className="text-gray-600">Quality care you can rely on</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl font-bold text-primary-light">Fusion</span>
                <span className="text-2xl font-bold text-primary-dark">Aura</span>
              </div>
              <p className="text-gray-400 text-sm">
                Sustainable Life, Timeless Remedies, Trusted Care
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <HiPhone className="w-5 h-5 text-primary-light flex-shrink-0" />
                  <a href="tel:+27658090794" className="text-gray-300 hover:text-white transition-colors">
                    065 809 0794
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <HiEnvelope className="w-5 h-5 text-primary-light flex-shrink-0" />
                  <a href="mailto:alphageneralsol@gmail.com" className="text-gray-300 hover:text-white transition-colors">
                    alphageneralsol@gmail.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <HiEnvelope className="w-5 h-5 text-primary-light flex-shrink-0" />
                  <a href="mailto:lraseemela@gmail.com" className="text-gray-300 hover:text-white transition-colors">
                    lraseemela@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <Link href="/products" className="block text-gray-300 hover:text-white transition-colors">
                  Products
                </Link>
                <Link href="/track-order" className="block text-gray-300 hover:text-white transition-colors">
                  Track Order
                </Link>
                <Link href="/login" className="block text-gray-300 hover:text-white transition-colors">
                  Login
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 FusionAura. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
