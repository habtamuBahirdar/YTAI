'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4">
            <span className="text-white font-bold text-lg">AD</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to AddisDub
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Sign in to your account to get started
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-sm border border-slate-200 dark:border-slate-700">
          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">Demo Credentials:</p>
          <p className="text-xs text-blue-800 dark:text-blue-400">
            Email: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">demo@addisdub.com</code>
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-400">
            Password: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">demo123456</code>
          </p>
        </div>
      </div>
    </div>
  );
}
