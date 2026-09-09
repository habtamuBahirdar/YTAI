/**
 * Buffer Management System
 * Maintains 2-5 segments ahead for smooth playback
 */

export interface BufferConfig {
  minSegments: number; // Minimum segments to keep buffered
  maxSegments: number; // Maximum segments to buffer
  targetSegments: number; // Target buffer size
}

export class AudioBuffer {
  private segments: Map<number, { data: Buffer; ready: boolean }> = new Map();
  private config: BufferConfig;
  private playingSequence: number = -1;

  constructor(config: BufferConfig = { minSegments: 2, maxSegments: 5, targetSegments: 3 }) {
    this.config = config;
  }

  /**
   * Add segment to buffer
   */
  addSegment(sequence: number, data: Buffer): void {
    this.segments.set(sequence, { data, ready: true });
  }

  /**
   * Get segment from buffer
   */
  getSegment(sequence: number): Buffer | null {
    const segment = this.segments.get(sequence);
    return segment?.ready ? segment.data : null;
  }

  /**
   * Check if segment is ready
   */
  isReady(sequence: number): boolean {
    return this.segments.has(sequence) && this.segments.get(sequence)?.ready === true;
  }

  /**
   * Remove segment after playback
   */
  removeSegment(sequence: number): void {
    this.segments.delete(sequence);
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.segments.size;
  }

  /**
   * Get buffer status
   */
  getStatus(): {
    size: number;
    buffered: number[];
    isFull: boolean;
    isLow: boolean;
    isEmpty: boolean;
  } {
    const buffered = Array.from(this.segments.keys()).sort((a, b) => a - b);
    const size = this.segments.size;

    return {
      size,
      buffered,
      isFull: size >= this.config.maxSegments,
      isLow: size < this.config.minSegments,
      isEmpty: size === 0,
    };
  }

  /**
   * Clear all segments
   */
  clear(): void {
    this.segments.clear();
  }

  /**
   * Set playing sequence for cleanup
   */
  setPlayingSequence(sequence: number): void {
    this.playingSequence = sequence;
    
    // Clean up segments before current playing sequence
    // Keep some history for seeking
    const keepHistory = 2;
    for (const seq of this.segments.keys()) {
      if (seq < sequence - keepHistory) {
        this.segments.delete(seq);
      }
    }
  }
}

/**
 * Latency Tracker
 * Monitors end-to-end processing latency
 */
export class LatencyTracker {
  private times: Map<string, number> = new Map();

  /**
   * Mark event timestamp
   */
  mark(event: string): void {
    this.times.set(event, Date.now());
  }

  /**
   * Get latency between two events
   */
  getLatency(fromEvent: string, toEvent: string): number | null {
    const from = this.times.get(fromEvent);
    const to = this.times.get(toEvent);

    if (from === undefined || to === undefined) return null;
    return to - from;
  }

  /**
   * Get all latencies
   */
  getMetrics(): Record<string, number | null> {
    return {
      stt_latency: this.getLatency('audio_received', 'stt_completed'),
      translation_latency: this.getLatency('stt_completed', 'translation_completed'),
      tts_latency: this.getLatency('translation_completed', 'tts_completed'),
      total_latency: this.getLatency('audio_received', 'tts_completed'),
      playback_delay: this.getLatency('tts_completed', 'playback_started'),
    };
  }

  /**
   * Reset tracker
   */
  reset(): void {
    this.times.clear();
  }
}
