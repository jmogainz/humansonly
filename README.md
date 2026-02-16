# HumansOnly

HumansOnly is a production-oriented cognitive benchmark platform built on the same infrastructure stack as `mazle`, with a different product domain: 18 playable tests, persistent scoring, and global leaderboards.

## Stack

- Next.js 15 + TypeScript 5 + React 18
- PostgreSQL (raw `pg`) + SQL migrations
- Upstash Redis for live leaderboard ranking
- NextAuth v4 (Google + Apple)
- Vercel + devops-toolkit workflows

## Quick Start

```bash
export UNIQUE_RUNNER_ID=$(whoami)
export BWS_ACCESS_TOKEN=... # required for `make up` in dev/dev-test
export NGROK_AUTHTOKEN=... # required because ngrok is enabled by default

# toolkit-managed local stack
make up

# app at http://localhost:8080
```

## Key Commands

| Command | Description |
|---|---|
| `make up` | Start local app + db + migrations via devops-toolkit |
| `make down` | Stop containers |
| `make clean` | Full local cleanup |
| `make up ENV=prod` | Deploy frontend to Vercel with prod env wiring |
| `npm run dev` | Direct local dev server (without toolkit orchestration) |
| `npm run build` | Build check |
| `npm run lint` | ESLint |

## Project Layout

```
humansonly/
├── src/app                  # Next.js routes and API handlers
├── src/components           # Reusable UI blocks
├── src/lib/server           # db/redis/auth/score services
├── src/lib/tests            # registry + scoring metadata
├── migrations               # SQL schema and leaderboard snapshot tables
├── devops-toolkit           # orchestration/build/deploy integration
├── humansonly.compose.yaml  # compose app definition
└── Makefile                 # toolkit-integrated workflows
```

## Migrations

Migrations are plain SQL in `migrations/`. Toolkit migration execution uses `MIGRATIONS_PATH` from the root `Makefile`.

## Environment

Expected env vars include:

- `DB_URL`
- `UPSTASH_LB_REST_URL`, `UPSTASH_LB_REST_TOKEN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` (or Apple key material)
- `AUTH_SECRET` / `NEXTAUTH_SECRET`

Use toolkit-managed secrets (`env-local`) for dev/staging/prod consistency.

For manual local setup without toolkit secrets, start from `.env.example`.
