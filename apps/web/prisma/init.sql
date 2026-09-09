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
  "password" TEXT,
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
-- Demo user for testing (password: demo123456)
INSERT INTO "users" ("id", "email", "password", "name", "credits") 
VALUES ('demo-user-1', 'demo@addisdub.com', '$2a$10$W3l8fHvWCKDDDz.P6IGNN.CjHCmRZAGLPsLp7Xe3Kpx1AkfILEi8K', 'Demo User', 100)
ON CONFLICT ("email") DO NOTHING;

-- ============================================
-- VERIFY TABLES
-- ============================================
-- Run these queries to verify setup:
-- SELECT * FROM "users";
-- SELECT * FROM "dubbing_sessions";
-- SELECT * FROM "audio_segments";
-- SELECT * FROM "usage";

