'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, logout } from '@/lib/api';
import { 
  HiPencilSquare, 
  HiTrash, 
  HiPlus, 
  HiMagnifyingGlass,
  HiClipboardDocumentList,
  HiCheckCircle,
  HiXCircle,
  HiCube,
  HiCurrencyDollar,
} from 'react-icons/hi2';
import { FaLeaf } from 'react-icons/fa';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  isActive: boolean;
  isFeatured: boolean;
  inventory: { quantity: number } | null;
  category: { name: string };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);

    if (userData.role !== 'ADMIN') {
      router.push('/products');
      return;
    }

    fetchProducts();
  }, [router]);

  const fetchProducts = async (search?: string) => {
    try {
      setLoading(true);
      const url = search
        ? `/api/products?search=${encodeURIComponent(search)}`
        : '/api/products';
      const response = await apiRequest<{ data: Product[]; pagination?: any }>(url);
      if (response.success && response.data) {
        const productsArray = Array.isArray(response.data) ? response.data : [];
        setProducts(productsArray);
      } else {
        console.error('Failed to fetch products:', response.error);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const timeoutId = setTimeout(() => {
        fetchProducts(searchQuery || undefined);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await apiRequest(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert(response.error || 'Failed to delete product');
      }
    } catch (error) {
      alert('Error deleting product');
    }
  };

  const toNumber = (value: number | string): number => {
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  };

  // Calculate stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;
  const featuredProducts = products.filter(p => p.isFeatured).length;
  const lowStock = products.filter(p => (p.inventory?.quantity || 0) < 10).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-dark border-t-transparent 
                        rounded-full animate-spin mb-4" />
          <p className="text-[rgb(var(--muted-foreground))]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Welcome Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--foreground))]">
            Welcome back, {user?.firstName || 'Admin'}! 👋
          </h1>
          <p className="text-[rgb(var(--muted-foreground))] mt-1">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
          <div className="card p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary-light/20">
                <HiCube className="w-5 h-5 text-primary-dark" />
              </div>
              <span className="text-xs lg:text-sm text-[rgb(var(--muted-foreground))]">
                Total Products
              </span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-[rgb(var(--foreground))]">
              {totalProducts}
            </p>
          </div>

          <div className="card p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/20">
                <HiCheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs lg:text-sm text-[rgb(var(--muted-foreground))]">
                Active
              </span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-[rgb(var(--foreground))]">
              {activeProducts}
            </p>
          </div>

          <div className="card p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                <FaLeaf className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs lg:text-sm text-[rgb(var(--muted-foreground))]">
                Featured
              </span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-[rgb(var(--foreground))]">
              {featuredProducts}
            </p>
          </div>

          <div className="card p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/20">
                <HiXCircle className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs lg:text-sm text-[rgb(var(--muted-foreground))]">
                Low Stock
              </span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-[rgb(var(--foreground))]">
              {lowStock}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <h2 className="text-xl lg:text-2xl font-bold text-[rgb(var(--foreground))] flex-1">
            Product Management
          </h2>
          <div className="flex gap-3">
            <Link
              href="/admin/orders"
              className="btn-secondary flex-1 sm:flex-none"
            >
              <HiClipboardDocumentList className="w-5 h-5" />
              <span className="hidden sm:inline">View Orders</span>
              <span className="sm:hidden">Orders</span>
            </Link>
            <Link
              href="/admin/products/new"
              className="btn-primary flex-1 sm:flex-none"
            >
              <HiPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 
                                        text-[rgb(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
          />
        </div>

        {/* Products - Mobile Cards / Desktop Table */}
        <div className="card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(var(--muted))]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold 
                               text-[rgb(var(--muted-foreground))] uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold 
                               text-[rgb(var(--muted-foreground))] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold 
                               text-[rgb(var(--muted-foreground))] uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold 
                               text-[rgb(var(--muted-foreground))] uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold 
                               text-[rgb(var(--muted-foreground))] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold 
                               text-[rgb(var(--muted-foreground))] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-[rgb(var(--muted-foreground))]">
                        No products found. Create your first product!
                      </p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-[rgb(var(--muted))]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[rgb(var(--foreground))]">{product.name}</p>
                          <p className="text-sm text-[rgb(var(--muted-foreground))]">{product.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[rgb(var(--muted-foreground))]">
                        {product.category.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[rgb(var(--foreground))]">
                          R{toNumber(product.price).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          (product.inventory?.quantity || 0) < 10 
                            ? 'text-orange-600' 
                            : 'text-[rgb(var(--foreground))]'
                        }`}>
                          {product.inventory?.quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            product.isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {product.isFeatured && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold 
                                           bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-2 rounded-lg text-primary-dark hover:bg-primary-dark/10 
                                     transition-colors"
                          >
                            <HiPencilSquare className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-100 
                                     dark:hover:bg-red-900/30 transition-colors"
                          >
                            <HiTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-[rgb(var(--border))]">
            {products.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[rgb(var(--muted-foreground))]">
                  No products found. Create your first product!
                </p>
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[rgb(var(--foreground))] truncate">
                        {product.name}
                      </h3>
                      <p className="text-sm text-[rgb(var(--muted-foreground))]">
                        {product.category.name}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-2 rounded-lg text-primary-dark hover:bg-primary-dark/10 
                                 transition-colors"
                      >
                        <HiPencilSquare className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-100 
                                 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <HiCurrencyDollar className="w-4 h-4 text-[rgb(var(--muted-foreground))]" />
                        <span className="font-semibold text-[rgb(var(--foreground))]">
                          R{toNumber(product.price).toFixed(2)}
                        </span>
                      </div>
                      <div className={`text-sm ${
                        (product.inventory?.quantity || 0) < 10 
                          ? 'text-orange-600' 
                          : 'text-[rgb(var(--muted-foreground))]'
                      }`}>
                        Stock: {product.inventory?.quantity || 0}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        product.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {product.isFeatured && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold 
                                       bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          ★
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
