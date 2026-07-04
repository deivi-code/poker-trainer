# Poker Trainer — Architecture

## System Overview

A decision-training poker app built on Next.js + TypeScript with a shared TypeScript engine running entirely client-side (no backend needed for MVP). Supabase is wired for auth + persistence when ready.

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (dark theme, nav)
│   ├── page.tsx            # Redirects to /train
│   ├── train/page.tsx      # Main training screen (core loop)
│   ├── mistakes/page.tsx   # Mistake review list
│   ├── range-painter/page.tsx
│   ├── session/[id]/page.tsx
│   └── actions/session.ts  # Supabase server actions
├── engine/                 # Core business logic (pure TS, no React)
│   ├── types.ts            # All shared types (Spot, Hand, Action, etc.)
│   ├── spots/
│   │   ├── generator.ts    # Spot generation with weighted randomness
│   │   ├── positions.ts    # Position helpers + weights
│   │   ├── hands.ts        # Hand generation + strength eval
│   │   └── action-states.ts
│   ├── evaluation/
│   │   ├── evaluator.ts    # Decision evaluation (preflop + postflop)
│   │   └── preflop-strategy.ts  # 8-scenario preflop strategy tables
│   ├── mistakes/
│   │   └── spaced-repetition.ts  # Mistake store + SRS algorithm
│   └── session/
│       └── manager.ts      # Session lifecycle + decision processing
├── components/
│   ├── Nav.tsx             # Top navigation bar
│   ├── training/
│   │   ├── SpotDisplay.tsx # Hand cards, position, pot, SPR
│   │   ├── ActionButtons.tsx # Preflop/postflop action buttons
│   │   ├── FeedbackOverlay.tsx # Correct/incorrect modal
│   │   ├── SessionHUD.tsx  # Progress bar, accuracy, streak
│   │   └── Timer.tsx       # Decision timer
│   ├── session/
│   │   └── SessionSummary.tsx # End-of-session results
│   ├── mistakes/
│   │   └── MistakeList.tsx # Mistake list with priority
│   └── range-painter/
│       └── RangeGrid.tsx   # 13x13 hand grid visualization
├── store/
│   ├── training-store.ts   # Zustand: active training session state
│   └── session-store.ts    # Zustand: historical stats + config
└── lib/
    ├── utils.ts            # cn() helper
    ├── supabase-schema.sql # Full database schema
    └── supabase/
        ├── client.ts       # Browser Supabase client
        └── server.ts       # Server Supabase client
```

## Core Training Loop

1. **Start Session** → user picks 20/50/100 decisions
2. **Generate Spot** → `generator.ts` creates weighted random spot
3. **Display** → `SpotDisplay` shows hand, position, pot, SPR
4. **User Action** → keyboard (F/C/R/A) or button click
5. **Evaluate** → `evaluator.ts` compares against strategy table
6. **Feedback** → `FeedbackOverlay` shows correct/incorrect + explanation
7. **Record** → `SessionManager.processDecision()` stores attempt, updates mistakes
8. **Repeat** → next spot (mistake-injected if due)
9. **Summary** → accuracy %, avg time, weakest spots

## Strategy Engine

The `preflop-strategy.ts` module implements a simplified GTO-based strategy using:

- **8 scenarios**: open (UTG/MP/CO/BTN), vs-open (BTN/CO/MP), vs-3bet (BTN/CO), blind-defense (BB)
- **Hand-based lookup**: Each scenario maps hand strength → action (raise/call/fold) with frequencies
- **Mixed strategies**: Many spots return alternatives (e.g., "raise 60%, call 40%") — both are accepted as correct
- **Postflop**: Simplified SPR-based heuristic for flop decisions (c-bet defense, short-stack jams)

## Spaced Repetition System

- Mistakes are stored in an in-memory `MistakeStore` with priority scores
- Priority = f(error_type_weight, frequency, recency)
- Due mistakes are injected into sessions at configurable ratio (default 30%)
- Correct answers → interval increases, priority decays
- Wrong answers → interval resets, priority increases
- Intervals: 0s → 1m → 5m → 30m → 2h → 6h → 24h

## Data Flow

```
User → ActionButtons → training-store.submitDecision()
  → SessionManager.processDecision()
    → evaluator.evaluateDecision(spot, action)
    → mistakeStore (update/create mistake)
    → returns { attempt, isCorrect, explanation }
  → FeedbackOverlay shows result
  → onDismiss → training-store.nextSpot()
    → SessionManager.generateDecisions(1)
      → MistakeInjector (some spots from mistakes)
      → SpotGenerator (fresh spots)
    → SpotDisplay renders next spot
```

## Key Design Decisions

- **All logic runs client-side**: Zero latency for decision → feedback loop
- **No API routes needed for MVP**: Zustand stores + engine modules are pure TS
- **Strategy is deterministic + frequency-based**: Same hand in same spot always evaluates the same way; mixed strategies are handled via frequency thresholds
- **Mistake store is in-memory**: Supabase persistence is wired but optional for MVP
- **Dark theme default**: Reduces eye strain during rapid-fire sessions
