import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { StreamingPipeline } from './pipeline/streaming-pipeline.js';
import { AudioBuffer, LatencyTracker } from './audio/buffer.js';
import { processSegmentWithAddisAI } from './services/segment-processor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from workspace root .env
config({ path: path.resolve(__dirname, '../../../.env') });
config({ path: path.resolve(__dirname, '../../.env') });
config();

const PORT = parseInt(process.env.REALTIME_PORT || '4000', 10);

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Session manager with pipeline integration
interface SessionData {
  ws: WebSocket;
  userId: string;
  sessionId: string;
  videoUrl?: string;
  createdAt: Date;
  pipeline?: StreamingPipeline;
  buffer?: AudioBuffer;
  isProcessing: boolean;
  voiceId: string;
  totalCost: number;
  processedSegments: number;
}

const sessions = new Map<string, SessionData>();

// Helper function to send JSON message
function sendMessage(ws: WebSocket, message: any): void {
  try {
    ws.send(JSON.stringify(message));
  } catch (error) {
    console.error('Send message error:', error);
  }
}

// Broadcast to all connected clients
function broadcast(message: any, excludeWs?: WebSocket): void {
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  console.log('✅ New WebSocket connection');

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message type:', message.type);

      switch (message.type) {
        case 'session.start':
          handleSessionStart(ws, message);
          break;

        case 'session.process':
          handleSessionProcess(ws, message);
          break;

        case 'session.pause':
          handleSessionPause(ws, message);
          break;

        case 'session.resume':
          handleSessionResume(ws, message);
          break;

        case 'session.stop':
          handleSessionStop(ws, message);
          break;

        case 'session.seek':
          handleSessionSeek(ws, message);
          break;

        default:
          sendMessage(ws, {
            type: 'error',
            message: 'Unknown message type',
          });
      }
    } catch (error) {
      console.error('Message error:', error);
      sendMessage(ws, {
        type: 'error',
        message: 'Invalid message format',
      });
    }
  });

  ws.on('close', () => {
    // Clean up session
    for (const [sessionId, session] of sessions.entries()) {
      if (session.ws === ws) {
        sessions.delete(sessionId);
        console.log(`❌ Session ${sessionId} closed`);
        
        // Notify others
        broadcast({
          type: 'session.closed',
          sessionId,
        });
      }
    }
  });

  ws.on('error', (error) => {
    console.error('⚠️  WebSocket error:', error);
  });
});

/**
 * Handle session start
 */
function handleSessionStart(ws: WebSocket, message: any): void {
  const { sessionId, userId, youtubeUrl, voiceId = 'am-simon' } = message;

  if (!sessionId || !userId) {
    sendMessage(ws, {
      type: 'error',
      message: 'Missing sessionId or userId',
    });
    return;
  }

  // Create session
  const session: SessionData = {
    ws,
    userId,
    sessionId,
    videoUrl: youtubeUrl,
    voiceId,
    createdAt: new Date(),
    pipeline: new StreamingPipeline({
      maxConcurrentSegments: 3,
      bufferMinSegments: 2,
      bufferMaxSegments: 5,
      targetSegmentSeconds: 5,
    }),
    isProcessing: false,
    totalCost: 0,
    processedSegments: 0,
  };

  sessions.set(sessionId, session);

  sendMessage(ws, {
    type: 'session.started',
    sessionId,
    timestamp: new Date().toISOString(),
    videoUrl: youtubeUrl,
    voiceId,
  });

  console.log(`✅ Session ${sessionId} started for user ${userId}`);
  console.log(`🎙️  Voice: ${voiceId}`);

  // Auto-start segment 1 processing
  setTimeout(() => {
    handleSessionProcess(ws, { sessionId, sequence: 1 });
  }, 800);
}

/**
 * Generate a valid 16kHz Mono 16-bit PCM WAV audio sample (1 second 440Hz sine wave tone)
 */
function createSampleWavBase64(): string {
  const sampleRate = 16000;
  const numSamples = sampleRate * 1;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 440 * t) * 10000;
    buffer.writeInt16LE(Math.round(sample), 44 + i * 2);
  }

  return buffer.toString('base64');
}

/**
 * Handle audio processing with Addis AI integration
 */
async function handleSessionProcess(ws: WebSocket, message: any): Promise<void> {
  const { sessionId, sequence = 1 } = message;
  let audioBase64 = message.audioBuffer;
  
  if (!audioBase64) {
    audioBase64 = createSampleWavBase64();
  }
  const session = sessions.get(sessionId);

  if (!session) {
    sendMessage(ws, {
      type: 'error',
      message: 'Session not found',
    });
    return;
  }

  if (session.isProcessing) {
    console.log(`⚠️  Session ${sessionId} is already processing segment. Skipping duplicate request.`);
    return;
  }

  try {
    session.isProcessing = true;

    sendMessage(ws, {
      type: 'session.processing',
      sessionId,
      sequence,
      timestamp: new Date().toISOString(),
    });

    console.log(`🔄 Processing segment ${sequence} with Addis AI...`);

    // Process segment through Addis AI pipeline
    const result = await processSegmentWithAddisAI(
      sequence,
      audioBase64,
      session.voiceId,
      {
        onTranscript: (seq, text) => {
          sendMessage(ws, {
            type: 'transcript',
            sessionId,
            sequence: seq,
            text,
            timestamp: new Date().toISOString(),
          });
          console.log(`📝 [${seq}] Transcript: ${text}`);
        },

        onTranslation: (seq, text) => {
          sendMessage(ws, {
            type: 'translation',
            sessionId,
            sequence: seq,
            text,
            timestamp: new Date().toISOString(),
          });
          console.log(`🌍 [${seq}] Translation: ${text}`);
        },

        onAudioReady: (seq, audioB64) => {
          sendMessage(ws, {
            type: 'audio.ready',
            sessionId,
            sequence: seq,
            audio: audioB64,
            timestamp: new Date().toISOString(),
          });
          console.log(`🔊 [${seq}] Audio ready (${audioB64.length} bytes)`);
        },

        onProgress: (stage, progress) => {
          sendMessage(ws, {
            type: 'progress',
            sessionId,
            stage,
            progress,
            timestamp: new Date().toISOString(),
          });
        },

        onError: (seq, error) => {
          sendMessage(ws, {
            type: 'segment.error',
            sessionId,
            sequence: seq,
            error,
            timestamp: new Date().toISOString(),
          });
        },
      },
      session.videoUrl
    );

    // Update session stats
    session.totalCost += result.cost.total;
    session.processedSegments += 1;

    sendMessage(ws, {
      type: 'segment.complete',
      sessionId,
      sequence: result.sequence,
      latency: result.latency,
      cost: result.cost,
      stats: {
        totalCost: session.totalCost,
        processedSegments: session.processedSegments,
      },
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Segment ${sequence} completed`);
    console.log(`   STT: ${result.latency.stt}ms | Translation: ${result.latency.translation}ms | TTS: ${result.latency.tts}ms`);
    console.log(`   Total latency: ${result.latency.total}ms`);
    console.log(`   Cost: $${result.cost.total.toFixed(6)} (Total: $${session.totalCost.toFixed(6)})`);

    session.isProcessing = false;
  } catch (error) {
    session.isProcessing = false;
    const errorMessage = error instanceof Error ? error.message : 'Processing failed';
    
    sendMessage(ws, {
      type: 'session.error',
      sessionId,
      sequence,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    console.error(`❌ Segment ${sequence} failed:`, errorMessage);
  }
}

/**
 * Handle session pause
 */
function handleSessionPause(ws: WebSocket, message: any): void {
  const { sessionId } = message;
  const session = sessions.get(sessionId);

  if (!session) {
    sendMessage(ws, {
      type: 'error',
      message: 'Session not found',
    });
    return;
  }

  sendMessage(ws, {
    type: 'session.paused',
    sessionId,
    timestamp: new Date().toISOString(),
  });

  console.log(`⏸️  Session ${sessionId} paused`);
}

/**
 * Handle session resume
 */
function handleSessionResume(ws: WebSocket, message: any): void {
  const { sessionId } = message;
  const session = sessions.get(sessionId);

  if (!session) {
    sendMessage(ws, {
      type: 'error',
      message: 'Session not found',
    });
    return;
  }

  sendMessage(ws, {
    type: 'session.resumed',
    sessionId,
    timestamp: new Date().toISOString(),
  });

  console.log(`▶️  Session ${sessionId} resumed`);
}

/**
 * Handle session stop
 */
function handleSessionStop(ws: WebSocket, message: any): void {
  const { sessionId } = message;
  const session = sessions.get(sessionId);

  if (!session) {
    sendMessage(ws, {
      type: 'error',
      message: 'Session not found',
    });
    return;
  }

  // Clean up pipeline
  if (session.pipeline) {
    session.pipeline.reset();
  }

  console.log(`⏹️  Session ${sessionId} stopped`);
  console.log(`   Processed: ${session.processedSegments} segments`);
  console.log(`   Total cost: $${session.totalCost.toFixed(6)}`);

  sessions.delete(sessionId);

  sendMessage(ws, {
    type: 'session.stopped',
    sessionId,
    stats: {
      processedSegments: session.processedSegments,
      totalCost: session.totalCost,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle seek/replay to specific segment
 */
function handleSessionSeek(ws: WebSocket, message: any): void {
  const { sessionId, sequence } = message;
  const session = sessions.get(sessionId);

  if (!session) {
    sendMessage(ws, {
      type: 'error',
      message: 'Session not found',
    });
    return;
  }

  sendMessage(ws, {
    type: 'segment.seek',
    sessionId,
    sequence,
    timestamp: new Date().toISOString(),
  });

  console.log(`⏩ Session ${sessionId} seeking to segment ${sequence}`);
}

// Server startup
server.listen(PORT, () => {
  console.log(`\n🚀 Realtime server started`);
  console.log(`📍 WebSocket: ws://localhost:${PORT}`);
  console.log(`🤖 AI Service: Addis AI (STT + Translation + TTS)`);
  console.log(`📊 Max concurrent segments: 3`);
  console.log(`📦 Buffer size: 2-5 segments`);
  console.log(`⏱️  Target segment duration: 5 seconds`);
  console.log(`🎙️  Available voices: am-hamen (male), am-abeba (female)\n`);
});

// Periodic stats logging
setInterval(() => {
  const activeSessions = Array.from(sessions.values()).filter(s => s.isProcessing);
  if (activeSessions.length > 0) {
    console.log(`\n📈 Active sessions: ${activeSessions.length}`);
    activeSessions.forEach(session => {
      console.log(`   ${session.sessionId}: ${session.processedSegments} segments, Cost: $${session.totalCost.toFixed(6)}`);
    });
  }
}, 10000);


