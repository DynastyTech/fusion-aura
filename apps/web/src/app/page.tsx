import Link from 'next/link';
import Image from 'next/image';
import ProductCarousel from '@/components/ProductCarousel';
import { 
  HiClock, 
  HiShieldCheck,
  HiArrowRight,
  HiTruck,
  HiCurrencyDollar,
  HiHeart,
} from 'react-icons/hi2';
import { FaLeaf } from 'react-icons/fa';

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

const features = [
  {
    icon: FaLeaf,
    title: 'Sustainable',
    description: 'Eco-friendly products for a better tomorrow',
    gradient: 'from-emerald-400 to-green-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    icon: HiClock,
    title: 'Timeless',
    description: 'Proven remedies that stand the test of time',
    gradient: 'from-blue-400 to-indigo-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: HiShieldCheck,
    title: 'Trusted',
    description: 'Quality care you can rely on',
    gradient: 'from-purple-400 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
];

const benefits = [
  {
    icon: HiTruck,
    title: 'Fast Delivery',
    description: 'Swift shipping nationwide',
  },
  {
    icon: HiCurrencyDollar,
    title: 'Best Prices',
    description: 'Competitive market rates',
  },
  {
    icon: HiHeart,
    title: '100% Natural',
    description: 'Pure, organic ingredients',
  },
  {
    icon: HiShieldCheck,
    title: 'Quality Assured',
    description: 'Rigorous quality checks',
  },
];

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
            Experience the perfect fusion of nature and innovation. 
            Discover products that care for you and the planet.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Link
              href="/products"
              className="group btn-primary px-8 py-4 text-lg animate-pulse-glow"
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

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-[rgb(var(--muted))]/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--foreground))] mb-4">
              Why Choose FusionAura?
            </h2>

            <p className="text-lg text-[rgb(var(--muted-foreground))]">
              We&apos;re committed to bringing you the best in natural wellness
            </p>
            {/* Benefits Bar */}
      <section className="py-6 border-y border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={benefit.title}
                className="flex items-center gap-3 justify-center md:justify-start animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <benefit.icon className="w-6 h-6 text-primary-dark flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[rgb(var(--foreground))] text-sm md:text-base">
                    {benefit.title}
                  </p>
                  <p className="text-xs text-[rgb(var(--muted-foreground))] hidden md:block">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative card-hover p-8 text-center"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} 
                                opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative">
                  <div className={`inline-flex p-4 rounded-2xl ${feature.bgColor} mb-6
                                  group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-8 h-8 bg-gradient-to-r ${feature.gradient} 
                                             bg-clip-text text-transparent`} 
                                  style={{ color: 'inherit' }} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-[rgb(var(--foreground))] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[rgb(var(--muted-foreground))]">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-light to-primary-dark p-8 md:p-12 lg:p-16 text-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Wellness?
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                Join thousands of satisfied customers who have discovered the power of natural remedies
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-dark 
                           font-semibold rounded-xl hover:bg-white/90 transition-all duration-200
                           shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Start Shopping
                <HiArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
