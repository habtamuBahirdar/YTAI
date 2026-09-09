import { z } from 'zod';

export const YouTubeUrlSchema = z.string().refine(
  (url) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      return (
        hostname === 'youtube.com' ||
        hostname === 'youtu.be' ||
        hostname === 'm.youtube.com'
      );
    } catch {
      return false;
    }
  },
  { message: 'Invalid YouTube URL' }
);

export const SessionIdSchema = z.string().cuid();

export const DubbingSessionCreateSchema = z.object({
  youtubeUrl: YouTubeUrlSchema,
  sourceLanguage: z.string().default('en'),
  targetLanguage: z.string().default('am'),
});

export const WebSocketMessageSchema = z.object({
  type: z.string(),
});

export const SessionStartMessageSchema = WebSocketMessageSchema.extend({
  type: z.literal('session.start'),
  sessionId: SessionIdSchema,
  userId: z.string(),
  youtubeUrl: YouTubeUrlSchema,
});

export const TranscriptMessageSchema = WebSocketMessageSchema.extend({
  type: z.literal('transcript'),
  sequence: z.number().positive(),
  text: z.string(),
});

export const TranslationMessageSchema = WebSocketMessageSchema.extend({
  type: z.literal('translation'),
  sequence: z.number().positive(),
  text: z.string(),
});

export const AudioReadyMessageSchema = WebSocketMessageSchema.extend({
  type: z.literal('audio.ready'),
  sequence: z.number().positive(),
  audioUrl: z.string().url(),
});
