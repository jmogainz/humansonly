# HumansOnly TODO

## Product hardening

- Expand static datasets:
  - Verbal memory word bank from ~100 to 1000+ words.
  - GIA reasoning names/comparison pairs to target coverage from `docs/BUILD_PLAN.md`.
  - GIA word-meaning category groups to full 300+ group target.
- Add richer score history visualization (sparkline chart in result/profile pages).
- Add GIA combined-session flow to compute and submit `gia-combined` leaderboard entries from one sitting.

## Platform

- Add migration runner helper script for local raw SQL execution.
- Add daily leaderboard snapshot cron endpoint and scheduler wiring.
- Add integration tests for score submission and leaderboard rank correctness.

## UX

- Add keyboard shortcuts to interactive tests where relevant.
- Replace generated face placeholders with curated royalty-free face assets.
- Add PWA manifest/service worker and richer social share cards.
