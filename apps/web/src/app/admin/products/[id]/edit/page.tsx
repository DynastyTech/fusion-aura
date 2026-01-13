'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';
import { 
  HiArrowLeft, 
  HiCheck,
  HiCube,
  HiTag,
  HiCurrencyDollar,
  HiArrowPath,
} from 'react-icons/hi2';

interface Category {
  id: string;
  name: string;
}

interface Inventory {
  quantity: number;
  lowStockThreshold?: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number | string;
  compareAtPrice: number | string | null;
  categoryId: string;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  inventory?: Inventory | null;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    compareAtPrice: '',
    categoryId: '',
    images: [] as string[] | string,
    isActive: true,
    isFeatured: false,
    stockQuantity: '0',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriesRes, productRes] = await Promise.all([
        apiRequest<Category[]>('/api/categories'),
        apiRequest<Product>(`/api/products/${productId}`),
      ]);

      if (categoriesRes.success && categoriesRes.data) {
        const categoriesArray = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
        setCategories(categoriesArray);
      }

      if (productRes.success && productRes.data) {
        const product = productRes.data;
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          price: String(product.price || ''),
          compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
          categoryId: product.categoryId || '',
          images: Array.isArray(product.images) ? product.images : [],
          isActive: product.isActive ?? true,
          isFeatured: product.isFeatured ?? false,
          stockQuantity: String(product.inventory?.quantity ?? 0),
        });
      } else {
        console.error('Failed to fetch product:', productRes.error);
        alert('Failed to load product. Redirecting to dashboard...');
        router.push('/admin/dashboard');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading product data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router, productId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'ADMIN') {
      router.push('/products');
      return;
    }

    fetchData();
  }, [fetchData, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const images = Array.isArray(formData.images)
        ? formData.images
        : typeof formData.images === 'string'
        ? formData.images
            .split(',')
            .map((url) => url.trim())
            .filter((url) => url.length > 0)
        : [];

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        shortDescription: formData.shortDescription,
        categoryId: formData.categoryId,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        images,
        initialQuantity: parseInt(formData.stockQuantity) || 0,
      };

      const response = await apiRequest(`/api/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (response.success) {
        router.push('/admin/dashboard');
      } else {
        alert(response.error || 'Failed to update product');
      }
    } catch (error) {
      alert('Error updating product');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-dark border-t-transparent 
                        rounded-full animate-spin mb-4" />
          <p className="text-[rgb(var(--muted-foreground))]">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] pb-safe-bottom">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-[rgb(var(--muted-foreground))] 
                       hover:text-primary-dark transition-colors mb-2 touch-target"
            >
              <HiArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--foreground))]">
              Edit Product
            </h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4 flex items-center gap-2">
                  <HiCube className="w-5 h-5 text-primary-dark" />
                  Basic Information
                </h2>
                
                <div className="space-y-4">
            <div>
                    <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                      Product Name *
                    </label>
              <input
                type="text"
                required
                value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: generateSlug(e.target.value),
                        });
                      }}
                      className="input-field"
                      placeholder="e.g., Premium Organic Honey"
              />
            </div>

            <div>
                    <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                      URL Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="input-field"
                      placeholder="premium-organic-honey"
              />
                    <p className="mt-1.5 text-xs text-[rgb(var(--muted-foreground))]">
                      Product URL: /products/<span className="font-medium">{formData.slug || 'slug'}</span>
              </p>
            </div>

            <div>
                    <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      placeholder="Brief product summary for listings"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                      Full Description
                    </label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input-field resize-none"
                      placeholder="Detailed product description..."
                    />
                  </div>
                </div>
              </div>

              {/* Images Card */}
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4">
                  Product Images
                </h2>
                <ImageUpload
                  images={Array.isArray(formData.images) ? formData.images : typeof formData.images === 'string' ? formData.images.split(',').map(url => url.trim()).filter(url => url.length > 0) : []}
                  onImagesChange={(images) => setFormData({ ...formData, images })}
                  maxImages={5}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing & Stock Card */}
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4 flex items-center gap-2">
                  <HiCurrencyDollar className="w-5 h-5 text-primary-dark" />
                  Pricing & Stock
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                      Price (ZAR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))]">
                        R
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="input-field pl-8"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                      Compare-at Price (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))]">
                        R
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.compareAtPrice}
                        onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                        className="input-field pl-8"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-[rgb(var(--muted-foreground))]">
                      Shows as strikethrough price if higher than price
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      className="input-field"
                      placeholder="0"
                    />
                    <p className="mt-1.5 text-xs text-[rgb(var(--muted-foreground))]">
                      Number of items available in stock
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Card */}
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4 flex items-center gap-2">
                  <HiTag className="w-5 h-5 text-primary-dark" />
                  Organization
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                      Category *
                    </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="input-field"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

                  <div className="pt-2 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group touch-target">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors
                        ${formData.isActive 
                          ? 'bg-primary-dark border-primary-dark' 
                          : 'border-[rgb(var(--border))] group-hover:border-primary-dark/50'}`}>
                        {formData.isActive && <HiCheck className="w-4 h-4 text-white" />}
          </div>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="sr-only"
              />
                      <span className="text-sm text-[rgb(var(--foreground))]">Active (visible to customers)</span>
            </label>

                    <label className="flex items-center gap-3 cursor-pointer group touch-target">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors
                        ${formData.isFeatured 
                          ? 'bg-primary-dark border-primary-dark' 
                          : 'border-[rgb(var(--border))] group-hover:border-primary-dark/50'}`}>
                        {formData.isFeatured && <HiCheck className="w-4 h-4 text-white" />}
                      </div>
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="sr-only"
              />
                      <span className="text-sm text-[rgb(var(--foreground))]">Featured (show on homepage)</span>
            </label>
          </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full justify-center touch-target"
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                      <HiArrowPath className="w-5 h-5 animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <HiCheck className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
                
            <Link
              href="/admin/dashboard"
                  className="btn-secondary w-full justify-center touch-target"
            >
              Cancel
            </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
