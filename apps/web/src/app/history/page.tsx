'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SessionCard } from '@/components/ui/SessionCard';

// Mock data for all sessions
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

export default function HistoryPage() {
  return (
    <AppShell>
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Session History
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              View and manage all your dubbing sessions.
            </p>
          </div>

          {/* Filter/Sort (Placeholder) */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search sessions..."
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>All Status</option>
              <option>Completed</option>
              <option>Processing</option>
              <option>Failed</option>
            </select>
          </div>

          {/* Sessions Grid */}
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
    </AppShell>
  );
}
