import Link from 'next/link';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import ProductsGrid from '@/components/ProductsGrid';
import ProductFilters from '@/components/ProductFilters';
import Pagination from '@/components/Pagination';

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
  page?: string;
}

const ITEMS_PER_PAGE = 50;

async function getProducts(params: SearchParams): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const urlParams = new URLSearchParams();
  
  // Set high limit to get all products for filtering/pagination
  urlParams.set('limit', '1000');
  
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
  const [allProducts, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ]);

  // Pagination
  const currentPage = parseInt(params.page || '1', 10);
  const totalProducts = allProducts.length;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const products = allProducts.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Page Header */}
      <section className="relative py-8 lg:py-12 overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/10 via-transparent to-primary-dark/5" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">

        </div>
      </section>

      {/* Filters & Products Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Filters */}
        <div className="mb-8">
          <ProductFilters categories={categories} totalProducts={totalProducts} />
        </div>

        {/* Products */}
        {allProducts.length === 0 ? (
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
          <>
            <ProductsGrid products={products} />
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalProducts}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        )}
      </main>
    </div>
  );
}
