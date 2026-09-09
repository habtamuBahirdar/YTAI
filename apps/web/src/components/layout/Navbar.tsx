import React from 'react';
import { Menu, LogOut, Settings, User } from 'lucide-react';

interface NavbarProps {
  credits?: number;
  userName?: string;
  onMenuClick?: () => void;
}

export function Navbar({ credits = 42, userName = "User", onMenuClick }: NavbarProps) {
  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo and Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AD</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline text-slate-900 dark:text-white">
              AddisDub
            </span>
          </div>
        </div>

        {/* Right: Credits and User Menu */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Credits: {credits}
            </span>
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">{userName}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
