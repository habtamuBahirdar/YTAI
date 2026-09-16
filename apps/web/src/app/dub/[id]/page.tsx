'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ArrowLeft, Play, Pause, Volume2, AlertCircle, Loader } from 'lucide-react';
import { RealtimeClient, createRealtimeClient } from '@/lib/realtime-client';

interface SegmentItem {
  sequence: number;
  transcript: string;
  translation: string;
  audioBase64?: string;
}

interface DubbingState {
  status: 'connecting' | 'ready' | 'processing' | 'playing' | 'paused' | 'completed' | 'error';
  progress: number;
  currentSegment: number;
  transcript: string;
  translation: string;
  segments: SegmentItem[];
  error?: string;
}

function DubbingPlayerInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  
  const urlParam = searchParams ? (searchParams.get('url') || searchParams.get('youtubeUrl')) : null;
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(`session_${sessionId}_url`) : null;
  const youtubeUrl = urlParam || storedUrl || undefined;

  const [state, setState] = useState<DubbingState>({
    status: 'connecting',
    progress: 0,
    currentSegment: 0,
    transcript: '',
    translation: '',
    segments: [],
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const clientRef = useRef<RealtimeClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioQueueRef = useRef<Map<number, string>>(new Map());

  const playAudioBase64 = async (base64Data: string) => {
    if (!base64Data) return;
    try {
      const cleanBase64 = base64Data.replace(/^data:audio\/[a-z0-9]+;base64,/, '').trim();
      const binaryString = window.atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Set HTML5 audio controls for UI visualization & playback
      const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = blobUrl;
      }

      // Initialize Web Audio API for native decoding
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }

      if (audioContextRef.current) {
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        try {
          const bufferCopy = bytes.buffer.slice(0);
          const audioBuffer = await ctx.decodeAudioData(bufferCopy);
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          source.start(0);

          setIsPlaying(true);
          setState(prev => ({ ...prev, status: 'playing', progress: 100 }));

          source.onended = () => {
            setIsPlaying(false);
            // Auto play next segment if available
            setState(prev => {
              const nextSeq = prev.currentSegment + 1;
              const nextAudio = audioQueueRef.current.get(nextSeq);
              if (nextAudio) {
                setTimeout(() => playAudioBase64(nextAudio), 200);
              }
              return prev;
            });
          };
          return;
        } catch (decodeErr) {
          console.warn('Web Audio decode failed, falling back to HTML5 Audio element:', decodeErr);
        }
      }

      if (audioRef.current) {
        await audioRef.current.play();
        setIsPlaying(true);
        setState(prev => ({ ...prev, status: 'playing', progress: 100 }));
      }
    } catch (e) {
      console.log('Audio playback notice:', e);
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        const client = await createRealtimeClient(`ws://localhost:4000`, {
          onConnectionChange: (connected) => {
            if (connected) {
              setState(prev => ({ ...prev, status: 'ready' }));
              clientRef.current?.startSession(sessionId, 'demo-user-1', youtubeUrl);
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
            setState(prev => {
              const existingIndex = prev.segments.findIndex(s => s.sequence === sequence);
              const updatedSegments = [...prev.segments];
              if (existingIndex >= 0) {
                updatedSegments[existingIndex] = { ...updatedSegments[existingIndex], transcript: text };
              } else {
                updatedSegments.push({ sequence, transcript: text, translation: '' });
              }
              return {
                ...prev,
                currentSegment: sequence,
                transcript: text,
                segments: updatedSegments,
              };
            });
          },

          onTranslation: (sequence, text) => {
            setState(prev => {
              const existingIndex = prev.segments.findIndex(s => s.sequence === sequence);
              const updatedSegments = [...prev.segments];
              if (existingIndex >= 0) {
                updatedSegments[existingIndex] = { ...updatedSegments[existingIndex], translation: text };
              } else {
                updatedSegments.push({ sequence, transcript: '', translation: text });
              }
              return {
                ...prev,
                translation: text,
                segments: updatedSegments,
              };
            });
          },

          onAudioReady: (sequence, audioBase64) => {
            audioQueueRef.current.set(sequence, audioBase64);
            playAudioBase64(audioBase64);

            setState(prev => {
              const existingIndex = prev.segments.findIndex(s => s.sequence === sequence);
              const updatedSegments = [...prev.segments];
              if (existingIndex >= 0) {
                updatedSegments[existingIndex] = { ...updatedSegments[existingIndex], audioBase64 };
              }
              return {
                ...prev,
                status: 'playing',
                progress: 100,
                segments: updatedSegments,
              };
            });
          },

          onSegmentComplete: (sequence) => {
            setState(prev => ({
              ...prev,
              progress: 100,
              status: 'playing',
            }));
          },

          onProgress: (stage, progress) => {
            setState(prev => ({
              ...prev,
              progress: Math.min(95, Math.max(prev.progress, Math.round(progress))),
            }));
          },

          onCompleted: () => {
            setState(prev => ({ ...prev, status: 'completed', progress: 100 }));
          },

          onError: (error) => {
            // Ignore non-fatal warnings
            if (error.includes('already processing')) return;
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

  const handlePlayPause = () => {
    if (isPlaying) {
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setState(prev => ({ ...prev, status: 'paused' }));
      return;
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        setIsPlaying(true);
        setState(prev => ({ ...prev, status: 'playing' }));
      });
      return;
    }

    const currentSeq = state.currentSegment > 0 ? state.currentSegment : 1;
    const latestAudio = audioQueueRef.current.get(currentSeq) || Array.from(audioQueueRef.current.values()).pop();
    if (latestAudio) {
      playAudioBase64(latestAudio);
    } else if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch(err => console.log('Play notice:', err.message));
      setIsPlaying(true);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 min-h-screen">
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
              Dubbing Session
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              ID: {sessionId}
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Status
                </h2>
                <div className="flex items-center gap-2">
                  {state.status === 'connecting' && (
                    <>
                      <Loader className="w-4 h-4 text-blue-500 animate-spin" />
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Connecting...</span>
                    </>
                  )}
                  {state.status === 'ready' && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Ready</span>
                  )}
                  {state.status === 'processing' && (
                    <>
                      <Loader className="w-4 h-4 text-purple-500 animate-spin" />
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Processing Audio & Subtitles...</span>
                    </>
                  )}
                  {state.status === 'playing' && (
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Playing Amharic Voice</span>
                  )}
                  {state.status === 'completed' && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Dubbing Completed</span>
                  )}
                  {state.status === 'error' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Error</span>
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
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-300"
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

          {/* Audio Player Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={handlePlayPause}
                disabled={state.status === 'connecting' || state.status === 'error'}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Segment {state.currentSegment > 0 ? state.currentSegment : 1} • {state.progress}% complete
                </div>
                <audio
                  ref={audioRef}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full"
                  controls
                />
              </div>

              <Volume2 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
          </div>

          {/* Realtime Subtitles Display */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Subtitles & Voice Translation</span>
            </h2>

            {/* Current Active Subtitle Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* English Transcript */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-purple-600 dark:text-purple-400 text-sm tracking-wide uppercase">
                    English Transcript
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    Source
                  </span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 text-base leading-relaxed min-h-24">
                  {state.transcript || 'Waiting for transcript...'}
                </p>
              </div>

              {/* Amharic Translation */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-purple-200 dark:border-purple-900/50 shadow-sm bg-purple-50/30 dark:bg-purple-950/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-pink-600 dark:text-pink-400 text-sm tracking-wide uppercase">
                    Amharic Voice Subtitle
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium">
                    አማርኛ
                  </span>
                </div>
                <p className="text-slate-900 dark:text-white text-xl font-medium leading-relaxed min-h-24">
                  {state.translation || 'Waiting for translation...'}
                </p>
              </div>
            </div>

            {/* All Segments Timeline */}
            {state.segments.length > 1 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-lg">
                  All Subtitle Segments ({state.segments.length})
                </h3>
                <div className="space-y-4">
                  {state.segments.map((seg) => (
                    <div
                      key={seg.sequence}
                      className={`p-4 rounded-lg border transition ${
                        seg.sequence === state.currentSegment
                          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-purple-600 text-white">
                          Segment {seg.sequence}
                        </span>
                        {seg.audioBase64 && (
                          <button
                            onClick={() => playAudioBase64(seg.audioBase64!)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            <Play className="w-3.5 h-3.5" /> Replay Audio
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        <strong className="text-slate-700 dark:text-slate-300">EN:</strong> {seg.transcript || 'Processing...'}
                      </p>
                      <p className="text-base text-slate-900 dark:text-white font-medium">
                        <strong className="text-purple-600 dark:text-purple-400">AM:</strong> {seg.translation || 'Translating...'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function DubbingPlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <DubbingPlayerInner />
    </Suspense>
  );
}
