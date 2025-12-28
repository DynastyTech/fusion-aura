// API client utilities

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
  token: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 API Request - Token included for:', endpoint);
  } else {
    console.log('⚠️  API Request - No token for:', endpoint);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // If 401 on auth endpoints, clear token and user
      // Don't clear on other endpoints to avoid race conditions
      if (response.status === 401 && endpoint.includes('/api/auth/')) {
        if (typeof window !== 'undefined') {
          console.log('🚫 Clearing auth due to 401 on auth endpoint:', endpoint);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Trigger storage event to update auth context
          window.dispatchEvent(new Event('storage'));
        }
      }
      // Log rate limiting errors
      if (response.status === 429) {
        console.warn('⚠️ Rate limited on:', endpoint);
      }
      // If 403, log detailed error
      if (response.status === 403) {
        console.error('❌ 403 Forbidden:', data);
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (userStr) {
          const userData = JSON.parse(userStr);
          console.error('Current user role:', userData.role);
        }
      }
      return {
        success: false,
        error: data.error || 'An error occurred',
        message: data.message,
        ...data, // Pass through all additional fields like details, code, meta
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName?: string,
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province?: string;
    postalCode: string;
    phone?: string;
  }
): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ 
      email, 
      password, 
      firstName, 
      lastName,
      ...address,
    }),
  });
}

export async function getCurrentUser() {
  return apiRequest('/api/auth/me');
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

