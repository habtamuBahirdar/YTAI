'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ArrowLeft, Play, Pause, Volume2, AlertCircle, Loader } from 'lucide-react';
import { RealtimeClient, createRealtimeClient } from '@/lib/realtime-client';

interface DubbingState {
  status: 'connecting' | 'ready' | 'processing' | 'playing' | 'paused' | 'completed' | 'error';
  progress: number;
  currentSegment: number;
  transcript: string;
  translation: string;
  error?: string;
}

export default function DubbingPlayerPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [state, setState] = useState<DubbingState>({
    status: 'connecting',
    progress: 0,
    currentSegment: 0,
    transcript: '',
    translation: '',
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const clientRef = useRef<RealtimeClient | null>(null);
  const audioQueueRef = useRef<Map<number, string>>(new Map());
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        const client = await createRealtimeClient(`ws://localhost:4000`, {
          onConnectionChange: (connected) => {
            if (connected) {
              setState(prev => ({ ...prev, status: 'ready' }));
              client.startSession(sessionId, 'demo-user-1');
            } else {
              setState(prev => ({ ...prev, status: 'connecting', error: 'WebSocket disconnected' }));
            }
          },

          onSessionStarted: () => {
            console.log('Session started');
          },

          onProcessing: () => {
            setState(prev => ({ ...prev, status: 'processing' }));
          },

          onTranscript: (sequence, text) => {
            setState(prev => ({
              ...prev,
              currentSegment: sequence,
              transcript: text,
            }));
          },

          onTranslation: (sequence, text) => {
            setState(prev => ({
              ...prev,
              translation: text,
            }));
          },

          onAudioReady: (sequence, audioBase64) => {
            audioQueueRef.current.set(sequence, audioBase64);
            
            // Auto-play if this is the next segment
            if (sequence === state.currentSegment && !isPlaying) {
              playNextSegment();
            }
          },

          onProgress: (stage, progress) => {
            setState(prev => ({
              ...prev,
              progress: Math.round(progress),
            }));
          },

          onCompleted: () => {
            setState(prev => ({ ...prev, status: 'completed' }));
          },

          onError: (error) => {
            setState(prev => ({ ...prev, status: 'error', error }));
          },
        });

        clientRef.current = client;
      } catch (error) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to connect',
        }));
      }
    };

    initializeWebSocket();

    return () => {
      clientRef.current?.disconnect();
    };
  }, [sessionId]);

  const playNextSegment = () => {
    const nextSegmentAudio = audioQueueRef.current.get(state.currentSegment);
    if (nextSegmentAudio && audioRef.current) {
      const audioBlob = Buffer.from(nextSegmentAudio, 'base64');
      const audioUrl = URL.createObjectURL(new Blob([audioBlob], { type: 'audio/mp3' }));
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              Dubbing in Progress
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Session: {sessionId}
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Status
                </h2>
                <div className="flex items-center gap-2">
                  {state.status === 'connecting' && (
                    <>
                      <Loader className="w-4 h-4 text-blue-500 animate-spin" />
                      <span className="text-sm text-blue-600 dark:text-blue-400">Connecting...</span>
                    </>
                  )}
                  {state.status === 'ready' && (
                    <span className="text-sm text-green-600 dark:text-green-400">Ready</span>
                  )}
                  {state.status === 'processing' && (
                    <>
                      <Loader className="w-4 h-4 text-purple-500 animate-spin" />
                      <span className="text-sm text-purple-600 dark:text-purple-400">Processing</span>
                    </>
                  )}
                  {state.status === 'playing' && (
                    <span className="text-sm text-blue-600 dark:text-blue-400">Playing</span>
                  )}
                  {state.status === 'completed' && (
                    <span className="text-sm text-green-600 dark:text-green-400">Completed</span>
                  )}
                  {state.status === 'error' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">Error</span>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-48">
                <div className="text-right mb-1">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {state.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {state.error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{state.error}</p>
              </div>
            )}
          </div>

          {/* Player */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={handlePlayPause}
                disabled={state.status === 'connecting' || state.status === 'error'}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              <div className="flex-1">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Segment {state.currentSegment} • {state.progress}% complete
                </div>
                <audio
                  ref={audioRef}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full"
                  controls
                />
              </div>

              <Volume2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
          </div>

          {/* Transcript and Translation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* English Transcript */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                English
              </h3>
              <p className="text-slate-600 dark:text-slate-400 min-h-24">
                {state.transcript || 'Waiting for transcript...'}
              </p>
            </div>

            {/* Amharic Translation */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                Amharic
              </h3>
              <p className="text-slate-600 dark:text-slate-400 min-h-24 text-lg">
                {state.translation || 'Waiting for translation...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
