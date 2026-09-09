/**
 * Shared types for AddisDub
 */

export interface User {
  id: string;
  name?: string;
  email: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DubbingSession {
  id: string;
  userId: string;
  youtubeUrl: string;
  videoId?: string;
  title?: string;
  sourceLanguage: string;
  targetLanguage: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface AudioSegment {
  id: string;
  sessionId: string;
  sequence: number;
  sourceText?: string;
  translatedText?: string;
  audioUrl?: string;
  duration?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export interface SessionStartMessage extends WebSocketMessage {
  type: 'session.start';
  sessionId: string;
  userId: string;
  youtubeUrl: string;
}

export interface TranscriptMessage extends WebSocketMessage {
  type: 'transcript';
  sequence: number;
  text: string;
}

export interface TranslationMessage extends WebSocketMessage {
  type: 'translation';
  sequence: number;
  text: string;
}

export interface AudioReadyMessage extends WebSocketMessage {
  type: 'audio.ready';
  sequence: number;
  audioUrl: string;
}
