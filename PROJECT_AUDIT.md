# AniLens Project Audit & Roadmap

Last updated: 2026-01-09

This document captures a high-level audit of AniLens, including product/UX opportunities, architecture concerns, reliability/performance risks, and a prioritized roadmap.

---

## 1) What’s already strong

- **Clear product pillars**
  - Taste analytics, games, and recommendations form a coherent product loop.

- **Differentiated analytics**
  - `TasteAnalyzer` contains meaningful modeling (completionist correction, diversity index, tag affinity, z-score style normalization).

- **Good caching baseline**
  - React Query is in place and used across AniList list fetches and recommendations.

- **Visual direction**
  - Dark gradient aesthetic is consistent and feels modern.

---

## 2) Highest-impact issues (fix these first)

### A) Data integrity / correctness risks

#### 1) Multiplayer race condition (Supabase `players` array)

- **Problem**: both clients read the full `players` array, mutate their own entry, and write the whole array back. Concurrent updates overwrite each other.
- **Impact**: lost scores, broken progress tracking, desynced UI.
- **Fix options**:
  - **Preferred**: a Postgres RPC function to update a single player atomically (JSONB update), keyed by `room_id` + `player_id`.
  - **Alternative**: normalize into a `multiplayer_room_players` table (one row per player) and join.

#### 2) Auth & data fetching inconsistency

- **Current reality**: you have two modes:
  - OAuth (token in browser)
  - view-only (username-based)

- **Problems**:
  - multiple paths for AniList calls (`AuthManager` does `fetch` for Viewer; hooks use `anilistClient`).
  - inconsistent shapes / assumptions about list responses in different features.

- **Fix**: a single, canonical “AniList session” and a single wrapper client that is always token-aware.

---

### B) UI architecture issue: iframe-in-dashboard

- **Problem**: rendering `Studio` via `<iframe src="/studio" />` duplicates headers and makes auth/data flows harder.
- **Fix**: render as a normal component within the dashboard shell.
- **Impact**: big UX win + simpler state management.

---

### C) Heavy compute on client without a compute boundary

- **Problem**: `TasteAnalyzer` is large and computation-heavy; with large lists, the main thread can block.
- **Fix options**:
  - **Best UX**: move taste compute into a Web Worker.
  - **Server option**: compute on server and cache results keyed by `(userId, mediaType, lastUpdated)`.
- **Impact**: app feels “instant” for power users.

---

## 3) UX / Product suggestions

### A) Navigation & information architecture

- Consider top-level grouping by intent:
  - Taste
  - Play
  - Discover
  - Studio (Coming Soon)
  - Community

- Improve navigation ergonomics:
  - keyboard shortcuts for tab switching (e.g. 1–5)
  - persist last active tab in `localStorage`

### B) Onboarding improvements

- First-run tour:
  - choose Anime vs Manga
  - set title language
  - adult-content preference
  - guide user to try a game

- Show realistic “first load” expectations (AniList calls can be slow).

### C) Taste share loop upgrades

- Add:
  - “Copy summary” for AniList posts
  - consistent image export watermark
  - “saved rivals” list in comparisons

### D) Recommendations improvements (high leverage)

- Add:
  - expanded “Why this was recommended” with weighted reasons (you already store `_reasons`)
  - feedback loop: “seen it” / “not interested” / “loved it” to tune picks
  - optional: detect “already in planning”

### E) Studio (when revived)

- Keep deterministic compute pipeline design.
- Reintroduce only after:
  - common list normalization utilities exist
  - auth + list fetching are unified
  - caching strategy is in place

---

## 4) Engineering / maintainability suggestions

### A) Consolidate list normalization

Multiple places repeat:

- status filters (`COMPLETED`, `CURRENT`, `REPEATING`)
- dedupe logic (custom lists duplicates)
- flattening `MediaList.lists[].entries`

**Create a single utility**:

- `normalizeMediaList(mediaList, { statuses, dedupe }) => MediaListEntry[]`

Then reuse in Taste/Games/Recommendations/Studio.

### B) Make API boundaries explicit

- Move heavier recommendation logic behind `/api/recommendations` for:
  - caching
  - rate limiting
  - less client bundle weight

### C) Supabase model

- If staying with polling:
  - fix atomic updates (RPC)
  - consider increasing poll interval and using versioning/timestamps

### D) Testing (minimal but high ROI)

Suggested tiers:

- unit: `TasteAnalyzer` invariants (diversity, z-scores, correction)
- integration: list normalization + dedupe behavior
- smoke: pages render + auth callback parsing

### E) Observability

- Add a tiny logger wrapper:
  - dev-only verbose
  - prod: minimal, user-facing error messages

---

## 5) Security & reliability checklist

- OAuth token in `localStorage` is acceptable for early stage, but XSS-sensitive.
  - hardening option: server-side OAuth exchange + HttpOnly cookies (bigger change).

- Protect `/api/db/init`.
  - should be behind a secret, or disabled in production.

- Add rate limiting / throttling:
  - AniList API calls
  - `/api/game/submit`

---

## 6) Prioritized roadmap

### Quick wins (1–2 days)

- Remove iframe and render Studio as a normal component.
- Add shared `normalizeMediaList` and refactor Taste/Games/Recommendations.
- Protect `/api/db/init`.
- Replace noisy console spam with dev-only logging.

### High leverage (1–2 weeks)

- Fix multiplayer atomic updates (RPC or schema change).
- Move `TasteAnalyzer` compute off main thread (Web Worker) or server-cached.
- Unify AniList session + token-aware client.

### Big upgrades (1–2 months)

- Harden auth (server-based OAuth + HttpOnly cookies).
- Recommendation feedback loop persisted per user.
- Reintroduce Studio on top of normalized list pipeline + caching.

---

## 7) Open decisions

- **Architecture direction**: remain client-heavy, or move to a server-backed model for caching/rate-limiting/security.
- **What “user accounts” mean**: currently auth is essentially AniList identity + optional OAuth token; decide whether AniLens should store preferences/history server-side long-term.
