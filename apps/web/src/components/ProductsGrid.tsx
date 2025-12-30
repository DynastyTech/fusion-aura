'use client';

import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  images: string[];
  isFeatured?: boolean;
  category: {
    id?: string;
    name: string;
    slug?: string;
  };
  inventory?: {
    quantity: number;
  } | null;
}

interface ProductsGridProps {
  products: Product[];
  showCategory?: boolean;
}

export default function ProductsGrid({ products, showCategory = true }: ProductsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          showCategory={showCategory}
        />
      ))}
    </div>
  );
}

