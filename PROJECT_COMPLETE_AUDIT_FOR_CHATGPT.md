# AniLens Project Complete Audit - For ChatGPT Analysis

**Generated**: 2026-01-26  
**Purpose**: Complete project overview for external AI audit and analysis

---

## 📋 PROJECT OVERVIEW

**AniLens** is a sophisticated anime/manga taste analysis platform that uses advanced trait-based scoring to provide users with deep insights into their viewing preferences and personality.

### Core Features
- **Taste Genome Analysis**: 100+ trait taxonomy across 12 categories
- **Ultimate Accuracy System V2**: Advanced scoring with mechanical bias fixes
- **Multiplayer Games**: Taste-based competitive games
- **Recommendations**: AI-powered content suggestions
- **Social Features**: Profile sharing, comparisons, leaderboards

---

## 🏗️ ARCHITECTURE

### Technology Stack
- **Frontend**: Next.js 16.1.1, React 19.2.3, TypeScript
- **Styling**: TailwindCSS 4, Lucide icons
- **State**: React Query, React hooks
- **Backend**: Next.js API routes, Supabase (PostgreSQL)
- **External**: AniList GraphQL API

### Key Directories
```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API endpoints
│   ├── admin/              # Admin panels
│   └── [username]/         # User profile pages
├── components/
│   ├── taste/              # Trait display components
│   ├── ui/                 # Reusable UI components
│   └── games/              # Game components
├── lib/
│   ├── trait-*.ts          # Trait scoring system
│   ├── taste-*.ts          # Taste analysis
│   ├── ultimate-accuracy*.ts # Accuracy engine
│   └── engagement-weights.ts # Weight calculations
├── hooks/                  # React hooks
└── workers/                # Web Workers
```

---

## 🔬 CORE SYSTEMS

### 1. Trait Universe (`src/lib/trait-universe.ts`)
**100+ traits across 12 categories:**
- Genre DNA (identity channel)
- Tone/Vibe (vibe channel) 
- Emotional Output (vibe channel)
- Plot Engine (structure channel)
- Narrative Complexity (structure channel)
- Setting (structure channel)
- Cast Composition (structure channel)
- Combat/Power (structure channel)
- Romance Configuration (structure channel)
- Comedy Types (intensity channel)
- Content Intensity (intensity channel)
- Production/Format (intensity channel)

### 2. Trait Scoring Engine (`src/lib/trait-scoring-engine.ts`)
**Advanced scoring with:**
- Per-trait diminishing returns
- 4-channel normalization (identity, vibe, structure, intensity)
- Explainability tracking
- Exposure vs enjoyment split
- Confidence metrics

### 3. Ultimate Accuracy V2 (`src/lib/ultimate-accuracy-v2.ts`)
**Fixes "Gintama everywhere" problem:**
- Per-title spread normalization
- Centered preference weighting (z-score sigmoid)
- Conservative episode weighting
- Core vs modifier classification
- Enhanced debug tracing
- Exposure vs preference split

### 4. Taste Genome (`src/lib/taste-genome.ts`)
**User taste fingerprinting:**
- Fixed-length vector representation
- Trait Universe integration
- Derived indices (Darkness, Cozy, Mindfuck)
- Taste type detection
- Stress diet analysis
- Comfort loop detection

---

## 🎯 KEY ALGORITHMS

### Trait Score Calculation
```typescript
// Base contribution with diminishing returns
const diminishing = 1 / (1 + acc.diminishRate * acc.hitCount);
const contribution = weight * diminishing * rankModifier * definingBoost * engagementWeight;

// V2 fixes applied
const spreadPenalty = 1 / sqrt(traitsTriggeredByTitle);
const preferenceWeight = sigmoid(zScore);
const episodeWeight = clamp(log2(1 + episodes/12), 0.8, 1.5);
```

### Confidence Scoring
```typescript
// Geometric mean of multiple factors
const factors = [
  Math.min(1, sampleSize / 50),      // Sample size
  ratingSignalStrength,              // Rating variance
  coverageCompleteness,              // Tag mapping coverage
  diversity                          // Trait diversity
];
const overall = Math.pow(factors.reduce(product), 1 / factors.length);
```

### Distinctiveness (TF-IDF)
```typescript
// Boost rare traits that define user
const idf = log(totalUsers / usersWithTrait);
const tf = traitScore / totalTraitScore;
const signatureScore = tf * idf;
```

---

## 📊 ACCURACY SYSTEMS

### Problem Solved: "Gintama Everywhere"
**Issue**: Tag-dense, long-running shows dominated traits despite moderate ratings.

**Root Causes**:
1. Linear score scaling (7/10 = 70% strength)
2. Tag density advantage (more tags = more contributions)
3. Episode count domination (long series = more weight)
4. No user baseline consideration
5. Mechanical vs preference confusion

**V2 Fixes Applied**:
1. **Spread Normalization**: `1 / sqrt(traitsTriggered)` penalty
2. **Centered Preference**: Z-score sigmoid mapping
3. **Episode Caps**: Hard limits on long series influence
4. **Core vs Modifier**: Structural tags get 60% weight
5. **Debug Tracing**: Full contribution breakdown

---

## 🔧 API ENDPOINTS

### Core APIs
- `POST /api/ultimate-accuracy` - Main accuracy engine (V2)
- `POST /api/ultimate-accuracy-v2` - Direct V2 access
- `GET /api/anilist/list` - AniList list fetching
- `POST /api/anilist/taste` - Taste profile computation
- `POST /api/game/submit` - Game score submission

### Admin APIs
- `GET /api/admin/accuracy-validation` - Accuracy testing panel
- `POST /api/admin/*` - Various admin tools

---

## 🎨 UI COMPONENTS

### Trait Display
- `UltimateTraitDisplay` - Main trait visualization
- `UltimateTraitExplainabilityDrawer` - Detailed trait explanations
- `EnhancedTraitDisplay` - Advanced trait cards
- `TraitStack` - Compact trait visualization

### Core Features
- Taste profile pages (`/u/[username]`)
- Multiplayer games
- Recommendation system
- Admin validation panel

---

## 🧪 TESTING & VALIDATION

### Test Scripts
- `test-ultimate-accuracy-v2.js` - V2 accuracy validation
- Validation panel at `/admin/accuracy-validation`

### Test Cases Covered
- Basic accuracy computation
- TF-IDF distinctiveness
- Population percentiles
- Exposure vs preference split
- Confidence scoring
- Data quality assessment

---

## 📈 PERFORMANCE CONSIDERATIONS

### Optimizations
- Precompiled tag→trait lookup maps
- Per-trait diminishing returns cache
- React Query for API caching
- Web Workers for heavy computation

### Potential Bottlenecks
- Large media list processing
- Trait scoring computation
- Real-time multiplayer updates

---

## 🔒 SECURITY & RELIABILITY

### Current State
- OAuth token in localStorage (XSS-sensitive)
- Basic rate limiting needed
- Supabase polling for multiplayer
- Some admin endpoints need protection

### Recommendations
- Server-side OAuth + HttpOnly cookies
- Rate limiting on AniList calls
- Atomic multiplayer updates (Postgres RPC)
- Protect admin endpoints

---

## 🚀 DEPLOYMENT

### Current Setup
- Vercel deployment
- Environment variables for secrets
- Git-triggered deployments

### Build Process
```bash
npm run build    # Next.js build
npm run start    # Production server
npm run dev      # Development server
```

---

## 📝 KEY FILES FOR AUDIT

### Core Logic Files
1. `src/lib/ultimate-accuracy-v2.ts` - Main accuracy engine
2. `src/lib/trait-scoring-engine.ts` - Trait computation
3. `src/lib/engagement-weights.ts` - Weight calculations
4. `src/lib/taste-genome.ts` - Taste fingerprinting
5. `src/lib/trait-universe.ts` - Trait definitions

### API Files
1. `src/app/api/ultimate-accuracy/route.ts` - Main API
2. `src/app/api/ultimate-accuracy-v2/route.ts` - V2 API

### UI Files
1. `src/components/taste/ultimate-trait-display.tsx`
2. `src/components/taste/ultimate-trait-explainability-drawer.tsx`

### Test Files
1. `test-ultimate-accuracy-v2.js`
2. `src/app/admin/accuracy-validation/page.tsx`

---

## 🎯 AUDIT FOCUS AREAS

### Accuracy & Bias
- Are the V2 fixes working correctly?
- Is there any remaining mechanical bias?
- Are confidence scores realistic?

### Performance
- How does it scale with large media lists?
- Are there any blocking computations?
- Is caching effective?

### User Experience
- Do trait explanations make sense?
- Is the accuracy system trustworthy?
- Are recommendations relevant?

### Code Quality
- Are there any race conditions?
- Is error handling comprehensive?
- Are there any security vulnerabilities?

---

## 📊 SAMPLE DATA

### Typical User Profile
```typescript
{
  exposureProfile: {
    topTraits: [
      { name: "Psychological", normalizedScore: 95, confidence: 0.8 },
      { name: "Dark Fantasy", normalizedScore: 88, confidence: 0.7 }
    ]
  },
  preferenceProfile: {
    topTraits: [
      { name: "Mindfuck", normalizedScore: 92, confidence: 0.8 }
    ]
  },
  confidence: {
    overall: 0.75,
    sampleSize: 127,
    ratingSignalStrength: 0.8
  }
}
```

---

## 🔍 KNOWN ISSUES

### Resolved
- ✅ "Gintama everywhere" problem (V2 fixes)
- ✅ Type compatibility issues
- ✅ API endpoint routing

### Potential Areas for Review
- Multiplayer race conditions
- Auth consistency across components
- Heavy client-side computation
- Error handling edge cases

---

## 📋 AUDIT CHECKLIST

### Mathematical Accuracy
- [ ] Trait scoring formulas are sound
- [ ] Diminishing returns work correctly
- [ ] Confidence scores are realistic
- [ ] Population percentiles are accurate

### System Performance
- [ ] Scales to large media lists (500+ entries)
- [ ] API response times are acceptable
- [ ] Memory usage is reasonable
- [ ] No memory leaks

### User Experience
- [ ] Trait explanations are clear
- [ ] Results feel accurate to users
- [ ] Loading states are handled well
- [ ] Error states are graceful

### Code Quality
- [ ] No race conditions
- [ ] Proper error boundaries
- [ ] Security best practices
- [ ] Maintainable architecture

---

**This complete overview should provide ChatGPT with all necessary context for a comprehensive audit of the AniLens project's accuracy, performance, and overall system quality.**
