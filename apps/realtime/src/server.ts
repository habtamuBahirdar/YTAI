import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { config } from 'dotenv';

config();

const PORT = parseInt(process.env.REALTIME_PORT || '4000', 10);

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Session manager
const sessions = new Map<string, { ws: WebSocket; userId: string; createdAt: Date }>();

wss.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket connection');

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received:', message);

      // Handle session events
      if (message.type === 'session.start') {
        const sessionId = message.sessionId;
        const userId = message.userId;

        sessions.set(sessionId, {
          ws,
          userId,
          createdAt: new Date(),
        });

        ws.send(
          JSON.stringify({
            type: 'session.started',
            sessionId,
            timestamp: new Date().toISOString(),
          })
        );

        console.log(`Session ${sessionId} started for user ${userId}`);
      }

      if (message.type === 'session.stop') {
        const { sessionId } = message;
        sessions.delete(sessionId);
        ws.send(
          JSON.stringify({
            type: 'session.stopped',
            sessionId,
          })
        );
      }
    } catch (error) {
      console.error('Message error:', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        })
      );
    }
  });

  ws.on('close', () => {
    // Clean up session
    for (const [sessionId, session] of sessions.entries()) {
      if (session.ws === ws) {
        sessions.delete(sessionId);
        console.log(`Session ${sessionId} closed`);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`Realtime server listening on ws://localhost:${PORT}`);
  console.log(`Active sessions: ${sessions.size}`);
});
