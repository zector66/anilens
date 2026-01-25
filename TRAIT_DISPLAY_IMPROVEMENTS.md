# Trait Display System Improvements

## Problem Summary
Current trait display shows similar profiles across users because:
1. **Common traits dominate** - Action/Comedy/Drama appear in everyone's top traits
2. **Exposure ≠ Preference** - High exposure to a trait doesn't mean you love it
3. **Normalized scoring** - Everything shows 100% because we normalize within channel
4. **Warning traits mixed with identity** - Sexual Content/Gore hijack "Top Traits"
5. **No distinctiveness scoring** - Rare traits (denpa, noir) don't get credit for being unique

## Implementation Plan

### Tier 1: Immediate Impact (Priority)

#### 1A. Filter Warning Traits from Top Traits Display ✅
**File:** `src/lib/trait-scoring-engine.ts`
- Add filter in `computeTraitProfile` to separate `role: 'warning'` traits
- Create separate `warningTraits` array in `TraitProfile` type
- Update UI to show warnings in dedicated "Content Profile" section

**File:** `src/components/taste/trait-insights-card.tsx`
- Add new "Content Profile" card for warning traits only
- Filter warning traits from main "Trait DNA" display
- Show Sexual Content, Gore, Torture separately with context

#### 1B. Add Exposure vs Preference Scoring Split ✅
**File:** `src/lib/trait-scoring-engine.ts`
- Compute `exposureScore` (current logic - how often trait appears)
- Compute `enjoymentScore` (rating correlation - do you rate it higher?)
- Calculate `affinityDelta = enjoymentScore - exposureScore`
- Add to `TraitScore` interface (already exists!)

**Algorithm:**
```typescript
// For each trait:
exposureScore = normalizedScore; // Current logic

// Compute enjoyment:
const mediaWithTrait = entries.filter(hasThisTrait);
const avgRatingWithTrait = mean(mediaWithTrait.map(e => e.score));
const avgRatingOverall = mean(entries.map(e => e.score));
const ratingLift = avgRatingWithTrait - avgRatingOverall;

enjoymentScore = clamp(50 + ratingLift * 10, 0, 100);
affinityDelta = enjoymentScore - exposureScore;
```

**Insights:**
- `delta > +20`: "You LOVE this trait" (hidden gem)
- `delta > +10`: "Strong preference"
- `delta -10 to +10`: "Neutral"
- `delta < -10`: "You tolerate this" (guilty pleasure)

#### 1C. Implement Signature Trait Scoring (IDF Weighting) ✅
**File:** `src/lib/trait-distinctiveness.ts` (NEW)
- Compute global trait frequency across all users (mock for now)
- Calculate IDF: `idf = log((N + 1) / (df + 1))`
- Compute signature score: `signatureScore = normalizedScore * idf`
- Add `signatureScore` and `rarity` to `TraitScore`

**Mock Global Frequencies (until we have real data):**
```typescript
const MOCK_TRAIT_FREQUENCIES = {
  'action': 0.85,      // 85% of users have this
  'comedy': 0.80,
  'drama': 0.75,
  'romance': 0.70,
  'psychological': 0.45,
  'horror': 0.35,
  'denpa': 0.02,       // Very rare
  'noir': 0.05,
  // ... etc
};
```

#### 1D. Add Explainability Drawer ✅
**File:** `src/components/taste/trait-explainability-drawer.tsx` (NEW)
- Show top 3 contributing anime titles
- Show contributing tags with ranks
- Add pattern label: "Spike-driven" vs "Background-high"
- Calculate Gini coefficient for contribution distribution

**Pattern Detection:**
```typescript
// If top 2 shows contribute >60% → "Spike-driven"
// If contributions are evenly distributed → "Background-high"
const gini = calculateGiniCoefficient(contributions);
const pattern = gini > 0.6 ? 'spike-driven' : 'background-high';
```

### Tier 2: Enhanced Intelligence

#### 2A. Preference Lift Metric
- Show rating correlation per trait
- Display as: "Romance: 67 exposure / +1.4 rating lift"
- Add insight labels automatically

#### 2B. Pattern Labels for Warnings
- "2 shows cause 80% of Sexual Content score"
- "Gore evenly distributed across 15 shows"

#### 2C. UI Reorganization
Split trait display into 4 sections:
1. **Core Identity** (role: core) - Action, Romance, Psychological
2. **Vibe Profile** (role: modifier) - Dark, Cozy, Hype
3. **Structure** (channel: structure) - Episodic, Serialized
4. **Content Profile** (role: warning) - Sexual Content, Gore

### Tier 3: Elite Features

#### 3A. Population Percentiles
- Compute percentile rank across all users
- Display: "Romance: 67 strength / Top 12% of users"
- Requires backend aggregation

#### 3B. Absolute Scoring Display
- Option to show raw scores (0-100 absolute)
- Option to show percentiles
- Option to show both

## Data Structures

### Enhanced TraitScore
```typescript
export interface TraitScore {
  // Existing
  traitId: string;
  name: string;
  normalizedScore: number;
  
  // NEW: Exposure vs Preference
  exposureScore: number;      // 0-100, how often encountered
  enjoymentScore: number;     // 0-100, rating correlation
  affinityDelta: number;      // enjoyment - exposure
  affinityInsight: 'loves' | 'tolerates' | 'neutral' | 'hidden_gem';
  
  // NEW: Distinctiveness
  signatureScore: number;     // normalizedScore * IDF
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare';
  globalFrequency: number;    // % of users with this trait
  
  // NEW: Explainability
  topContributors: TraitContributor[];
  contributionPattern: 'spike-driven' | 'background-high';
  contributionGini: number;   // 0-1, inequality measure
}
```

## Implementation Order

1. **Phase 1** (1-2 hours)
   - Create trait distinctiveness module
   - Add IDF scoring and signature scores
   - Filter warning traits from display

2. **Phase 2** (2-3 hours)
   - Implement exposure vs preference split
   - Add rating correlation analysis
   - Generate affinity insights

3. **Phase 3** (2-3 hours)
   - Build explainability drawer component
   - Add pattern detection (spike vs background)
   - Wire up "Why?" buttons

4. **Phase 4** (1-2 hours)
   - Reorganize UI into 4 sections
   - Add signature traits section
   - Polish and test

## Testing Checklist

- [ ] Warning traits don't appear in "Top Traits"
- [ ] Romance lover shows high enjoymentScore even if exposure is medium
- [ ] Rare traits (denpa, noir) get boosted signature scores
- [ ] Common traits (action, comedy) get reduced signature scores
- [ ] "Why?" drawer shows correct contributing anime
- [ ] Pattern labels correctly identify spike-driven vs background
- [ ] Users with different tastes now look visibly different
- [ ] No more "everyone has 100% Action/Comedy/Drama"

## Success Metrics

**Before:**
- Top 10 traits look 70% similar across users
- Warning traits dominate display
- "I love romance" but shows 67% with no context

**After:**
- Top 10 traits look <30% similar across users
- Warning traits in separate section with explanations
- "Romance: 67% exposure / +1.4 rating lift / You LOVE this"
- Signature traits highlight what makes you unique
- Every trait has explainability on click

## Notes

- Mock global frequencies until we have real user data
- Can compute real frequencies from Supabase later
- IDF formula is standard: `log((N + 1) / (df + 1))`
- Rating lift formula: `mean(rating | trait) - mean(rating | all)`
- Gini coefficient for contribution inequality
