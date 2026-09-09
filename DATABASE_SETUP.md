# Database Initialization Guide

## Quick Setup

Since npm registry is having timeout issues, here are the fastest ways to initialize your database:

### Option 1: Direct PostgreSQL (Recommended)

1. **Open PostgreSQL client:**
   ```bash
   psql -U postgres
   ```

2. **Create database:**
   ```sql
   CREATE DATABASE addisdub_dev OWNER postgres;
   ```

3. **Connect to the database:**
   ```sql
   \c addisdub_dev
   ```

4. **Run the initialization SQL:**
   ```bash
   psql -U postgres -d addisdub_dev -f apps/web/prisma/init.sql
   ```

### Option 2: Using pgAdmin (GUI)

1. Open pgAdmin 4
2. Right-click Databases → Create → Database
3. Name: `addisdub_dev`
4. Owner: `postgres`
5. Open Query Tool and paste contents of `apps/web/prisma/init.sql`
6. Execute

### Option 3: DBeaver (Cross-platform)

1. Create new database connection to your PostgreSQL server
2. Create database `addisdub_dev`
3. Open SQL script editor
4. Load and execute `apps/web/prisma/init.sql`

## Verify Your Database

Once created, verify with:

```bash
psql -U postgres -d addisdub_dev -c "
  SELECT 
    schemaname,
    COUNT(*) as table_count
  FROM pg_tables
  WHERE schemaname = 'public'
  GROUP BY schemaname;
"
```

Should show 4 tables: users, dubbing_sessions, audio_segments, usage

## Install Prisma (when npm is stable)

```bash
cd apps/web
pnpm add -D prisma @prisma/client
pnpm prisma generate
```

## Using Prisma Once Installed

### Generate Prisma Client
```bash
pnpm prisma generate
```

### Open Prisma Studio (GUI)
```bash
pnpm prisma studio
```

### Run migrations
```bash
pnpm prisma migrate deploy
```

## Database Connection String

Your `.env` file already has the correct connection:

```
DATABASE_URL="postgresql://postgres:Wz^kwLl&vt0h9-(4Qt@1YuuQ2os0@f@127.0.0.1:5432/addisdub_dev"
```

## Test Connection with Node

Once Prisma is installed, test with:

```bash
pnpm exec prisma db execute --stdin < apps/web/prisma/init.sql
```

Or create a test file `test-db.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const userCount = await db.user.count();
  console.log(`✅ Connected! Users in database: ${userCount}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error('❌ Connection failed:', e.message);
  process.exit(1);
});
```

Run with: `node test-db.js`

## Troubleshooting

### Connection refused
```bash
# Check PostgreSQL is running
psql -U postgres -h 127.0.0.1 -c "SELECT version();"
```

### Authentication failed
- Verify password in `.env` matches PostgreSQL
- Check credentials: `DB_USERNAME=postgres` and `DB_PASSWORD`

### Database already exists
```sql
DROP DATABASE IF EXISTS addisdub_dev;
CREATE DATABASE addisdub_dev OWNER postgres;
```

### Table creation failed
Ensure you're connected to `addisdub_dev`, not the default postgres database:
```bash
psql -U postgres -d addisdub_dev
```

## Database Schema Diagram

```
users
├── id (PK)
├── email (UNIQUE)
├── name
├── credits
└── timestamps

    ↓ (1:many)

dubbing_sessions
├── id (PK)
├── userId (FK)
├── youtubeUrl
├── videoId
├── title
├── status (pending|processing|completed|failed)
├── progress
└── timestamps

    ├─ (1:many) → audio_segments
    │   ├── id (PK)
    │   ├── sessionId (FK)
    │   ├── sequence (UNIQUE with sessionId)
    │   ├── sourceText
    │   ├── translatedText
    │   ├── audioUrl
    │   ├── duration
    │   ├── status
    │   └── createdAt
    │
    └─ (1:many) → usage
        ├── id (PK)
        ├── userId (FK)
        ├── service (STT|TRANSLATION|TTS)
        ├── duration
        ├── estimatedCost
        ├── actualCost
        ├── provider
        └── status (pending|completed|failed)
```

## Next: Phase 3 — Authentication

Once your database is set up, we'll implement:
- Auth.js for email/password authentication
- Protected routes
- Login/register pages
- Session management

Ready to proceed with Phase 3?
