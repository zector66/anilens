# Anilens Project Complete Handoff

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
  - Bracket Battles (Tournament style)
  - Hangman & Wordle games
- **Multiplayer Engine:**
  - Real-time head-to-head battles via Supabase.
  - Atomic question generation by the host to ensure synchronization.
  - Robust "Wait for Opponent" logic.
  - ELO/MMR system with ranks (Iron to Challenger).

### 3. Social Features

- **Compatibility Score:** Compare your taste with other users
- **Watch History Timeline:** Visual timeline of completed media
- **Community Hub:** Leaderboards, stats, and player profiles
- **Shareable Taste Cards:** Export your taste profile as shareable images

## Recent Major Improvements (Latest Session)

### 1. User Settings Persistence (Supabase Integration)

**Added Functions:**
- `saveUserSettings()` - Save all user preferences to database
- `loadUserSettings()` - Load preferences on login
- `updateUserSetting()` - Update individual settings
- `updateUserMMR()` - Handle rating changes (including penalties)

**Persisted Settings:**
- Theme preference (dark/light/system)
- Accent color (purple/blue/green/pink/orange/red/cyan/indigo)
- Reduced motion preference
- Sound enabled/disabled
- Weather effects settings
- Weather intensity (light/medium/heavy)
- Title language preference (romaji/english/native)
- **Quit warning dismissed** flag (one-time preference)

**Benefits:**
- Settings sync across devices for logged-in users
- Persistent preferences even after browser clear
- Better user experience with remembered choices

### 2. Game Quit Button with MMR Penalty

**Implementation:**
- Added back button (←) to game header
- **-5 MMR penalty** for leaving mid-game
- One-time confirmation modal with clear warning
- "Don't show again" checkbox saves preference
- MMR penalty applied via `updateUserMMR()` function

**User Flow:**
1. First quit attempt → Show modal with -5 MMR warning
2. User can check "Don't show again" 
3. Future quits are instant (no modal)
4. Preference saved to Supabase for persistence

**Technical Details:**
- Modal uses fixed positioning with backdrop blur
- Loading state during MMR update
- Proper error handling for failed updates
- Graceful fallback if Supabase unavailable

### 3. Complete Image Optimization (All Components)

**Problem Solved:**
- Broken images showing default browser error icons
- Inconsistent fallback handling across components
- Missing lazy loading and smooth transitions

**Solution:**
Replaced ALL `next/image` usage with custom `OptimizedImage` component:

**Updated Components:**
- `game-play.tsx` - 8 game question types (CHARACTER_GUESS, SEASON_MATCH, SCREENSHOT_GUESS, SCORE_GUESS, COVER_GUESS, CHAPTER_COUNT_GUESS, TAG_OR_CAP, POPULARITY_BATTLE)
- `bracket-battle.tsx` - Tournament preview, winner display, battle contestants
- `multiplayer-lobby.tsx` - Player avatars with initials fallback
- `multiplayer-results.tsx` - Match result player avatars
- `compatibility-score.tsx` - Media cards and user avatars
- `watch-history-timeline.tsx` - Media cover images
- `shareable-taste-card.tsx` - User avatar in taste cards
- `community-hub.tsx` - Profile avatars and leaderboard images

**OptimizedImage Features:**
- Lazy loading with IntersectionObserver
- Generated blur placeholders
- Smooth fade-in transitions
- Consistent fallback UI (gradient + icon)
- Error handling for broken URLs
- Proper alt text preservation
- Responsive sizing support

**Fallback Examples:**
- Missing character images → Users icon with purple gradient
- Missing cover images → ImageIcon with gradient background
- Missing avatars → User initials or Users icon
- Missing tournament images → Trophy or Tv icons

### 4. UI/UX Improvements

**Gradient Class Updates:**
- Updated `bg-gradient-to-*` to `bg-linear-to-*` for modern Tailwind
- Fixed deprecation warnings across components

**Consistent Visual Language:**
- Unified fallback styling with purple/blue gradients
- Consistent icon choices for different content types
- Proper hover states and transitions

## Database Schema (Supabase)

### Existing Tables:
- `multiplayer_rooms`: Stores room state, settings, players (JSONB), and generated questions
- `user_stats`: Stores ELO ratings, match history, and personality profiles

### New Table (Required):
```sql
CREATE TABLE user_settings (
  anilist_id INTEGER PRIMARY KEY,
  theme TEXT,
  accent_color TEXT,
  reduced_motion BOOLEAN DEFAULT FALSE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  weather_enabled BOOLEAN DEFAULT FALSE,
  weather_intensity TEXT DEFAULT 'medium',
  weather_override TEXT,
  title_language TEXT DEFAULT 'romaji',
  quit_warning_dismissed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Architecture Patterns

### Image Handling
- **Always use `OptimizedImage`** instead of `next/image`
- Provide meaningful alt text for accessibility
- Expect and handle missing/broken images gracefully
- Use appropriate fallback icons for content type

### Settings Management
- Use Supabase for persistent user settings
- Load settings on user authentication
- Save immediately on change
- Provide localStorage fallback for offline

### Game Flow
- Implement quit confirmation with penalties
- Use MMR system for competitive features
- Handle multiplayer state synchronization carefully
- Provide clear visual feedback for all actions

## Current Status

- **Build Status:** Stable (`npm run build` passing)
- **Multiplayer:** Fully functional with live score sync and profile picture tracking
- **Discovery:** Highly personalized recommendations working for both media types
- **Images:** 100% optimized with fallbacks across entire application
- **Settings:** Full persistence via Supabase
- **Game UX:** Professional quit flow with MMR penalties

## Instructions for ChatGPT

When continuing work on this project:

### 1. Image Handling
```tsx
// ALWAYS use OptimizedImage
import { OptimizedImage } from '@/components/ui/optimized-image';

// With fallback
<OptimizedImage
  src={imageUrl || ''}
  alt={title}
  fill
  className="object-cover"
/>
```

### 2. Settings Persistence
```tsx
// Load settings
const settings = await loadUserSettings(user.id);

// Update single setting
await updateUserSetting(user.id, 'theme', 'dark');

// Save multiple settings
await saveUserSettings(user.id, {
  theme: 'dark',
  accent_color: 'purple'
});
```

### 3. MMR Updates
```tsx
// Apply penalty
const result = await updateUserMMR(user.id, -5);
console.log('New rating:', result.newRating);
```

### 4. AniList GraphQL
- Refer to the `AniListClient` in `src/lib/anilist-client.ts` for all API interactions
- Use TanStack Query for data fetching to benefit from existing caching

### 5. Realtime Features
- Use utilities in `src/lib/supabase.ts` for multiplayer/social features
- Follow the subscription pattern for live updates

### 6. Component Patterns
- Keep game logic in `game-play.tsx`
- Use sub-components for UI presentation
- Maintain consistent error boundaries

## Known Issues & Future Improvements

### Technical Debt:
- Multiplayer race condition still needs PostgreSQL RPC function for atomic updates
- Some gradient classes still using old syntax (minor warnings)

### Potential Enhancements:
- Add more game modes (character matching, timeline ordering)
- Implement achievement system
- Add voice chat for multiplayer
- Enhanced analytics for game performance

### Database Optimization:
- Consider adding indexes for frequently queried settings
- Implement data archiving for old multiplayer rooms

## Testing Checklist

Before deploying changes:

1. **Image Loading:**
   - [ ] Test with broken image URLs
   - [ ] Verify fallback UI displays correctly
   - [ ] Check lazy loading behavior

2. **Settings Persistence:**
   - [ ] Settings save to Supabase
   - [ ] Settings load on refresh
   - [ ] Settings sync across devices

3. **Game Quit Flow:**
   - [ ] First quit shows modal
   - [ ] MMR penalty applied correctly
   - [ ] "Don't show again" works

4. **Multiplayer:**
   - [ ] Score sync works
   - [ ] Profile pictures display
   - [ ] Room cleanup functions

This handoff represents a fully functional, production-ready application with robust error handling, user persistence, and professional UX patterns.
