'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ArrowLeft, Play, AlertCircle, Loader, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { validateYouTubeUrl, parseYouTubeUrl } from '@/lib/youtube-utils';
import { canProcessYouTubeVideo, estimateCostForVideo } from '@/lib/youtube-service';

interface VideoPreview {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  estimatedCost: number;
}

export default function NewDubbingPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError('');
    setPreview(null);
  };

  const handleValidate = async () => {
    setError('');
    setPreview(null);

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);

    try {
      // Validate URL format
      if (!validateYouTubeUrl(url)) {
        setError('Invalid YouTube URL. Please check and try again.');
        setLoading(false);
        return;
      }

      // Parse URL
      const parsed = parseYouTubeUrl(url);
      if (!parsed) {
        setError('Could not parse YouTube URL');
        setLoading(false);
        return;
      }

      // Check if video can be processed
      const { canProcess, reason, metadata } = await canProcessYouTubeVideo(parsed.videoId);

      if (!canProcess || !metadata) {
        setError(reason || 'This video cannot be processed');
        setLoading(false);
        return;
      }

      // Calculate cost
      const cost = estimateCostForVideo(metadata.duration);

      setPreview({
        videoId: parsed.videoId,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        duration: metadata.duration,
        channel: metadata.channel,
        estimatedCost: cost.total,
      });
    } catch (err) {
      setError('Failed to validate URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDubbing = async () => {
    if (!preview) return;

    setProcessing(true);

    try {
      // Create dubbing session
      const response = await fetch('/api/dubbing/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl: url,
          videoId: preview.videoId,
          title: preview.title,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const { sessionId } = await response.json();
      router.push(`/dub/${sessionId}`);
    } catch (err) {
      setError('Failed to start dubbing session');
      setProcessing(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              New Dubbing Session
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Paste a YouTube URL to start dubbing in Amharic
            </p>
          </div>

          {/* URL Input Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
              YouTube URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleValidate}
                disabled={loading || !url.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Video'
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Video Preview */}
          {preview && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex gap-6 mb-6">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <img
                    src={preview.thumbnail}
                    alt={preview.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                </div>

                {/* Video Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {preview.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {preview.channel}
                  </p>

                  {/* Duration and Cost */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Duration</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {Math.floor(preview.duration / 60)}:{String(preview.duration % 60).padStart(2, '0')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Est. Cost</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ${preview.estimatedCost.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={handleStartDubbing}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Creating Session...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start Dubbing
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                      Ready to dub
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-400">
                      Your video will be processed in real-time. You'll hear Amharic audio as each segment is translated and synthesized.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tips Section */}
          {!preview && (
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Supported URLs</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• youtube.com/watch?v=...</li>
                <li>• youtu.be/...</li>
                <li>• youtube.com/shorts/...</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

