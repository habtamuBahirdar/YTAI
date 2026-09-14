import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { config } from 'dotenv';
import { StreamingPipeline } from './pipeline/streaming-pipeline';
import { AudioBuffer, LatencyTracker } from './audio/buffer';
import { processSegmentWithAddisAI } from './services/segment-processor';

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
  const { sessionId, userId, youtubeUrl, voiceId = 'am-hamen' } = message;

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
}

/**
 * Handle audio processing with Addis AI integration
 */
async function handleSessionProcess(ws: WebSocket, message: any): Promise<void> {
  const { sessionId, audioBuffer: audioBase64, sequence = 1 } = message;
  const session = sessions.get(sessionId);

  if (!session) {
    sendMessage(ws, {
      type: 'error',
      message: 'Session not found',
    });
    return;
  }

  if (session.isProcessing) {
    sendMessage(ws, {
      type: 'error',
      message: 'Session already processing',
    });
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
      }
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


/**
 * Handle audio processing
 */
async function handleSessionProcess(ws: WebSocket, message: any): Promise<void> {
  const { sessionId, audioBuffer: audioBase64 } = message;
  const session = sessions.get(sessionId);

  if (!session) {
    sendMessage(ws, {
      type: 'error',
      message: 'Session not found',
    });
    return;
  }

  if (session.isProcessing) {
    sendMessage(ws, {
      type: 'error',
      message: 'Session already processing',
    });
    return;
  }

  try {
    session.isProcessing = true;
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    sendMessage(ws, {
      type: 'session.processing',
      sessionId,
      timestamp: new Date().toISOString(),
    });

    // Process through pipeline
    await session.pipeline!.processStream(
      audioBuffer,
      session.userId,
      sessionId,
      {
        onSegmentStart: (sequence) => {
          sendMessage(ws, {
            type: 'segment.start',
            sessionId,
            sequence,
            timestamp: new Date().toISOString(),
          });
        },

        onTranscript: (sequence, text) => {
          sendMessage(ws, {
            type: 'transcript',
            sessionId,
            sequence,
            text,
            timestamp: new Date().toISOString(),
          });
        },

        onTranslation: (sequence, text) => {
          sendMessage(ws, {
            type: 'translation',
            sessionId,
            sequence,
            text,
            timestamp: new Date().toISOString(),
          });
        },

        onAudioReady: (sequence, audioBase64) => {
          sendMessage(ws, {
            type: 'audio.ready',
            sessionId,
            sequence,
            audio: audioBase64,
            timestamp: new Date().toISOString(),
          });
        },

        onSegmentComplete: (result) => {
          sendMessage(ws, {
            type: 'segment.complete',
            sessionId,
            sequence: result.sequence,
            processingTime: result.processingTime,
            cost: result.cost,
            timestamp: new Date().toISOString(),
          });
        },

        onError: (sequence, error) => {
          sendMessage(ws, {
            type: 'segment.error',
            sessionId,
            sequence,
            error,
            timestamp: new Date().toISOString(),
          });
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
      }
    );

    session.isProcessing = false;

    sendMessage(ws, {
      type: 'session.completed',
      sessionId,
      timestamp: new Date().toISOString(),
      status: session.pipeline!.getStatus(),
    });
  } catch (error) {
    session.isProcessing = false;
    sendMessage(ws, {
      type: 'session.error',
      sessionId,
      error: error instanceof Error ? error.message : 'Processing failed',
      timestamp: new Date().toISOString(),
    });
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

  console.log(`Session ${sessionId} paused`);
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

  console.log(`Session ${sessionId} resumed`);
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

  sessions.delete(sessionId);

  sendMessage(ws, {
    type: 'session.stopped',
    sessionId,
    timestamp: new Date().toISOString(),
  });

  console.log(`Session ${sessionId} stopped`);
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

  console.log(`Session ${sessionId} seeking to segment ${sequence}`);
}

// Server startup
server.listen(PORT, () => {
  console.log(`✅ Realtime server listening on ws://localhost:${PORT}`);
  console.log(`📊 Max concurrent segments: 3`);
  console.log(`📦 Buffer size: 2-5 segments`);
  console.log(`⏱️  Target segment duration: 5 seconds`);
});

// Periodic stats logging
setInterval(() => {
  const activeSession = Array.from(sessions.values()).find(s => s.isProcessing);
  if (activeSession) {
    const status = activeSession.pipeline?.getStatus();
    console.log(`📈 Active session: ${activeSession.sessionId}`);
    console.log(`   Buffer: ${status?.bufferStatus.size} segments, Queue: ${status?.queueLength} remaining`);
  }
}, 5000);

