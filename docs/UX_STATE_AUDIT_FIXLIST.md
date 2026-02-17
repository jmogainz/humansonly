# HumansOnly UX/State Audit Fix List

## Scope audited

Routes and page states audited:

- `/`
- `/tests/[slug]` for all 18 playable tests
- `/leaderboard`
- `/leaderboard/[testSlug]`
- `/profile`
- Header/auth/theme interactions present across pages
- API routes under `/api/*` that support these pages

Method:

- Full static code review of all page, component, hook, and server route files
- Build/lint validation (`npm run lint`, `npm run build`)
- Logic simulations for randomization quality and edge-case distributions in GIA + key timed tests

---

## System-level user stories and state gaps

### A. Global shell (header/theme/layout)

1. **As a mobile user, I can always reach leaderboards from the header**
   - Status: **Failing**
   - Problem: Leaderboard nav link is hidden on small screens with no replacement action.
2. **As a low-vision user, I can zoom the UI during tests**
   - Status: **Failing**
   - Problem: Viewport disables pinch/zoom (`userScalable=false`).
3. **As a user, page widths match the test needs (wide canvas tests especially)**
   - Status: **Partially failing**
   - Problem: Global `main` max width constrains pages and shrinks intended wide layouts.
4. **As a user, theme toggle state is stable on first paint**
   - Status: **Partially failing**
   - Problem: Initial label can mismatch briefly before effect sync.

### B. Home page (`/`)

1. **As a new user, I can identify and enter any test quickly**
   - Status: **Partially failing**
   - Problem: Human Benchmark cards all use generic icon (registry icons not surfaced).
2. **As a user, card interactions are clear and accessible**
   - Status: **Partially failing**
   - Problem: Hover-only affordance and opacity fade can reduce readability.

### C. Test runtime (`/tests/[slug]`)

1. **As a player, each run submits exactly once**
   - Status: **Failing in multiple tests**
   - Problem: Several games do not guard repeated `onComplete` calls before result screen mounts.
2. **As a player, submission errors are handled transparently**
   - Status: **Failing**
   - Problem: Submit failures are swallowed and shown as normal completion without explicit warning.
3. **As a player, negative net scores display correctly**
   - Status: **Failing**
   - Problem: Result animation clamps score to non-negative.
4. **As a GIA player, combined score is auto-submitted after all 5 subtests**
   - Status: **Failing**
   - Problem: Spatial slug mismatch prevents “all complete” state.

### D. Leaderboards (`/leaderboard`, `/leaderboard/[testSlug]`)

1. **As a user, I can distinguish “no players yet” vs “backend unavailable”**
   - Status: **Failing**
   - Problem: Redis-unavailable and empty leaderboard both resolve to empty states.
2. **As a signed-out user, I still get graceful around-me behavior**
   - Status: **Passing**
   - Notes: Around-me request failure is softened client-side.
3. **As a user, GIA dashboard cards map to real tests**
   - Status: **Failing**
   - Problem: GIA slug mismatch creates broken/empty spatial card.

### E. Profile (`/profile`)

1. **As a signed-in user, profile loads even if one endpoint fails**
   - Status: **Failing**
   - Problem: `Promise.all` hard-fails entire page on either profile or history error.
2. **As a user, chart stats are numerically correct**
   - Status: **Failing**
   - Problem: `metadata.correct || scoreValue` corrupts zero values and some averages.
3. **As a user, no-data states are explicit**
   - Status: **Partially failing**
   - Problem: Missing dashboard explanation when no GIA history.

### F. Auth / identity flows

1. **As a user, sign-in works reliably in local/dev and prod contexts**
   - Status: **Risk present**
   - Problem: COOP/COEP headers can interfere with popup/callback contexts depending on runtime path.
2. **As a signed-out user, Sign In always offers a valid provider**
   - Status: **Risk present**
   - Problem: No UI fallback if OAuth providers are misconfigured/absent.
3. **As a guest, my pre-login progress is claimed correctly on login**
   - Status: **Passing**
   - Notes: Claim flow exists, but no explicit user-facing success confirmation.

---

## Game-specific user stories and gaps

1. `reaction-time`
   - Failing: Completion can deadlock from rapid final clicks (attempt count overshoots completion condition).
2. `chimp-test`
   - Failing: Level can exceed 5x5 grid capacity, creating impossible rounds.
3. `typing`
   - Risk: No anti-paste/anti-cheat guard for leaderboard integrity.
4. `visual-memory`
   - Risk: Scoring semantics need confirmation (reports current level on fail, may be off expected convention).
5. `aim-trainer`
   - Failing: Target placement can clip on smaller render widths; missing post-finish input lock.
6. `number-memory`
   - Failing: Off-by-one final score on failure.
7. `verbal-memory`
   - Failing: Duplicate vocabulary entries and predictable new-word traversal reduce test quality.
8. `sequence-memory`
   - Risk: Missing completion lock can allow duplicate submissions after fail click races.
9. `symbol-search`
   - Risk: YES-class distribution bias (~55%) enables answer strategy shortcuts.
10. `color-blindness`
   - Risk: Classification language may imply medical certainty without qualification.
11. `face-memory`
   - Risk: Heavy SVG generation in render path can cause avoidable jank.
12. `hue-test`
   - Risk: Hue-only objective can be confounded by luminance contrast cues.
13. `object-tracking`
   - Failing: No inter-object collision resolution causes overlap ambiguity; mobile precision suffers.
14. `gia-reasoning`
   - Status: **Passing**
   - Notes: Rebuilt sentence templates for grammar and expanded variety.
15. `gia-perceptual-speed`
   - Status: **Passing**
   - Notes: Added recent-round uniqueness.
16. `gia-number-speed`
   - Status: **Passing**
   - Notes: Redesigned to alternate between Median and Furthest-from-Median to eliminate elimination heuristics.
17. `gia-word-meaning`
   - Status: **Passing**
   - Notes: Doubled dataset and added recent-round uniqueness.
18. `gia-spatial`
   - Status: **Passing**
   - Notes: Increased complexity to 3 columns and added recent-round uniqueness.

---

## Prioritized remediation backlog (before code changes)

### P0 — Correctness and blocking UX

1. Fix GIA slug constants and combined-session readiness logic.
2. Fix result screen negative score rendering.
3. Fix reaction-time completion deadlock/race.
4. Add per-test one-shot completion guards (universal submission lock).
5. Fix chimp level cap to board capacity.
6. Fix number-memory off-by-one score.
7. Fix GIA dashboard slug usage + stats correctness.
8. Restore zoom accessibility (`viewport` policy).
9. Resolve mobile leaderboard navigation discoverability.
10. Differentiate leaderboard-empty vs leaderboard-service-unavailable UI states.

### P1 — GIA item quality and fairness

1. [x] Rebuild GIA reasoning sentence templates for grammatical correctness.
2. [x] Increase reasoning generator complexity beyond polarity-parity rule.
3. [x] Redesign GIA number speed generator so any option can be correct.
4. [x] Expand GIA word-meaning datasets and reduce pattern obviousness.
5. [x] Expand GIA spatial complexity (more columns/instances, stronger distractors).
6. Add difficulty telemetry and answer distribution checks for all GIA subtests.

### P2 — Robustness and polish

1. Profile partial-failure rendering (load whichever endpoint succeeds).
2. Add explicit score submission error surfaces + retry affordance.
3. Stabilize theme toggle first paint state.
4. Improve Aim Trainer spawn bounds for responsive containers.
5. Add object-tracking collision handling and responsive scaling strategy.
6. Remove duplicate verbal-memory words and randomize unseen-word selection.
7. Memoize/precompute face assets per run.
8. Add non-generic icons for all test cards.
9. Add fallback handling for missing OAuth providers.
10. Add “not a medical diagnosis” framing for color-blindness results.

### P3 — Integrity and operational safeguards

1. Add server-side sanity bounds per test score/unit.
2. Add anti-abuse/rate-limiting on score submission endpoints.
3. Add leaderboard integrity checks for anomalous score patterns.
4. Add structured event logging for failed submissions and API degradation.
5. Add integration tests covering auth/guest/submit/leaderboard/profile flows.

---

## Acceptance criteria for “graceful handling in all cases”

1. Every page has explicit loading, empty, and error states with actionable copy.
2. Every test can only complete once per run regardless of click/input races.
3. Submission failure never masquerades as success.
4. Guest and signed-in flows both preserve user progress predictably.
5. Mobile and desktop both expose core navigation and complete all test interactions.
6. GIA generators produce grammatically valid prompts and non-obvious answer structures.
7. Accessibility baseline: zoom enabled, keyboard paths where feasible, readable contrasts.
8. Observability baseline: degradations are distinguishable from empty data.
