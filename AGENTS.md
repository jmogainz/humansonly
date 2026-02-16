# HumansOnly - AI Agent Instructions

## Overview

HumansOnly is a cognitive benchmark web app with 18 tests, score history, authentication, and global leaderboards.

Core stack mirrors `mazle` infra conventions:

- Next.js (App Router) + TypeScript
- PostgreSQL + SQL migrations
- Upstash Redis leaderboards
- NextAuth (Google + Apple)
- Devops-toolkit orchestrated local/prod flows

## Primary Workflow

Use Make targets first for run/build/deploy orchestration.

```bash
export UNIQUE_RUNNER_ID=$(whoami)
make up
```

Use direct commands (`npm`, `docker`, `psql`, `curl`) only for debugging or when Make target coverage is missing.

## Environment Modes

- `ENV=dev` default local flow
- `ENV=dev-test` optional lightweight local profile
- `ENV=staging` pre-prod checks
- `ENV=prod` deploy flow

## Migrations Rule

Migration SQL is in `migrations/`.

When changing schema:
1. Check `migrations/migration_runs.txt` latest applied version.
2. If latest version already equals newest migration filename version, add a new migration.
3. If not, edit the newest unapplied migration.

## API Health

Use `/api/health` as health endpoint for local and deployment checks.

## Score/Leaderboard Notes

- Test metadata and scoring direction are in `src/lib/tests/registry.ts`.
- Persisted score writes go through `src/lib/server/scores.ts`.
- Live ranks go through `src/lib/server/leaderboard.ts` and Upstash sorted sets.
- Redis stores normalized scores (`higher` tests raw, `lower` tests negated).

## Guardrails

- Do not deploy unless explicitly asked.
- Do not run destructive git commands.
- Keep changes scoped to the user request.
- Keep architecture aligned with existing toolkit + Next.js patterns.
