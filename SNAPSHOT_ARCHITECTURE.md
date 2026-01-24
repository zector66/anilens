# Snapshot Architecture: Optional Cache Only

## Core Principle
**Snapshots are NEVER required for the app to function. They are write-behind cache only.**

## Current Architecture (Correct)

### ✅ Primary Data Flow (Always Works)
```
User entries → useEnhancedGenome → extractEnhancedGenome → traitStats
                                                          → genome
                                                          → What Shaped Me
```

**This flow:**
- Computes locally every time
- Never depends on snapshot API
- Always returns traitStats if entries exist
- Fast enough for production use

### ✅ Snapshot Flow (Optional Cache)
```
useEnhancedGenome → compute genome locally
                 ↓
            TasteDriftCard → saveSnapshot (write-behind)
                          ↓
                    /api/genome/snapshot (POST)
                          ↓
                    Database (if it works)
                          ↓
                    Silent failure if it doesn't
```

**Snapshot save:**
- Happens in background
- Failures are logged but ignored
- UI never waits for it
- UI never breaks if it fails

### ✅ Snapshot Fetch (History/Timeline Only)
```
TasteDriftCard → useGenomeSnapshots → /api/genome/snapshot (GET)
                                    ↓
                              200 { snapshots } = cache hit
                              204 No Content = cache miss (not error)
                              500 = actual DB failure
```

**Snapshot fetch:**
- Only used for taste drift timeline
- Returns empty array on cache miss (204)
- Timeline gracefully handles no history
- Never blocks core stats

## API Contract

### GET /api/genome/snapshot
```typescript
// Returns cached snapshots if they exist
// NEVER computes, NEVER throws 500 for "not found"

200 { snapshots: [...] }  // Cache hit
204 No Content            // Cache miss (no snapshots exist)
500 { error }             // Actual DB outage only
```

### POST /api/genome/snapshot
```typescript
// Saves snapshot to cache
// Client doesn't care if it fails

200 { success: true }     // Saved successfully
500 { error }             // Save failed (client ignores)
```

## What Snapshots Are Good For

✅ **Taste Evolution Timeline**
- Monthly deltas
- "Your taste has drifted 23% since last year"
- Era detection

✅ **Performance Optimization** (future)
- Skip recompute for huge lists (1000+ entries)
- Pre-computed genome for instant load

✅ **Sharing** (future)
- Permalinked "taste card"
- Stable snapshot URL

## What Snapshots Are NOT For

❌ **Primary data source** - Always compute locally
❌ **Required for traitStats** - traitStats computed from local genome
❌ **Required for "What Shaped Me"** - Uses local trait profile
❌ **Blocking UI** - Never wait for snapshot save/fetch

## Failure Modes

### Snapshot Save Fails
```
✅ UI: Works perfectly
✅ traitStats: Computed locally
✅ What Shaped Me: Works from local genome
❌ Taste Drift: No new snapshot added to timeline
```

### Snapshot Fetch Fails
```
✅ UI: Works perfectly
✅ traitStats: Computed locally
✅ What Shaped Me: Works from local genome
❌ Taste Drift: Shows "No history yet" message
```

### Database Completely Dead
```
✅ UI: Works perfectly
✅ traitStats: Computed locally
✅ What Shaped Me: Works from local genome
❌ Taste Drift: Shows "No history yet" message
❌ Snapshot saves: Fail silently in background
```

## Code Guarantees

### useEnhancedGenome
```typescript
// ALWAYS computes locally
// NEVER depends on snapshot API
// NEVER returns null traitStats if entries exist

const { genome, traitStats } = useEnhancedGenome();
// genome: computed from extractEnhancedGenome(entries)
// traitStats: computed from genome.traitProfile
```

### TasteDriftCard
```typescript
// Snapshot save is write-behind with silent failure
saveSnapshot(data, {
  onError: (error) => {
    console.warn('[SNAPSHOT SAVE FAILED - IGNORED]', error);
  }
});
```

### useGenomeSnapshots
```typescript
// Returns empty array on cache miss (not error)
// Only throws on actual DB failure
// TasteDriftCard handles empty gracefully
```

## Migration Notes

**Before this fix:**
- Snapshot API could return 500
- UI might depend on snapshot for genome
- traitStats could be null due to snapshot failure

**After this fix:**
- Snapshot API returns 204 on cache miss
- UI always computes locally
- traitStats only null if no entries exist
- Snapshot failures are silent and logged

## Testing Checklist

- [ ] Disable snapshot API → UI still works
- [ ] Delete all snapshots → UI still works
- [ ] Snapshot save fails → UI still works
- [ ] Snapshot fetch returns 204 → Drift shows "No history"
- [ ] Snapshot fetch returns 500 → Drift shows error but stats work
- [ ] traitStats never null when entries exist
- [ ] "What Shaped Me" never breaks from snapshot issues
