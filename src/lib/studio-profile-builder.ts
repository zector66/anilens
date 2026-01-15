import { TasteProfile, MediaListEntry } from '@/types/anilist';
import { StudioPosterProfile, StudioPosterSettings, IndexStat, DEFAULT_POSTER_SETTINGS, TopMediaItem } from '@/types/studio';

interface UserInfo {
  id: number;
  name: string;
  avatar?: { large?: string; medium?: string };
  bannerImage?: string;
}

/**
 * Generates a deterministic "Your Lane" summary line based on taste profile
 */
export function generateSummaryLine(
  tasteProfile: TasteProfile,
  mode: 'ANIME' | 'MANGA'
): string {
  const { genreAffinity, tagAffinity, behavioralMetrics, emotionalProfile } = tasteProfile;
  
  // Get top genres and tags
  const topGenre = genreAffinity[0]?.genre?.toLowerCase() || '';
  const topTag = tagAffinity[0]?.tag?.toLowerCase() || '';
  const secondTag = tagAffinity[1]?.tag?.toLowerCase() || '';
  
  // Behavioral traits
  const isNiche = behavioralMetrics.nicheIndex > 0.6;
  const isMainstream = behavioralMetrics.mainstreamIndex > 0.6;
  const isExperimental = behavioralMetrics.experimentalIndex > 0.5;
  const isDiverse = behavioralMetrics.diversityIndex > 0.7;
  const isCompletionist = behavioralMetrics.completionRate > 0.85;
  
  // Emotional traits
  const isBleak = emotionalProfile?.bleakness > 0.6;
  const isIntense = emotionalProfile?.intensity > 0.6;
  const isSentimental = emotionalProfile?.sentimentality > 0.6;
  const isEscapist = emotionalProfile?.escapism > 0.6;
  
  // Build summary components
  const parts: string[] = [];
  
  // Emotional modifier
  if (isBleak) parts.push('Dark');
  else if (isSentimental) parts.push('Emotional');
  else if (isIntense) parts.push('High-stakes');
  else if (isEscapist) parts.push('Escapist');
  
  // Genre/tag focus
  if (topGenre) {
    parts.push(capitalize(topGenre));
  }
  
  // Style descriptor
  if (topTag && topTag !== topGenre) {
    parts.push(`with ${topTag}`);
  }
  
  // Behavioral suffix
  const suffixes = [];
  if (isNiche) suffixes.push('deep cuts');
  if (isExperimental) suffixes.push('experiments');
  if (isCompletionist) suffixes.push('commitment');
  if (isDiverse) suffixes.push('variety');
  if (isMainstream && !isNiche) suffixes.push('hits');
  
  // Build the line
  let summaryLine = parts.join(' ');
  
  if (suffixes.length > 0) {
    summaryLine += ` enjoyer.`;
  } else {
    summaryLine += ` fan.`;
  }
  
  // Fallback templates based on dominant traits
  const templates = [
    { condition: isBleak && topTag.includes('psychological'), line: `Dark ${topGenre} with psychological spirals.` },
    { condition: isSentimental && topGenre === 'romance', line: `High-score romance enjoyer.` },
    { condition: isNiche && isExperimental, line: `Niche ${topTag} hunter.` },
    { condition: isMainstream && isCompletionist, line: `${capitalize(topGenre)} completionist.` },
    { condition: topTag.includes('time') || topTag.includes('loop'), line: `${capitalize(topGenre)} with temporal complexity.` },
    { condition: secondTag.includes('found family'), line: `${capitalize(topGenre)} with found family energy.` },
  ];
  
  // Check for matching template
  for (const template of templates) {
    if (template.condition) {
      return template.line;
    }
  }
  
  // Use constructed line or fallback
  if (summaryLine.length < 10) {
    return `${capitalize(topGenre)} ${mode.toLowerCase()} enthusiast.`;
  }
  
  return summaryLine;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Builds the 6 core indices for the poster
 */
export function buildIndices(tasteProfile: TasteProfile): IndexStat[] {
  const { behavioralMetrics, scorePatterns } = tasteProfile;
  
  const indices: IndexStat[] = [
    {
      label: 'Niche',
      value: behavioralMetrics.nicheIndex,
      displayValue: `${Math.round(behavioralMetrics.nicheIndex * 100)}%`,
      descriptor: behavioralMetrics.nicheIndex > 0.5 ? 'Prefers deep cuts' : 'Mostly mainstream',
      color: '#8b5cf6',
    },
    {
      label: 'Commitment',
      value: behavioralMetrics.completionRate,
      displayValue: `${Math.round(behavioralMetrics.completionRate * 100)}%`,
      descriptor: behavioralMetrics.completionRate > 0.8 ? 'Sees it through' : 'Selective finisher',
      color: '#10b981',
    },
    {
      label: 'Binge',
      value: behavioralMetrics.bingeIndex,
      displayValue: `${Math.round(behavioralMetrics.bingeIndex * 100)}%`,
      descriptor: behavioralMetrics.bingeIndex > 0.6 ? 'Marathon watcher' : 'Steady pace',
      color: '#f59e0b',
    },
    {
      label: 'Mean Score',
      value: scorePatterns.meanScore / 10,
      displayValue: scorePatterns.meanScore.toFixed(1),
      descriptor: scorePatterns.meanScore > 7.5 ? 'Generous scorer' : scorePatterns.meanScore < 6.5 ? 'Harsh critic' : 'Balanced rater',
      color: '#3b82f6',
    },
    {
      label: 'Diversity',
      value: behavioralMetrics.diversityIndex,
      displayValue: `${Math.round(behavioralMetrics.diversityIndex * 100)}%`,
      descriptor: behavioralMetrics.diversityIndex > 0.6 ? 'Genre explorer' : 'Focused taste',
      color: '#ec4899',
    },
    {
      label: 'Experimental',
      value: behavioralMetrics.experimentalIndex,
      displayValue: `${Math.round(behavioralMetrics.experimentalIndex * 100)}%`,
      descriptor: behavioralMetrics.experimentalIndex > 0.5 ? 'Risk taker' : 'Plays it safe',
      color: '#ef4444',
    },
  ];
  
  return indices;
}

/**
 * Filters entries by time window
 */
export function filterByTimeWindow(
  entries: MediaListEntry[],
  timeWindow: 'ALL_TIME' | '12M' | '90D'
): MediaListEntry[] {
  if (timeWindow === 'ALL_TIME') return entries;
  
  const now = Date.now();
  const msPerDay = 86400000;
  const cutoff = timeWindow === '12M' ? now - (365 * msPerDay) : now - (90 * msPerDay);
  
  return entries.filter(entry => {
    // Use updatedAt timestamp if available
    if (entry.updatedAt) {
      return entry.updatedAt * 1000 >= cutoff;
    }
    // Fallback to completedAt
    if (entry.completedAt?.year) {
      const completedDate = new Date(
        entry.completedAt.year,
        (entry.completedAt.month || 1) - 1,
        entry.completedAt.day || 1
      ).getTime();
      return completedDate >= cutoff;
    }
    return true; // Include if no date info
  });
}

/**
 * Filters entries by status
 */
export function filterByStatus(
  entries: MediaListEntry[],
  statuses: string[]
): MediaListEntry[] {
  return entries.filter(entry => statuses.includes(entry.status));
}

/**
 * Filters entries by format exclusions
 */
export function filterByFormat(
  entries: MediaListEntry[],
  excludeFormats: string[]
): MediaListEntry[] {
  if (excludeFormats.length === 0) return entries;
  return entries.filter(entry => !excludeFormats.includes(entry.media?.format || ''));
}

/**
 * Gets time range label for metadata
 */
export function getTimeRangeLabel(timeWindow: 'ALL_TIME' | '12M' | '90D'): string {
  switch (timeWindow) {
    case 'ALL_TIME': return 'All Time';
    case '12M': return 'Last 12 Months';
    case '90D': return 'Last 90 Days';
  }
}

/**
 * Generates a fallback gradient from top media colors
 */
export function generateFallbackGradient(entries: MediaListEntry[]): string {
  const colors: string[] = [];
  
  for (const entry of entries.slice(0, 5)) {
    if (entry.media?.coverImage?.color) {
      colors.push(entry.media.coverImage.color);
    }
  }
  
  if (colors.length === 0) {
    return 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
  }
  
  if (colors.length === 1) {
    return `linear-gradient(135deg, ${colors[0]}33 0%, #0a0a0f 100%)`;
  }
  
  return `linear-gradient(135deg, ${colors[0]}44 0%, ${colors[1] || colors[0]}22 50%, #0a0a0f 100%)`;
}

/**
 * Gets top media sorted by score/impact
 */
function getTopMedia(entries: MediaListEntry[], count: number = 5): TopMediaItem[] {
  return entries
    .filter(e => e.media?.coverImage?.large && e.score && e.score > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, count)
    .map(e => ({
      id: e.media!.id,
      title: e.media!.title?.english || e.media!.title?.romaji || 'Unknown',
      cover: e.media!.coverImage!.large!,
      score: e.score,
      color: e.media!.coverImage?.color || undefined,
    }));
}

/**
 * Calculates activity stats from entries
 */
function calculateActivityStats(
  entries: MediaListEntry[],
  mode: 'ANIME' | 'MANGA',
  tasteProfile: TasteProfile
) {
  const totalTitles = entries.length;
  
  let episodesWatched = 0;
  let chaptersRead = 0;
  
  for (const entry of entries) {
    if (mode === 'ANIME') {
      episodesWatched += entry.progress || 0;
    } else {
      chaptersRead += entry.progress || 0;
    }
  }
  
  const scoredEntries = entries.filter(e => e.score && e.score > 0);
  const meanScore = scoredEntries.length > 0
    ? scoredEntries.reduce((sum, e) => sum + (e.score || 0), 0) / scoredEntries.length
    : 0;
  
  return {
    totalTitles,
    episodesWatched: mode === 'ANIME' ? episodesWatched : undefined,
    chaptersRead: mode === 'MANGA' ? chaptersRead : undefined,
    daysActive: undefined, // Could compute from date range
    meanScore,
    completionRate: tasteProfile.behavioralMetrics.completionRate,
  };
}

/**
 * Builds the complete StudioPosterProfile from TasteProfile and user info
 */
export function buildStudioPosterProfile(
  tasteProfile: TasteProfile,
  user: UserInfo,
  entries: MediaListEntry[],
  mode: 'ANIME' | 'MANGA',
  settings: StudioPosterSettings = DEFAULT_POSTER_SETTINGS
): StudioPosterProfile {
  // Apply filters
  let filteredEntries = filterByTimeWindow(entries, settings.timeWindow);
  filteredEntries = filterByStatus(filteredEntries, settings.statuses);
  filteredEntries = filterByFormat(filteredEntries, settings.excludeFormats);
  
  // Generate summary line
  const summaryLine = generateSummaryLine(tasteProfile, mode);
  
  // Build indices
  const indices = buildIndices(tasteProfile);
  
  // Get top media with covers
  const topMedia = getTopMedia(filteredEntries, 5);
  
  // Top genres (5)
  const topGenres = tasteProfile.genreAffinity.slice(0, 5).map(g => ({
    name: g.genre,
    strength: g.affinity,
  }));
  
  // Top tags (8-12)
  const topTags = tasteProfile.tagAffinity.slice(0, 10).map(t => ({
    name: t.tag,
    strength: t.affinity,
  }));
  
  // Top studios/authors with counts and percentages
  const totalCount = filteredEntries.length;
  const topStudiosOrAuthors = tasteProfile.studioBias.slice(0, 5).map(s => {
    const studioEntries = filteredEntries.filter(e => 
      e.media?.studios?.edges?.some(edge => edge.node?.name === s.studio)
    );
    return {
      name: s.studio,
      strength: s.bias,
      count: studioEntries.length,
      percentage: totalCount > 0 ? Math.round((studioEntries.length / totalCount) * 100) : 0,
      era: undefined,
    };
  });
  
  // Activity stats
  const activityStats = calculateActivityStats(filteredEntries, mode, tasteProfile);
  
  // Fallback gradient if no banner
  const fallbackGradient = !user.bannerImage 
    ? generateFallbackGradient(entries)
    : undefined;
  
  return {
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar?.large || user.avatar?.medium || '',
      banner: user.bannerImage || null,
      fallbackGradient,
    },
    mode,
    settings,
    summaryLine,
    indices,
    topMedia,
    topGenres,
    topTags,
    topStudiosOrAuthors,
    activityStats,
    metadata: {
      totalEntries: filteredEntries.length,
      timeRange: getTimeRangeLabel(settings.timeWindow),
      generatedAt: new Date().toISOString(),
      version: 'v1',
      statusesIncluded: settings.statuses,
    },
  };
}
