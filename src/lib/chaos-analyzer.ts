import { MediaListEntry } from '@/types/anilist';

// ============================================
// CHAOS LEVEL ANALYZER
// ============================================
// Chaos Level = how unpredictable / whiplash-y / unconventional your consumption is
// It's about variance + contrast, not just "weirdness"
//
// Components:
// 1. Tag Weirdness (rarity-weighted) - 35%
// 2. Whiplash/Contrast (polarity variance) - 30%
// 3. Obscurity + Risk (niche behavior) - 20%
// 4. Rating Volatility (score chaos) - 15%
// + Optional chaos tag boost

// ============================================
// TYPES
// ============================================

export interface ChaosProfile {
  chaosLevel: number; // 0-100
  chaosLabel: string;
  chaosArchetype: string;
  
  // Component scores (0-1)
  tagWeirdness: number;
  whiplash: number;
  risk: number;
  ratingChaos: number;
  chaosTagBoost: number;
  
  // Drivers for "why" explanation
  drivers: ChaosDriver[];
  
  // Detailed breakdowns
  breakdown: {
    rareTagDensity: number;
    polarityVariance: number;
    obscurityScore: number;
    formatEntropy: number;
    extremeRatingPercent: number;
    chaosTagHits: string[];
  };
}

export interface ChaosDriver {
  label: string;
  description: string;
  contribution: number; // How much this added to chaos
}

// ============================================
// TAG POLARITY AXES
// ============================================
// Each tag gets a position on these opposing axes
// Values range from -1 to +1

interface PolarityVector {
  wholesome_bleak: number;      // +1 = wholesome, -1 = bleak
  grounded_escapist: number;    // +1 = grounded, -1 = escapist
  calm_intense: number;         // +1 = calm, -1 = intense
  cute_disturbing: number;      // +1 = cute, -1 = disturbing
  comedic_tragic: number;       // +1 = comedic, -1 = tragic
  romance_violence: number;     // +1 = romance, -1 = violence
}

// Tag polarity mappings (curated subset)
const TAG_POLARITY: Record<string, Partial<PolarityVector>> = {
  // Wholesome / Light
  'Slice of Life': { wholesome_bleak: 0.7, calm_intense: 0.6, cute_disturbing: 0.5 },
  'Iyashikei': { wholesome_bleak: 1.0, calm_intense: 1.0, cute_disturbing: 0.8 },
  'CGDCT': { wholesome_bleak: 0.9, cute_disturbing: 1.0, comedic_tragic: 0.7 },
  'Comedy': { wholesome_bleak: 0.5, comedic_tragic: 0.9, calm_intense: 0.3 },
  'Romance': { romance_violence: 1.0, wholesome_bleak: 0.4 },
  'School': { grounded_escapist: 0.6, wholesome_bleak: 0.3 },
  'Coming of Age': { grounded_escapist: 0.7, wholesome_bleak: 0.2 },
  'Family Life': { wholesome_bleak: 0.6, grounded_escapist: 0.7 },
  'Pets': { cute_disturbing: 0.8, wholesome_bleak: 0.7 },
  'Chibi': { cute_disturbing: 0.9, comedic_tragic: 0.6 },
  
  // Dark / Heavy
  'Gore': { cute_disturbing: -1.0, calm_intense: -0.9, romance_violence: -1.0 },
  'Body Horror': { cute_disturbing: -1.0, wholesome_bleak: -0.9 },
  'Cosmic Horror': { wholesome_bleak: -0.9, grounded_escapist: -0.8 },
  'Psychological': { calm_intense: -0.6, grounded_escapist: -0.3 },
  'Tragedy': { wholesome_bleak: -0.8, comedic_tragic: -1.0 },
  'Death': { wholesome_bleak: -0.7, comedic_tragic: -0.6 },
  'Suicide': { wholesome_bleak: -1.0, comedic_tragic: -0.9 },
  'War': { romance_violence: -0.8, calm_intense: -0.7 },
  'Terrorism': { romance_violence: -0.9, wholesome_bleak: -0.8 },
  'Torture': { cute_disturbing: -1.0, romance_violence: -1.0 },
  'Crime': { grounded_escapist: 0.4, romance_violence: -0.5 },
  'Drugs': { wholesome_bleak: -0.5, grounded_escapist: 0.3 },
  
  // Action / Intense
  'Action': { calm_intense: -0.7, romance_violence: -0.4 },
  'Battle Royale': { calm_intense: -0.9, romance_violence: -0.8 },
  'Martial Arts': { calm_intense: -0.5, romance_violence: -0.3 },
  'Survival': { calm_intense: -0.8, wholesome_bleak: -0.4 },
  'Revenge': { wholesome_bleak: -0.6, romance_violence: -0.6 },
  
  // Fantasy / Escapist
  'Fantasy': { grounded_escapist: -0.7 },
  'Isekai': { grounded_escapist: -0.9 },
  'Magic': { grounded_escapist: -0.6 },
  'Demons': { grounded_escapist: -0.7, cute_disturbing: -0.3 },
  'Dragons': { grounded_escapist: -0.8 },
  'Mythology': { grounded_escapist: -0.5 },
  'Supernatural': { grounded_escapist: -0.5 },
  
  // Sci-Fi / Grounded
  'Sci-Fi': { grounded_escapist: -0.3 },
  'Mecha': { grounded_escapist: -0.4, calm_intense: -0.5 },
  'Space': { grounded_escapist: -0.6 },
  'Cyberpunk': { grounded_escapist: -0.4, wholesome_bleak: -0.3 },
  'Post-Apocalyptic': { wholesome_bleak: -0.6, grounded_escapist: -0.3 },
  'Dystopia': { wholesome_bleak: -0.7, grounded_escapist: -0.2 },
  
  // Experimental / Weird
  'Surrealism': { grounded_escapist: -0.9, calm_intense: -0.4 },
  'Abstract': { grounded_escapist: -1.0 },
  'Avant Garde': { grounded_escapist: -0.9 },
  'Experimental': { grounded_escapist: -0.8 },
  'Meta': { grounded_escapist: -0.5 },
  'Non-linear': { grounded_escapist: -0.6 },
  'Unreliable Narrator': { grounded_escapist: -0.4 },
  
  // Emotional
  'Drama': { comedic_tragic: -0.4, calm_intense: -0.3 },
  'Melodrama': { comedic_tragic: -0.7, calm_intense: -0.5 },
  'Tearjerker': { comedic_tragic: -0.9, wholesome_bleak: -0.3 },
  
  // Cute / Moe
  'Moe': { cute_disturbing: 0.9, wholesome_bleak: 0.5 },
  'Shoujo': { cute_disturbing: 0.5, romance_violence: 0.6 },
  'Idol': { cute_disturbing: 0.7, wholesome_bleak: 0.4 },
  
  // Sports / Competition
  'Sports': { grounded_escapist: 0.7, calm_intense: -0.3 },
  'Competitive': { calm_intense: -0.4 },
  
  // Music
  'Music': { calm_intense: 0.2, grounded_escapist: 0.3 },
  'Band': { grounded_escapist: 0.5 },
  
  // Horror (various)
  'Horror': { cute_disturbing: -0.8, calm_intense: -0.6, wholesome_bleak: -0.5 },
  'Monsters': { cute_disturbing: -0.5, grounded_escapist: -0.5 },
  'Zombies': { cute_disturbing: -0.6, wholesome_bleak: -0.5 },
  'Vampires': { grounded_escapist: -0.5, cute_disturbing: -0.3 },
  
  // Ecchi / Adult
  'Ecchi': { cute_disturbing: 0.2, comedic_tragic: 0.4 },
  'Harem': { romance_violence: 0.5, comedic_tragic: 0.3 },
  'Reverse Harem': { romance_violence: 0.6 },
};

// ============================================
// CHAOS TAGS (tags that almost always imply chaos)
// ============================================
const CHAOS_TAGS = new Set([
  'Surrealism',
  'Abstract',
  'Avant Garde',
  'Experimental',
  'Psychological',
  'Existential',
  'Body Horror',
  'Cosmic Horror',
  'Arthouse',
  'Meta',
  'Non-linear',
  'Unreliable Narrator',
  'Gore',
  'Torture',
  'Denpa',
  'Mindfuck',
  'Cult Classic',
  'Parody',
  'Satire',
  'Deconstruction',
  'Anti-Hero',
  'Amnesia',
  'Time Loop',
  'Time Travel',
  'Alternate Universe',
  'Multiple Timelines',
  'Dream World',
  'Virtual Reality',
  'Philosophy',
  'Nihilism',
]);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

function entropy(distribution: number[]): number {
  const total = distribution.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  
  let ent = 0;
  for (const count of distribution) {
    if (count > 0) {
      const p = count / total;
      ent -= p * Math.log2(p);
    }
  }
  return ent;
}

// ============================================
// COMPONENT 1: TAG WEIRDNESS (35%)
// ============================================
// Rarity-weighted tag weirdness - rare tags contribute more chaos

function calculateTagWeirdness(
  entries: MediaListEntry[],
  tagAffinities: Array<{ tag: string; affinity: number; count?: number }>
): { score: number; rareTagDensity: number; topRareTags: string[] } {
  if (tagAffinities.length === 0) {
    return { score: 0, rareTagDensity: 0, topRareTags: [] };
  }
  
  // Get all tags with their popularity from entries
  const tagPopularity = new Map<string, number>();
  const tagEngagement = new Map<string, number>();
  
  for (const entry of entries) {
    const weight = entry.score ? entry.score / 10 : 0.5;
    for (const tag of entry.media?.tags || []) {
      const current = tagEngagement.get(tag.name) || 0;
      tagEngagement.set(tag.name, current + weight);
      
      // Use tag rank as proxy for rarity (lower rank = more common)
      if (tag.rank && !tagPopularity.has(tag.name)) {
        tagPopularity.set(tag.name, tag.rank);
      }
    }
  }
  
  // Calculate rarity weight for each tag
  // rarityWeight = clamp(1 - log10(tagRank + 1) / 5, 0, 1)
  // Lower rank = more common = less chaos contribution
  const tagRarityWeights: Array<{ tag: string; weight: number; engagement: number }> = [];
  
  for (const [tag, engagement] of tagEngagement.entries()) {
    const rank = tagPopularity.get(tag) || 50; // Default to middle rank
    // Invert logic: lower rank (more popular tag) = lower weight
    // Higher rank (rarer tag) = higher weight
    const rarityWeight = clamp(rank / 100, 0, 1);
    tagRarityWeights.push({ tag, weight: rarityWeight, engagement });
  }
  
  // Sort by engagement and take top 50
  tagRarityWeights.sort((a, b) => b.engagement - a.engagement);
  const topTags = tagRarityWeights.slice(0, 50);
  
  if (topTags.length === 0) {
    return { score: 0, rareTagDensity: 0, topRareTags: [] };
  }
  
  // Calculate weighted average rarity
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const { weight, engagement } of topTags) {
    weightedSum += weight * engagement;
    totalWeight += engagement;
  }
  
  const avgRarity = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  // Identify rare tags (top 25% by weight)
  const rareThreshold = 0.6;
  const rareTags = topTags.filter(t => t.weight >= rareThreshold);
  const rareTagDensity = rareTags.length / topTags.length;
  
  return {
    score: avgRarity,
    rareTagDensity,
    topRareTags: rareTags.slice(0, 5).map(t => t.tag),
  };
}

// ============================================
// COMPONENT 2: WHIPLASH / CONTRAST (30%)
// ============================================
// Polarity variance across taste axes

function calculateWhiplash(
  entries: MediaListEntry[],
  tagAffinities: Array<{ tag: string; affinity: number }>
): { score: number; polarityVariance: number; dominantContrast: string } {
  // Get user's top tags by affinity
  const topTags = tagAffinities.slice(0, 40).map(t => t.tag);
  
  if (topTags.length < 5) {
    return { score: 0, polarityVariance: 0, dominantContrast: 'Insufficient data' };
  }
  
  // Collect polarity values for each axis
  const axisValues: Record<keyof PolarityVector, number[]> = {
    wholesome_bleak: [],
    grounded_escapist: [],
    calm_intense: [],
    cute_disturbing: [],
    comedic_tragic: [],
    romance_violence: [],
  };
  
  for (const tag of topTags) {
    const polarity = TAG_POLARITY[tag];
    if (polarity) {
      for (const [axis, value] of Object.entries(polarity)) {
        if (value !== undefined) {
          axisValues[axis as keyof PolarityVector].push(value);
        }
      }
    }
  }
  
  // Calculate variance for each axis
  const axisVariances: Array<{ axis: string; variance: number }> = [];
  
  for (const [axis, values] of Object.entries(axisValues)) {
    if (values.length >= 3) {
      const std = standardDeviation(values);
      // Normalize: max std for [-1, 1] range is ~1
      const variance = clamp(std, 0, 1);
      axisVariances.push({ axis, variance });
    }
  }
  
  if (axisVariances.length === 0) {
    return { score: 0, polarityVariance: 0, dominantContrast: 'Insufficient polarity data' };
  }
  
  // Mean variance across axes = whiplash score
  const meanVariance = axisVariances.reduce((sum, a) => sum + a.variance, 0) / axisVariances.length;
  
  // Find dominant contrast
  axisVariances.sort((a, b) => b.variance - a.variance);
  const topContrast = axisVariances[0];
  
  const contrastLabels: Record<string, string> = {
    wholesome_bleak: 'Wholesome ↔ Bleak',
    grounded_escapist: 'Grounded ↔ Escapist',
    calm_intense: 'Calm ↔ Intense',
    cute_disturbing: 'Cute ↔ Disturbing',
    comedic_tragic: 'Comedic ↔ Tragic',
    romance_violence: 'Romance ↔ Violence',
  };
  
  return {
    score: meanVariance,
    polarityVariance: meanVariance,
    dominantContrast: contrastLabels[topContrast.axis] || topContrast.axis,
  };
}

// ============================================
// COMPONENT 3: OBSCURITY + RISK (20%)
// ============================================
// Niche behavior and format variety

function calculateRisk(
  entries: MediaListEntry[]
): { score: number; obscurityScore: number; formatEntropy: number } {
  if (entries.length === 0) {
    return { score: 0, obscurityScore: 0, formatEntropy: 0 };
  }
  
  // Obscurity: reward low popularity watching
  // obscurity = average( clamp(1 - log10(popularity+1)/6, 0, 1) )
  const obscurityScores: number[] = [];
  
  for (const entry of entries) {
    const popularity = entry.media?.popularity || 100000;
    const weight = entry.score ? entry.score / 10 : 0.5;
    // Lower popularity = higher obscurity
    const obscurity = clamp(1 - Math.log10(popularity + 1) / 6, 0, 1);
    obscurityScores.push(obscurity * weight);
  }
  
  const avgObscurity = obscurityScores.length > 0
    ? obscurityScores.reduce((a, b) => a + b, 0) / obscurityScores.length
    : 0;
  
  // Format variety: entropy of format distribution
  const formatCounts = new Map<string, number>();
  for (const entry of entries) {
    const format = entry.media?.format || 'UNKNOWN';
    formatCounts.set(format, (formatCounts.get(format) || 0) + 1);
  }
  
  const formatDistribution = Array.from(formatCounts.values());
  const maxEntropy = Math.log2(Math.max(formatDistribution.length, 1));
  const formatEntropy = maxEntropy > 0 ? entropy(formatDistribution) / maxEntropy : 0;
  
  // Combined risk score (70% obscurity, 30% format mix)
  const riskScore = 0.7 * avgObscurity + 0.3 * formatEntropy;
  
  return {
    score: riskScore,
    obscurityScore: avgObscurity,
    formatEntropy,
  };
}

// ============================================
// COMPONENT 4: RATING VOLATILITY (15%)
// ============================================
// Unpredictable scoring patterns

function calculateRatingChaos(
  entries: MediaListEntry[]
): { score: number; extremeRatingPercent: number; scoreStdDev: number } {
  const scoredEntries = entries.filter(e => e.score && e.score > 0);
  
  if (scoredEntries.length < 5) {
    return { score: 0, extremeRatingPercent: 0, scoreStdDev: 0 };
  }
  
  const scores = scoredEntries.map(e => e.score!);
  
  // Method 1: Standard deviation based
  const std = standardDeviation(scores);
  const stdChaos = clamp(std / 2.5, 0, 1);
  
  // Method 2: Extreme ratings (≤3 or ≥9)
  const extremeCount = scores.filter(s => s <= 3 || s >= 9).length;
  const extremePercent = extremeCount / scores.length;
  const extremeChaos = clamp(extremePercent / 0.35, 0, 1);
  
  // Use the higher of the two methods
  const ratingChaos = Math.max(stdChaos, extremeChaos);
  
  return {
    score: ratingChaos,
    extremeRatingPercent: extremePercent,
    scoreStdDev: std,
  };
}

// ============================================
// CHAOS TAG BOOST
// ============================================
// Small bump for known chaos-implying tags

function calculateChaosTagBoost(
  tagAffinities: Array<{ tag: string; affinity: number }>
): { boost: number; hits: string[] } {
  const hits: string[] = [];
  
  for (const { tag, affinity } of tagAffinities) {
    if (CHAOS_TAGS.has(tag) && affinity > 0.3) {
      hits.push(tag);
    }
  }
  
  // chaosTagBoost = clamp(chaosTagHits / 6, 0, 1)
  const boost = clamp(hits.length / 6, 0, 1);
  
  return { boost, hits };
}

// ============================================
// CHAOS ARCHETYPE CLASSIFICATION
// ============================================

function determineChaosArchetype(
  tagWeirdness: number,
  whiplash: number,
  risk: number,
  ratingChaos: number
): string {
  // Find dominant component
  const components = [
    { name: 'Theme Chaos', score: tagWeirdness, desc: 'Rare tags + disturbing themes' },
    { name: 'Mood Whiplash', score: whiplash, desc: 'Emotional polarity variance' },
    { name: 'Obscurity Goblin', score: risk, desc: 'Niche + risky picks' },
    { name: 'Opinion Grenade', score: ratingChaos, desc: 'Extreme ratings' },
  ];
  
  components.sort((a, b) => b.score - a.score);
  
  // If top component is significantly higher, use it
  if (components[0].score > components[1].score + 0.15) {
    return components[0].name;
  }
  
  // Otherwise, combination
  if (tagWeirdness > 0.5 && whiplash > 0.5) {
    return 'Unhinged Enjoyer';
  }
  if (risk > 0.5 && ratingChaos > 0.5) {
    return 'Contrarian Explorer';
  }
  if (whiplash > 0.5 && ratingChaos > 0.5) {
    return 'Emotional Wildcard';
  }
  
  return components[0].name;
}

function getChaosLabel(level: number): string {
  if (level >= 85) return 'Absolute Chaos';
  if (level >= 70) return 'Highly Chaotic';
  if (level >= 55) return 'Chaotic';
  if (level >= 40) return 'Moderately Chaotic';
  if (level >= 25) return 'Mildly Chaotic';
  if (level >= 10) return 'Ordered';
  return 'Extremely Predictable';
}

// ============================================
// MAIN EXPORT: ANALYZE CHAOS
// ============================================

export function analyzeChaos(
  entries: MediaListEntry[],
  tagAffinities: Array<{ tag: string; affinity: number; count?: number }>
): ChaosProfile {
  // Calculate all components
  const tagResult = calculateTagWeirdness(entries, tagAffinities);
  const whiplashResult = calculateWhiplash(entries, tagAffinities);
  const riskResult = calculateRisk(entries);
  const ratingResult = calculateRatingChaos(entries);
  const boostResult = calculateChaosTagBoost(tagAffinities);
  
  // Normalize scores (0-1)
  const tagWeirdness = tagResult.score;
  const whiplash = whiplashResult.score;
  const risk = riskResult.score;
  const ratingChaos = ratingResult.score;
  const chaosTagBoost = boostResult.boost;
  
  // Calculate final chaos level (0-100)
  let chaosLevel = 100 * (
    0.35 * tagWeirdness +
    0.30 * whiplash +
    0.20 * risk +
    0.15 * ratingChaos
  );
  
  // Add chaos tag boost (small bump, max +8)
  chaosLevel += 8 * chaosTagBoost;
  chaosLevel = clamp(chaosLevel, 0, 100);
  
  // Build drivers list
  const drivers: ChaosDriver[] = [];
  
  if (whiplash > 0.3) {
    drivers.push({
      label: 'High Whiplash',
      description: `${whiplashResult.dominantContrast} swings`,
      contribution: whiplash * 30,
    });
  }
  
  if (tagResult.rareTagDensity > 0.2) {
    drivers.push({
      label: 'Rare Tag Density',
      description: `${Math.round(tagResult.rareTagDensity * 100)}% of top tags are niche`,
      contribution: tagWeirdness * 35,
    });
  }
  
  if (riskResult.obscurityScore > 0.3) {
    drivers.push({
      label: 'Niche Engagement',
      description: `${Math.round(riskResult.obscurityScore * 100)}% obscurity score`,
      contribution: risk * 20,
    });
  }
  
  if (ratingResult.extremeRatingPercent > 0.15) {
    drivers.push({
      label: 'Extreme Scorer',
      description: `${Math.round(ratingResult.extremeRatingPercent * 100)}% of ratings are 1-3 or 9-10`,
      contribution: ratingChaos * 15,
    });
  }
  
  if (boostResult.hits.length >= 2) {
    drivers.push({
      label: 'Chaos Tags',
      description: boostResult.hits.slice(0, 3).join(', '),
      contribution: chaosTagBoost * 8,
    });
  }
  
  // Sort drivers by contribution
  drivers.sort((a, b) => b.contribution - a.contribution);
  
  return {
    chaosLevel: Math.round(chaosLevel * 10) / 10,
    chaosLabel: getChaosLabel(chaosLevel),
    chaosArchetype: determineChaosArchetype(tagWeirdness, whiplash, risk, ratingChaos),
    
    tagWeirdness,
    whiplash,
    risk,
    ratingChaos,
    chaosTagBoost,
    
    drivers: drivers.slice(0, 4), // Top 4 drivers
    
    breakdown: {
      rareTagDensity: tagResult.rareTagDensity,
      polarityVariance: whiplashResult.polarityVariance,
      obscurityScore: riskResult.obscurityScore,
      formatEntropy: riskResult.formatEntropy,
      extremeRatingPercent: ratingResult.extremeRatingPercent,
      chaosTagHits: boostResult.hits,
    },
  };
}

// ============================================
// HELPER: Get chaos explanation text
// ============================================

export function getChaosExplanation(profile: ChaosProfile): string {
  const lines: string[] = [];
  
  lines.push(`**Chaos Level: ${profile.chaosLevel}** (${profile.chaosLabel})`);
  lines.push(`**Type:** ${profile.chaosArchetype}`);
  lines.push('');
  lines.push('**Chaos Drivers:**');
  
  for (const driver of profile.drivers) {
    lines.push(`- **${driver.label}:** ${driver.description}`);
  }
  
  return lines.join('\n');
}
