'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HiEnvelope, HiArrowLeft, HiCheckCircle } from 'react-icons/hi2';
import { apiRequest } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiRequest<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (response.success) {
        setSubmitted(true);
      } else {
        setError(response.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-primary-dark/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiCheckCircle className="w-10 h-10 text-primary-dark" />
            </div>
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-4">
              Check Your Email
            </h1>
            <p className="text-[rgb(var(--muted-foreground))] mb-6">
              If an account exists with <span className="font-semibold text-[rgb(var(--foreground))]">{email}</span>, 
              you will receive a password reset link shortly.
            </p>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mb-6">
              The link will expire in 1 hour. Please check your spam folder if you don&apos;t see the email.
            </p>
            <Link
              href="/login"
              className="btn-primary hidden md:inline-flex items-center gap-2"
            >
              <HiArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
            <Link
              href="/login"
              className="btn-primary md:hidden"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-dark/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiEnvelope className="w-8 h-8 text-primary-dark" />
            </div>
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">
              Forgot Password?
            </h1>
            <p className="text-[rgb(var(--muted-foreground))]">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="input-field"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Back to Login - hidden on mobile, use floating button instead */}
          <div className="mt-6 text-center hidden md:block">
            <Link
              href="/login"
              className="text-primary-dark hover:underline inline-flex items-center gap-1"
            >
              <HiArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
