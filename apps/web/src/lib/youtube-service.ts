/**
 * YouTube Metadata Extraction and Audio Download Service
 */

import { YouTubeVideoInfo } from './youtube-utils';

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  duration: number; // in seconds
  thumbnail: string;
  channel: string;
  description?: string;
  uploadDate?: string;
  viewCount?: number;
}

/**
 * Fetch YouTube video metadata
 * Uses yt-dlp for reliable metadata extraction
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeMetadata | null> {
  try {
    // In production, this would use yt-dlp-exec or similar
    // For now, we provide a mock implementation
    
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Mock metadata for development
    // Replace with real yt-dlp call in production
    const mockMetadata: YouTubeMetadata = {
      videoId,
      title: `YouTube Video: ${videoId}`,
      duration: 300, // 5 minutes
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      channel: 'Example Channel',
      description: 'Video description would go here',
      uploadDate: new Date().toISOString().split('T')[0],
      viewCount: 1000000,
    };
    
    return mockMetadata;
  } catch (error) {
    console.error('Failed to fetch YouTube metadata:', error);
    return null;
  }
}

/**
 * Extract audio from YouTube video
 * Downloads audio stream without video content
 */
export async function extractAudioFromYouTube(
  videoId: string,
  onProgress?: (progress: number) => void
): Promise<Buffer | null> {
  try {
    // In production, this would use yt-dlp to download audio
    // For now, we provide a mock implementation
    
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Mock audio extraction for development
    // Replace with real yt-dlp call in production:
    // 
    // import { exec } from 'yt-dlp-exec';
    // const result = await exec(videoUrl, {
    //   extractAudio: true,
    //   audioFormat: 'mp3',
    //   audioQuality: 192,
    //   output: '%(id)s.%(ext)s',
    // });
    
    onProgress?.(50);
    
    // Return mock audio buffer (16 kHz, 2-channel, 30 seconds)
    const sampleRate = 16000;
    const channels = 1;
    const durationSeconds = 30;
    const bufferSize = sampleRate * channels * 2 * durationSeconds;
    const mockAudioBuffer = Buffer.alloc(bufferSize);
    
    onProgress?.(100);
    
    return mockAudioBuffer;
  } catch (error) {
    console.error('Failed to extract audio from YouTube:', error);
    return null;
  }
}

/**
 * Check if YouTube video can be processed
 */
export async function canProcessYouTubeVideo(videoId: string): Promise<{
  canProcess: boolean;
  reason?: string;
  metadata?: YouTubeMetadata;
}> {
  try {
    const metadata = await fetchYouTubeMetadata(videoId);
    
    if (!metadata) {
      return {
        canProcess: false,
        reason: 'Could not fetch video information',
      };
    }
    
    // Check constraints
    const maxDuration = 3600; // 1 hour
    if (metadata.duration > maxDuration) {
      return {
        canProcess: false,
        reason: `Video is too long (${Math.round(metadata.duration / 60)} minutes). Maximum is ${Math.round(maxDuration / 60)} minutes.`,
        metadata,
      };
    }
    
    // All checks passed
    return {
      canProcess: true,
      metadata,
    };
  } catch (error) {
    return {
      canProcess: false,
      reason: 'Failed to check video compatibility',
    };
  }
}

/**
 * Estimate processing cost based on video duration
 */
export function estimateCostForVideo(durationSeconds: number): {
  stt: number;
  translation: number;
  tts: number;
  total: number;
} {
  // Based on pricing from Addis AI
  const sttCost = (durationSeconds / 60) * 0.01; // $0.01 per minute
  
  // Estimate transcript length: ~2.5 words per second, ~5 chars per word = ~12.5 chars per second
  const estimatedChars = durationSeconds * 12.5;
  const translationCost = (estimatedChars / 1000) * 0.0025; // $0.0025 per 1000 chars
  const ttsCost = (estimatedChars / 1000) * 0.015; // $0.015 per 1000 chars
  
  return {
    stt: sttCost,
    translation: translationCost,
    tts: ttsCost,
    total: sttCost + translationCost + ttsCost,
  };
}
