# AddisDub MVP

Real-time English → Amharic AI dubbing platform.

## Project Structure

```
addisdub/
├── apps/
│   ├── web/              # Next.js frontend
│   └── realtime/         # Node.js WebSocket server
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── validation/       # Zod validation schemas
│   └── config/           # Shared configuration
├── docker-compose.yml    # Development services
└── pnpm-workspace.yaml   # pnpm monorepo config
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 12.3.4+
- Docker & Docker Compose (for full stack)

### Local Development

```bash
# Install dependencies
pnpm install

# Start all services in parallel
pnpm dev

# Or start individually
pnpm dev:web       # Next.js on http://localhost:3000
pnpm dev:realtime  # WebSocket on ws://localhost:4000
```

### Docker Development

```bash
# Start all services (PostgreSQL, Redis, Web, Realtime)
pnpm docker:up

# Stop services
pnpm docker:down

# Rebuild images
pnpm docker:build
```

## Services

### Web (Next.js)
- **Port**: 3000
- **Command**: `pnpm dev:web`
- **URL**: http://localhost:3000

### Realtime (Node.js + WebSocket)
- **Port**: 4000
- **Command**: `pnpm dev:realtime`
- **URL**: ws://localhost:4000

### PostgreSQL
- **Port**: 5432
- **Default DB**: addisdub_dev
- **User**: addisdub
- **Password**: addisdub_dev_password

### Redis
- **Port**: 6379
- **URL**: redis://localhost:6379

## Environment Setup

Copy `.env.example` to `.env` and update values as needed:

```bash
cp .env.example .env
```

## Project Phases

- **Phase 0**: ✅ Project Foundation (Complete)
- **Phase 1**: UI MVP (Next)
- **Phase 2**: Database (Prisma + PostgreSQL)
- **Phase 3**: Authentication (Auth.js)
- **Phase 4**: Addis AI Integration
- **Phase 5**: Audio Pipeline
- **Phase 6**: YouTube Input
- **Phase 7**: Full Web MVP

## Key Technologies

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, WebSocket
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Monorepo**: pnpm workspaces
- **AI**: Addis AI (STT, Translation, TTS)

## Development Commands

```bash
# Build everything
pnpm build

# Lint all apps
pnpm lint

# Type check all apps
pnpm type-check

# Run tests (when available)
pnpm test
```

## Notes

- Never commit `.env` (use `.env.example`)
- WebSocket server is separate from Next.js for long-running operations
- Realtime pipeline should not block HTTP requests
- All API keys stored server-side only

## Next Steps

1. Verify local environment: `pnpm dev`
2. Check web: http://localhost:3000
3. Check realtime: `ws://localhost:4000`
4. Begin Phase 1: UI MVP (landing page, dashboard, dubbing player)
