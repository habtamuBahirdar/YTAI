/**
 * DATABASE INITIALIZATION GUIDE
 * 
 * Run these SQL commands directly in your PostgreSQL database
 * or use: psql -U postgres -d addisdub_dev -f init.sql
 */

-- Drop existing tables if needed (for fresh start)
-- DROP TABLE IF EXISTS "usage" CASCADE;
-- DROP TABLE IF EXISTS "audio_segments" CASCADE;
-- DROP TABLE IF EXISTS "dubbing_sessions" CASCADE;
-- DROP TABLE IF EXISTS "users" CASCADE;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "credits" DOUBLE PRECISION DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- ============================================
-- DUBBING_SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "dubbing_sessions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "youtubeUrl" TEXT NOT NULL,
  "videoId" TEXT,
  "title" TEXT,
  "sourceLanguage" TEXT DEFAULT 'en',
  "targetLanguage" TEXT DEFAULT 'am',
  "status" TEXT DEFAULT 'pending',
  "progress" DOUBLE PRECISION DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "dubbing_sessions_userId_idx" ON "dubbing_sessions"("userId");
CREATE INDEX IF NOT EXISTS "dubbing_sessions_status_idx" ON "dubbing_sessions"("status");

-- ============================================
-- AUDIO_SEGMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "audio_segments" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES "dubbing_sessions"("id") ON DELETE CASCADE,
  "sequence" INTEGER NOT NULL,
  "sourceText" TEXT,
  "translatedText" TEXT,
  "audioUrl" TEXT,
  "duration" DOUBLE PRECISION,
  "status" TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("sessionId", "sequence")
);

CREATE INDEX IF NOT EXISTS "audio_segments_sessionId_idx" ON "audio_segments"("sessionId");
CREATE INDEX IF NOT EXISTS "audio_segments_status_idx" ON "audio_segments"("status");

-- ============================================
-- USAGE TABLE (Billing/Cost Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS "usage" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "sessionId" TEXT REFERENCES "dubbing_sessions"("id") ON DELETE SET NULL,
  "service" TEXT NOT NULL,
  "duration" DOUBLE PRECISION,
  "estimatedCost" DOUBLE PRECISION NOT NULL,
  "actualCost" DOUBLE PRECISION,
  "provider" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "usage_userId_idx" ON "usage"("userId");
CREATE INDEX IF NOT EXISTS "usage_sessionId_idx" ON "usage"("sessionId");
CREATE INDEX IF NOT EXISTS "usage_service_idx" ON "usage"("service");

-- ============================================
-- TEST DATA (Optional)
-- ============================================
-- Uncomment to insert test user and sessions

-- INSERT INTO "users" ("id", "email", "name", "credits") 
-- VALUES ('user-1', 'test@addisdub.com', 'Test User', 100)
-- ON CONFLICT ("email") DO NOTHING;

-- INSERT INTO "dubbing_sessions" ("id", "userId", "youtubeUrl", "videoId", "title", "status")
-- VALUES 
--   ('session-1', 'user-1', 'https://youtube.com/watch?v=test1', 'test1', 'Test Video 1', 'completed'),
--   ('session-2', 'user-1', 'https://youtube.com/watch?v=test2', 'test2', 'Test Video 2', 'processing')
-- ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- VERIFY TABLES
-- ============================================
-- Run these queries to verify setup:
-- SELECT * FROM "users";
-- SELECT * FROM "dubbing_sessions";
-- SELECT * FROM "audio_segments";
-- SELECT * FROM "usage";
