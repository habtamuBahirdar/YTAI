/**
 * Audio Segmentation Service
 * Splits audio into 3-8 second chunks for processing
 */

export interface AudioSegment {
  id: string;
  sequence: number;
  audioBuffer: Buffer;
  startTime: number; // milliseconds
  duration: number; // milliseconds
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Segment audio buffer into chunks
 * Target: 3-8 seconds per segment
 */
export function segmentAudio(
  audioBuffer: Buffer,
  sampleRate: number = 16000,
  targetSegmentSeconds: number = 5
): AudioSegment[] {
  const bytesPerSecond = sampleRate * 2; // 16-bit audio = 2 bytes per sample
  const bytesPerSegment = bytesPerSecond * targetSegmentSeconds;

  const segments: AudioSegment[] = [];
  let offset = 0;
  let sequence = 0;
  let startTime = 0;

  while (offset < audioBuffer.length) {
    const segmentEnd = Math.min(offset + bytesPerSegment, audioBuffer.length);
    const segmentBuffer = audioBuffer.slice(offset, segmentEnd);
    const duration = (segmentBuffer.length / bytesPerSecond) * 1000; // convert to ms

    segments.push({
      id: `segment-${sequence}`,
      sequence,
      audioBuffer: segmentBuffer,
      startTime,
      duration,
      status: 'pending',
    });

    offset = segmentEnd;
    startTime += duration;
    sequence++;
  }

  return segments;
}

/**
 * Merge audio segments back together
 */
export function mergeAudioSegments(segments: AudioSegment[]): Buffer {
  return Buffer.concat(segments.map(s => s.audioBuffer));
}

/**
 * Calculate optimal segment size based on audio properties
 */
export function calculateOptimalSegmentSize(
  audioLengthSeconds: number
): number {
  // Aim for 3-8 second segments
  // For longer audio, use larger segments to reduce overhead
  if (audioLengthSeconds < 30) return 3;
  if (audioLengthSeconds < 60) return 4;
  if (audioLengthSeconds < 300) return 5;
  if (audioLengthSeconds < 600) return 6;
  return 8;
}
