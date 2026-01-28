import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
import RelatedProducts from '@/components/RelatedProducts';
import ProductImageGallery from '@/components/ProductImageGallery';

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

// Use ISR - revalidate every 60 seconds
export const revalidate = 60;

async function getProduct(slug: string): Promise<Product | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const res = await fetch(`${apiUrl}/api/products/${slug}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
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
      next: { revalidate: 60 }, // Cache for 60 seconds
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
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Product Detail */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/products"
          className="text-primary-dark hover:text-primary-dark/80 mb-6 inline-block"
        >
          ← Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images Gallery */}
          <ProductImageGallery images={product.images || []} productName={product.name} />

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <span className="text-sm text-primary-dark font-semibold">
                {product.category.name}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[rgb(var(--foreground))] mb-4">{product.name}</h1>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-3">
                <span className="text-4xl font-bold text-primary-dark">
                  R{toNumber(product.price).toFixed(2)}
                </span>
                {product.compareAtPrice && toNumber(product.compareAtPrice) > toNumber(product.price) && (
                  <>
                    <span className="text-xl text-[rgb(var(--muted-foreground))] line-through">
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
                      ? 'bg-[#569330]/10 text-[#569330]'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {product.inventory.quantity > 0
                    ? `In Stock (${product.inventory.quantity} available)`
                    : 'Out of Stock'}
                </span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-3">Description</h2>
                <p className="text-[rgb(var(--muted-foreground))] whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Add to Cart Button */}
            <AddToCartButton product={product} />
            
            {/* Delivery Info */}
            <div className="mt-6 p-4 rounded-xl bg-[rgb(var(--muted))]/50 border border-[rgb(var(--border))]">
              <h4 className="font-semibold text-[rgb(var(--foreground))] mb-2">Delivery Options</h4>
              <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
                <li>• <strong>Door-to-Door Courier:</strong> R80 throughout South Africa</li>
                <li>• <strong>Free Pick Up:</strong> Sunninghill, Sandton or Waterfall, Midrand</li>
              </ul>
            </div>
            
            <p className="text-sm text-[rgb(var(--muted-foreground))] text-center mt-4">
              Secure online payment via iKhokha
            </p>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <RelatedProducts products={relatedProducts} currentProductId={product.id} />
        )}
      </main>
    </div>
  );
}

