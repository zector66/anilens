/**
 * Fingerprint Generator
 * 
 * Auto-generates one-liner taste summaries based on user's profile.
 * Examples:
 * - "Niche-leaning drama explorer with high completion."
 * - "Mainstream action grinder with high binge velocity."
 * - "Tag-diverse mood chaser: dark → wholesome swings."
 */

import { TasteProfile } from '@/types/anilist';

interface FingerprintInput {
  profile: TasteProfile;
  totalEntries: number;
  completionRate: number;
  meanScore: number;
  topStudio?: string;
  topGenre?: string;
  mode: 'ANIME' | 'MANGA';
}

interface FingerprintResult {
  short: string;      // One-liner for poster
  medium: string;     // 2-3 sentences
  tags: string[];     // Key traits
  archetype: string;  // Primary archetype name
}

// Archetype definitions
const ARCHETYPES = {
  COMPLETIONIST: {
    name: 'The Completionist',
    emoji: '✅',
    traits: ['high completion', 'methodical', 'dedicated'],
  },
  EXPLORER: {
    name: 'The Explorer',
    emoji: '🧭',
    traits: ['diverse taste', 'adventurous', 'genre-hopping'],
  },
  CONNOISSEUR: {
    name: 'The Connoisseur',
    emoji: '🍷',
    traits: ['niche-leaning', 'refined taste', 'selective'],
  },
  BINGER: {
    name: 'The Binger',
    emoji: '⚡',
    traits: ['high volume', 'fast consumption', 'marathon viewer'],
  },
  LOYALIST: {
    name: 'The Loyalist',
    emoji: '🛡️',
    traits: ['studio-focused', 'consistent preferences', 'reliable'],
  },
  TRENDSETTER: {
    name: 'The Trendsetter',
    emoji: '📈',
    traits: ['seasonal watcher', 'current', 'mainstream-aware'],
  },
  CLASSIC_PURIST: {
    name: 'The Classic Purist',
    emoji: '📜',
    traits: ['older era preference', 'timeless taste', 'nostalgic'],
  },
  MOOD_CHASER: {
    name: 'The Mood Chaser',
    emoji: '🎭',
    traits: ['emotional range', 'varied themes', 'mood-driven'],
  },
  HIDDEN_GEM_HUNTER: {
    name: 'Hidden Gem Hunter',
    emoji: '💎',
    traits: ['niche finder', 'underrated picks', 'quality over popularity'],
  },
  ACTION_JUNKIE: {
    name: 'Action Junkie',
    emoji: '💥',
    traits: ['action-focused', 'high energy', 'thrill-seeking'],
  },
};

type ArchetypeKey = keyof typeof ARCHETYPES;

function determineArchetype(input: FingerprintInput): ArchetypeKey {
  const { profile, completionRate, totalEntries } = input;
  
  // Calculate key metrics from TasteProfile structure
  const diversityIndex = profile.behavioralMetrics?.diversityIndex || 0.5;
  const nicheScore = profile.behavioralMetrics?.nicheIndex || 0.5;
  const mainstreamIndex = profile.behavioralMetrics?.mainstreamIndex || 0.5;
  
  // High completion rate = Completionist
  if (completionRate > 0.85 && totalEntries > 100) {
    return 'COMPLETIONIST';
  }
  
  // Very niche taste = Hidden Gem Hunter or Connoisseur
  if (nicheScore > 0.7 || mainstreamIndex < 0.3) {
    return nicheScore > 0.8 ? 'HIDDEN_GEM_HUNTER' : 'CONNOISSEUR';
  }
  
  // High diversity = Explorer
  if (diversityIndex > 0.7) {
    return 'EXPLORER';
  }
  
  // Check for genre focus
  const topGenres = profile.genreAffinity || [];
  const actionGenres = ['Action', 'Adventure', 'Shounen'];
  const isActionFocused = topGenres.slice(0, 3).some((g: { genre: string }) => 
    actionGenres.includes(g.genre)
  );
  
  if (isActionFocused && totalEntries > 50) {
    return 'ACTION_JUNKIE';
  }
  
  // High volume = Binger
  if (totalEntries > 300) {
    return 'BINGER';
  }
  
  // Check studio concentration
  const topStudios = profile.studioBias || [];
  if (topStudios[0] && topStudios[0].count > totalEntries * 0.15) {
    return 'LOYALIST';
  }
  
  // Default to Mood Chaser for varied emotional profiles
  return 'MOOD_CHASER';
}

function generateShortFingerprint(input: FingerprintInput, archetype: ArchetypeKey): string {
  const { profile, completionRate, topStudio, topGenre, mode } = input;
  const nicheScore = profile.behavioralMetrics?.nicheIndex || 0.5;
  const mainstreamIndex = profile.behavioralMetrics?.mainstreamIndex || 0.5;
  
  const nicheLevel = nicheScore > 0.6 ? 'Niche-leaning' : mainstreamIndex > 0.6 ? 'Mainstream' : 'Balanced';
  const completionDesc = completionRate > 0.8 ? 'high completion' : completionRate > 0.5 ? 'moderate completion' : 'selective viewing';
  const mediaWord = mode === 'ANIME' ? 'anime' : 'manga';
  
  const templates: Record<ArchetypeKey, string[]> = {
    COMPLETIONIST: [
      `Methodical completionist with eclectic ${mediaWord} taste.`,
      `Dedicated viewer who sees every series through.`,
      `${nicheLevel} ${mediaWord} completionist with refined selection.`,
    ],
    EXPLORER: [
      `Genre-hopping explorer with adventurous taste.`,
      `${nicheLevel} ${mediaWord} explorer chasing new experiences.`,
      `Diverse taste seeker who ventures off the beaten path.`,
    ],
    CONNOISSEUR: [
      `${nicheLevel} connoisseur with selective, refined taste.`,
      `Quality-focused viewer with ${completionDesc}.`,
      `Selective ${mediaWord} appreciator with high standards.`,
    ],
    BINGER: [
      `High-velocity binger with marathon dedication.`,
      `${nicheLevel} binge master with impressive volume.`,
      `Dedicated consumer with rapid-fire watching habits.`,
    ],
    LOYALIST: [
      `Studio loyalist with strong ${topStudio || 'studio'} appreciation.`,
      `${topStudio || 'Studio'}-focused viewer with consistent taste.`,
      `Loyal fan with refined studio preferences.`,
    ],
    TRENDSETTER: [
      `Seasonal surfer catching every trending wave.`,
      `Current-season focused with mainstream awareness.`,
      `Trendy viewer always on the pulse.`,
    ],
    CLASSIC_PURIST: [
      `Classic purist with timeless ${mediaWord} taste.`,
      `Nostalgic viewer who appreciates the foundations.`,
      `Old-school appreciator with refined classic selections.`,
    ],
    MOOD_CHASER: [
      `Mood-driven chaser: dark → wholesome swings.`,
      `Tag-diverse mood explorer with emotional range.`,
      `${nicheLevel} mood chaser with ${completionDesc}.`,
    ],
    HIDDEN_GEM_HUNTER: [
      `Hidden gem hunter who digs deep for quality.`,
      `Niche finder with underrated ${mediaWord} picks.`,
      `Deep-dive explorer uncovering hidden treasures.`,
    ],
    ACTION_JUNKIE: [
      `${topGenre || 'Action'}-focused with high energy taste.`,
      `Thrill-seeking ${mediaWord} enthusiast.`,
      `High-octane viewer with action-packed preferences.`,
    ],
  };
  
  const options = templates[archetype];
  return options[Math.floor(Math.random() * options.length)];
}

function generateMediumFingerprint(input: FingerprintInput, archetype: ArchetypeKey): string {
  const { totalEntries, completionRate, meanScore, topStudio, topGenre, mode } = input;
  const arch = ARCHETYPES[archetype];
  const mediaWord = mode === 'ANIME' ? 'anime' : 'manga';
  
  const parts = [
    `With ${totalEntries} ${mediaWord} entries and a ${Math.round(completionRate * 100)}% completion rate, you're ${arch.name.toLowerCase()}.`,
  ];
  
  if (topGenre) {
    parts.push(`${topGenre} leads your genre preferences.`);
  }
  
  if (topStudio) {
    parts.push(`${topStudio} is your most-watched studio.`);
  }
  
  if (meanScore > 7.5) {
    parts.push(`Your generous scoring (avg ${meanScore.toFixed(1)}) shows an appreciative viewer.`);
  } else if (meanScore < 6) {
    parts.push(`Your selective scoring (avg ${meanScore.toFixed(1)}) reflects high standards.`);
  }
  
  return parts.join(' ');
}

export function generateFingerprint(input: FingerprintInput): FingerprintResult {
  const archetype = determineArchetype(input);
  const arch = ARCHETYPES[archetype];
  
  return {
    short: generateShortFingerprint(input, archetype),
    medium: generateMediumFingerprint(input, archetype),
    tags: arch.traits,
    archetype: arch.name,
  };
}

export function generateAniListPost(input: FingerprintInput & { fingerprint: string }): { short: string; long: string } {
  const { profile, totalEntries, mode, topStudio, topGenre, fingerprint } = input;
  const mediaWord = mode === 'ANIME' ? 'Anime' : 'Manga';
  
  const topStudios = profile.studioBias || [];
  const studioName = topStudio || topStudios[0]?.studio || 'Unknown';
  const genreName = topGenre || profile.genreAffinity?.[0]?.genre || 'Unknown';
  
  const short = `I ran my AniList through AniLens Studio 📊

Top Studio: ${studioName}
Top Genre: ${genreName}
${mediaWord}: ${totalEntries} entries

Try yours → anilens.vercel.app`;

  const long = `I ran my AniList through AniLens Studio and here's what it found! 📊

"${fingerprint}"

📌 Top Studio: ${studioName}
🎭 Top Genre: ${genreName}  
📈 ${mediaWord} Entries: ${totalEntries}

Create your own taste poster → anilens.vercel.app

#AniLens #AniList #AnimeTaste`;

  return { short, long };
}

export { ARCHETYPES };
export type { ArchetypeKey, FingerprintInput, FingerprintResult };
