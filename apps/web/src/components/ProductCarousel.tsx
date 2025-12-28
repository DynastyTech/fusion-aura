'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FaLeaf, FaEye } from 'react-icons/fa';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './ProductCarousel.css';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  images: string[];
  category: {
    name: string;
  };
  shortDescription: string | null;
  compareAtPrice: number | string | null;
  inventory: {
    quantity: number;
  } | null;
}

interface ProductCarouselProps {
  products: Product[];
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : Number(value);
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  if (products.length === 0) return null;

  return (
    <div className="product-carousel-section">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={24}
        slidesPerView="auto"
        centeredSlides={true}
        loop={products.length > 3}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation={true}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        className="product-swiper"
      >
        {products.map((product) => {
          const price = toNumber(product.price);
          const comparePrice = toNumber(product.compareAtPrice);
          const hasDiscount = comparePrice > price;
          const inStock = product.inventory && product.inventory.quantity > 0;
          const isHovered = hoveredProduct === product.id;

          return (
            <SwiperSlide key={product.id}>
              <div
                className="product-card-carousel"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                {/* Product Image */}
                <div className="product-image">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 480px) 280px, (max-width: 768px) 300px, 380px"
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      <FaLeaf />
                    </div>
                  )}

                  {/* Featured Badge */}
                  <span className="product-badge">Featured</span>

                  {/* Hover Overlay */}
                  <div className="product-overlay">
                    <Link href={`/products/${product.slug}`} className="btn">
                      <FaEye />
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Product Info */}
                <div className="product-info">
                  <p className="product-category-tag">{product.category.name}</p>
                  <h3>{product.name}</h3>
                  {product.shortDescription && (
                    <p className="product-description">{product.shortDescription}</p>
                  )}

                  {/* Footer */}
                  <div className="product-footer">
                    <div className="product-price-container">
                      <span className="product-price">R{price.toFixed(2)}</span>
                      {hasDiscount && (
                        <span className="product-price-original">
                          R{comparePrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className={`product-stock ${inStock ? 'in-stock' : 'out-of-stock'}`}>
                      {inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
