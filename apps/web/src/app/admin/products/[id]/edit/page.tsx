'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';
import Logo from '@/components/Logo';

interface Category {
  id: string;
  name: string;
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
  });

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
  }, [router, productId, fetchData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriesRes, productRes] = await Promise.all([
        apiRequest<Category[]>('/api/categories'),
        apiRequest<Product>(`/api/products/${productId}`),
      ]);

      // Categories: API returns { success: true, data: [...] }
      if (categoriesRes.success && categoriesRes.data) {
        const categoriesArray = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
        setCategories(categoriesArray);
      }

      // Product: API returns { success: true, data: {...} }
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
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        images,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <div className="flex items-center">
                <Logo href="/admin/dashboard" width={180} height={60} />
              </div>
            </Link>
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-primary-dark">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Product</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Same form fields as new product page */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Slug * 
                <span className="text-xs text-gray-500 font-normal ml-2">
                  (URL-friendly version of product name)
                </span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., premium-organic-honey"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
              />
              <p className="mt-1 text-xs text-gray-500">
                Used in URLs: yoursite.com/products/<strong>{formData.slug || 'product-slug'}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price (ZAR) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="Brief product title (e.g., 'Premium Organic Honey')"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
            />
          </div>

          <div>
            <ImageUpload
              images={Array.isArray(formData.images) ? formData.images : typeof formData.images === 'string' ? formData.images.split(',').map(url => url.trim()).filter(url => url.length > 0) : []}
              onImagesChange={(images) => setFormData({ ...formData, images })}
              maxImages={5}
            />
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-primary-dark focus:ring-primary-dark"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="rounded border-gray-300 text-primary-dark focus:ring-primary-dark"
              />
              <span className="ml-2 text-sm text-gray-700">Featured</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-dark text-white rounded-md hover:bg-primary-dark/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

