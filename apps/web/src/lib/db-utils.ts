/**
 * Database utilities for AddisDub
 */

async function getDb() {
  const db = await import('./db').then(m => m.default);
  return db;
}

/**
 * Get user with their recent sessions
 */
export async function getUserWithSessions(userId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return db.user.findUnique({
    where: { id: userId },
    include: {
      sessions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          segments: {
            orderBy: { sequence: 'asc' },
          },
        },
      },
    },
  });
}

/**
 * Get user credits
 */
export async function getUserCredits(userId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user?.credits ?? 0;
}

/**
 * Deduct credits from user
 */
export async function deductCredits(userId: string, amount: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return db.user.update({
    where: { id: userId },
    data: { credits: { decrement: amount } },
  });
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
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return db.dubbingSession.create({
    data: {
      userId,
      youtubeUrl,
      videoId,
      title,
      status: 'pending',
    },
  });
}

/**
 * Get session with all segments
 */
export async function getSessionWithSegments(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return db.dubbingSession.findUnique({
    where: { id: sessionId },
    include: {
      segments: {
        orderBy: { sequence: 'asc' },
      },
      usage: true,
    },
  });
}

/**
 * Update session status and progress
 */
export async function updateSessionStatus(
  sessionId: string,
  status: string,
  progress?: number
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const data: any = { status };
  if (progress !== undefined) {
    data.progress = progress;
  }
  if (status === 'completed') {
    data.completedAt = new Date();
  }
  return db.dubbingSession.update({
    where: { id: sessionId },
    data,
  });
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
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return db.audioSegment.createMany({
    data: segments.map((seg) => ({
      sessionId,
      ...seg,
      status: 'pending',
    })),
  });
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
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return db.audioSegment.update({
    where: { id: segmentId },
    data,
  });
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
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return db.usage.create({
    data: {
      userId,
      sessionId,
      service,
      duration,
      estimatedCost,
      provider,
      status: 'pending',
    },
  });
}

/**
 * Get user usage statistics
 */
export async function getUserUsageStats(userId: string, days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db.usage.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    select: {
      service: true,
      duration: true,
      estimatedCost: true,
    },
  });
}
