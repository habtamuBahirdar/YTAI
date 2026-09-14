/**
 * Database utilities for AddisDub using raw SQL
 */

import { getDb } from './db';

/**
 * Get user with their recent sessions
 */
export async function getUserWithSessions(userId: string) {
  const client = await getDb();
  if (!client) throw new Error('Database not available');

  const user = await client.query('SELECT * FROM "users" WHERE id = $1', [userId]);
  if (user.rows.length === 0) return null;

  const sessions = await client.query(
    'SELECT * FROM "dubbing_sessions" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 10',
    [userId]
  );

  return { ...user.rows[0], sessions: sessions.rows };
}

/**
 * Get user credits
 */
export async function getUserCredits(userId: string) {
  const client = await getDb();
  if (!client) throw new Error('Database not available');

  const result = await client.query(
    'SELECT credits FROM "users" WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.credits ?? 0;
}

/**
 * Deduct credits from user
 */
export async function deductCredits(userId: string, amount: number) {
  const client = await getDb();
  if (!client) throw new Error('Database not available');

  const result = await client.query(
    'UPDATE "users" SET credits = credits - $1 WHERE id = $2 AND credits >= $1 RETURNING *',
    [amount, userId]
  );
  if (result.rows.length === 0) throw new Error('Insufficient credits or user not found');
  return result.rows[0];
}

/**
 * Create a new dubbing session
 */
export async function createDubbingSession(
  userId: string,
  youtubeUrl: string,
  videoId?: string,
  title?: string
) {
  const client = await getDb();
  if (!client) throw new Error('Database not available');

  const result = await client.query(
    `INSERT INTO "dubbing_sessions" ("userId", "youtubeUrl", "videoId", "title", status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [userId, youtubeUrl, videoId || null, title || null]
  );
  return result.rows[0];
}

/**
 * Get session with all segments
 */
export async function getSessionWithSegments(sessionId: string) {
  const client = await getDb();
  if (!client) throw new Error('Database not available');

  const sessionResult = await client.query(
    'SELECT * FROM "dubbing_sessions" WHERE id = $1',
    [sessionId]
  );
  if (sessionResult.rows.length === 0) return null;
  const session = sessionResult.rows[0];

  const segments = await client.query(
    'SELECT * FROM "audio_segments" WHERE "sessionId" = $1 ORDER BY sequence ASC',
    [sessionId]
  );
  const usage = await client.query(
    'SELECT * FROM "usage" WHERE "sessionId" = $1',
    [sessionId]
  );

  return { ...session, segments: segments.rows, usage: usage.rows[0] || null };
}

/**
 * Update session status and progress
 */
export async function updateSessionStatus(
  sessionId: string,
  status: string,
  progress?: number
) {
  const client = await getDb();
  if (!client) throw new Error('Database not available');

  const fields: string[] = ['status = $1'];
  const values: any[] = [status];
  let idx = 2;
  if (progress !== undefined) {
    fields.push(`progress = $${idx}`);
    values.push(progress);
    idx++;
  }
  if (status === 'completed') {
    fields.push(`"completedAt" = NOW()`);
  }
  values.push(sessionId);
  const query = `UPDATE "dubbing_sessions" SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  const result = await client.query(query, values);
  return result.rows[0];
}

/**
 * Create audio segments
 */
export async function createAudioSegments(
  sessionId: string,
  segments: Array<{
    sequence: number;
    sourceText?: string;
  }>
) {
  const client = await getDb();
  if (!client) throw new Error('Database not available');

  if (segments.length === 0) return [];

  const values: any[] = [];
  const placeholders: string[] = [];
  let idx = 1;
  for (const seg of segments) {
    placeholders.push(`($${idx}, $${idx+1}, $${idx+2}, 'pending')`);
    values.push(sessionId);
    values.push(seg.sequence);
    values.push(seg.sourceText || null);
    idx += 3;
  }
  const query = `INSERT INTO "audio_segments" ("sessionId", sequence, "sourceText", status) VALUES ${placeholders.join(', ')} RETURNING *`;
  const result = await client.query(query, values);
  return result.rows;
}

/**
 * Update audio segment
 */
export async function updateAudioSegment(
  segmentId: string,
  data: {
    sourceText?: string;
    translatedText?: string;
    audioUrl?: string;
    duration?: number;
    status?: string;
  }
) {
  const client = await getDb();
  if (!client) throw new Error('Database not available');

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (data.sourceText !== undefined) {
    fields.push(`"sourceText" = $${idx}`);
    values.push(data.sourceText);
    idx++;
  }
  if (data.translatedText !== undefined) {
    fields.push(`"translatedText" = $${idx}`);
    values.push(data.translatedText);
    idx++;
  }
  if (data.audioUrl !== undefined) {
    fields.push(`"audioUrl" = $${idx}`);
    values.push(data.audioUrl);
    idx++;
  }
  if (data.duration !== undefined) {
    fields.push(`duration = $${idx}`);
    values.push(data.duration);
    idx++;
  }
  if (data.status !== undefined) {
    fields.push(`status = $${idx}`);
    values.push(data.status);
    idx++;
  }
  if (fields.length === 0) return null;
  values.push(segmentId);
  const query = `UPDATE "audio_segments" SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  const result = await client.query(query, values);
  return result.rows[0];
}

/**
 * Track usage for billing
 */
export async function trackUsage(
  userId: string,
  sessionId: string | null,
  service: 'STT' | 'TRANSLATION' | 'TTS',
  duration: number,
  estimatedCost: number,
  provider: string = 'addis-ai'
) {
  const client = await getDb();
  if (!client) throw new Error('Database not available');

  const result = await client.query(
    `INSERT INTO "usage" ("userId", "sessionId", service, duration, "estimatedCost", provider, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [userId, sessionId, service, duration, estimatedCost, provider]
  );
  return result.rows[0];
}

/**
 * Get user usage statistics
 */
export async function getUserUsageStats(userId: string, days: number = 30) {
  const client = await getDb();
  if (!client) throw new Error('Database not available');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await client.query(
    `SELECT service, duration, "estimatedCost" FROM "usage"
     WHERE "userId" = $1 AND "createdAt" >= $2`,
    [userId, startDate]
  );
  return result.rows;
}