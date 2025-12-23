import Link from 'next/link';
import Image from 'next/image';
import HeaderNav from '@/components/HeaderNav';
import Logo from '@/components/Logo';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number | string; // Prisma Decimal can be string or number
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

// Helper function to convert Prisma Decimal to number
function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : Number(value);
}

async function getProducts(search?: string): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = search
    ? `${apiUrl}/api/products?search=${encodeURIComponent(search)}`
    : `${apiUrl}/api/products`;
  
  try {
    const res = await fetch(url, {
      cache: 'no-store', // Always fetch fresh data in development
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Logo href="/" width={180} height={60} />
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Products Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Our Products</h1>
          <p className="text-gray-600">Sustainable Life, Timeless Remedies, Trusted Care</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found.</p>
            <p className="text-gray-400 text-sm mt-2">
              Make sure the API is running on port 3001
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Product Image */}
                <div className="relative w-full h-64 bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="lazy"
                      />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        className="w-24 h-24"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {product.isFeatured && (
                    <div className="absolute top-2 right-2 bg-primary-dark text-white px-2 py-1 rounded text-xs font-semibold">
                      Featured
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 uppercase">
                      {product.category.name}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-dark transition-colors">
                    {product.name}
                  </h3>
                  {product.shortDescription && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.shortDescription}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-primary-dark">
                        R{toNumber(product.price).toFixed(2)}
                      </span>
                      {product.compareAtPrice && toNumber(product.compareAtPrice) > toNumber(product.price) && (
                        <span className="text-sm text-gray-500 line-through">
                          R{toNumber(product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {product.inventory && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          product.inventory.quantity > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.inventory.quantity > 0
                          ? `In Stock (${product.inventory.quantity})`
                          : 'Out of Stock'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-2">
            <span className="text-primary-light">Fusion</span>
            <span className="text-primary-dark">Aura</span>
          </p>
          <p className="text-gray-400 text-sm">© 2024 FusionAura. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
