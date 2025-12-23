'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  images: string[];
  category: {
    name: string;
  };
  inventory: {
    quantity: number;
  } | null;
}

interface RelatedProductsProps {
  products: Product[];
  currentProductId: string;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : Number(value);
}

export default function RelatedProducts({ products, currentProductId }: RelatedProductsProps) {
  // Filter out current product
  const relatedProducts = products.filter((p) => p.id !== currentProductId).slice(0, 4);

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-16 border-t">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
          >
            {product.images && product.images.length > 0 ? (
              <div className="relative w-full h-48 bg-gray-100">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="p-4">
              <div className="mb-2">
                <span className="text-xs text-gray-500 uppercase">{product.category.name}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-dark transition-colors line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-primary-dark">
                  R{toNumber(product.price).toFixed(2)}
                </span>
                {product.inventory && product.inventory.quantity > 0 && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    In Stock
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

