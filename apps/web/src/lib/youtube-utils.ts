/**
 * YouTube URL Validation and Parsing
 */

import { z } from 'zod';

// Valid YouTube URL patterns
const YOUTUBE_URL_PATTERNS = {
  standard: /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  short: /^(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  shorts: /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  mobile: /^(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
};

export interface YouTubeVideoInfo {
  videoId: string;
  url: string;
  title?: string;
  duration?: number; // in seconds
  thumbnail?: string;
  channel?: string;
}

/**
 * Validate YouTube URL
 */
export function validateYouTubeUrl(url: string): boolean {
  try {
    const cleanUrl = url.trim();
    
    for (const pattern of Object.values(YOUTUBE_URL_PATTERNS)) {
      if (pattern.test(cleanUrl)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  try {
    const cleanUrl = url.trim();
    
    for (const pattern of Object.values(YOUTUBE_URL_PATTERNS)) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Normalize YouTube URL
 */
export function normalizeYouTubeUrl(url: string): string | null {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return null;
  }
  
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get YouTube thumbnail URL
 */
export function getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Validation schema
 */
export const YouTubeUrlSchema = z.string()
  .trim()
  .refine(
    (url) => validateYouTubeUrl(url),
    { message: 'Invalid YouTube URL. Please provide a valid YouTube link.' }
  );

export const YouTubeVideoInfoSchema = z.object({
  videoId: z.string().length(11),
  url: z.string().url(),
  title: z.string().optional(),
  duration: z.number().positive().optional(),
  thumbnail: z.string().url().optional(),
  channel: z.string().optional(),
});

/**
 * Parse and validate YouTube URL
 */
export function parseYouTubeUrl(url: string): YouTubeVideoInfo | null {
  try {
    const validated = YouTubeUrlSchema.parse(url);
    const videoId = extractVideoId(validated);
    
    if (!videoId) {
      return null;
    }
    
    const normalizedUrl = normalizeYouTubeUrl(validated);
    if (!normalizedUrl) {
      return null;
    }
    
    return {
      videoId,
      url: normalizedUrl,
      thumbnail: getThumbnailUrl(videoId, 'high'),
    };
  } catch (error) {
    return null;
  }
}
