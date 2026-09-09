# AddisDub MVP — Full Development Plan

> **Project:** Real-time English → Amharic AI dubbing platform  
> **MVP goal:** Let a user provide a YouTube video/podcast and listen to an Amharic AI dub progressively, without waiting for the entire video to finish processing.  
> **Primary stack:** Next.js + React + TypeScript + Tailwind CSS + PostgreSQL + Prisma + Redis + Node.js realtime worker + WebSocket + FFmpeg + Addis AI.

---

## 1. Product Vision

AddisDub is an AI-powered dubbing platform focused initially on converting English spoken content into natural Amharic speech.

### Long-term product

```text
YouTube / Browser Audio
        ↓
English Speech
        ↓
Speech-to-Text
        ↓
English Transcript
        ↓
English → Amharic Translation
        ↓
Amharic Text
        ↓
Amharic Text-to-Speech
        ↓
Audio Buffer
        ↓
User hears Amharic
```

### Initial target users

- Ethiopian developers and students
- Podcast listeners
- YouTube viewers
- Online-course students
- Content creators
- Ethiopian media creators
- Training organizations
- NGOs and educational organizations

### Initial language direction

```text
Source: English
Target: Amharic
```

Future:

```text
Amharic → English
English → Afaan Oromo
English → Tigrinya
English → other African languages
```

---

# 2. MVP Definition

The first version must be small enough to build and test quickly.

## MVP v0.1

The user can:

1. Open the website.
2. Paste a supported YouTube URL.
3. Create a dubbing session.
4. Select Amharic.
5. Start processing.
6. See the English transcript.
7. See the Amharic translation.
8. Hear generated Amharic speech.
9. Receive segments progressively.
10. Pause/resume playback.
11. See current processing status.
12. See basic usage/credit consumption.
13. View previous sessions.

## Not required in v0.1

- Payments
- Subscription management
- Mobile application
- Chrome extension
- Multi-user organizations
- Advanced voice cloning
- Perfect speaker separation
- Full video rendering
- Social sharing
- Complex analytics
- Automatic lip synchronization

These can come later.

---

# 3. Product Modes

The architecture should support two modes.

## Mode A — Web MVP

```text
User
 ↓
Next.js website
 ↓
Dubbing session
 ↓
Realtime service
 ↓
AI pipeline
 ↓
Amharic audio
 ↓
Browser player
```

This is the first implementation.

## Mode B — Chrome Extension

Later:

```text
YouTube tab
 ↓
Chrome Extension
 ↓
Tab audio capture
 ↓
WebSocket
 ↓
Realtime service
 ↓
Addis AI
 ↓
Amharic audio
 ↓
Browser audio
```

The backend should be designed now so Mode B can reuse it.

---

# 4. Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Query where useful

## Backend / Web application

- Next.js App Router
- Route Handlers / Server Actions for normal application operations
- Prisma
- PostgreSQL
- Auth.js

## Realtime

- Node.js
- TypeScript
- WebSocket
- Dedicated realtime service

Do not put long-running audio processing entirely inside normal Next.js request handlers.

## Queue / cache

- Redis
- BullMQ if background jobs are needed

## AI

- Addis AI
  - Speech-to-text
  - Translation / LLM
  - Text-to-speech
  - Realtime capabilities where appropriate

## Audio

- FFmpeg
- Web Audio API
- AudioWorklet where needed

## Storage

Development:

```text
Local filesystem
```

Production:

```text
S3-compatible object storage
```

## Infrastructure

Development:

```text
Docker Compose
```

Production:

```text
VPS
Docker
Nginx
SSL
PostgreSQL
Redis
Realtime worker
Next.js
```

---

# 5. High-Level Architecture

```text
                       ┌──────────────────────┐
                       │       YouTube        │
                       │    Source Content    │
                       └──────────┬───────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       NEXT.JS WEB APP                       │
│                                                             │
│  Landing Page                                               │
│  Dashboard                                                  │
│  URL Input                                                  │
│  Dubbing Player                                             │
│  Transcript                                                 │
│  Session History                                            │
│  Account / Usage                                            │
│                                                             │
│                    React + TypeScript                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTPS / WebSocket
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    REALTIME SERVICE                         │
│                  Node.js + TypeScript                       │
│                                                             │
│  Session Manager                                            │
│  Audio Stream Manager                                       │
│  Pipeline Coordinator                                       │
│  Transcript Manager                                         │
│  Audio Buffer Manager                                       │
│  Reconnection Manager                                       │
└───────────────┬───────────────────────────┬─────────────────┘
                │                           │
                ▼                           ▼
        ┌───────────────┐          ┌────────────────┐
        │   Addis AI    │          │     FFmpeg     │
        │               │          │                │
        │ STT           │          │ Decode         │
        │ Translation   │          │ Convert        │
        │ TTS           │          │ Normalize      │
        └───────────────┘          └────────────────┘
                │
                ▼
        ┌────────────────┐
        │ Audio Segments │
        └───────┬────────┘
                │
                ▼
        ┌────────────────┐
        │ Browser Player │
        └────────────────┘
```

---

# 6. Monorepo Structure

Recommended structure:

```text
addisdub/
│
├── apps/
│   │
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (marketing)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── dub/
│   │   │   │   ├── api/
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   ├── player/
│   │   │   │   ├── dubbing/
│   │   │   │   └── dashboard/
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── auth/
│   │   │   │   ├── db/
│   │   │   │   ├── redis/
│   │   │   │   └── validation/
│   │   │   │
│   │   │   └── types/
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   │
│   │   └── package.json
│   │
│   └── realtime/
│       ├── src/
│       │   ├── server.ts
│       │   ├── config.ts
│       │   ├── sessions/
│       │   ├── pipeline/
│       │   ├── ai/
│       │   ├── audio/
│       │   ├── youtube/
│       │   └── utils/
│       │
│       └── package.json
│
├── packages/
│   ├── types/
│   ├── validation/
│   └── config/
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── .env.example
├── .gitignore
└── README.md
```

---

# 7. Development Phases

## Phase 0 — Project Foundation

### Goal

Create a clean development environment.

### Tasks

- [ ] Create Git repository
- [ ] Initialize pnpm workspace
- [ ] Create Next.js application
- [ ] Create realtime Node.js application
- [ ] Configure TypeScript
- [ ] Configure ESLint
- [ ] Configure Prettier
- [ ] Configure Tailwind
- [ ] Install shadcn/ui
- [ ] Create `.env.example`
- [ ] Create Docker Compose
- [ ] Start PostgreSQL
- [ ] Start Redis
- [ ] Verify local environment

### Success criteria

```text
Next.js → http://localhost:3000
Realtime → ws://localhost:4000
PostgreSQL → working
Redis → working
```

---

# 8. Phase 1 — UI MVP

## Goal

Build the complete frontend before connecting AI.

### Pages

```text
/
```

Landing page.

```text
/login
```

Login.

```text
/register
```

Registration.

```text
/dashboard
```

Dashboard.

```text
/dub/new
```

New dubbing session.

```text
/dub/[id]
```

Dubbing player.

```text
/history
```

Previous sessions.

```text
/settings
```

Account settings.

---

# 9. Landing Page

The landing page should communicate one idea immediately:

> Watch English content in Amharic.

Example:

```text
English content.
Your language.

Watch YouTube in Amharic
with AI-powered dubbing.

[ Paste YouTube URL ]

[ Start dubbing ]
```

Features:

- Real-time / progressive dubbing
- Amharic AI voice
- Transcript
- Low-latency playback
- No manual translation workflow

---

# 10. Dashboard

Dashboard sections:

```text
┌─────────────────────────────────────────────┐
│ AddisDub                         Credits: 42 │
├─────────────────────────────────────────────┤
│                                             │
│ Start a new dubbing                         │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Paste YouTube URL                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [ Start dubbing ]                           │
│                                             │
├─────────────────────────────────────────────┤
│ Recent sessions                             │
│                                             │
│ Podcast A          Amharic      Completed   │
│ Podcast B          Amharic      Processing  │
│ Podcast C          Amharic      Completed   │
└─────────────────────────────────────────────┘
```

---

# 11. Dubbing Player UI

The main player is the most important UI.

```text
┌────────────────────────────────────────────────┐
│                                                │
│             Podcast / Video Title              │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │                                          │  │
│  │              Video / Artwork              │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  ● LIVE                         02:14 / 43:20   │
│                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                │
│             ▶  ─────────────  🔊              │
│                                                │
├────────────────────────────────────────────────┤
│ English                                        │
│ "Today we're going to talk about..."           │
│                                                │
│ Amharic                                        │
│ "ዛሬ ስለ ... እንነጋገራለን..."                  │
│                                                │
│ ● Translating segment                         │
└────────────────────────────────────────────────┘
```

---

# 12. Phase 2 — Database

Use PostgreSQL + Prisma.

## User

```prisma
model User {
  id        String   @id @default(cuid())
  name      String?
  email     String   @unique
  credits   Float    @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions DubbingSession[]
}
```

## DubbingSession

```prisma
model DubbingSession {
  id             String   @id @default(cuid())
  userId         String
  youtubeUrl     String
  videoId        String?
  title          String?
  sourceLanguage String   @default("en")
  targetLanguage String   @default("am")
  status         String   @default("pending")
  progress       Float    @default(0)
  createdAt      DateTime @default(now())
  completedAt    DateTime?

  user     User           @relation(fields: [userId], references: [id])
  segments AudioSegment[]

  @@index([userId])
}
```

## AudioSegment

```prisma
model AudioSegment {
  id              String   @id @default(cuid())
  sessionId       String
  sequence        Int
  sourceText      String?
  translatedText  String?
  audioUrl        String?
  duration        Float?
  status          String   @default("pending")
  createdAt       DateTime @default(now())

  session DubbingSession @relation(fields: [sessionId], references: [id])

  @@unique([sessionId, sequence])
  @@index([sessionId])
}
```

---

# 13. Phase 3 — Authentication

Use Auth.js.

Features:

- Email/password initially
- Google OAuth later
- Protected dashboard
- Session ownership
- Usage tracking

Security rules:

- Never expose Addis AI API keys to the browser.
- Never expose database credentials.
- Never expose Redis credentials.
- Never trust user-provided session IDs.
- Every session must belong to the authenticated user.

---

# 14. Phase 4 — Addis AI Integration

Before building the complete pipeline, test each API separately.

## Test A — STT

Input:

```text
English audio
```

Output:

```text
English transcript
```

Expected:

```json
{
  "text": "Welcome to today's podcast..."
}
```

---

# 15. Test B — Translation

Input:

```text
Welcome to today's podcast.
```

Output:

```text
እንኳን ወደ ዛሬው ፖድካስት በደህና መጡ።
```

Translation should preserve:

- Meaning
- Names
- Numbers
- Technical terminology
- Context
- Sentence boundaries

---

# 16. Test C — Amharic TTS

Input:

```text
እንኳን ወደ ዛሬው ፖድካስት በደህና መጡ።
```

Output:

```text
Amharic audio
```

Test:

- Male voice
- Female voice
- Speaking speed
- Pronunciation
- Audio quality
- Latency
- Cost

---

# 17. Addis AI Credit Testing Strategy

Do not spend the full balance on a large video.

Start with:

```text
30 seconds
```

Then:

```text
1 minute
```

Then:

```text
5 minutes
```

Then:

```text
10 minutes
```

Record:

```text
STT cost
Translation cost
TTS cost
Total cost
Processing time
Audio quality
```

Create an internal cost calculator.

---

# 18. Phase 5 — Audio Pipeline

The pipeline should process content in segments.

Conceptually:

```text
Audio
 ↓
Segment 1
 ↓
STT
 ↓
Translation
 ↓
TTS
 ↓
Audio 1
 ↓
Playback

Audio
 ↓
Segment 2
 ↓
STT
 ↓
Translation
 ↓
TTS
 ↓
Audio 2
 ↓
Playback
```

Never require the entire podcast to finish before playback starts.

---

# 19. Segment Strategy

Initial target:

```text
3–8 seconds
```

per speech segment, depending on speech boundaries.

Avoid cutting sentences unnecessarily.

Bad:

```text
"Today we are going"
```

then:

```text
"to discuss AI."
```

Better:

```text
"Today we are going to discuss AI."
```

The segmentation system should prioritize semantic/sentence boundaries where possible.

---

# 20. Realtime Pipeline

Create:

```text
RealtimeSession
```

Responsibilities:

- Authenticate WebSocket
- Validate session
- Manage connection
- Receive events
- Send status updates
- Stream transcripts
- Stream translated text
- Stream audio
- Handle reconnects
- Track latency

Example event:

```json
{
  "type": "session.started",
  "sessionId": "abc123"
}
```

Transcript:

```json
{
  "type": "transcript",
  "sequence": 1,
  "text": "Welcome to the podcast."
}
```

Translation:

```json
{
  "type": "translation",
  "sequence": 1,
  "text": "እንኳን ወደ ፖድካስቱ በደህና መጡ።"
}
```

Audio:

```json
{
  "type": "audio.ready",
  "sequence": 1,
  "audioUrl": "/audio/session/1.mp3"
}
```

---

# 21. WebSocket Protocol

Client → server:

```text
session.start
session.pause
session.resume
session.stop
session.seek
```

Server → client:

```text
session.started
session.processing
transcript.partial
transcript.final
translation.ready
audio.ready
segment.play
session.paused
session.completed
session.error
```

---

# 22. Audio Playback Strategy

The browser should maintain a small queue.

Example:

```text
Audio Queue

[ Segment 8 ]
[ Segment 9 ]
[ Segment 10 ]
       ↑
    Playing
```

While segment 8 plays:

```text
segment 11 → processing
segment 12 → waiting
```

This prevents silence between segments.

---

# 23. Buffering

Initial strategy:

```text
Minimum buffer:
2 segments

Target buffer:
3–5 segments
```

If buffer becomes too low:

```text
PLAYBACK
   ↓
BUFFER LOW
   ↓
prioritize pipeline
```

If buffer becomes large:

```text
BUFFER FULL
   ↓
slow/pause processing
```

This prevents unnecessary API usage.

---

# 24. Latency Measurement

Track:

```text
audio_received_at
stt_started_at
stt_completed_at
translation_started_at
translation_completed_at
tts_started_at
tts_completed_at
audio_played_at
```

Calculate:

```text
STT latency
Translation latency
TTS latency
Total pipeline latency
```

Display only simplified information to users.

Example:

```text
Live
● 2.3s behind
```

---

# 25. Phase 6 — YouTube Input

The user enters a YouTube URL.

Validate:

```text
youtube.com/watch?v=...
youtu.be/...
youtube.com/shorts/...
```

Extract:

```text
videoId
```

Retrieve metadata where permitted:

```text
title
thumbnail
duration
channel
```

Important:

The implementation must respect YouTube's terms, copyright restrictions, access controls, and applicable law. Do not design the system around bypassing restrictions or downloading protected content without permission.

For the first technical pipeline, use test audio or content you are authorized to process.

---

# 26. Development Audio Source

Before connecting YouTube, create:

```text
/test-audio
```

with an authorized English audio sample.

Pipeline:

```text
test.mp3
 ↓
STT
 ↓
Translation
 ↓
TTS
 ↓
Browser
```

This isolates AI and realtime problems from YouTube-specific problems.

---

# 27. Phase 7 — Full Web MVP

Once test audio works:

```text
YouTube URL
 ↓
Metadata
 ↓
Authorized/compatible audio source
 ↓
Audio segmentation
 ↓
STT
 ↓
Translation
 ↓
TTS
 ↓
Audio queue
 ↓
Browser
```

Dashboard should show:

```text
Status:
● Connecting

● Processing

● Translating

● Generating voice

● Playing

● Completed
```

---

# 28. Error Handling

Possible errors:

```text
Invalid URL
Video unavailable
Unsupported video
Audio unavailable
STT failure
Translation failure
TTS failure
WebSocket disconnected
AI rate limit
Insufficient credits
Server failure
Timeout
```

Every error should have:

```text
human-readable message
technical error ID
retry option
safe logging
```

Example:

```text
We couldn't process this segment.

Error ID: DUB-8F32

[ Retry ]
```

Do not show API secrets or raw provider errors.

---

# 29. Retry Strategy

Transient errors:

```text
Retry 1
wait 500ms

Retry 2
wait 1s

Retry 3
wait 2s
```

After maximum retries:

```text
segment.status = failed
```

Do not endlessly retry.

---

# 30. Redis / Queue Architecture

Redis can handle:

- Session state
- Short-lived locks
- Processing queues
- Rate limiting
- Pub/sub if needed

BullMQ can handle:

```text
audio processing jobs
translation jobs
TTS jobs
cleanup jobs
```

Realtime streaming itself should remain responsive and should not be blocked by a large background queue.

---

# 31. Usage / Credits

Every AI operation should produce a usage record.

Example:

```text
Usage
 ├── userId
 ├── sessionId
 ├── service
 ├── duration
 ├── estimatedCost
 ├── provider
 └── createdAt
```

Services:

```text
STT
TRANSLATION
TTS
```

Eventually:

```text
USER CREDIT
     ↓
RESERVE
     ↓
PROCESS
     ↓
FINAL COST
     ↓
RECONCILE
```

Do not simply deduct estimated costs without reconciliation.

---

# 32. Cost Protection

Critical.

Implement:

```text
Maximum session duration
Maximum daily usage
Maximum segment size
Rate limit
Concurrent session limit
```

For example during development:

```text
Maximum session:
10 minutes

Maximum concurrent sessions:
1 per user
```

This protects the Addis AI balance.

---

# 33. Observability

Log:

```text
session ID
segment ID
user ID
pipeline stage
latency
provider response status
error code
estimated cost
```

Never log:

```text
API keys
passwords
session secrets
private tokens
```

---

# 34. Testing Plan

## Unit tests

Test:

- YouTube URL parser
- Session validation
- Credit calculations
- Segment ordering
- WebSocket message validation
- Translation response parsing
- TTS response parsing

## Integration tests

Test:

```text
Audio
 ↓
STT
 ↓
Translation
 ↓
TTS
```

## End-to-end

Test:

```text
Open website
 ↓
Paste URL
 ↓
Start
 ↓
Session created
 ↓
WebSocket connected
 ↓
Transcript appears
 ↓
Translation appears
 ↓
Audio plays
```

---

# 35. Security

## API keys

Server-side only:

```text
ADDIS_AI_API_KEY
```

Never:

```text
NEXT_PUBLIC_ADDIS_AI_API_KEY
```

## WebSocket authentication

Use a short-lived session token or authenticated session.

Do not accept:

```text
ws://server/session?id=anything
```

without authentication/authorization.

## Input validation

Validate:

```text
URL
language
sessionId
audio metadata
WebSocket events
```

Use Zod.

---

# 36. Rate Limiting

Apply limits to:

```text
POST /api/dubbing
WebSocket connections
session creation
metadata requests
```

Initial example:

```text
5 session creations / hour / user
```

Adjust after testing.

---

# 37. File Storage

Development:

```text
storage/
  sessions/
    session-id/
      segment-001.mp3
      segment-002.mp3
```

Production:

```text
Object Storage
    ↓
session-id/
    ├── segment-001
    ├── segment-002
    └── ...
```

Audio files should have expiration/cleanup rules.

---

# 38. Cleanup Jobs

Automatically delete temporary files.

Example:

```text
temporary audio:
24 hours

failed sessions:
24–48 hours

old generated segments:
based on retention policy
```

Do not accumulate large audio files on the VPS.

---

# 39. Chrome Extension — Phase 2

Only begin this after the web pipeline is stable.

Technology:

```text
Chrome Extension Manifest V3
TypeScript
React
WebSocket
Web Audio API
```

Extension structure:

```text
extension/
├── manifest.json
├── src/
│   ├── background/
│   ├── content/
│   ├── popup/
│   ├── audio/
│   └── websocket/
└── package.json
```

---

# 40. Chrome Extension Flow

```text
User opens YouTube
       ↓
Click AddisDub
       ↓
Extension obtains permitted tab audio
       ↓
Audio chunks
       ↓
WebSocket
       ↓
Realtime service
       ↓
STT
       ↓
Translation
       ↓
TTS
       ↓
Amharic audio
       ↓
Browser playback
```

Need to handle:

- Chrome permissions
- MV3 lifecycle
- Audio capture
- Background service
- Offscreen document if required
- WebSocket reconnect
- Audio synchronization
- User controls

---

# 41. Synchronization Problem

This is one of the hardest parts.

English audio:

```text
0s ───────────── 10s ──────────── 20s
```

Amharic generation may take:

```text
2.5 seconds
```

Therefore:

```text
English:
       █████████████████████████

Amharic:
             ███████████████████
             ↑
          2.5s latency
```

The product should initially use:

> **Low-latency sequential dubbing**

rather than claiming perfect lip synchronization.

---

# 42. Voice Management

Create a voice configuration:

```text
Voice
 ├── id
 ├── provider
 ├── language
 ├── gender
 ├── displayName
 ├── speed
 └── enabled
```

UI:

```text
Amharic Voice

○ Male — Natural
○ Female — Natural
○ Male — Deep
○ Female — Soft
```

Only expose voices actually available from the provider.

---

# 43. Translation Quality

Technical terms should remain understandable.

Example:

```text
React
Laravel
API
GitHub
JavaScript
PostgreSQL
Docker
```

Do not blindly transliterate every technical word.

Translation prompt should include rules such as:

```text
Translate naturally into Ethiopian Amharic.

Preserve:
- technical terms
- names
- URLs
- code
- numbers

Prefer natural spoken Amharic over literal word-for-word translation.
```

---

# 44. Speaker Handling

Initial MVP:

```text
One generic Amharic voice
```

Later:

```text
Speaker 1 → Male voice
Speaker 2 → Female voice
Speaker 3 → Male voice
```

Eventually:

```text
speaker diarization
+
voice assignment
```

This is not required for v0.1.

---

# 45. Video Rendering — Later

Once realtime audio works, add:

```text
English video
+
Amharic audio
=
Dubbed MP4
```

Using FFmpeg.

Example conceptual pipeline:

```text
Video
 ↓
Remove/replace audio
 ↓
Amharic audio track
 ↓
Mux
 ↓
MP4
```

Do not build this first.

---

# 46. Admin Dashboard

Later create:

```text
/admin
```

Sections:

```text
Users
Sessions
Usage
Costs
Errors
AI providers
Voices
System health
```

Useful metrics:

```text
Total minutes processed
Total TTS minutes
Total STT minutes
Average latency
Failed sessions
Active sessions
Estimated AI cost
```

---

# 47. Analytics

Track product events:

```text
landing_view
session_created
session_started
session_first_audio
session_completed
session_failed
voice_selected
session_stopped
```

Most important metric:

> Time from "Start Dubbing" to first Amharic audio.

Target:

```text
< 5 seconds initially
```

Then optimize.

---

# 48. Performance Targets

## MVP

```text
First audio:
< 5 seconds

Pipeline latency:
2–5 seconds

WebSocket reconnect:
< 3 seconds

UI response:
< 200ms for normal actions
```

## Later

```text
First audio:
< 2 seconds

Pipeline latency:
< 2 seconds
```

---

# 49. Deployment Architecture

Production:

```text
                    Internet
                       │
                       ▼
                    Nginx
                   /      \
                  /        \
                 ▼          ▼
           Next.js        WebSocket
             App            Server
               │               │
               └───────┬───────┘
                       │
                 ┌─────┴─────┐
                 ▼           ▼
             PostgreSQL     Redis
                               │
                               ▼
                         Background Jobs

                       Addis AI
                           │
                           ▼
                         TTS/STT
```

---

# 50. Docker Services

Initial production compose:

```text
web
realtime
postgres
redis
nginx
```

Optional:

```text
worker
```

if background processing becomes necessary.

---

# 51. Environment Variables

Example:

```env
DATABASE_URL=
REDIS_URL=

AUTH_SECRET=

ADDIS_AI_API_KEY=

NEXT_PUBLIC_APP_URL=
REALTIME_URL=
REALTIME_SECRET=

STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

Never commit `.env`.

Commit:

```text
.env.example
```

---

# 52. Git Branch Strategy

Use:

```text
main
develop
feature/*
fix/*
```

Example:

```text
feature/project-foundation
feature/dashboard
feature/addis-ai
feature/realtime-pipeline
feature/youtube-input
feature/chrome-extension
```

---

# 53. Commit Strategy

Prefer small commits:

```text
feat: initialize Next.js app
feat: add dashboard layout
feat: add Prisma schema
feat: add dubbing session API
feat: integrate Addis AI STT
feat: integrate Addis AI TTS
feat: add websocket session manager
feat: add audio queue
fix: handle websocket reconnect
```

---

# 54. MVP Milestone Checklist

## Milestone 1

```text
[ ] Next.js running
[ ] Tailwind working
[ ] shadcn/ui installed
[ ] Monorepo working
[ ] Git initialized
```

## Milestone 2

```text
[ ] Landing page
[ ] Dashboard
[ ] Dubbing page
[ ] Player UI
[ ] Responsive design
```

## Milestone 3

```text
[ ] PostgreSQL
[ ] Prisma
[ ] User model
[ ] DubbingSession model
[ ] AudioSegment model
```

## Milestone 4

```text
[ ] Authentication
[ ] Protected dashboard
[ ] Session ownership
```

## Milestone 5

```text
[ ] Addis AI STT test
[ ] Addis AI translation test
[ ] Addis AI TTS test
[ ] Cost measurements
```

## Milestone 6

```text
[ ] Realtime server
[ ] WebSocket connection
[ ] Session manager
[ ] Event protocol
```

## Milestone 7

```text
[ ] Audio segmentation
[ ] STT pipeline
[ ] Translation pipeline
[ ] TTS pipeline
[ ] Audio queue
```

## Milestone 8

```text
[ ] Test audio → Amharic audio
[ ] Progressive playback
[ ] Transcript
[ ] Translation
[ ] Latency indicator
```

## Milestone 9

```text
[ ] YouTube URL validation
[ ] Metadata
[ ] Authorized/compatible source handling
[ ] Full web MVP
```

## Milestone 10

```text
[ ] Usage tracking
[ ] Credit protection
[ ] Rate limiting
[ ] Error handling
[ ] Cleanup
```

## Milestone 11

```text
[ ] Docker
[ ] VPS deployment
[ ] Nginx
[ ] SSL
[ ] Monitoring
```

## Milestone 12

```text
[ ] Chrome extension
[ ] Tab audio capture
[ ] WebSocket integration
[ ] Amharic playback
```

---

# 55. What We Should Build First

Do NOT start with:

```text
YouTube extraction
Chrome extension
Payments
Admin panel
Mobile app
```

Start with:

```text
                    TODAY

             Next.js project
                    ↓
             React dashboard
                    ↓
            Dubbing session UI
                    ↓
             PostgreSQL/Prisma
                    ↓
             Addis AI STT test
                    ↓
             Addis AI TTS test
                    ↓
             Realtime pipeline
                    ↓
             Browser playback
```

---

# 56. First Development Sprint

## Sprint 1

### Step 1

Create project:

```bash
mkdir addisdub
cd addisdub

pnpm init
```

### Step 2

Create Next.js:

```bash
pnpm create next-app@latest apps/web
```

Select:

```text
TypeScript: Yes
ESLint: Yes
Tailwind: Yes
src/: Yes
App Router: Yes
Turbopack: Yes
Import alias: @/*
```

### Step 3

Create realtime application:

```text
apps/realtime
```

### Step 4

Create packages:

```text
packages/types
packages/validation
```

### Step 5

Run:

```bash
pnpm install
pnpm dev
```

### Step 6

Confirm:

```text
http://localhost:3000
```

---

# 57. Sprint 2

Build:

```text
Landing page
Dashboard
New dubbing form
Dubbing player
Session history
```

Use mock data.

No AI yet.

---

# 58. Sprint 3

Install:

```text
Prisma
PostgreSQL
Redis
```

Create migrations.

Connect:

```text
User
DubbingSession
AudioSegment
Usage
```

---

# 59. Sprint 4

Integrate Addis AI.

Test only:

```text
audio → STT
```

Then:

```text
Amharic text → TTS
```

Then:

```text
English → Amharic → TTS
```

---

# 60. Sprint 5

Build realtime service.

Implement:

```text
WebSocket
session authentication
events
connection management
reconnect
```

---

# 61. Sprint 6

Combine:

```text
Audio
 ↓
STT
 ↓
Translation
 ↓
TTS
 ↓
WebSocket
 ↓
Browser
```

This is the first major technical milestone.

---

# 62. Sprint 7

Add:

```text
YouTube metadata
session creation
progress
history
usage
errors
```

Use compliant/authorized content sources for testing.

---

# 63. Sprint 8

Polish:

```text
UX
loading states
errors
mobile responsiveness
audio buffering
latency
performance
```

Then deploy.

---

# 64. Definition of Done — MVP

The MVP is considered complete when:

- [ ] User can create an account.
- [ ] User can open dashboard.
- [ ] User can submit a supported YouTube URL or authorized test source.
- [ ] Dubbing session is created.
- [ ] Realtime connection works.
- [ ] English speech is transcribed.
- [ ] English text becomes natural Amharic.
- [ ] Amharic speech is generated.
- [ ] Audio is delivered progressively.
- [ ] Browser plays Amharic audio.
- [ ] Transcript is displayed.
- [ ] Translation is displayed.
- [ ] Session status is displayed.
- [ ] Usage is tracked.
- [ ] AI keys remain server-side.
- [ ] Errors are handled.
- [ ] Temporary audio is cleaned up.
- [ ] Application can be deployed with Docker.

---

# 65. Post-MVP Roadmap

## v0.2

```text
Chrome Extension
```

## v0.3

```text
Multiple voices
Speaker detection
```

## v0.4

```text
Full video dubbing
MP4 export
```

## v0.5

```text
Creator tools
Upload video
Download dubbed video
```

## v0.6

```text
Subscriptions
Payments
Usage plans
```

## v0.7

```text
Multiple African languages
```

## v1.0

```text
Real-time multilingual African-language dubbing platform
```

---

# 66. Product North Star

The final experience should feel like this:

```text
                    YouTube

        ┌─────────────────────────────┐
        │                             │
        │       English Podcast       │
        │                             │
        └─────────────────────────────┘

                  ↓

              AddisDub

             🇪🇹 Amharic

        "እንኳን ወደ ፖድካስቱ
          በደህና መጡ..."

                  🔊

        User continues watching
        without manually translating.
```

The technical goal is not merely to generate an Amharic MP3.

The real product is:

> **Low-latency language conversion while the user is consuming content.**

---

# 67. Development Principle

Build from the inside out:

```text
                 UI
                  ↑
            WebSocket
                  ↑
          Realtime Pipeline
                  ↑
        STT → Translate → TTS
                  ↑
              Test Audio
```

Then add:

```text
YouTube
```

Then:

```text
Chrome Extension
```

Then:

```text
Payments
```

Then:

```text
Scale
```

This order minimizes debugging complexity and protects the initial Addis AI testing budget.

---

# 68. Immediate Next Action

Start with **Milestone 1**.

The first coding session should produce:

```text
addisdub/
├── apps/
│   └── web/
├── packages/
│   ├── types/
│   └── validation/
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

and a working:

```text
http://localhost:3000
```

After that, build the dashboard UI before connecting any AI API.

