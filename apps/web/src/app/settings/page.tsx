'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Settings
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your account preferences and settings.
            </p>
          </div>

          {/* Account Settings Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Account
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value="Addis Developer"
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value="developer@addisdub.com"
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Preferences
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-900 dark:text-white">
                  Dark Mode
                </label>
                <button className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
                  System
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <label className="text-sm font-medium text-slate-900 dark:text-white">
                  Email Notifications
                </label>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800 space-y-4">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
              Danger Zone
            </h2>
            <button className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
