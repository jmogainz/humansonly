# HumansOnly - Complete Build Plan

## Context

Building a production-grade cognitive benchmark website called **HumansOnly** that recreates all tests from [humanbenchmark.com](https://humanbenchmark.com) (13 tests) and [gia.steciuk.dev](https://gia.steciuk.dev) (5 GIA subtests) — 18 total exams. The goal is a modern, addictive, beautifully designed platform with global leaderboards for every exam. Tech stack mirrors `~/mazle`.

---

## Tech Stack (from ~/mazle)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI | React 18, CSS Modules, CSS Variables (light/dark themes) |
| Database | PostgreSQL (raw `pg` driver, no ORM) |
| Cache/Leaderboards | Upstash Redis |
| Auth | NextAuth v4 (Google + Apple OAuth, JWT sessions) |
| Payments | None (no paid features) |
| Deployment | Vercel + Vercel Analytics |
| Fonts | Google Fonts (Inter, Space Grotesk, JetBrains Mono) |
| Rendering | Canvas API (for interactive visual tests), DOM (for simpler tests) |

**Dropped from mazle:** Phaser (game engine), WASM generator, seedrandom — not needed for cognitive tests.

---

## All 18 Exams — Complete Specifications

### CATEGORY A: Human Benchmark Tests (13)

---

#### A1. Reaction Time
- **Route:** `/tests/reaction-time`
- **Measures:** Visual reflexes / reaction speed
- **Mechanics:**
  1. Screen shows a blue/dark "Click to start" state
  2. Screen turns RED — "Wait for green..."
  3. After a random delay (1-6 seconds), screen turns GREEN — "Click!"
  4. User clicks as fast as possible
  5. If user clicks during RED phase = "Too soon!" penalty, restart that attempt
  6. Run 5 attempts, display average
- **Scoring:** Average reaction time in milliseconds (lower = better)
- **UI:** Full-screen color transitions with large text, smooth color animations
- **Implementation:** Pure DOM + CSS transitions. `performance.now()` for timing. Store timestamp on green trigger, calculate delta on click.

---

#### A2. Chimp Test
- **Route:** `/tests/chimp-test`
- **Measures:** Short-term spatial memory (inspired by Ayumu the chimp)
- **Mechanics:**
  1. Numbers (starting at 4) appear in random positions on a grid
  2. User sees all numbers briefly, then they are hidden behind white squares
  3. User must click squares in ascending numerical order (1, 2, 3...)
  4. Correct = advance to next level (one more number)
  5. Wrong click = strike (3 strikes = game over)
- **Scoring:** Highest level reached (number count)
- **UI:** Grid of squares, numbers appear then hide. Clean white squares with subtle shadows. Numbers flash for ~1 second before hiding.
- **Implementation:** Canvas-based grid. Track square positions, render numbers, detect click coordinates mapped to grid cells.

---

#### A3. Typing Test
- **Route:** `/tests/typing`
- **Measures:** Typing speed and accuracy
- **Mechanics:**
  1. Display a paragraph of text
  2. User types the text in an input area
  3. Real-time highlighting: correct chars green, current position highlighted, errors red
  4. Timer starts on first keystroke
  5. Test ends when all text is typed
- **Scoring:** Words per minute (WPM) — 1 word = 5 characters. Also show accuracy %.
- **UI:** Large monospace text display, character-by-character highlighting, live WPM counter
- **Implementation:** DOM-based. Preloaded word banks. Track keystrokes, calculate WPM = (chars / 5) / (time in minutes). Show real-time progress.

---

#### A4. Visual Memory
- **Route:** `/tests/visual-memory`
- **Measures:** Visual-spatial working memory
- **Mechanics:**
  1. Grid of squares (starts 3x3 with 3 highlighted)
  2. Some squares flash white for ~1 second
  3. All squares reset to default
  4. User clicks the squares that were highlighted
  5. If user misses 3+ tiles = lose a life (3 lives total)
  6. Each level: grid grows and more squares highlighted
- **Scoring:** Highest level reached
- **Level Progression:** Level 1: 3x3 grid, 3 tiles → Level N increases grid size and tile count
- **UI:** Grid of rounded squares, flash animation, click feedback with green/red indicators
- **Implementation:** Canvas grid rendering. Track highlighted positions. Compare user clicks.

---

#### A5. Aim Trainer
- **Route:** `/tests/aim-trainer`
- **Measures:** Mouse precision and speed
- **Mechanics:**
  1. A circular target appears at random position in the play area
  2. User clicks it as fast as possible
  3. New target appears immediately at different position
  4. 30 targets total
  5. Track time per target
- **Scoring:** Average time per target in milliseconds
- **UI:** Bullseye target (concentric circles), satisfying hit animation (pop/shrink), clean play area
- **Implementation:** Canvas rendering. Random position generation avoiding edges. `performance.now()` timing per target.

---

#### A6. Number Memory
- **Route:** `/tests/number-memory`
- **Measures:** Short-term numerical memory capacity
- **Mechanics:**
  1. Display a number for a duration (scales with digit count)
  2. Number disappears, user types it from memory
  3. Correct = advance (number gets one digit longer)
  4. Wrong = game over
  5. Start with 1 digit, increase by 1 each level
- **Scoring:** Highest number of digits correctly recalled
- **Display Time:** ~1 second per digit (e.g., 3 digits = 3 seconds)
- **UI:** Large centered number display with countdown timer, input field with submit button
- **Implementation:** DOM-based. Generate random numbers of N digits. Timer-based show/hide.

---

#### A7. Verbal Memory
- **Route:** `/tests/verbal-memory`
- **Measures:** Verbal short-term memory / word recognition
- **Mechanics:**
  1. A word appears on screen
  2. User clicks "SEEN" if they've seen it before, "NEW" if it's new
  3. Correct answer = score +1, lives preserved
  4. Wrong answer = lose a life (3 lives)
  5. Words from a pool — some repeat, some are new. Ratio of new/seen increases over time.
- **Scoring:** Total number of correct answers before losing all lives
- **UI:** Large centered word, two prominent buttons (SEEN / NEW), lives counter, score counter
- **Implementation:** DOM-based. Word bank of ~1000 common English words. Track seen words in a Set. Gradually increase repeat probability.

---

#### A8. Sequence Memory
- **Route:** `/tests/sequence-memory`
- **Measures:** Sequential pattern memory (Simon Says-style)
- **Mechanics:**
  1. 3x3 grid of squares
  2. One square lights up
  3. User repeats by clicking it
  4. Next round: same sequence + one more square added
  5. Wrong click = game over
- **Scoring:** Longest sequence correctly repeated (level number)
- **UI:** 3x3 grid with glow/pulse animation on active square, subtle grid styling
- **Implementation:** Canvas or DOM grid. Store sequence array. Animate each step with delays. Validate user input sequence.

---

#### A9. Symbol Search
- **Route:** `/tests/symbol-search`
- **Measures:** Cognitive processing speed / pattern matching
- **Mechanics:**
  1. Show a target symbol (or pair of symbols) at the top
  2. Show a row of symbols below
  3. User must determine if the target symbol appears in the row
  4. Click YES or NO as fast as possible
  5. Timed test (e.g., 90 seconds), as many rounds as possible
- **Scoring:** Number of correct answers in time limit
- **UI:** Clean symbol display, large YES/NO buttons, timer bar, score counter
- **Implementation:** DOM-based. Generate symbol sets using Unicode symbols or custom SVG icons. Random inclusion/exclusion of target.

---

#### A10. Color Blindness (Ishihara)
- **Route:** `/tests/color-blindness`
- **Measures:** Color vision deficiency detection
- **Mechanics:**
  1. Display Ishihara-style plates (circles of dots with hidden number)
  2. User types the number they see
  3. Run through ~15 plates
  4. Diagnose: Normal, Protanopia, Deuteranopia, Tritanopia
- **Scoring:** Pass/fail + classification of color vision type
- **UI:** Large circular plate display, number input, progress indicator
- **Implementation:** Canvas-based plate generation. Algorithmically generate dot patterns with embedded numbers using specific color channels that are invisible to certain color deficiencies. Pre-generate a set of plates.

---

#### A11. Face Memory
- **Route:** `/tests/face-memory`
- **Measures:** Facial recognition / memory ability
- **Mechanics:**
  1. Study phase: Show N faces for a set time (e.g., 5 faces for 20 seconds)
  2. Test phase: Show faces one at a time — mix of studied and new faces
  3. User clicks "SEEN" or "NEW" for each face
  4. 7 levels of increasing difficulty (more faces, more similar faces)
- **Scoring:** Accuracy percentage per level, overall classification (Super Recognizer / Average / Prosopagnosia)
- **UI:** Face display cards, progress through levels, clean study/test phase transitions
- **Implementation:** Use AI-generated face images (royalty-free). DOM-based card layout. Track study set vs test set.

---

#### A12. Hue Test
- **Route:** `/tests/hue-test`
- **Measures:** Color discrimination / hue perception
- **Mechanics:**
  1. Grid of colored tiles (starts 2x2, grows to 6x6)
  2. One tile has a slightly different hue than the rest
  3. User clicks the different tile
  4. Correct = advance (grid grows, difference becomes subtler)
  5. Wrong = game over
- **Scoring:** Highest level reached
- **UI:** Grid of color tiles with smooth rendering, satisfying correct/wrong feedback
- **Implementation:** Canvas rendering. Generate HSL colors with controlled delta. Decrease delta each level for harder discrimination.

---

#### A13. Object Tracking (MOT - Multiple Object Tracking)
- **Route:** `/tests/object-tracking`
- **Measures:** Attentional tracking / sustained attention
- **Mechanics:**
  1. N circles on screen, some highlighted as targets (e.g., 3 of 8)
  2. All circles become identical and start moving randomly
  3. After ~5 seconds of movement, circles stop
  4. User clicks which ones were the original targets
  5. Each level: more circles and targets, faster movement
- **Scoring:** Highest level completed
- **UI:** Circles with smooth motion, highlight animation at start, selection UI at end
- **Implementation:** Canvas with requestAnimationFrame loop. Physics: random velocity, wall bouncing, collision avoidance. Track positions per frame.

---

### CATEGORY B: GIA Tests (5)

---

#### B1. Reasoning (Logical Deduction)
- **Route:** `/tests/gia-reasoning`
- **Measures:** Logical reasoning, inference, working memory
- **Time Limit:** 120 seconds
- **Scoring:** +1 correct, -1 incorrect (penalty for guessing)
- **Exact Mechanics (from steciuk source + official GIA format):**
  1. **Statement phase:** Display a comparison statement, e.g. "James is stronger than Mary"
  2. User reads statement, clicks to proceed
  3. **Question phase:** Statement disappears, question appears: "Who is weaker?"
  4. Two name buttons appear — user picks the correct answer
  5. Immediately generates next question
- **Question Generation Algorithm:**
  1. Pick random comparison pair (e.g., stronger/weaker)
  2. Pick 2 distinct random names
  3. Randomize 4 boolean flags: `isStatementPositive`, `isQuestionPositive`, `swapNames`, and name order
  4. Statement uses positive or negative phrasing: "X is stronger than Y" vs "X is not as strong as Y"
  5. Question uses positive or negative form: "Who is stronger?" vs "Who is weaker?"
  6. **Answer logic:** correct = name1 when statement/question polarity match; name2 when they differ
- **Dataset for Maximum Variety (target: millions of unique combos):**
  - **Names:** 200+ names (steciuk has 100 — we double it). Mix of diverse names across cultures.
  - **Comparison pairs:** 120+ pairs (steciuk has 60 — we double it). Categories:
    - Physical: stronger/weaker, taller/shorter, faster/slower, heavier/lighter...
    - Mental: smarter/dumber, wiser/more foolish, more creative/less creative...
    - Social: friendlier/more hostile, kinder/crueler, more generous/more selfish...
    - Emotional: calmer/more anxious, braver/more fearful, happier/sadder...
    - Professional: more diligent/lazier, more organized/more chaotic...
  - **Unique combos:** 200 × 199 × 120 × 16 boolean flags = **~76 million unique questions**
- **UI:** Two-phase card (statement → question). Large readable text. Two prominent name buttons. Timer bar + correct/incorrect counter. Brief green/red flash (300ms) on answer.

---

#### B2. Perceptual Speed
- **Route:** `/tests/gia-perceptual-speed`
- **Measures:** Speed of recognizing similarities/differences in letter pairs
- **Time Limit:** 120 seconds
- **Scoring:** +1 correct, -0.25 incorrect
- **Exact Mechanics:**
  1. Display 4 columns, each with a lowercase letter on top and uppercase letter on bottom
  2. User counts how many columns have matching letters (same letter regardless of case)
  3. Answer options: buttons labeled 0, 1, 2, 3, 4
  4. Immediately generates next question
- **Question Generation Algorithm:**
  1. Pick random `numSame` (0-4) — how many columns will match
  2. For matching columns: pick `numSame` unique random letters, display same letter in both cases
  3. For non-matching columns: pick 2 different random letters for upper/lower
  4. Shuffle all columns randomly
  5. Answer = `numSame`
- **Dataset Variety:** Purely algorithmic — 26 letters, 4 positions, 5 possible match counts = **effectively infinite unique questions**
- **UI:** 4 columns with clear letter display (monospace font, large size). Lowercase on top, uppercase on bottom (or vice versa — randomize). Answer buttons 0-4. Timer bar. Green/red flash feedback.

---

#### B3. Number Speed & Accuracy
- **Route:** `/tests/gia-number-speed`
- **Measures:** Numerical processing, quick estimation
- **Time Limit:** 120 seconds
- **Scoring:** +1 correct, -0.5 incorrect
- **Exact Mechanics:**
  1. Display 3 numbers
  2. User clicks the number that is furthest from the middle value
  3. Immediately generates next question
- **Question Generation Algorithm (from steciuk source):**
  1. Generate `middle`: random integer 10–30
  2. Generate `lower`: random integer 1 to (middle - 2)
  3. Calculate `diff` = middle - lower
  4. Generate `shake`: random integer 1 to (diff - 1)
  5. Random boolean `isHigherFurther`:
     - If true: `higher` = middle + diff + shake (higher is the answer)
     - If false: `higher` = middle + diff - shake (lower is the answer)
  6. Shuffle [lower, middle, higher] randomly
  7. Answer = the number with greatest distance from middle
- **Expanded Ranges for More Variety:**
  - Extend `middle` range: 5–100 (steciuk uses 10–30)
  - Add decimal variants for harder questions (optional mode)
  - Add negative number variants
  - This gives **effectively infinite unique questions** since all numbers are algorithmically generated
- **UI:** Three large number cards in a row. Click to select. Timer bar. Green/red flash feedback.

---

#### B4. Word Meaning (Odd One Out)
- **Route:** `/tests/gia-word-meaning`
- **Measures:** Vocabulary comprehension, semantic categorization
- **Time Limit:** 120 seconds
- **Scoring:** +1 correct, -0.5 incorrect
- **Exact Mechanics:**
  1. Display 3 words
  2. Two words are semantically related (synonyms, same category, antonym pairs, etc.)
  3. Third word is the odd one out (from a different category)
  4. User clicks the odd word
  5. Immediately generates next question
- **Question Generation Algorithm (from steciuk source):**
  1. Pick 2 random word groups from the dataset
  2. From group 1: pick 2 random words (the matching pair)
  3. From group 2: pick 1 random word (the odd one out)
  4. Shuffle all 3 words
  5. Answer = the odd word
- **MASSIVE Dataset Expansion (steciuk has 50 groups — we target 300+):**
  - **Nouns (~100 groups):**
    - Tools, Vehicles, Animals (mammals, birds, reptiles, fish, insects), Fruits, Vegetables, Furniture, Clothing, Sports, Musical instruments, Professions, Body parts, Geological features, Weather, Beverages, Cuisines, Fabrics, Metals, Gemstones, Flowers, Trees, Buildings, Currencies, Languages, Countries by region, Kitchen utensils, Office supplies, Dance styles, Art movements, Literary genres, Scientific disciplines, Mathematical concepts, Musical genres, Architectural styles, Cooking methods, Communication devices, Storage containers, Water bodies, Celestial objects, Timepieces...
  - **Adjectives (~100 groups):**
    - Size, Temperature, Texture, Color shades, Emotions, Speed, Sound volume, Taste, Smell, Age, Weight, Brightness, Hardness, Wetness, Shape, Cleanliness, Complexity, Rarity, Proximity, Transparency...
  - **Verbs (~100 groups):**
    - Movement, Communication, Creation, Destruction, Transformation, Observation, Consumption, Production, Calculation, Navigation, Expression, Competition, Cooperation, Acquisition, Release, Growth, Decline, Combination, Separation, Concealment, Revelation...
  - **5 words per group average → 300 groups × 5 = 1,500 words**
  - **Unique combos:** 300 × 299 × C(5,2) × 5 = **~4.5 million unique questions**
- **UI:** Three large word buttons. Timer bar. Green/red flash feedback.

---

#### B5. Spatial Visualization (Letter Rotation/Mirror)
- **Route:** `/tests/gia-spatial`
- **Measures:** Mental rotation, distinguishing rotation from reflection
- **Time Limit:** 120 seconds
- **Scoring:** +1 correct, -0.5 incorrect
- **Exact Mechanics (from steciuk source + official GIA format):**
  1. Display 2 columns (boxes)
  2. Each column has 2 letters — one on top, one on bottom
  3. Letters may be rotated (0°, 90°, 180°, 270°) and/or mirrored (horizontally flipped)
  4. User determines how many columns contain a pair of the SAME letter (rotation is OK, mirror is NOT the same)
  5. Answer options: 0, 1, or 2
- **Question Generation Algorithm (from steciuk source):**
  1. Pick random asymmetric letters from set: F, G, J, L, N, P, Q, R, S, Z
  2. Determine `numOneMirrored` (0-2): how many columns have a mirrored (non-matching) pair
  3. For each column, generate 2 letter instances with:
     - `isMirrored`: boolean (horizontal flip)
     - `rotation`: 0-3 (×90°)
  4. If column is "mirrored": one letter's mirror state differs from the other
  5. If column is "matching": both letters have same mirror state (rotation can differ)
  6. Answer = NUM_COLUMNS - numOneMirrored
  7. Render with CSS: `transform: rotate(${rotation * 90}deg) scaleX(${isMirrored ? -1 : 1})`
- **Expanded Letter Set for More Variety:**
  - Steciuk uses 10 letters: F, G, J, L, N, P, Q, R, S, Z
  - Expand to 20+ asymmetric characters: add b, d, h, k, p, q (lowercase), plus digits 2, 3, 4, 5, 6, 7, 9, plus symbols like &, ?, etc.
  - Also add **compound shapes** (programmatically generated): L-shapes, T-shapes, arrow-like shapes rendered via Canvas
  - **Unique combos:** 20+ chars × 4 rotations × 2 mirror states × 2 columns = thousands per question type, **effectively infinite**
- **UI:** 2 box columns, each with upper/lower letter. Large clear rendering. Answer buttons 0, 1, 2. Timer bar. Green/red flash feedback.

---

## App Architecture

### Directory Structure

```
humansonly/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (fonts, theme, analytics)
│   │   ├── globals.css                   # Global CSS variables, reset, theme
│   │   ├── page.tsx                      # Landing page — test grid
│   │   ├── page.module.css
│   │   ├── tests/
│   │   │   ├── layout.tsx                # Test layout (back nav, shared UI)
│   │   │   ├── reaction-time/
│   │   │   │   ├── page.tsx              # SSR wrapper + metadata
│   │   │   │   ├── ReactionTimeClient.tsx
│   │   │   │   ├── ReactionTime.module.css
│   │   │   │   └── engine.ts             # Game logic (pure functions)
│   │   │   ├── chimp-test/
│   │   │   ├── typing/
│   │   │   ├── visual-memory/
│   │   │   ├── aim-trainer/
│   │   │   ├── number-memory/
│   │   │   ├── verbal-memory/
│   │   │   ├── sequence-memory/
│   │   │   ├── symbol-search/
│   │   │   ├── color-blindness/
│   │   │   ├── face-memory/
│   │   │   ├── hue-test/
│   │   │   ├── object-tracking/
│   │   │   ├── gia-reasoning/
│   │   │   ├── gia-perceptual-speed/
│   │   │   ├── gia-number-speed/
│   │   │   ├── gia-word-meaning/
│   │   │   └── gia-spatial/
│   │   ├── leaderboard/
│   │   │   ├── page.tsx                  # Global leaderboard hub
│   │   │   └── [testSlug]/
│   │   │       └── page.tsx              # Per-test leaderboard
│   │   ├── profile/
│   │   │   └── page.tsx                  # User profile + history
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── scores/submit/route.ts
│   │       ├── scores/history/route.ts
│   │       ├── leaderboard/
│   │       │   ├── top/route.ts
│   │       │   ├── around/route.ts
│   │       │   └── me/route.ts
│   │       ├── profile/route.ts
│   │       └── health/route.ts
│   ├── components/
│   │   ├── Header.tsx + .module.css
│   │   ├── TestCard.tsx + .module.css     # Card for test grid on landing
│   │   ├── TestLayout.tsx + .module.css   # Shared test wrapper (title, score, back)
│   │   ├── Timer.tsx + .module.css        # Reusable countdown/count-up timer
│   │   ├── LivesDisplay.tsx              # Hearts/lives indicator
│   │   ├── ScoreDisplay.tsx              # Animated score counter
│   │   ├── LeaderboardTable.tsx          # Reusable leaderboard component
│   │   ├── LeaderboardMini.tsx           # Small inline leaderboard for test pages
│   │   ├── ResultScreen.tsx + .module.css # Post-test results with stats + share
│   │   ├── PercentileBar.tsx             # "You scored better than X%" visualization
│   │   ├── CanvasRenderer.tsx            # Shared Canvas setup for visual tests
│   │   ├── AuthButton.tsx                # Sign in / profile button
│   │   ├── ThemeToggle.tsx               # Light/dark mode
│   │   └── ShareCard.tsx                 # Shareable results image
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db.ts                     # PostgreSQL pool (from mazle pattern)
│   │   │   ├── redis.ts                  # Upstash Redis (from mazle pattern)
│   │   │   ├── env.ts                    # Environment variable helper
│   │   │   ├── users.ts                  # User CRUD
│   │   │   ├── scores.ts                 # Score submission + history
│   │   │   ├── leaderboard.ts            # Leaderboard queries (Redis sorted sets)
│   │   │   └── responses.ts              # API response helpers
│   │   ├── api/
│   │   │   ├── client.ts                 # Client-side fetch wrapper
│   │   │   └── types.ts                  # API type definitions
│   │   ├── tests/                        # Test configuration registry
│   │   │   ├── registry.ts               # All test metadata (name, slug, category, icon, description)
│   │   │   └── types.ts                  # Test types, score types
│   │   └── utils.ts                      # Shared utilities
│   ├── hooks/
│   │   ├── useTimer.ts                   # Countdown/count-up timer hook
│   │   ├── useCanvas.ts                  # Canvas setup + resize hook
│   │   ├── useScore.ts                   # Score submission hook
│   │   └── useAuth.ts                    # Auth state hook
│   ├── auth.ts                           # NextAuth config (from mazle pattern)
│   └── constants/
│       └── index.ts
├── public/
│   ├── assets/
│   │   ├── faces/                        # AI-generated face images for Face Memory
│   │   └── icons/                        # Test category icons
│   └── fonts/
├── migrations/                           # SQL migration files
│   ├── 001_initial.sql
│   └── 002_leaderboards.sql
├── package.json
├── next.config.mjs
├── tsconfig.json
└── eslint.config.mjs
```

### Database Schema (PostgreSQL)

```sql
-- 001_initial.sql
CREATE TABLE schema_version (
  version INT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  test_slug TEXT NOT NULL,          -- e.g., 'reaction-time', 'chimp-test'
  score_value NUMERIC NOT NULL,     -- raw score (ms, level, wpm, count, etc.)
  score_unit TEXT NOT NULL,          -- 'ms', 'level', 'wpm', 'count', 'percent'
  metadata JSONB,                    -- extra data (e.g., individual attempt times)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scores_user ON scores(user_id, test_slug, created_at DESC);
CREATE INDEX idx_scores_test ON scores(test_slug, score_value);
CREATE INDEX idx_scores_created ON scores(created_at);

-- GIA combined session (all 5 subtests in one sitting)
CREATE TABLE gia_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  reasoning_score NUMERIC NOT NULL,       -- net score (correct - incorrect*1.0)
  reasoning_correct INT NOT NULL,
  reasoning_incorrect INT NOT NULL,
  perceptual_score NUMERIC NOT NULL,      -- net score (correct - incorrect*0.25)
  perceptual_correct INT NOT NULL,
  perceptual_incorrect INT NOT NULL,
  number_score NUMERIC NOT NULL,          -- net score (correct - incorrect*0.5)
  number_correct INT NOT NULL,
  number_incorrect INT NOT NULL,
  word_score NUMERIC NOT NULL,            -- net score (correct - incorrect*0.5)
  word_correct INT NOT NULL,
  word_incorrect INT NOT NULL,
  spatial_score NUMERIC NOT NULL,         -- net score (correct - incorrect*0.5)
  spatial_correct INT NOT NULL,
  spatial_incorrect INT NOT NULL,
  combined_score NUMERIC NOT NULL,        -- sum of all 5 net scores
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gia_sessions_user ON gia_sessions(user_id, created_at DESC);
CREATE INDEX idx_gia_sessions_combined ON gia_sessions(combined_score DESC);

-- Guest scores (pre-auth, linked later)
CREATE TABLE guest_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id TEXT NOT NULL,            -- localStorage-based guest ID
  test_slug TEXT NOT NULL,
  score_value NUMERIC NOT NULL,
  score_unit TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_by UUID REFERENCES users(id)
);
```

```sql
-- 002_leaderboards.sql
-- Leaderboard snapshots (Redis is primary, this is backup/archive)
CREATE TABLE leaderboard_snapshots (
  id SERIAL PRIMARY KEY,
  test_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  best_score NUMERIC NOT NULL,
  rank INT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(test_slug, user_id, snapshot_date)
);
```

### Redis Structure (Upstash)

```
# Per-test sorted sets for real-time leaderboards
leaderboard:{test_slug}         → ZSET (userId → bestScore)

# For "lower is better" tests (reaction-time, aim-trainer):
#   Store negative scores so ZRANGEBYSCORE gives lowest first

# For "higher is better" tests (chimp-test, visual-memory, etc.):
#   Store raw scores, use ZREVRANGEBYSCORE

# User best scores cache
user:{userId}:bests              → HASH (testSlug → bestScore)

# GIA combined leaderboard
leaderboard:gia-combined         → ZSET (userId → bestCombinedScore)

# Global stats per test (for percentile calculation)
stats:{test_slug}:histogram      → HASH (bucket → count)
stats:gia-combined:histogram     → HASH (bucket → count)
```

### Authentication (from mazle)
- NextAuth v4 with Google + Apple OAuth providers
- JWT session strategy (10-day expiry)
- `upsertUserForOidcAccount` pattern on sign-in
- Guest mode: localStorage-based guest ID, scores saved to `guest_scores`
- On sign-in: claim guest scores by linking `guest_id` to `user_id`

---

## Landing Page Design

The home page is the "test hub" — a grid of beautifully designed test cards:

- **Layout:** Responsive grid (3 columns desktop, 2 tablet, 1 mobile)
- **Categories:** Two sections — "Human Benchmark" and "GIA Assessment"
- **Each card shows:** Test icon/emoji, test name, brief description, user's best score (if any), global rank indicator
- **Interactive:** Hover effects (lift + glow), click navigates to test
- **Top bar:** HumansOnly logo, auth button, theme toggle, leaderboard link

---

## Leaderboard System

### Per-Test Leaderboard (shown after each test + dedicated page)
- **Top 100** players with rank, display name, score, date
- **"Around Me"** — 5 players above and below the current user
- **Percentile bar** — "You scored better than X% of players"
- **Score distribution histogram** (optional)

### Combined GIA Leaderboard
- **Route:** `/leaderboard/gia-combined`
- **Scoring:** Sum of net scores across all 5 GIA subtests
- **Net score per subtest** = correct - (incorrect × penalty_weight)
  - Reasoning: penalty = 1.0
  - Perceptual Speed: penalty = 0.25
  - Number Speed: penalty = 0.5
  - Word Meaning: penalty = 0.5
  - Spatial Visualization: penalty = 0.5
- **Requirement:** User must complete all 5 GIA tests in a single session to submit a combined score
- **Leaderboard displays:** Combined total score, plus breakdown per subtest
- **Also show:** Individual subtest ranks alongside combined rank

### Global Leaderboard Hub (`/leaderboard`)
- Tabs for each test + "GIA Combined" tab
- Combined "Overall" ranking (average percentile across all tests)
- Filter by: All Time, This Month, This Week, Today
- Search by username

### Implementation
- Redis sorted sets for real-time rankings
- Percentile calculated from histogram buckets stored in Redis
- Background cron job snapshots leaderboards to PostgreSQL daily
- API endpoints mirror mazle pattern: `/api/leaderboard/top`, `/api/leaderboard/around`, `/api/leaderboard/me`
- GIA combined score: separate sorted set `leaderboard:gia-combined` in Redis

---

## Result Screen (Post-Test)

Every test ends with a rich result screen:
1. **Score** — large, animated counter
2. **Percentile** — "Better than X% of players" with visual bar
3. **Personal best** indicator (crown icon if new PB)
4. **Score history graph** — sparkline of last 20 attempts
5. **Leaderboard mini** — your position + nearby players
6. **Action buttons:** Play Again, Share, View Leaderboard
7. **Share card** — generate an image card with score (for social media)

---

## Visual Design System (Monkeytype-Inspired)

### Theme & Aesthetic
Inspired by monkeytype.com — dark-first, minimalist, typographically rich:

- **Dark theme (default):** Background `#323437`, surface `#2c2e31`, text `#d1d0c5`, accent `#e2b714` (warm yellow)
- **Light theme:** Background `#f5f5f5`, surface `#ffffff`, text `#1a1a1a`, accent `#e2b714`
- **Fonts:**
  - **Primary (UI):** `Space Grotesk` — modern geometric sans-serif for headings, buttons, labels
  - **Monospace:** `JetBrains Mono` — for scores, timers, typed text, numbers
  - **Body:** `Inter` — clean readable font for descriptions, instructions
- **Cards:** Subtle borders, no heavy shadows, rounded corners (12px), slight background elevation
- **Animations:** Minimal, purposeful — color flash feedback (300ms green/red), smooth transitions
- **Progress bars:** Thin, accent-colored, animated countdown

### GIA Test Visual Specs (Verified from gia.steciuk.dev)

**Shared GIA layout:**
- Clean white card container with light border, centered on page
- Question text at top in bold
- Subtitle/instruction in muted gray
- Progress bar (time remaining) above the card
- Answer buttons in a horizontal row below content
- Brief color flash feedback on answer (green = correct, red = wrong, 300ms)
- Score counter (correct/incorrect) visible

**B1 — Reasoning:**
- Two-phase card: Statement phase shows comparison text + "Show the question" button
- Question phase shows question text + two large name buttons side by side
- Statement text: regular weight, ~18px. Names in buttons: bold, prominent
- Negative phrasing examples: "X is not as [adjective] as Y"

**B2 — Perceptual Speed:**
- "How many columns have the same letter?"
- 4 columns displayed horizontally, each with lowercase letter on top, uppercase on bottom
- Font: system sans-serif, monospace-like rendering, large size (~24px+)
- Answer buttons: 0, 1, 2, 3, 4

**B3 — Number Speed:**
- "Which number is furthest from the median?"
- 3 number buttons displayed horizontally, large font
- Numbers are clickable buttons with rounded borders

**B4 — Word Meaning:**
- "Which word doesn't belong?"
- 3 word buttons displayed horizontally
- Words are clickable buttons with rounded borders

**B5 — Spatial Visualization:**
- "How many boxes have the same letter?"
- Subtitle: "Rotated letters are considered the same, while mirrored letters are not."
- 2 boxes side by side, each containing 2 letters stacked vertically (top + bottom)
- **Letter rendering:** System sans-serif font (`ui-sans-serif, system-ui`), 24px, weight 400
- **Transforms:** CSS `transform: rotate(Ndeg) scaleX(-1 or 1)` — rotation in 90° increments, mirroring via horizontal flip
- **Letter set:** Asymmetric uppercase letters: F, G, J, L, N, P, Q, R, S, Z
- Boxes: rounded rectangles (~100×130px), light gray border, white background
- Answer buttons: 0, 1, 2
- For our build: use `JetBrains Mono` or `Space Grotesk` for letter rendering (more distinctive asymmetry than system font)

### Human Benchmark Test Visual Approach
- **Full-screen color tests** (Reaction Time): Entire viewport changes color with large centered text
- **Grid-based tests** (Chimp, Visual Memory, Sequence): Canvas grids with clean tiles, subtle borders, glow effects on active tiles
- **Typing test:** Monkeytype-style — monospace text, character-by-character coloring (correct=accent, error=red, upcoming=muted)
- **Target tests** (Aim Trainer): Canvas with bullseye target, satisfying pop animation on hit
- **Memory tests** (Number, Verbal): Large centered display, clean input fields, animated transitions between phases

---

## Build Order (Implementation Phases)

### Phase 1: Foundation
1. Initialize Next.js 15 project with TypeScript
2. Set up `package.json` with all dependencies (mirror mazle)
3. Configure `next.config.mjs`, `tsconfig.json`, `eslint.config.mjs`
4. Set up global CSS (variables, themes, reset) in `globals.css`
5. Create root `layout.tsx` (fonts, theme, analytics)
6. Set up PostgreSQL schema + migration runner
7. Set up Upstash Redis connection
8. Set up NextAuth (Google + Apple)
9. Create API response helpers + env helpers
10. Set up Vercel project config

### Phase 2: Core UI Shell
1. Build `Header` component (logo, auth, theme toggle, nav)
2. Build landing page with test card grid
3. Build `TestCard` component
4. Build test registry (`lib/tests/registry.ts`) with all 18 test definitions
5. Build shared `TestLayout` wrapper component
6. Build `ResultScreen` component
7. Build `Timer`, `LivesDisplay`, `ScoreDisplay` components
8. Build `CanvasRenderer` shared component
9. Build responsive layouts for all screen sizes

### Phase 3: Implement Tests (Group 1 — DOM-based, simpler)
1. **Reaction Time** — pure CSS + DOM, performance.now timing
2. **Number Memory** — DOM, random number generation, timed display
3. **Verbal Memory** — DOM, word bank, seen/new logic
4. **Typing Test** — DOM, keystroke tracking, WPM calculation
5. **Symbol Search** — DOM, symbol sets, timed rounds
6. **GIA Perceptual Speed** — DOM, letter pair generation
7. **GIA Number Speed** — DOM, number triple generation
8. **GIA Word Meaning** — DOM, curated word bank
9. **GIA Reasoning** — DOM, logic problem generator

### Phase 4: Implement Tests (Group 2 — Canvas-based, complex)
1. **Chimp Test** — Canvas grid, number positions, click detection
2. **Visual Memory** — Canvas grid, flash patterns, click validation
3. **Sequence Memory** — Canvas/DOM grid, sequence animation
4. **Aim Trainer** — Canvas, random target placement, click timing
5. **Hue Test** — Canvas, HSL color generation, grid rendering
6. **Object Tracking** — Canvas, physics simulation, requestAnimationFrame
7. **GIA Spatial Visualization** — Canvas, shape generation + transformation
8. **Color Blindness** — Canvas, Ishihara plate generation
9. **Face Memory** — DOM, image management, study/test phases

### Phase 5: Score System + Leaderboards
1. Build score submission API (`/api/scores/submit`)
2. Build score history API (`/api/scores/history`)
3. Build leaderboard APIs (`top`, `around`, `me`)
4. Build Redis sorted set leaderboard logic
5. Build percentile calculation system
6. Build `LeaderboardTable` and `LeaderboardMini` components
7. Build `PercentileBar` component
8. Integrate result screen with score submission
9. Build global leaderboard page (`/leaderboard`)
10. Build per-test leaderboard pages

### Phase 6: User Features
1. Build profile page (`/profile`) — stats, history, best scores
2. Build share card generation (Canvas-to-image)
3. Build guest mode + score claiming on sign-in
4. Build score history sparkline visualization
5. Add personal best tracking + notifications

### Phase 7: Polish + Production
1. Add loading states, error boundaries, skeleton screens
2. Optimize Canvas rendering (offscreen canvas, RAF scheduling)
3. Add keyboard shortcuts where applicable
4. SEO: metadata, Open Graph, structured data for each test page
5. PWA manifest + service worker for offline capability
6. Performance audit (Lighthouse, Core Web Vitals)
7. Add Vercel Analytics events
8. Final dark/light theme polish
9. Mobile gesture support (swipe, touch targets)
10. Deploy to Vercel

---

## Scoring Units Reference

| Test | Score Unit | Direction | Details |
|---|---|---|---|
| Reaction Time | ms | lower is better | Average of 5 attempts |
| Chimp Test | level | higher is better | Highest level reached |
| Typing | WPM | higher is better | (chars/5) / minutes |
| Visual Memory | level | higher is better | Highest level, 3 lives |
| Aim Trainer | ms/target | lower is better | Average across 30 targets |
| Number Memory | digits | higher is better | Max digits recalled |
| Verbal Memory | score (count) | higher is better | Correct answers, 3 lives |
| Sequence Memory | level | higher is better | Longest sequence |
| Symbol Search | correct/90s | higher is better | Correct in 90 seconds |
| Color Blindness | classification | pass/fail | No leaderboard |
| Face Memory | % accuracy | higher is better | Across 7 levels |
| Hue Test | level | higher is better | Highest level reached |
| Object Tracking | level | higher is better | Highest level reached |
| GIA Reasoning | net score | higher is better | correct - (incorrect × 1.0), 120s |
| GIA Perceptual Speed | net score | higher is better | correct - (incorrect × 0.25), 120s |
| GIA Number Speed | net score | higher is better | correct - (incorrect × 0.5), 120s |
| GIA Word Meaning | net score | higher is better | correct - (incorrect × 0.5), 120s |
| GIA Spatial | net score | higher is better | correct - (incorrect × 0.5), 120s |
| **GIA Combined** | **total net** | **higher is better** | **Sum of all 5 GIA net scores** |

---

## Verification Plan

1. **Local dev:** `npm run dev` — verify all 18 test routes render and are playable
2. **Test each game:** Complete each test end-to-end, verify scoring is accurate
3. **Auth flow:** Sign in with Google, verify user creation in DB
4. **Score submission:** Complete test → verify score saved to DB + Redis
5. **Leaderboards:** Submit multiple scores → verify ranking, percentile, "around me"
6. **Guest → Auth:** Play as guest, sign in, verify scores are claimed
7. **Responsive:** Test on mobile viewport (375px), tablet (768px), desktop (1440px)
8. **Themes:** Verify light + dark mode on all pages
9. **Performance:** Lighthouse score >90 on all metrics
10. **Deploy:** Verify on Vercel preview deployment
