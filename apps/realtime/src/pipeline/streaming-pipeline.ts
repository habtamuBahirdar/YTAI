/**
 * Streaming Pipeline Orchestrator
 * Manages concurrent processing of audio segments
 */

import { AudioSegment, segmentAudio } from '../audio/segmentation';
import { AudioBuffer, LatencyTracker } from '../audio/buffer';

export interface PipelineConfig {
  maxConcurrentSegments: number;
  bufferMinSegments: number;
  bufferMaxSegments: number;
  targetSegmentSeconds: number;
}

export interface PipelineSegmentResult {
  sequence: number;
  transcript: string;
  translation: string;
  audioBase64: string;
  duration: number;
  processingTime: number;
  cost: number;
}

export interface PipelineCallbacks {
  onSegmentStart?: (sequence: number) => void;
  onTranscript?: (sequence: number, text: string) => void;
  onTranslation?: (sequence: number, text: string) => void;
  onAudioReady?: (sequence: number, audioBase64: string) => void;
  onSegmentComplete?: (result: PipelineSegmentResult) => void;
  onError?: (sequence: number, error: string) => void;
  onProgress?: (stage: string, progress: number) => void;
}

export class StreamingPipeline {
  private buffer: AudioBuffer;
  private tracker: LatencyTracker;
  private config: PipelineConfig;
  private activeProcessing: Set<number> = new Set();
  private queue: AudioSegment[] = [];
  private isProcessing: boolean = false;

  constructor(config: PipelineConfig = {
    maxConcurrentSegments: 3,
    bufferMinSegments: 2,
    bufferMaxSegments: 5,
    targetSegmentSeconds: 5,
  }) {
    this.config = config;
    this.buffer = new AudioBuffer({
      minSegments: config.bufferMinSegments,
      maxSegments: config.bufferMaxSegments,
      targetSegments: Math.ceil((config.bufferMinSegments + config.bufferMaxSegments) / 2),
    });
    this.tracker = new LatencyTracker();
  }

  /**
   * Start processing audio stream
   */
  async processStream(
    audioBuffer: Buffer,
    userId: string,
    sessionId: string,
    callbacks?: PipelineCallbacks
  ): Promise<void> {
    this.tracker.mark('audio_received');
    this.isProcessing = true;

    try {
      // Segment the audio
      const segments = segmentAudio(
        audioBuffer,
        16000, // 16kHz sample rate
        this.config.targetSegmentSeconds
      );

      this.queue = segments;
      callbacks?.onProgress?.('segmentation', 100);

      // Process segments concurrently
      await this.processQueueConcurrently(userId, sessionId, callbacks);

      callbacks?.onProgress?.('complete', 100);
    } catch (error) {
      callbacks?.onError?.(0, error instanceof Error ? error.message : 'Processing failed');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process queue with concurrency control
   */
  private async processQueueConcurrently(
    userId: string,
    sessionId: string,
    callbacks?: PipelineCallbacks
  ): Promise<void> {
    while (this.queue.length > 0 || this.activeProcessing.size > 0) {
      // Start new segments if we haven't hit max concurrency
      while (
        this.queue.length > 0 &&
        this.activeProcessing.size < this.config.maxConcurrentSegments
      ) {
        const segment = this.queue.shift();
        if (segment) {
          this.processSegment(segment, userId, sessionId, callbacks);
        }
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Process individual segment through pipeline
   */
  private async processSegment(
    segment: AudioSegment,
    userId: string,
    sessionId: string,
    callbacks?: PipelineCallbacks
  ): Promise<void> {
    const sequence = segment.sequence;
    this.activeProcessing.add(sequence);
    const segmentStartTime = Date.now();

    try {
      callbacks?.onSegmentStart?.(sequence);

      // Placeholder for actual API calls
      // In real implementation, these would call the Addis AI services

      // Simulate STT
      const transcript = `Transcript for segment ${sequence}`;
      callbacks?.onTranscript?.(sequence, transcript);

      // Simulate Translation
      const translation = `ትርጉም ለክፍል ${sequence}`;
      callbacks?.onTranslation?.(sequence, translation);

      // Simulate TTS
      const audioBase64 = Buffer.alloc(100).toString('base64'); // Mock audio
      callbacks?.onAudioReady?.(sequence, audioBase64);

      // Add to buffer
      this.buffer.addSegment(sequence, Buffer.from(audioBase64, 'base64'));

      // Report completion
      const processingTime = Date.now() - segmentStartTime;
      callbacks?.onSegmentComplete?.({
        sequence,
        transcript,
        translation,
        audioBase64,
        duration: segment.duration,
        processingTime,
        cost: 0.01, // Mock cost
      });

      this.tracker.mark(`segment_${sequence}_completed`);
    } catch (error) {
      callbacks?.onError?.(sequence, error instanceof Error ? error.message : 'Segment processing failed');
    } finally {
      this.activeProcessing.delete(sequence);
    }
  }

  /**
   * Get current pipeline status
   */
  getStatus(): {
    isProcessing: boolean;
    activeSegments: number;
    queueLength: number;
    bufferStatus: any;
    latencyMetrics: any;
  } {
    return {
      isProcessing: this.isProcessing,
      activeSegments: this.activeProcessing.size,
      queueLength: this.queue.length,
      bufferStatus: this.buffer.getStatus(),
      latencyMetrics: this.tracker.getMetrics(),
    };
  }

  /**
   * Get audio buffer
   */
  getBuffer(): AudioBuffer {
    return this.buffer;
  }

  /**
   * Reset pipeline
   */
  reset(): void {
    this.activeProcessing.clear();
    this.queue = [];
    this.buffer.clear();
    this.tracker.reset();
    this.isProcessing = false;
  }
}
