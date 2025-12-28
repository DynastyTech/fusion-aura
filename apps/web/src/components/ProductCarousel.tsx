'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import { motion } from 'framer-motion';
import { FaLeaf, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '@/contexts/CartContext';
import { addToGuestCart } from '@/lib/guestCart';
import { apiRequest } from '@/lib/api';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
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
  const { refreshCart } = useCart();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  if (products.length === 0) return null;

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (token) {
        // Authenticated user - use API
        await apiRequest('/api/cart/items', {
          method: 'POST',
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
          }),
        });
      } else {
        // Guest user - use localStorage
        addToGuestCart(
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            images: product.images,
          },
          1
        );
      }
      
      // Refresh cart count
      await refreshCart();
      
      // Dispatch cart updated event
      window.dispatchEvent(new Event('cartUpdated'));
      
      setTimeout(() => setAddingToCart(null), 1000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setAddingToCart(null);
    }
  };

  return (
    <section className="product-carousel-section">
      <div className="container mx-auto px-4">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Featured Products</h2>
          <p>Our most popular natural remedies trusted by customers nationwide</p>
        </motion.div>

        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView="auto"
          coverflowEffect={{
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          pagination={{ clickable: true }}
          navigation={true}
          className="product-swiper"
        >
          {products.map((product) => {
            const price = toNumber(product.price);
            const inStock = product.inventory && product.inventory.quantity > 0;

            return (
              <SwiperSlide key={product.id}>
                <motion.div
                  className="product-card-carousel"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="product-image">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 300px, 400px"
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        <FaLeaf />
                      </div>
                    )}
                    <div className="product-overlay">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleAddToCart(product)}
                        disabled={addingToCart === product.id || !inStock}
                      >
                        <FaShoppingCart size={20} />
                        {!inStock
                          ? 'Out of Stock'
                          : addingToCart === product.id
                          ? 'Added!'
                          : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                  <div className="product-info">
                    <Link href={`/products/${product.slug}`}>
                      <h3>{product.name}</h3>
                    </Link>
                    {product.shortDescription && (
                      <p className="product-description">{product.shortDescription}</p>
                    )}
                    <div className="product-footer">
                      <span className="product-price">R{price.toFixed(2)}</span>
                      <span className="product-category">{product.category.name}</span>
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
