# Taste System Migration Guide

## The Problem
We had multiple "taste engines" producing similar outputs:
- Trait scoring engine
- Derived indices
- Legacy analyzer
- Ultimate accuracy v2
- Snapshots

This caused confusion and made the UI complex.

## The Solution
**ONE canonical pipeline, ONE output schema**

```
computeTaste() → TasteResult → UI Components
```

## Quick Migration Steps

### 1. Replace your hook usage

**Before:**
```tsx
const { genome, traitStats, tasteProfile, fallback } = useGenomeData();
```

**After:**
```tsx
const { taste, loading, error, topTraits, shapedBy, contradictions } = useTaste({ userId });
```

### 2. Update component props

**Before:**
```tsx
<UltimateTraitDisplay 
  traitProfile={traitProfile}
  genome={genome}
  traitStats={traitStats}
/>
```

**After:**
```tsx
<UnifiedTraitDisplay userId={userId} mediaType="ANIME" />
```

### 3. Accessing data the new way

**Top Traits (Preference):**
```tsx
// Old
traitStats?.traits.filter(t => t.preferenceScore > 0)

// New
taste.views.preference.topTraits
// or just use the convenience prop:
topTraits
```

**What Shaped Me:**
```tsx
// Old
genome?.shapedBy.topShapers

// New
taste.shapedBy.topShapers
// or convenience:
shapedBy
```

**Contradictions:**
```tsx
// Old
genome?.contradictions

// New
taste.derived.contradictions
// or convenience:
contradictions
```

**Legacy Personality Traits (temporary):**
```tsx
// Old
tasteProfile.personalityTraits

// New
taste.legacy?.personalityTraits
// or convenience:
personality
```

## View Types

Choose the right view for your component:

### Preference View (Most Common)
"What you actually like relative to your baseline"
```tsx
taste.views.preference.topTraits
```

### Exposure View
"What you consume a lot"
```tsx
taste.views.exposure.topTraits
```

### Signature View
"What uniquely defines you vs population"
```tsx
taste.views.signature.topTraits
```

## File Structure Changes

### Old Structure
```
/src/lib/
├── impact-scoring.ts
├── trait-scoring-engine.ts
├── taste-analyzer.ts
├── taste-analyzer-legacy.ts
└── ultimate-accuracy-v2.ts
```

### New Structure
```
/src/lib/taste/
├── compute/
│   ├── computeTaste.ts       # The ONE pipeline
│   ├── computeTraits.ts
│   ├── computeDerived.ts
│   └── computeViews.ts
├── types/
│   └── TasteResult.ts        # The ONE schema
├── adapters/
│   └── legacyAdapter.ts      # Backward compatibility
└── cache/
    └── snapshotStore.ts      # Storage only
```

## Migration Checklist

- [ ] Replace `useGenomeData()` with `useTaste()`
- [ ] Update component to use `TasteResult` structure
- [ ] Choose correct view (preference/exposure/signature)
- [ ] Remove direct imports of old systems
- [ ] Test with the new unified display component
- [ ] Remove legacy adapter usage when ready

## Benefits

1. **Single source of truth** - No more confusion about which system to use
2. **Explicit views** - Clear separation between exposure, preference, and signature
3. **Simpler UI** - Components just read from `TasteResult`
4. **Better caching** - Snapshots are separate from computation
5. **Easier testing** - One pipeline to test instead of multiple engines

## Example: Full Component Migration

**Before:**
```tsx
function TasteProfile({ userId }) {
  const { genome, traitStats, tasteProfile } = useGenomeData(userId);
  
  return (
    <div>
      <h2>Top Traits</h2>
      {traitStats?.traits.map(t => (
        <div key={t.name}>{t.name}: {t.preferenceScore}</div>
      ))}
      
      <h2>What Shaped Me</h2>
      {genome?.shapedBy.topShapers.map(s => (
        <div key={s.mediaId}>{s.mediaTitle}</div>
      ))}
    </div>
  );
}
```

**After:**
```tsx
function TasteProfile({ userId }) {
  const { taste, loading, error, topTraits, shapedBy } = useTaste({ userId });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Top Traits</h2>
      {topTraits.map(t => (
        <div key={t.trait}>{t.trait}: {t.score}</div>
      ))}
      
      <h2>What Shaped Me</h2>
      {shapedBy.map(s => (
        <div key={s.mediaId}>{s.mediaTitle}</div>
      ))}
    </div>
  );
}
```

## Timeline

1. **Phase 1**: Create new system (✅ Done)
2. **Phase 2**: Migrate critical components
3. **Phase 3**: Remove old systems
4. **Phase 4**: Clean up legacy adapter

## Need Help?

Check the `UnifiedTraitDisplay` component for a complete example of the new pattern.
