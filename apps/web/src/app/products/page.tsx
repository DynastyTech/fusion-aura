import Link from 'next/link';
import { HiMagnifyingGlass, HiArrowLeft } from 'react-icons/hi2';
import ProductsGrid from '@/components/ProductsGrid';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number | string;
  compareAtPrice: number | string | null;
  images: string[];
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  inventory: {
    quantity: number;
  } | null;
}

export const dynamic = 'force-dynamic';

async function getProducts(search?: string): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = search
    ? `${apiUrl}/api/products?search=${encodeURIComponent(search)}`
    : `${apiUrl}/api/products`;
  
  try {
    const res = await fetch(url, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch products:', res.statusText);
      return [];
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Page Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/10 via-transparent to-primary-dark/5" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6
                     text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]
                     hover:bg-[rgb(var(--muted))] transition-all duration-200 font-medium"
          >
            <HiArrowLeft className="w-5 h-5" />
            Back
          </Link>
          
          <div className="text-center max-w-3xl mx-auto">
           
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[rgb(var(--foreground))] 
                         mb-4 animate-fade-in-up">
              Our Products
            </h1>
            
          </div>
        </div>
      </section>

      {/* Products Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {products.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--muted))] 
                          flex items-center justify-center">
              <HiMagnifyingGlass className="w-8 h-8 text-[rgb(var(--muted-foreground))]" />
            </div>
            <p className="text-lg text-[rgb(var(--muted-foreground))]">No products found.</p>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
              Check back later for new arrivals!
            </p>
          </div>
        ) : (
          <>
            {/* Products Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-[rgb(var(--muted-foreground))]">
                Showing <span className="font-semibold text-[rgb(var(--foreground))]">{products.length}</span> products
              </p>
            </div>

            {/* Products Grid */}
            <ProductsGrid products={products} />
          </>
        )}
      </main>
    </div>
  );
}
