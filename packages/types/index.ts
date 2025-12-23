// Shared TypeScript types for FusionAura platform
// Re-export types from @fusionaura/db (which exports from @prisma/client)
// Note: This requires @fusionaura/db to build first (prisma generate)
export type {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  Payment,
  Shipment,
  Inventory,
  CartItem,
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShipmentStatus,
} from '@fusionaura/db';

// API Request/Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Stripe types
export interface StripeCheckoutSession {
  id: string;
  url: string;
}

export interface CreateCheckoutSessionRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress?: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province?: string;
    postalCode: string;
    country?: string;
    phone?: string;
  };
}

// Product filters
export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'created_desc';
}

// Cart types
export interface CartItemResponse {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
  };
  quantity: number;
  subtotal: number;
}

// Order types
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: Date;
}

