# Unified Taste System

## Overview

The Unified Taste System solves the confusion of having multiple "taste engines" by providing **ONE canonical pipeline** that produces **ONE output schema**.

```
computeTaste() → TasteResult → UI Components
```

## Quick Start

```tsx
import { useTaste } from '@/lib/taste';

function MyComponent() {
  const { taste, loading, error, topTraits, shapedBy } = useTaste({ 
    userId: 123,
    mediaType: 'ANIME' 
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Top Traits</h2>
      {topTraits.map(trait => (
        <div key={trait.trait}>{trait.trait}: {trait.score}</div>
      ))}
    </div>
  );
}
```

## Core Concepts

### 1. TasteResult - The Single Source of Truth

```typescript
interface TasteResult {
  meta: { userId; mediaType; computedAt; version; sampleSize; warnings };
  traits: TraitProfile;              // 4 channels (core, modifier, warning, intensity)
  derived: DerivedIndices;           // contradictions, indices, types
  shapedBy: ShapedByResult;          // what shaped me analysis
  views: {
    exposure: TraitView;             // What you consume a lot
    preference: TraitView;           // What you actually like
    signature: TraitView;            // What makes you unique
  };
  legacy?: LegacyAdapterOutput;      // Backward compatibility
}
```

### 2. Views - Explicit Data Perspectives

Choose the right view for your use case:

- **Preference View**: "What you actually like relative to your baseline"
- **Exposure View**: "What you consume a lot"
- **Signature View**: "What uniquely defines you vs population"

### 3. The Pipeline - computeTaste()

Everything flows through one function:

```typescript
const taste = await computeTaste(entries, 'ANIME', userId, {
  includeViews: true,
  includeLegacy: false,
  debugMode: false
});
```

## Architecture

```
/src/lib/taste/
├── index.ts                 # Main exports
├── compute/
│   └── computeTaste.ts      # The ONE pipeline
├── types/
│   └── TasteResult.ts       # The ONE schema
├── adapters/
│   └── legacyAdapter.ts     # Backward compatibility
└── cache/
    └── snapshotStore.ts     # Storage only
```

## Migration

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration steps.

### Quick Migration Checklist

1. Replace `useGenomeData()` with `useTaste()`
2. Update components to read from `TasteResult`
3. Choose the appropriate view (preference/exposure/signature)
4. Remove direct imports of old systems
5. Test with `UnifiedTraitDisplay`

## Examples

### Basic Usage

```tsx
// Get taste data
const { taste } = useTaste({ userId: 123 });

// Access preference traits
taste.views.preference.topTraits

// Access what shaped you
taste.shapedBy.topShapers

// Access contradictions
taste.derived.contradictions
```

### With Convenience Props

```tsx
const { topTraits, shapedBy, contradictions, personality } = useTaste({ 
  userId: 123,
  includeLegacy: true 
});

// Direct access to common data
topTraits          // preference traits
shapedBy           // top shapers
contradictions     // contradictions
personality        // legacy traits (if needed)
```

### Custom View

```tsx
const { taste } = useTaste({ userId: 123 });

// Show signature traits for uniqueness analysis
taste.views.signature.topTraits.map(trait => (
  <div key={trait.trait}>
    {trait.trait} - {Math.round((1 - trait.rarity) * 100)}% unique
  </div>
));
```

## Best Practices

1. **Always use `useTaste()`** - Don't call computeTaste directly in components
2. **Choose views intentionally** - Don't mix exposure/preference randomly
3. **Use convenience props** - They simplify common patterns
4. **Handle loading/error states** - The hook provides these
5. **Phase out legacy** - Use `legacy` adapter only during migration

## Debugging

Enable debug mode:

```tsx
const { taste } = useTaste({ 
  userId: 123,
  debugMode: true  // Logs computation details
});
```

Check warnings:

```tsx
const { taste } = useTaste({ userId: 123 });

if (taste.meta.warnings.length > 0) {
  console.log('Analysis warnings:', taste.meta.warnings);
}
```

## FAQ

**Q: Where did the old systems go?**
A: They're now steps inside the computeTaste() pipeline. You don't need to import them directly.

**Q: How do I get the old personality traits?**
A: Use `taste.legacy?.personalityTraits` during migration, then update to use the new system.

**Q: What's the difference between exposure and preference?**
A: Exposure = what you watch a lot, Preference = what you actually like (scored higher than your baseline).

**Q: How is signature different from preference?**
A: Signature = what makes you unique compared to everyone else (rarity-based).

## Contributing

When adding new taste features:

1. Add them to the `computeTaste()` pipeline
2. Include them in `TasteResult` type
3. Update the views if relevant
4. Document the new feature

Remember: ONE pipeline, ONE output schema!
