import React from 'react';
import Link from 'next/link';
import { Play, Check, AlertCircle, Clock } from 'lucide-react';

export interface SessionCardProps {
  id: string;
  title: string;
  language: string;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  progress?: number;
  createdAt: string;
  duration?: string;
}

const statusConfig = {
  completed: {
    badge: 'Completed',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-400',
    icon: Check,
  },
  processing: {
    badge: 'Processing',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-400',
    icon: Clock,
  },
  failed: {
    badge: 'Failed',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-400',
    icon: AlertCircle,
  },
  pending: {
    badge: 'Pending',
    bgColor: 'bg-slate-50 dark:bg-slate-800/50',
    textColor: 'text-slate-700 dark:text-slate-400',
    icon: Clock,
  },
};

export function SessionCard({ id, title, language, status, progress = 0, createdAt, duration }: SessionCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Link href={`/dub/${id}`}>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {new Date(createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          {status === 'completed' && (
            <Play className="w-5 h-5 text-purple-500 flex-shrink-0 ml-2" />
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{config.badge}</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{language}</span>
          </div>
          {duration && (
            <span className="text-xs text-slate-500 dark:text-slate-400">{duration}</span>
          )}
        </div>

        {status === 'processing' && progress !== undefined && (
          <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
