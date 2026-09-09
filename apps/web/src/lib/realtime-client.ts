'use client';

/**
 * Realtime WebSocket Client for Browser
 * Handles WebSocket communication and audio streaming
 */

export interface WebSocketMessage {
  type: string;
  sessionId?: string;
  [key: string]: any;
}

export interface ClientCallbacks {
  onSessionStarted?: (sessionId: string) => void;
  onProcessing?: (sessionId: string) => void;
  onSegmentStart?: (sequence: number) => void;
  onTranscript?: (sequence: number, text: string) => void;
  onTranslation?: (sequence: number, text: string) => void;
  onAudioReady?: (sequence: number, audioBase64: string) => void;
  onSegmentComplete?: (sequence: number, processingTime: number) => void;
  onProgress?: (stage: string, progress: number) => void;
  onCompleted?: (sessionId: string) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks: ClientCallbacks;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor(url: string, callbacks: ClientCallbacks = {}) {
    this.url = url;
    this.callbacks = callbacks;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('Connection in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.callbacks.onConnectionChange?.(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.callbacks.onError?.('WebSocket error');
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('❌ WebSocket disconnected');
          this.isConnecting = false;
          this.callbacks.onConnectionChange?.(false);
          this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Start a new session
   */
  startSession(sessionId: string, userId: string, youtubeUrl?: string): void {
    this.send({
      type: 'session.start',
      sessionId,
      userId,
      youtubeUrl,
    });
  }

  /**
   * Process audio through pipeline
   */
  processAudio(sessionId: string, audioBuffer: Buffer): void {
    this.send({
      type: 'session.process',
      sessionId,
      audioBuffer: audioBuffer.toString('base64'),
    });
  }

  /**
   * Pause processing
   */
  pauseSession(sessionId: string): void {
    this.send({
      type: 'session.pause',
      sessionId,
    });
  }

  /**
   * Resume processing
   */
  resumeSession(sessionId: string): void {
    this.send({
      type: 'session.resume',
      sessionId,
    });
  }

  /**
   * Stop session
   */
  stopSession(sessionId: string): void {
    this.send({
      type: 'session.stop',
      sessionId,
    });
  }

  /**
   * Seek to segment
   */
  seekToSegment(sessionId: string, sequence: number): void {
    this.send({
      type: 'session.seek',
      sessionId,
      sequence,
    });
  }

  /**
   * Send message to server
   */
  private send(message: WebSocketMessage): void {
    if (!this.isConnected()) {
      this.callbacks.onError?.('WebSocket not connected');
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      this.callbacks.onError?.('Failed to send message');
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    try {
      switch (message.type) {
        case 'session.started':
          this.callbacks.onSessionStarted?.(message.sessionId!);
          break;

        case 'session.processing':
          this.callbacks.onProcessing?.(message.sessionId!);
          break;

        case 'segment.start':
          this.callbacks.onSegmentStart?.(message.sequence);
          break;

        case 'transcript':
          this.callbacks.onTranscript?.(message.sequence, message.text);
          break;

        case 'translation':
          this.callbacks.onTranslation?.(message.sequence, message.text);
          break;

        case 'audio.ready':
          this.callbacks.onAudioReady?.(message.sequence, message.audio);
          break;

        case 'segment.complete':
          this.callbacks.onSegmentComplete?.(message.sequence, message.processingTime);
          break;

        case 'progress':
          this.callbacks.onProgress?.(message.stage, message.progress);
          break;

        case 'session.completed':
          this.callbacks.onCompleted?.(message.sessionId!);
          break;

        case 'error':
          this.callbacks.onError?.(message.message || 'Unknown error');
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.callbacks.onError?.('Connection failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }
}

/**
 * Create and connect client
 */
export async function createRealtimeClient(
  url: string = `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:4000`,
  callbacks?: ClientCallbacks
): Promise<RealtimeClient> {
  const client = new RealtimeClient(url, callbacks);
  await client.connect();
  return client;
}
