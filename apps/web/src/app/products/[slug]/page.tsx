import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
import RelatedProducts from '@/components/RelatedProducts';
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

async function getProduct(slug: string): Promise<Product | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const res = await fetch(`${apiUrl}/api/products/${slug}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

async function getProducts(): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/products`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [product, allProducts] = await Promise.all([
    getProduct(params.slug),
    getProducts(),
  ]);

  if (!product) {
    notFound();
  }

  // Get related products (exclude current product)
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Logo href="/" width={180} height={60} />
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Product Detail */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/products"
          className="text-primary-dark hover:text-primary-dark/80 mb-6 inline-block"
        >
          ← Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {product.images && product.images.length > 0 ? (
              <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-32 h-32 text-gray-400"
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
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <span className="text-sm text-primary-dark font-semibold">
                {product.category.name}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-3">
                <span className="text-4xl font-bold text-primary-dark">
                  R{toNumber(product.price).toFixed(2)}
                </span>
                {product.compareAtPrice && toNumber(product.compareAtPrice) > toNumber(product.price) && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      R{toNumber(product.compareAtPrice).toFixed(2)}
                    </span>
                    <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                      Save R{(toNumber(product.compareAtPrice) - toNumber(product.price)).toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Stock Status */}
            {product.inventory && (
              <div className="mb-6">
                <span
                  className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                    product.inventory.quantity > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {product.inventory.quantity > 0
                    ? `✓ In Stock (${product.inventory.quantity} available)`
                    : '✗ Out of Stock'}
                </span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Add to Cart Button */}
            <AddToCartButton product={product} />
            <p className="text-sm text-gray-500 text-center mt-4">
              Free shipping on orders over R500
            </p>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <RelatedProducts products={relatedProducts} currentProductId={product.id} />
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

