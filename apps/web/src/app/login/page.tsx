'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, register } from '@/lib/api';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await login(email, password);
      } else {
        response = await register(email, password, firstName, lastName, {
          addressLine1,
          addressLine2,
          city,
          province,
          postalCode,
          phone,
        });
      }

      if (response.success && response.data) {
        // Store token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Force page reload to update AuthContext
        // This ensures HeaderNav and all components get the updated auth state
        window.location.href = response.data.user.role === 'ADMIN' ? '/admin/dashboard' : '/products';
      } else {
        setError(response.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-light/20 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo href="/" width={200} height={70} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="font-medium text-primary-dark hover:text-primary-dark/80"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your full name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                  />
                </div>
                
                <div>
                  <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                    Delivery Address Line 1 *
                  </label>
                  <input
                    id="addressLine1"
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Street address"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                  />
                </div>
                
                <div>
                  <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">
                    Address Line 2
                  </label>
                  <input
                    id="addressLine2"
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Apartment, suite, etc. (optional)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City *
                    </label>
                    <input
                      id="city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                      Postal Code *
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Postal code"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number (optional)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-dark hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign in' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-primary-dark">
              ← Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
