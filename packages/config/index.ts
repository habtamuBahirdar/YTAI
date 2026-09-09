/**
 * Shared configuration for AddisDub
 */

export const config = {
  app: {
    name: 'AddisDub',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://addisdub:addisdub_dev_password@localhost:5432/addisdub_dev',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  realtime: {
    port: parseInt(process.env.REALTIME_PORT || '4000', 10),
    url: process.env.REALTIME_URL || 'ws://localhost:4000',
  },
  auth: {
    secret: process.env.AUTH_SECRET || 'dev-secret-key',
  },
  addisAI: {
    apiKey: process.env.ADDIS_AI_API_KEY || '',
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    path: process.env.STORAGE_PATH || './storage',
  },
  costs: {
    maxSessionDuration: 10 * 60 * 1000, // 10 minutes
    maxConcurrentSessions: 1,
    maxSegmentSize: 8, // seconds
  },
};
