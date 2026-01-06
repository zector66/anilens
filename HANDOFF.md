# Anilens Project Handoff

## Project Overview

Anilens is a sophisticated web application designed for anime and manga enthusiasts. It combines social discovery through "Taste DNA" analysis with interactive gaming elements (trivia, music guessing, etc.), built on top of the AniList API.

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Styling:** Tailwind CSS + Shadcn UI
- **Backend/Realtime:** Supabase (Database & Realtime Subscriptions)
- **API:** AniList GraphQL API
- **State Management:** TanStack Query (React Query)
- **Icons:** Lucide React

## Key Features & Modules

### 1. Taste Analysis & Discovery

- **Taste Analyzer:** A complex engine that processes a user's entire AniList history to determine genre affinities, tag preferences, era biases, and behavioral metrics (binge index, mainstream index).
- **Personality Test:** A gamified way to discover "Anime Archetypes" based on psychological and structural storytelling preferences.
- **Advanced Recommendations:**
  - Multi-mode filtering: "Safe Picks", "Hidden Gems", "Experimental", and "Opposite Day".
  - **New:** Robust fallback mechanism that broadens search criteria automatically if results are low.
  - **New:** Author-based scoring for manga recommendations.

### 2. Gaming Suite (Solo & Multiplayer)

- **Game Modes:**
  - OP/ED Guessing (Real audio from AnimeThemes API)
  - Screenshot Guessing
  - Synopsis Snippet Guessing (Overhauled from "Quotes")
  - Character/Score/Season/Cover Guessing
- **Multiplayer Engine:**
  - Real-time head-to-head battles via Supabase.
  - Atomic question generation by the host to ensure synchronization.
  - Robust "Wait for Opponent" logic.
  - ELO/MMR system with ranks (Iron to Challenger).

## Recent Major Fixes & Architectural Decisions

### Multiplayer Synchronization

- **Race Condition Fix:** Implemented a retry-based update pattern for the `players` array in Supabase to prevent concurrent answer submissions from overwriting each other.
- **State Cleanup:** Improved `leaveRoom` logic to prevent accidental deletion of active game rooms while allowing cleanup of abandoned lobbies.
- **Sync Logic:** Switched from pure broadcast to a reliable subscription/polling hybrid to ensure UI stays perfectly in sync with the opponent's progress and score.

### Recommendation Logic

- **Discovery Bottleneck:** Fixed an issue where "Exploration" mode returned zero results for manga by implementing a multi-stage fallback (dropping tags -> lowering min score -> global trending).
- **Type Awareness:** Refactored the UI and queries to distinguish between Anime (studios) and Manga (authors) data structures.

### Game Content Quality

- **Quotes vs Synopsis:** Replaced low-quality "random quotes" with high-quality synopsis snippets.
- **Title Hiding:** Added regex-based title masking in snippets to prevent giving away the answer.

## Database Schema (Supabase)

- `multiplayer_rooms`: Stores room state, settings, players (JSONB), and generated questions.
- `user_stats`: Stores ELO ratings, match history, and personality profiles.

## Current Status

- **Build Status:** Stable (`npm run build` passing).
- **Multiplayer:** Fully functional with live score sync and profile picture tracking.
- **Discovery:** Highly personalized recommendations working for both media types.

## Instructions for ChatGPT

When continuing work on this project:

1. **AniList GraphQL:** Refer to the `AniListClient` in `src/lib/anilist-client.ts` for all API interactions.
2. **State Management:** Always use TanStack Query for data fetching to benefit from the existing caching strategy.
3. **Realtime:** Use the utilities in `src/lib/supabase.ts` for any multiplayer or social features.
4. **Components:** Follow the pattern of keeping game logic in `game-play.tsx` and UI presentation in smaller sub-components.
