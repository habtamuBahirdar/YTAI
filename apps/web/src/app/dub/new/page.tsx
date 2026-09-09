'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewDubbingPage() {
  return (
    <AppShell>
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              New Dubbing Session
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Coming soon: URL input form and dubbing player
            </p>
          </div>

          {/* Placeholder */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              The new dubbing creation page will be built in the next phase.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
