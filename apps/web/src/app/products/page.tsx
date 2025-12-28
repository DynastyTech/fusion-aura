import Link from 'next/link';
import Image from 'next/image';
import { HiSparkles, HiMagnifyingGlass, HiAdjustmentsHorizontal } from 'react-icons/hi2';

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

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : Number(value);
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
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium 
                           bg-primary-dark/10 text-primary-dark mb-4 animate-fade-in">
              🌿 Natural Wellness Products
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[rgb(var(--foreground))] 
                         mb-4 animate-fade-in-up">
              Our Products
            </h1>
            <p className="text-lg text-[rgb(var(--muted-foreground))] animate-fade-in-up"
               style={{ animationDelay: '0.1s' }}>
              Sustainable Life, Timeless Remedies, Trusted Care
            </p>
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {products.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group card-hover overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-[rgb(var(--muted))] overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HiSparkles className="w-12 h-12 text-[rgb(var(--muted-foreground))]/30" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-2">
                      {product.isFeatured && (
                        <span className="px-2 py-1 bg-primary-dark text-white text-xs font-semibold 
                                       rounded-lg shadow-lg">
                          Featured
                        </span>
                      )}
                      {product.compareAtPrice && toNumber(product.compareAtPrice) > toNumber(product.price) && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold 
                                       rounded-lg shadow-lg">
                          Sale
                        </span>
                      )}
                    </div>

                    {/* Stock Badge */}
                    {product.inventory && product.inventory.quantity <= 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="px-4 py-2 bg-white/90 text-gray-900 font-semibold rounded-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 lg:p-4">
                    <span className="text-xs text-primary-dark font-medium uppercase tracking-wide">
                      {product.category.name}
                    </span>
                    
                    <h3 className="mt-1 font-semibold text-[rgb(var(--foreground))] 
                                 group-hover:text-primary-dark transition-colors line-clamp-2
                                 text-sm lg:text-base">
                      {product.name}
                    </h3>
                    
                    {product.shortDescription && (
                      <p className="mt-1 text-xs lg:text-sm text-[rgb(var(--muted-foreground))] 
                                  line-clamp-2 hidden sm:block">
                        {product.shortDescription}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-2 lg:mt-3 flex items-baseline gap-2">
                      <span className="text-lg lg:text-xl font-bold text-primary-dark">
                        R{toNumber(product.price).toFixed(2)}
                      </span>
                      {product.compareAtPrice && toNumber(product.compareAtPrice) > toNumber(product.price) && (
                        <span className="text-xs lg:text-sm text-[rgb(var(--muted-foreground))] line-through">
                          R{toNumber(product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stock Indicator */}
                    {product.inventory && product.inventory.quantity > 0 && (
                      <div className="mt-2 hidden lg:block">
                        <span className={`text-xs font-medium ${
                          product.inventory.quantity < 10 
                            ? 'text-orange-600' 
                            : 'text-green-600'
                        }`}>
                          {product.inventory.quantity < 10 
                            ? `Only ${product.inventory.quantity} left!` 
                            : 'In Stock'}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
