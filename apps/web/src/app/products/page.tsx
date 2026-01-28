import Link from 'next/link';
import { HiMagnifyingGlass, HiArrowLeft } from 'react-icons/hi2';
import ProductsGrid from '@/components/ProductsGrid';
import ProductFilters from '@/components/ProductFilters';

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SearchParams {
  search?: string;
  category?: string;
  sortBy?: string;
}

async function getProducts(params: SearchParams): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const urlParams = new URLSearchParams();
  
  // Set high limit to show all products
  urlParams.set('limit', '500');
  
  if (params.search) urlParams.set('search', params.search);
  if (params.category) urlParams.set('categoryId', params.category);
  if (params.sortBy) urlParams.set('sortBy', params.sortBy);
  
  const queryString = urlParams.toString();
  const url = `${apiUrl}/api/products?${queryString}`;
  
  try {
    // Use short revalidation for products - keeps data fresh but enables caching
    const res = await fetch(url, {
      next: { revalidate: 30 }, // Cache for 30 seconds
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

async function getCategories(): Promise<Category[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    // Categories rarely change - cache for longer
    const res = await fetch(`${apiUrl}/api/categories`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      console.error('Failed to fetch categories:', res.statusText);
      return [];
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Page Header */}
      <section className="relative py-8 lg:py-12 overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/10 via-transparent to-primary-dark/5" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4
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
            <p className="text-[rgb(var(--muted-foreground))] text-lg">
              Browse our collection of premium products
            </p>
          </div>
        </div>
      </section>

      {/* Filters & Products Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Filters */}
        <div className="mb-8">
          <ProductFilters categories={categories} totalProducts={products.length} />
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--muted))] 
                          flex items-center justify-center">
              <HiMagnifyingGlass className="w-8 h-8 text-[rgb(var(--muted-foreground))]" />
            </div>
            <p className="text-lg text-[rgb(var(--muted-foreground))]">No products found.</p>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
              {params.search || params.category ? (
                <>Try adjusting your search or filters</>
              ) : (
                <>Check back later for new arrivals!</>
              )}
            </p>
            {(params.search || params.category) && (
              <Link 
                href="/products"
                className="inline-flex items-center gap-2 mt-4 px-6 py-2 rounded-xl
                         bg-primary-dark text-white hover:bg-primary-dark/90 transition-colors"
              >
                Clear Filters
              </Link>
            )}
          </div>
        ) : (
          <ProductsGrid products={products} />
        )}
      </main>
    </div>
  );
}
