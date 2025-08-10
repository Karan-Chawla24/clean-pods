'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithCsrf } from '../lib/csrf';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if already logged in using HTTP-only cookie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use GET request to verify admin status with HTTP-only cookie
      fetchWithCsrf('/api/admin-verify', {
        method: 'GET',
        credentials: 'include', // Important for cookies
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.isAdmin) {
          router.push('/admin');
        }
      })
      .catch(error => {
        console.error('Error verifying admin status:', error);
      });
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetchWithCsrf('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include', // Important for cookies
      });

      const data = await response.json();

      if (data.success) {
        // Session token is now stored in HTTP-only cookie
        // Just redirect to admin page
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid password');
        setIsLoading(false);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the admin password to access the dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter admin password"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-500 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}