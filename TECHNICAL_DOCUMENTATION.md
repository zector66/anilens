# AniLens Technical Documentation

**Last Updated:** January 15, 2026  
**Purpose:** Comprehensive technical reference for audit, improvement suggestions, and future development

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Taste Analysis Engine](#taste-analysis-engine)
3. [Recommendation Algorithm](#recommendation-algorithm)
4. [Performance & Caching](#performance--caching)
5. [UI/UX Features](#uiux-features)
6. [Data Flow & Architecture](#data-flow--architecture)
7. [Recent Improvements](#recent-improvements)
8. [Known Limitations](#known-limitations)

---

## System Overview

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Query (TanStack Query)
- **Data Source:** AniList GraphQL API
- **Database:** Supabase (PostgreSQL)
- **Image Export:** html-to-image library
- **Deployment:** Vercel

### Core Features
1. **Taste Profile Analysis** - Deep statistical analysis of user's anime/manga consumption
2. **Smart Recommendations** - Multi-mode recommendation engine with 4 strategies
3. **AniLens Studio** - Poster generation tool for sharing taste profiles
4. **Game Hub** - Interactive games (Guess the Score, Bingo, Multiplayer)
5. **Community Features** - Leaderboards, profiles, social sharing

---

## Taste Analysis Engine

### Location
- `src/lib/taste-analyzer.ts` - Main analysis class
- `src/lib/taste-analyzer-cache.ts` - In-memory caching layer

### Core Philosophy

The taste analyzer uses **Bayesian statistics** and **shrinkage estimators** to produce robust, confidence-weighted metrics that account for sample size and user behavior patterns.

### Key Statistical Methods

#### 1. Bayesian Score Shrinkage

**Purpose:** Prevent small sample sizes from producing extreme scores

```typescript
// Shrink user scores toward global mean
const shrunkScore = (
  (lambda * globalMean) + (sampleSize * observedMean)
) / (lambda + sampleSize)
```

**Constants:**
- `GLOBAL_MEAN_SCORE = 6.8` - Population average
- `SCORE_SHRINKAGE_LAMBDA = 5` - Shrinkage strength

**Why:** A user who rated 2 anime both 10/10 shouldn't have a "perfect" genre affinity. Shrinkage pulls extreme values toward the mean based on confidence.

#### 2. Dirichlet Prior for Proportions

**Purpose:** Smooth genre/tag distributions with pseudo-counts

```typescript
const smoothedProportion = (observed + alpha) / (total + alpha * categories)
```

**Constants:**
- `DIRICHLET_ALPHA = 0.5` - Pseudo-count strength

**Why:** Prevents zero probabilities and stabilizes estimates for rare categories.

#### 3. Completionist Correction

**Purpose:** Adjust for users who complete everything vs. selective viewers

```typescript
const completionRate = completed / total;

// Downweight completion evidence for completionists
const completionWeight = Math.max(0.2, 1 - (completionRate - 0.75) * 2);

// Amplify score evidence for completionists
const scoreMultiplier = completionRate > 0.75 
  ? 1 + 0.4 * ((completionRate - 0.75) / 0.25)  // 1.0 to 1.4
  : 1.0;
```

**Why:** If someone completes 95% of what they start, completion is less informative than scores. Conversely, selective viewers reveal preferences through completion.

#### 4. Z-Score Normalization

**Purpose:** Normalize scores relative to user's personal scale

```typescript
const userMean = scores.reduce((a, b) => a + b) / scores.length;
const userStd = Math.sqrt(variance);
const zScore = (score - userMean) / userStd;
```

**Why:** Some users rate everything 7-9, others use full 1-10 scale. Z-scores make comparisons fair.

### Affinity Calculations

#### Genre Affinity Formula

```typescript
const volumeFactor = progressUnits / totalProgress;  // Time spent
const scoreFactor = (shrunkScore - globalMean) / 10; // Quality signal
const countFactor = Math.min(1, count / threshold);  // Sample size

const affinity = Math.max(0, Math.min(1, 
  (volumeFactor * 4.0) +    // 40% weight - time is king
  (scoreFactor * 0.35) +    // 35% weight - quality matters
  (countFactor * 0.15) +    // 15% weight - sample confidence
  0.10                      // 10% baseline - prevent zeros
));
```

**Weights Rationale:**
- **Volume (40%):** Time spent is strongest signal of preference
- **Score (35%):** High ratings indicate enjoyment
- **Count (15%):** More samples = more confidence
- **Baseline (10%):** Prevents complete dismissal of categories

**Confidence Score:**
```typescript
const confidence = Math.min(1, 
  (count / 8) * (scoredCount / Math.max(1, count))
);
```

#### Tag Affinity Formula

Similar to genre but with adjusted thresholds:
- Uses tag rank (popularity) as additional signal
- Lower count threshold (6 vs 8) since tags are more granular
- Incorporates tag frequency across user's list

### Behavioral Metrics

#### 1. Completion Rate
```typescript
const completionRate = completedCount / analyzedCount;
```

#### 2. Drop Rate
```typescript
const dropRate = droppedCount / analyzedCount;
```

#### 3. Binge Index
```typescript
// Measures tendency to rewatch/reread
const bingeIndex = Math.min(1, rewatchCount / Math.max(1, completedCount));
```

#### 4. Mainstream Index
```typescript
// Based on popularity percentile
const mainstreamIndex = popularityQuantile;
```

#### 5. Niche Index
```typescript
// Inverse of mainstream, weighted by obscure titles
const nicheIndex = 1 - mainstreamIndex;
```

#### 6. Experimental Index
```typescript
// Measures genre diversity
const experimentalIndex = Math.min(1, effectiveGenres / 10);
```

#### 7. Diversity Index (Shannon Entropy)
```typescript
// Genre distribution entropy
let genreEntropy = 0;
genreDistribution.forEach(p => {
  if (p > 0) genreEntropy -= p * Math.log(p);
});

const diversityIndex = genreEntropy / Math.log(totalGenres);
```

**Why Entropy:** Captures how evenly distributed consumption is across genres. High entropy = diverse taste.

### Emotional Profile

Calculated from tag co-occurrence patterns:

1. **Escapism vs. Grounded** - Fantasy/Sci-Fi vs. Realistic settings
2. **Bleakness vs. Wholesome** - Dark themes vs. feel-good content
3. **Idealism vs. Cynicism** - Hopeful vs. pessimistic worldviews
4. **Intensity vs. Calm** - Action-packed vs. relaxing content
5. **Sentimentality** - Romance/drama preference

Each dimension uses weighted tag matching:
```typescript
const escapism = escapismTags / (escapismTags + groundedTags + 0.1);
```

### Structural Preferences

1. **Episodic vs. Serial** - Standalone episodes vs. continuous narrative
2. **Pacing Preference** - Fast-paced vs. slow-burn
3. **Plot vs. Character** - Story-driven vs. character-driven
4. **Complexity Preference** - Simple vs. intricate narratives

### Risk Profile

Analyzes consumption across popularity tiers:

```typescript
const popularityBuckets = [
  { min: 0, max: 1000, label: 'Obscure' },
  { min: 1000, max: 10000, label: 'Niche' },
  { min: 10000, max: 50000, label: 'Cult' },
  { min: 50000, max: 200000, label: 'Popular' },
  { min: 200000, max: Infinity, label: 'Mainstream' }
];
```

**Risk Tolerance:**
```typescript
const obscureEngagement = obscureBucket.engagement + nicheBucket.engagement;
const riskTolerance = Math.min(1, obscureEngagement * 1.5);
```

### Fingerprint Generation

Creates unique taste signature:
```typescript
const segments = [];

// Emotional axis
if (escapism > 0.6) segments.push('ESC');
else if (escapism < 0.4) segments.push('GRD');

// Bleakness axis
if (bleakness > 0.6) segments.push('DRK');
else if (bleakness < 0.3) segments.push('LGT');

// Diversity
if (diversity > 0.7) segments.push('DIV');
else if (diversity < 0.3) segments.push('FOC');

const code = segments.join('-'); // e.g., "ESC-LGT-DIV"
```

**Archetypes:**
- The Completionist
- The Critic
- The Explorer
- The Niche Hunter
- The Mainstream Fan
- The Binge Watcher
- The Casual

Determined by weighted scoring of behavioral patterns.

---

## Recommendation Algorithm

### Location
- `src/lib/anilist-client.ts` - Main recommendation logic

### Recommendation Modes

#### 1. Safe Picks (mode: 'safe')
**Goal:** High-confidence recommendations matching user's core preferences

**Scoring:**
```typescript
const genreScore = matchedGenres.reduce((sum, g) => {
  const userAffinity = userGenreMap.get(g.genre);
  return sum + (userAffinity?.affinity || 0);
}, 0) / Math.max(1, matchedGenres.length);

const tagScore = matchedTags.reduce((sum, t) => {
  const userAffinity = userTagMap.get(t.tag);
  return sum + (userAffinity?.affinity || 0);
}, 0) / Math.max(1, matchedTags.length);

const formatScore = formatWeights[media.format] || 0;

const safeScore = 
  (genreScore * 0.45) +      // Genre match is primary
  (tagScore * 0.35) +        // Tag match is secondary
  (formatScore * 0.10) +     // Format preference
  (anilistScore * 0.10);     // Quality baseline
```

**Filters:**
- Minimum 2 genre matches
- Minimum 3 tag matches
- Score threshold: 60%

#### 2. Hidden Gems (mode: 'hidden-gem')
**Goal:** Quality titles outside mainstream that match user taste

**Scoring:**
```typescript
const popularityPenalty = Math.max(0, 
  1 - (media.popularity / 50000)  // Penalize popular titles
);

const hiddenGemScore = 
  (genreScore * 0.35) +
  (tagScore * 0.30) +
  (popularityPenalty * 0.25) +   // Reward obscurity
  (anilistScore * 0.10);
```

**Filters:**
- Popularity < 50,000
- AniList score ≥ 70
- Minimum 1 genre match

#### 3. Experimental (mode: 'experimental')
**Goal:** Push boundaries with different but potentially interesting content

**Scoring:**
```typescript
const genreDivergence = genres.filter(g => 
  !userGenreMap.has(g.genre)
).length / Math.max(1, genres.length);

const tagNovelty = tags.filter(t => 
  !userTagMap.has(t.tag)
).length / Math.max(1, tags.length);

const experimentalScore = 
  (genreDivergence * 0.30) +     // Reward new genres
  (tagNovelty * 0.25) +          // Reward new tags
  (anilistScore * 0.25) +        // Quality matters more
  (genreScore * 0.20);           // Some familiarity
```

**Filters:**
- At least 30% genre divergence
- AniList score ≥ 65
- Not completely alien (some overlap required)

#### 4. Opposite Day (mode: 'opposite')
**Goal:** Recommend complete opposites of user's usual taste

**Scoring:**
```typescript
const genreInversion = 1 - genreScore;  // Invert preference
const tagInversion = 1 - tagScore;

const oppositeScore = 
  (genreInversion * 0.40) +
  (tagInversion * 0.35) +
  (anilistScore * 0.25);         // Still want quality
```

**Filters:**
- Maximum 1 genre match (avoid overlap)
- AniList score ≥ 70 (quality floor)

### Favorites Anchoring

When enabled, blends user's favorites profile with list-based analysis:

```typescript
const favoritesWeight = favoritesInfluence / 100;  // 0-30%
const listWeight = 1 - favoritesWeight;

const blendedGenreAffinity = genreAffinity.map(g => {
  const favAffinity = favoritesGenreMap.get(g.genre)?.affinity || 0;
  return {
    ...g,
    affinity: (g.affinity * listWeight) + (favAffinity * favoritesWeight)
  };
});
```

**Why:** Favorites often represent aspirational taste vs. actual consumption patterns.

### Match Scoring Details

Each recommendation includes detailed match reasons:

```typescript
interface MatchReason {
  type: 'genre' | 'tag' | 'staff' | 'format' | 'studio';
  text: string;
  weight: number;      // -1 to 1 (negative = mismatch)
  confidence?: number; // 0 to 1
}
```

**Example:**
```typescript
{
  type: 'genre',
  text: 'Action (92% affinity)',
  weight: 0.92,
  confidence: 0.85
}
```

### Deduplication & Filtering

1. **Remove watched titles:**
```typescript
results.filter(media => !watchedIds.has(media.id))
```

2. **Remove sequels/prequels of watched:**
```typescript
// Check relations for watched IDs
media.relations.filter(r => !watchedIds.has(r.id))
```

3. **Format filtering:**
```typescript
if (excludeFormats.includes(media.format)) return false;
```

4. **Score threshold:**
```typescript
if (media.averageScore < minScore) return false;
```

---

## Performance & Caching

### React Query Configuration

**Location:** `src/app/providers.tsx`

```typescript
{
  queries: {
    staleTime: 10 * 60 * 1000,        // 10 minutes
    gcTime: 60 * 60 * 1000,           // 1 hour
    refetchOnWindowFocus: false,       // Don't refetch on tab switch
    refetchOnMount: false,             // Use cache if available
    refetchOnReconnect: false,         // Don't refetch on reconnect
    retry: 2,                          // Retry failed requests twice
    retryDelay: (attemptIndex) =>      // Exponential backoff
      Math.min(1000 * 2 ** attemptIndex, 30000),
    structuralSharing: true,           // Optimize re-renders
    networkMode: 'online',             // No offline queueing
  }
}
```

### Query-Specific Cache Times

**Location:** `src/hooks/use-anilist.ts`

| Query Type | Stale Time | GC Time | Rationale |
|------------|------------|---------|-----------|
| Anime/Manga List | 15 min | 30 min | Lists change infrequently |
| Favorites | 30 min | 60 min | Rarely updated |
| User Stats | 20 min | 40 min | Stable data |
| Media Details | 30 min | 60 min | Static content |
| Search | 5 min | 10 min | More dynamic |
| Recommendations | 10 min | 20 min | Can be reused |

### TasteAnalyzer Cache

**Location:** `src/lib/taste-analyzer-cache.ts`

**Strategy:** In-memory LRU cache with hash-based keys

```typescript
class TasteAnalyzerCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 15 * 60 * 1000;  // 15 minutes
  private readonly MAX_ENTRIES = 50;       // LRU eviction
  
  private generateHash(entries: MediaListEntry[], type: string): string {
    const ids = entries.map(e => e.id).sort();
    const totalScore = entries.reduce((sum, e) => sum + (e.score || 0), 0);
    return `${type}-${entries.length}-${ids[0]}-${ids[ids.length - 1]}-${totalScore}`;
  }
}
```

**Performance Impact:**
- First calculation: ~500-1000ms (complex analysis)
- Cache hit: <1ms (instant)
- Prevents recalculation on every render, filter change, or tab switch

### Cache Invalidation

**Manual invalidation hooks:**
```typescript
const invalidateAnimeList = useInvalidateAnimeList();
const invalidateUserStats = useInvalidateUserStats();
```

**Automatic invalidation:**
- On user logout
- On explicit refresh actions
- After TTL expiration

---

## UI/UX Features

### Recent Polish Improvements

#### 1. Studio Export Functionality
- **Issue:** Export button wasn't working due to ref forwarding issues
- **Fix:** Moved `posterRef` to wrapper div for direct DOM access
- **Enhancement:** Added 100ms delay before export to ensure DOM ready
- **Error Handling:** Detailed logging and user-friendly error messages

#### 2. Smooth Tab Transitions
- **Feature:** Fade-in/out animations when switching tabs
- **Implementation:**
```typescript
const handleTabChange = (tab: TabType) => {
  setIsTransitioning(true);
  setTimeout(() => {
    setActiveTab(tab);
    setTimeout(() => setIsTransitioning(false), 50);
  }, 150);
};
```

#### 3. Studio Poster Layout
- **Issue:** Overlapping elements in poster preview
- **Fix:** Reduced grid gaps, padding, and component sizes
- **Result:** Clean, non-overlapping layout across all aspect ratios

#### 4. Keyboard Shortcuts (Studio)
- `Cmd/Ctrl + E` - Export poster
- `Cmd/Ctrl + K` - Copy share text
- `+` or `=` - Zoom in
- `-` - Zoom out
- `0` - Fit to view

#### 5. LocalStorage Persistence (Studio)
- Saves: mode, settings, aspect ratio, zoom level, theme
- Auto-loads on page refresh
- Improves user experience across sessions

#### 6. Toast Notifications
- Replaced browser alerts with custom toast system
- Auto-dismiss after 3 seconds
- Color-coded by type (success/error/info)

#### 7. Loading Skeletons
- Added to Studio poster generation
- Smooth animation during taste profile calculation
- Better perceived performance

#### 8. Enhanced Recommendation Cards
- Hover effects with scale and lift animations
- Category badges with emojis and ring effects
- Better visual hierarchy
- Backdrop blur overlays
- Improved button states

### Aspect Ratios (Studio)

```typescript
const ASPECT_RATIOS = [
  { value: 'wide', label: 'Wide', width: 1600, height: 900, ratio: '16:9' },
  { value: 'post', label: 'Post', width: 1080, height: 1350, ratio: '4:5' },
  { value: 'story', label: 'Story', width: 1080, height: 1920, ratio: '9:16' },
  { value: 'square', label: 'Square', width: 1080, height: 1080, ratio: '1:1' },
];
```

### Zoom Levels (Studio)

```typescript
const ZOOM_LEVELS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2];
```

### Theme System (Studio)

```typescript
interface PosterTheme {
  accent: string;      // Primary color
  background: string;  // Background color
  text: string;        // Text color
}

const DEFAULT_THEMES = {
  purple: { accent: '#a855f7', background: '#050508', text: '#ffffff' },
  blue: { accent: '#3b82f6', background: '#050508', text: '#ffffff' },
  green: { accent: '#22c55e', background: '#050508', text: '#ffffff' },
  // ... more themes
};
```

---

## Data Flow & Architecture

### Component Hierarchy

```
App (providers.tsx)
├── QueryClientProvider (React Query)
├── SettingsProvider (User preferences)
├── MediaProvider (Prefetch context)
├── UIProvider (Weather, theme)
└── ToastProvider (Notifications)
    └── Page Components
        ├── Dashboard
        │   ├── Studio
        │   ├── TasteProfile
        │   ├── GameHub
        │   ├── CommunityHub
        │   └── Recommendations
        └── Landing
```

### Data Flow

1. **User Authentication** (AniList OAuth)
   - Redirect to AniList
   - Receive access token
   - Store in localStorage
   - Fetch user profile

2. **List Fetching** (React Query)
   - Query: `useAnimeList(userId)`
   - Cache: 15 minutes
   - Transform: Normalize to `MediaListEntry[]`

3. **Taste Analysis** (Computed)
   - Input: `MediaListEntry[]`
   - Process: `TasteAnalyzer.analyzeTaste()`
   - Cache: In-memory, 15 minutes
   - Output: `TasteProfile`

4. **Recommendations** (Derived)
   - Input: `TasteProfile`, `watchedIds`, mode
   - Process: `anilistClient.getRecommendations()`
   - Cache: 10 minutes
   - Output: `ScoredMedia[]`

5. **Studio Poster** (Rendered)
   - Input: `TasteProfile`, user settings
   - Process: `buildStudioPosterProfile()`
   - Render: `StudioPoster` component
   - Export: `html-to-image` library

### API Routes

| Route | Purpose | Caching |
|-------|---------|---------|
| `/api/anilist/list` | Fetch user's anime/manga list | React Query |
| `/api/anilist/taste` | Get computed taste profile | React Query |
| `/api/game/submit` | Submit game scores | None |
| `/api/leaderboard` | Fetch leaderboard data | React Query |
| `/api/user/profile` | Get user profile | React Query |
| `/api/feedback` | Submit user feedback | None |

### Database Schema (Supabase)

**game_sessions:**
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY,
  anilist_id INTEGER NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  accuracy DECIMAL,
  time_taken INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**leaderboard:**
```sql
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY,
  anilist_id INTEGER UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar TEXT,
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  avg_accuracy DECIMAL,
  rank INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**multiplayer_sessions:**
```sql
CREATE TABLE multiplayer_sessions (
  id UUID PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  game_type TEXT NOT NULL,
  host_id INTEGER NOT NULL,
  players JSONB DEFAULT '[]',
  status TEXT DEFAULT 'waiting',
  current_round INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Recent Improvements

### Session: January 15, 2026 (Part 2)

#### Comprehensive Accuracy Improvements (Commit: `78dd7ae`)

**1. Engagement Weighting System** (`src/lib/engagement-weights.ts`)
- New formula: `w = baseStatusWeight * scoreSignalWeight * progressWeight`
- Status weights: Completed (1.0), Current (0.7), Dropped (0.25), Planning (0)
- Score signal: `1 + clamp(zScore, -1.25, 1.25) * 0.25`
- Prevents "exposure inflation" from completionists

**2. Fixed Confidence Scores**
- New formula: `confidence = 1 - exp(-count / k)`
- k=8 for genres, k=6 for tags, k=5 for studios
- Stops small sample sizes from looking authoritative
- UI can show 🟢 Strong / 🟡 Tentative / 🔴 Low confidence

**3. Fixed Diversity Index**
- Uses engagement-weighted entropy (not raw count)
- Added dominance penalty: `diversityFinal = entropyNorm * (1 - 0.25 * dominancePenalty)`
- Prevents 100% diversity if one category dominates
- Formula: `dominancePenalty = clamp((pTop1 - 0.15) / 0.35, 0, 1)`

**4. Time-Window + Status Filtering**
- New `analyzeWithOptions()` method
- Supports: 'all', '12months', '90days'
- Status filtering: completed-only, include current, etc.

**5. Data Completeness Flags** (`src/lib/taste-profile-cache.ts`)
- Tracks: entries with scores, tags, studios, dates
- Generates warnings: "50% titles unscored", "30% missing tags"
- `isReliable` flag for minimum quality threshold

**6. Supabase Persistent Caching**
- Table: `taste_profile_cache`
- Cache key: `userId + type + timeWindow + listHash`
- `listHash` = sum of ids + scores + progress + status chars
- Survives refreshes and works across devices

**7. Recommendation Staged Fallback** (`src/lib/recommendation-fallback.ts`)
- 4-stage progressive relaxation per mode
- Debug logging: which stage was used, what was relaxed
- UI-friendly banners: "Showing broader results — strict experimental criteria had limited matches"
- Never returns empty

**8. Thin vs Thick AniList Queries** (`src/lib/anilist-queries.ts`)
- THIN: 15 fields (for analysis) — no covers/banners
- THICK: 50 fields (for display) — full details
- COVERS: 5 fields (for cards) — just images
- IDS: 2 fields (for dedup) — mediaId + status

**SQL Migration Created:**
- `supabase/migrations/20260115_taste_profile_cache.sql`
- Includes indexes, RLS policies, auto-update triggers

### Session: January 15, 2026 (Part 1)

#### Performance Optimizations (Commit: `878eb43`)
- Increased React Query cache times across the board
- Disabled unnecessary refetches (window focus, mount, reconnect)
- Added exponential backoff for retries
- Implemented TasteAnalyzer in-memory cache
- Expected 50-70% reduction in API calls

#### Studio Export Fix (Commits: `d96b16b`, `a06eee1`)
- Fixed posterRef attachment for html-to-image
- Added DOM ready delay (100ms)
- Implemented node filtering to skip problematic elements
- Enhanced error logging and user feedback
- Export now works reliably across all aspect ratios

#### Studio Layout Fix (Commit: `1ead174`)
- Resolved overlapping elements in poster
- Optimized spacing and sizing throughout
- Added text truncation to prevent overflow
- Reduced component sizes for better fit
- Clean layout across all aspect ratios

#### Tab Transitions (Commit: `6bc1487`)
- Added smooth fade-in/out animations
- Implemented transition state management
- Enhanced tab button styling
- Better visual hierarchy

#### Recommendation Card Polish (Commit: `40e7f96`)
- Advanced hover effects with scale and lift
- Enhanced category badges with emojis
- Better visual hierarchy
- Backdrop blur overlays
- Improved button states

#### Studio Features (Commit: `9cedcac`)
- Keyboard shortcuts for common actions
- LocalStorage persistence for settings
- Loading skeleton during poster generation
- Better UX across sessions

---

## Known Limitations

### 1. Sample Size Sensitivity
- Users with <20 entries may see unstable recommendations
- Mitigation: Bayesian shrinkage, but still limited
- **Potential Improvement:** Add minimum entry threshold with helpful messaging

### 2. Cold Start Problem
- New users have no data for taste analysis
- Mitigation: None currently
- **Potential Improvement:** Onboarding quiz to bootstrap preferences

### 3. Sequel Bias
- Sequels often recommended if user liked original
- Mitigation: Relation filtering, but not perfect
- **Potential Improvement:** Better sequel detection and handling

### 4. Tag Quality Variance
- AniList tags vary in quality and specificity
- Some tags are too broad, others too niche
- **Potential Improvement:** Tag weighting by reliability/specificity

### 5. Recency Bias
- Recent entries may be overweighted
- Mitigation: Volume-based weighting helps
- **Potential Improvement:** Time-decay factor for older entries

### 6. Format Mixing
- Anime and manga recommendations don't cross-pollinate
- **Potential Improvement:** Cross-format recommendations for adaptations

### 7. Score Inflation
- Users who rate everything highly get less useful recommendations
- Mitigation: Z-score normalization
- **Potential Improvement:** Detect and warn about score inflation

### 8. Popularity Paradox
- Hidden gems mode may miss quality popular titles
- Experimental mode may recommend poor-quality obscure titles
- **Potential Improvement:** Better quality floors and popularity curves

### 9. Cache Staleness
- 15-minute cache means recent list updates aren't reflected
- **Potential Improvement:** Manual refresh button, shorter TTL for active users

### 10. Export Performance
- Large posters (2x pixel ratio) can be slow to generate
- **Potential Improvement:** Progressive rendering, lower default quality

---

## Areas for Audit & Improvement

### Statistical Methods
1. Are the Bayesian priors (lambda, alpha) optimal?
2. Should we use different shrinkage for different metrics?
3. Is the completionist correction formula accurate?
4. Are the affinity weight distributions (40/35/15/10) optimal?

### Recommendation Algorithm
1. Are the mode-specific scoring formulas balanced?
2. Should we add more recommendation modes?
3. Is the favorites anchoring weight (0-30%) appropriate?
4. How can we better handle sequel/prequel recommendations?

### Performance
1. Can we reduce cache TTL without hurting UX?
2. Should we implement server-side caching (Redis)?
3. Are there opportunities for query batching?
4. Can we lazy-load heavy components more aggressively?

### UX
1. Are the loading states clear enough?
2. Should we add more keyboard shortcuts?
3. Is the Studio poster layout optimal for all aspect ratios?
4. Can we improve the recommendation card information density?

### Data Quality
1. How can we handle missing/incomplete AniList data?
2. Should we validate or clean tag data?
3. Can we detect and handle outliers better?
4. Should we implement user feedback loops to improve recommendations?

### Architecture
1. Should we move taste analysis to server-side?
2. Can we implement incremental updates instead of full recalculation?
3. Should we add a proper database cache layer?
4. Can we optimize the GraphQL queries further?

---

## Testing Recommendations

### Unit Tests Needed
- [ ] TasteAnalyzer statistical methods
- [ ] Recommendation scoring functions
- [ ] Cache key generation and invalidation
- [ ] Affinity calculation edge cases

### Integration Tests Needed
- [ ] Full taste analysis pipeline
- [ ] Recommendation generation across modes
- [ ] Studio poster rendering
- [ ] Export functionality

### Performance Tests Needed
- [ ] Taste analysis with large lists (1000+ entries)
- [ ] Recommendation generation speed
- [ ] Cache hit/miss ratios
- [ ] Memory usage over time

### User Testing Needed
- [ ] Recommendation quality across user types
- [ ] Studio poster usability
- [ ] Overall UX flow
- [ ] Mobile responsiveness

---

## Contact & Contribution

For questions, improvements, or audit feedback, please reference this document when discussing:
- Statistical methodology
- Algorithm improvements
- Performance optimizations
- UX enhancements

**Last Updated:** January 15, 2026  
**Version:** 1.0.0
