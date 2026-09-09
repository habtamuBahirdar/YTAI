'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SessionCard } from '@/components/ui/SessionCard';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Mock data for sessions
const mockSessions = [
  {
    id: '1',
    title: 'Introduction to React Hooks',
    language: 'Amharic',
    status: 'completed' as const,
    createdAt: '2026-09-05T10:30:00Z',
    duration: '15:30',
  },
  {
    id: '2',
    title: 'Advanced TypeScript Patterns',
    language: 'Amharic',
    status: 'processing' as const,
    progress: 65,
    createdAt: '2026-09-08T14:15:00Z',
    duration: '22:45',
  },
  {
    id: '3',
    title: 'Web Performance Optimization',
    language: 'Amharic',
    status: 'completed' as const,
    createdAt: '2026-09-03T09:00:00Z',
    duration: '18:20',
  },
  {
    id: '4',
    title: 'Database Design Fundamentals',
    language: 'Amharic',
    status: 'completed' as const,
    createdAt: '2026-09-01T11:20:00Z',
    duration: '25:10',
  },
  {
    id: '5',
    title: 'Microservices Architecture',
    language: 'Amharic',
    status: 'failed' as const,
    createdAt: '2026-08-30T16:45:00Z',
  },
  {
    id: '6',
    title: 'Cloud Deployment Best Practices',
    language: 'Amharic',
    status: 'pending' as const,
    createdAt: '2026-09-09T08:00:00Z',
  },
];

export default function DashboardPage() {
  const [credits] = useState(42);
  const [userName] = useState('Addis Developer');

  const recentSessions = mockSessions.slice(0, 3);
  const completedCount = mockSessions.filter(s => s.status === 'completed').length;
  const totalProcessed = mockSessions.length;

  return (
    <AppShell credits={credits} userName={userName}>
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Welcome back! Here's your dubbing activity.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Total Sessions
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {totalProcessed}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Completed
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {completedCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Credits Left
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {credits}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💎</span>
                </div>
              </div>
            </div>
          </div>

          {/* Start New Dubbing Section */}
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-lg p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Start a New Dubbing</h2>
                <p className="text-purple-100">
                  Paste a YouTube URL and we'll dub it to Amharic in real-time.
                </p>
              </div>
              <Link
                href="/dub/new"
                className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition"
              >
                Start Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Recent Sessions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Recent Sessions
              </h2>
              <Link
                href="/history"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium"
              >
                View All →
              </Link>
            </div>

            {recentSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentSessions.map(session => (
                  <SessionCard
                    key={session.id}
                    {...session}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center border border-slate-200 dark:border-slate-700">
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  No sessions yet. Start by creating your first dubbing!
                </p>
                <Link
                  href="/dub/new"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Create First Dubbing
                </Link>
              </div>
            )}
          </div>

          {/* All Sessions Grid */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              All Sessions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockSessions.map(session => (
                <SessionCard
                  key={session.id}
                  {...session}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
