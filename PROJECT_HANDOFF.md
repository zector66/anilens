# AniList Taste Analyzer - Project Handoff Document

## Overview

This is a **Next.js 16** application that integrates with the **AniList GraphQL API** to provide users with personalized anime/manga taste analysis, recommendations, and interactive games. The app authenticates via AniList OAuth and provides deep insights into viewing/reading patterns.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, TailwindCSS 4 |
| State/Data | TanStack React Query 5 |
| API Client | graphql-request |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Components | Radix UI (Progress, Slot) |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main dashboard with tabs
│   ├── layout.tsx         # Root layout with providers
│   └── globals.css        # Global styles (Tailwind)
│
├── components/
│   ├── auth/              # Login button, OAuth handling
│   ├── games/             # Game hub, individual game components
│   │   ├── game-hub.tsx   # Main game selection interface
│   │   └── ...            # Individual game modes
│   ├── personality/       # Personality trait display
│   ├── recommendations/   # Recommendation engine UI
│   │   └── recommendations.tsx
│   ├── social/            # Social comparison features
│   ├── taste/             # Taste profile components
│   │   └── taste-profile.tsx
│   └── ui/                # Shared UI components (buttons, cards)
│
├── hooks/
│   ├── use-anilist.ts     # React Query hooks for AniList API
│   └── use-auth.ts        # Authentication state management
│
├── lib/
│   ├── anilist-client.ts  # GraphQL client & API methods
│   ├── auth.ts            # OAuth configuration
│   ├── game-engine.ts     # Game logic & question generation
│   ├── taste-analyzer.ts  # Statistical analysis algorithms
│   └── utils.ts           # Utility functions (cn for classnames)
│
└── types/
    └── anilist.ts         # TypeScript interfaces for all data
```

---

## Core Features

### 1. Authentication (`src/lib/auth.ts`, `src/hooks/use-auth.ts`)
- AniList OAuth2 flow
- Token storage in localStorage
- User profile fetching

### 2. Taste Analysis (`src/lib/taste-analyzer.ts`)

The `TasteAnalyzer` class processes a user's media list and generates a comprehensive `TasteProfile`:

#### Calculated Metrics:

| Metric | Algorithm Description |
|--------|----------------------|
| **Genre Affinity** | Weighted by volume (40%), score (35%), count (15%), base (10%). Normalized 0-1. |
| **Tag Affinity** | Similar to genre, includes tag rank prominence. Top 20 tags kept. |
| **Studio/Author Bias** | Tracks favorite studios (anime) or authors (manga). |
| **Era Preference** | Groups by decade (80s, 90s, 2000s, 2010s, 2020s). |
| **Format Preference** | TV, Movie, OVA, etc. distribution. |

#### Behavioral Metrics:

| Metric | Range | Calculation |
|--------|-------|-------------|
| **Completion Rate** | 0-1 | completed / total (excluding PLANNING) |
| **Drop Rate** | 0-1 | dropped / total |
| **Rewatch Rate** | 0-1 | repeat count / total |
| **Binge Index** | 0-1 | Episodes/day curve: 1ep=0.15, 3ep=0.5, 6ep=0.85, 10+=1.0 |
| **Mainstream Index** | 0-1 | Log-scale popularity (500-500k), weighted by completion status |
| **Niche Index** | 0-1 | Engagement with <20k popularity titles, exponential decay |
| **Experimental Index** | 0-1 | Presence of avant-garde tags, weighted by engagement |
| **Diversity Index** | 0-1 | Shannon entropy of genre distribution, normalized to ~2.2 max |

#### Score Patterns:

| Metric | Description |
|--------|-------------|
| **Mean Score** | Average of all scored entries |
| **Score Inflation** | -1 to +1 relative to AniList global avg (6.8) |
| **Consistency** | 0-1 based on std deviation (2.5 = inconsistent threshold) |
| **Distribution** | Array of score counts 1-10 |

### 3. Recommendations (`src/lib/anilist-client.ts`, `src/components/recommendations/`)

#### Algorithm:

1. **Genre Selection**: Uses top 3-5 genres from user's affinity, or user-selected genre
2. **Tag Filtering**: Includes top 3 tags for precision
3. **Mode-based Filtering**:
   - `safe`: popularity > 50k, high score, multiple genre matches
   - `hidden-gem`: popularity < 30k, score >= 70
   - `experimental`: few genre matches, trending sort
4. **Match Scoring** (0-100):
   - Genre matches: 40 pts max
   - Tag matches: 30 pts max  
   - Quality (meanScore): 20 pts max
   - Popularity balance: 10 pts max
5. **Double Filtering**: Server-side AND client-side filtering of watched titles

#### UI Features:
- Media type toggle (Anime/Manga)
- Genre picker with affinity percentages
- Min score slider (40-80%)
- Category filters (Safe, Hidden Gem, Experimental)
- Regenerate button with varied results

### 4. Games (`src/lib/game-engine.ts`, `src/components/games/`)

#### Game Types:

**Anime Games:**
- OP Guessing (audio-based)
- Screenshot Guessing
- Quote Guessing
- Score Guessing
- Character Guessing
- Season Matching

**Manga Games:**
- Cover Guessing
- Chapter Count Guessing

**Common Games:**
- Score Guessing (works for both)

#### Game Engine:
- `createGameSession()`: Initializes game state
- `generateXxxQuestions()`: Creates questions from user's list
- `calculateDifficulty()`: Based on popularity/obscurity
- `calculateScore()`: Time-weighted scoring
- `getPerformanceLevel()`: S/A/B/C/D rating

### 5. Data Types (`src/types/anilist.ts`)

Key interfaces:
- `AniListUser`: User profile data
- `Media`: Anime/Manga details (title, genres, tags, studios, etc.)
- `MediaListEntry`: User's list entry with status, score, progress
- `MediaList`: Collection of lists (Watching, Completed, etc.)
- `TasteProfile`: Full taste analysis output
- `GameQuestion`: Question structure for games
- `GameSession`: Active game state

---

## API Integration (`src/lib/anilist-client.ts`)

The `AniListClient` class wraps graphql-request:

| Method | Description |
|--------|-------------|
| `getCurrentUser()` | Fetch authenticated user |
| `getUserByName(name)` | Search user by username |
| `getAnimeList(userId)` | Fetch user's anime list |
| `getMangaList(userId)` | Fetch user's manga list |
| `getUserStats(userId)` | Fetch detailed statistics |
| `searchMedia(query, type)` | Search anime/manga |
| `getMediaDetails(id)` | Get full media details |
| `getRecommendations(...)` | Advanced recommendation engine |

---

## React Query Hooks (`src/hooks/use-anilist.ts`)

| Hook | Purpose | Cache Time |
|------|---------|------------|
| `useAnimeList(userId)` | Fetch anime list | 5 min |
| `useMangaList(userId)` | Fetch manga list | 5 min |
| `useUserStats(userId)` | Fetch user stats | 10 min |
| `useMediaSearch(query, type)` | Search media | 2 min |
| `useMediaDetails(mediaId)` | Get media details | 15 min |
| `useRecommendations(...)` | Get recommendations | 3 min |

---

## Environment Variables

```env
NEXT_PUBLIC_ANILIST_CLIENT_ID=your_client_id
NEXT_PUBLIC_ANILIST_REDIRECT_URI=http://localhost:3000
```

---

## Key Implementation Details

### Manga Support
- All components support both ANIME and MANGA types
- Type toggle available in TasteProfile, Recommendations, GameHub
- TasteAnalyzer handles episodes vs chapters/volumes
- Studios (anime) vs Staff/Authors (manga) for bias calculation

### Recommendation Exclusion
- `watchedIds` Set tracks all media on user's list
- Server-side filtering in GraphQL response
- Client-side double-check filtering in hook
- Query key includes watchedIds hash for cache invalidation

### Statistical Accuracy
- Score inflation uses AniList global avg (6.8) as baseline
- Binge index uses smooth curve, not linear
- Mainstream/niche use logarithmic popularity scaling
- All indices weighted by engagement (completion status)

---

## Component State Flow

```
User Login
    ↓
useAuth() → stores token
    ↓
useAnimeList/useMangaList(userId)
    ↓
TasteAnalyzer.analyzeTaste(entries, type)
    ↓
TasteProfile (displayed) + genreAffinity/tagAffinity (passed to recommendations)
    ↓
useRecommendations(genreAffinity, watchedIds, type, options)
    ↓
AniListClient.getRecommendations() → filtered, scored results
    ↓
Recommendations UI (cards with match scores, reasons, categories)
```

---

## Build & Run

```bash
npm install
npm run dev      # Development server on localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## Known Considerations

1. **Rate Limiting**: AniList has rate limits; React Query caching helps mitigate
2. **Large Lists**: Users with 1000+ entries may experience slower analysis
3. **Tag Matching**: Uses partial string matching for experimental tags
4. **OAuth Redirect**: Ensure redirect URI matches AniList app settings

---

## Files Changed in Recent Session

| File | Changes |
|------|---------|
| `src/lib/anilist-client.ts` | Advanced recommendation engine with multi-genre, tags, modes |
| `src/lib/taste-analyzer.ts` | Added tagAffinity, improved all statistical algorithms |
| `src/hooks/use-anilist.ts` | Updated useRecommendations with options, double filtering |
| `src/components/recommendations/recommendations.tsx` | Genre picker, min score slider, improved UI |
| `src/components/taste/taste-profile.tsx` | Manga support, type toggle |
| `src/components/games/game-hub.tsx` | Manga games, type toggle |
| `src/lib/game-engine.ts` | Added manga game types |
| `src/types/anilist.ts` | Added tagAffinity to TasteProfile, manga game types |

---

## Testing Checklist

- [ ] Login with AniList OAuth
- [ ] View taste profile for anime
- [ ] Switch to manga and view taste profile
- [ ] Check recommendations don't include watched titles
- [ ] Filter recommendations by genre
- [ ] Change min score and verify filtering
- [ ] Regenerate recommendations for variety
- [ ] Start an anime game
- [ ] Start a manga game
- [ ] Verify all stats display correctly

---

*Last updated: January 2026*
