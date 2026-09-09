# Phase 2 — Database Setup Guide

## Prerequisites

- PostgreSQL running at `127.0.0.1:5432`
- Credentials set in `.env` file
- `pnpm` and Node.js installed

## Database Schema

The Prisma schema defines four main models:

### User
- Stores user account information
- Tracks available credits for API usage
- One-to-many relationship with DubbingSession and Usage

### DubbingSession
- Represents a single dubbing job
- Tracks progress, status, and timestamps
- One-to-many relationship with AudioSegment

### AudioSegment
- Represents individual segments being processed
- Contains source text, translation, and generated audio
- Tracks processing status for each segment

### Usage
- Tracks all API calls for billing/cost analysis
- Records estimated and actual costs
- Supports cost reconciliation workflow

## Initial Setup

### 1. Install Prisma Client

If not already installed:
```bash
cd apps/web
pnpm add @prisma/client
pnpm add -D prisma
```

### 2. Create Initial Migration

```bash
cd apps/web
pnpm prisma migrate dev --name init
```

This will:
- Create the PostgreSQL database (if needed)
- Apply all migrations
- Generate Prisma Client

### 3. Verify Connection

```bash
pnpm prisma db push
```

Or open Prisma Studio to verify:
```bash
pnpm prisma studio
```

## Database Models

### User Table
```sql
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "credits" DOUBLE PRECISION DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### DubbingSession Table
```sql
CREATE TABLE "dubbing_sessions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "youtubeUrl" TEXT NOT NULL,
  "videoId" TEXT,
  "title" TEXT,
  "sourceLanguage" TEXT DEFAULT 'en',
  "targetLanguage" TEXT DEFAULT 'am',
  "status" TEXT DEFAULT 'pending',
  "progress" DOUBLE PRECISION DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP
);
```

### AudioSegment Table
```sql
CREATE TABLE "audio_segments" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES "dubbing_sessions"("id") ON DELETE CASCADE,
  "sequence" INTEGER NOT NULL,
  "sourceText" TEXT,
  "translatedText" TEXT,
  "audioUrl" TEXT,
  "duration" DOUBLE PRECISION,
  "status" TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("sessionId", "sequence")
);
```

### Usage Table
```sql
CREATE TABLE "usage" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "sessionId" TEXT REFERENCES "dubbing_sessions"("id") ON DELETE SET NULL,
  "service" TEXT NOT NULL,
  "duration" DOUBLE PRECISION,
  "estimatedCost" DOUBLE PRECISION NOT NULL,
  "actualCost" DOUBLE PRECISION,
  "provider" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

## Connecting from Application Code

Use the Prisma Client singleton in `src/lib/db.ts`:

```typescript
import { db } from '@/lib/db';

// Get a user
const user = await db.user.findUnique({
  where: { email: 'user@example.com' },
});

// Create a session
const session = await db.dubbingSession.create({
  data: {
    userId: 'user-id',
    youtubeUrl: 'https://youtube.com/watch?v=...',
    title: 'Video Title',
  },
});
```

## Database Utilities

Helper functions are available in `src/lib/db-utils.ts`:

```typescript
import { 
  getUserCredits, 
  createDubbingSession,
  updateSessionStatus,
  trackUsage 
} from '@/lib/db-utils';

// Get user credits
const credits = await getUserCredits(userId);

// Create session
const session = await createDubbingSession(
  userId,
  youtubeUrl,
  videoId,
  title
);

// Update session status
await updateSessionStatus(sessionId, 'processing', 25);

// Track usage
await trackUsage(
  userId,
  sessionId,
  'STT',
  60, // duration in seconds
  0.50, // estimated cost
  'addis-ai'
);
```

## Troubleshooting

### Connection refused
- Check PostgreSQL is running: `psql -U postgres`
- Verify credentials in `.env`

### Password authentication failed
- Double-check `DB_PASSWORD` in `.env`
- Ensure password is properly escaped in `DATABASE_URL`

### Database does not exist
- Run `pnpm prisma migrate dev --name init` to create it

### Prisma Client out of sync
- Regenerate: `pnpm prisma generate`

## Next Steps

- Phase 3: Implement authentication with Auth.js
- Phase 4: Integrate Addis AI API
- Phase 5: Build audio processing pipeline
