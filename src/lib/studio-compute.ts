import { MediaListEntry, TasteProfile } from "@/types/anilist";
import { StudioConfig, PosterData, StudioTimeWindow } from "@/types/studio";

// DETERMINISTIC PIPELINE - No side effects, pure functions

export function filterEntries(entries: MediaListEntry[], config: StudioConfig): MediaListEntry[] {
  return entries.filter(entry => {
    // Media type filter
    if (config.media === "anime" && entry.media?.type !== "ANIME") return false;
    if (config.media === "manga" && entry.media?.type !== "MANGA") return false;

    // Status filter
    if (!config.statuses.includes(entry.status as StudioConfig["statuses"][0])) return false;

    // Time window filter
    if (!isInTimeWindow(entry, config.timeWindow)) return false;

    return true;
  });
}

function isInTimeWindow(entry: MediaListEntry, timeWindow: StudioTimeWindow): boolean {
  if (timeWindow === "all") return true;

  const entryDate = entry.completedAt || entry.startedAt;
  if (!entryDate) return false;

  const entryTime = new Date(entryDate.year!, entryDate.month! || 1, entryDate.day! || 1).getTime();
  const now = Date.now();

  if (timeWindow === "last12m") {
    const twelveMonthsAgo = now - (365 * 24 * 60 * 60 * 1000);
    return entryTime >= twelveMonthsAgo;
  }

  if (timeWindow === "year") {
    const currentYear = new Date().getFullYear();
    return entryDate.year === currentYear;
  }

  if (typeof timeWindow === "object") {
    const from = new Date(timeWindow.from).getTime();
    const to = new Date(timeWindow.to).getTime();
    return entryTime >= from && entryTime <= to;
  }

  return true;
}

export function buildPosterData(
  filteredEntries: MediaListEntry[], 
  config: StudioConfig,
  userTasteProfile: TasteProfile,
  userGamesData?: Record<string, unknown>,
  userAvatar?: string,
  userBanner?: string,
  username?: string
): PosterData {
  // Compute all data deterministically
  const animeEntries = filteredEntries.filter(e => e.media?.type === "ANIME");
  const mangaEntries = filteredEntries.filter(e => e.media?.type === "MANGA");

  const header = buildHeader(username, userAvatar, userBanner, config);
  const topAnime = buildTopAnime(animeEntries, config);
  const topManga = buildTopManga(mangaEntries, config);
  const animeStats = buildAnimeStats(animeEntries);
  const mangaStats = buildMangaStats(mangaEntries);
  const percentiles = buildPercentiles(userTasteProfile);
  const topTags = buildTopTags(userTasteProfile, config);
  const genreRadar = buildGenreRadar(userTasteProfile);
  const monthlyActivity = buildMonthlyActivity(filteredEntries, config);
  const hottestTake = buildHottestTake(filteredEntries, userTasteProfile, config);
  const gamesRank = buildGamesRank(userGamesData);
  const fingerprint = typeof userTasteProfile.fingerprint === 'string' 
    ? userTasteProfile.fingerprint 
    : userTasteProfile.fingerprint?.code || "UNKNOWN";
  const contradiction = userTasteProfile.contradictions?.[0]?.description || "";
  const confidence = getConfidenceLevel(filteredEntries.length);

  return {
    header,
    topAnime,
    topManga,
    animeStats,
    mangaStats,
    percentiles,
    topTags,
    genreRadar,
    monthlyActivity,
    hottestTake,
    tasteContradiction: contradiction,
    fingerprint,
    confidence,
    gamesRank,
    metadata: {
      totalEntries: filteredEntries.length,
      timeRange: getTimeRangeLabel(config.timeWindow),
      generatedAt: new Date().toISOString(),
      template: config.template,
    }
  };
}

// Helper functions - all pure and deterministic

function buildHeader(username?: string, avatar?: string, banner?: string, config?: StudioConfig) {
  return {
    username: config?.privacy.hideUsername ? "Anonymous" : (username || "User"),
    avatar: avatar || "/default-avatar.png",
    banner: banner || "/default-banner.png",
    subtitle: getTimeRangeLabel(config?.timeWindow || "all"),
    watermark: "Made with AniLens • anilens.vercel.app"
  };
}

function buildTopAnime(animeEntries: MediaListEntry[], config: StudioConfig) {
  const topAnimeModule = config.modules.find(m => m.id === "topAnime");
  const count = typeof topAnimeModule?.settings?.count === "number" ? topAnimeModule.settings.count : 5;

  // Calculate impact score: engagement * z-score * recency
  const scored = animeEntries
    .filter(e => e.media && e.score)
    .map(entry => {
      const engagement = getEngagementWeight(entry);
      const zScore = getZScore(entry.score!, 7.0, 1.5); // Approximate population stats
      const recency = getRecencyWeight(entry, config.timeWindow);
      const impact = engagement * Math.max(-2, Math.min(2, zScore)) * recency;
      
      return {
        entry,
        impact,
        score: entry.score,
        title: entry.media?.title?.userPreferred || entry.media?.title?.romaji || "",
        cover: entry.media?.coverImage?.large || "",
      };
    })
    .sort((a, b) => b.impact - a.impact);

  const primary = scored[0];
  const secondary = scored.slice(1, Math.min(count, scored.length));

  return {
    primary: primary ? {
      id: primary.entry.media!.id,
      title: primary.title,
      cover: primary.cover,
      score: primary.score,
      impact: primary.impact
    } : {
      id: 0, title: "No Data", cover: "/placeholder.png", impact: 0
    },
    secondary: secondary.map(s => ({
      id: s.entry.media!.id,
      title: s.title,
      cover: s.cover,
      score: s.score,
      impact: s.impact
    }))
  };
}

function buildTopManga(mangaEntries: MediaListEntry[], config: StudioConfig) {
  // Same logic as topAnime but for manga
  const topMangaModule = config.modules.find(m => m.id === "topManga");
  const count = typeof topMangaModule?.settings?.count === "number" ? topMangaModule.settings.count : 5;

  const scored = mangaEntries
    .filter(e => e.media && e.score)
    .map(entry => {
      const engagement = getEngagementWeight(entry);
      const zScore = getZScore(entry.score!, 7.0, 1.5);
      const recency = getRecencyWeight(entry, config.timeWindow);
      const impact = engagement * Math.max(-2, Math.min(2, zScore)) * recency;
      
      return {
        entry,
        impact,
        score: entry.score,
        title: entry.media?.title?.userPreferred || entry.media?.title?.romaji || "",
        cover: entry.media?.coverImage?.large || "",
      };
    })
    .sort((a, b) => b.impact - a.impact);

  const primary = scored[0];
  const secondary = scored.slice(1, Math.min(count, scored.length));

  return {
    primary: primary ? {
      id: primary.entry.media!.id,
      title: primary.title,
      cover: primary.cover,
      score: primary.score,
      impact: primary.impact
    } : {
      id: 0, title: "No Data", cover: "/placeholder.png", impact: 0
    },
    secondary: secondary.map(s => ({
      id: s.entry.media!.id,
      title: s.title,
      cover: s.cover,
      score: s.score,
      impact: s.impact
    }))
  };
}

function buildAnimeStats(animeEntries: MediaListEntry[]) {
  const episodesWatched = animeEntries.reduce((sum, e) => 
    sum + (e.status === "COMPLETED" ? e.media?.episodes || 0 : e.progress || 0), 0
  );
  
  const completed = animeEntries.filter(e => e.status === "COMPLETED").length;
  const dropped = animeEntries.filter(e => e.status === "DROPPED").length;
  
  const scoredEntries = animeEntries.filter(e => e.score);
  const meanScore = scoredEntries.length > 0 
    ? scoredEntries.reduce((sum, e) => sum + e.score!, 0) / scoredEntries.length 
    : 0;

  const daysWatched = episodesWatched * 24 / 60; // Rough estimate

  return {
    episodesWatched,
    completed,
    dropped,
    meanScore,
    daysWatched
  };
}

function buildMangaStats(mangaEntries: MediaListEntry[]) {
  const chaptersRead = mangaEntries.reduce((sum, e) => 
    sum + (e.status === "COMPLETED" ? e.media?.chapters || 0 : e.progress || 0), 0
  );
  
  const completed = mangaEntries.filter(e => e.status === "COMPLETED").length;
  const dropped = mangaEntries.filter(e => e.status === "DROPPED").length;
  
  const scoredEntries = mangaEntries.filter(e => e.score);
  const meanScore = scoredEntries.length > 0 
    ? scoredEntries.reduce((sum, e) => sum + e.score!, 0) / scoredEntries.length 
    : 0;

  const volumesRead = mangaEntries.reduce((sum, e) => 
    sum + (e.media?.volumes || 0), 0
  );

  return {
    chaptersRead,
    completed,
    dropped,
    meanScore,
    volumesRead
  };
}

function buildPercentiles(tasteProfile: TasteProfile) {
  return {
    niche: { 
      value: tasteProfile.behavioralMetrics.nicheIndex * 10, 
      label: "Niche Index" 
    },
    mainstream: { 
      value: tasteProfile.behavioralMetrics.mainstreamIndex * 10, 
      label: "Mainstream Index" 
    },
    diversity: { 
      value: tasteProfile.behavioralMetrics.diversityIndex * 10, 
      label: "Diversity" 
    }
  };
}

function buildTopTags(tasteProfile: TasteProfile, config: StudioConfig) {
  const topTagsModule = config.modules.find(m => m.id === "topTags");
  const count = typeof topTagsModule?.settings?.count === "number" ? topTagsModule.settings.count : 20;
  
  return tasteProfile.tagAffinity
    .slice(0, count)
    .map(tag => ({
      tag: tag.tag,
      weight: tag.affinity,
      count: tag.count
    }));
}

function buildGenreRadar(tasteProfile: TasteProfile) {
  return tasteProfile.genreAffinity
    .slice(0, 8) // Top 8 genres for radar
    .map(genre => ({
      genre: genre.genre,
      affinity: genre.affinity
    }));
}

function buildMonthlyActivity(entries: MediaListEntry[], _config: StudioConfig) {
  const monthlyData = new Map<string, number>();
  
  entries.forEach(entry => {
    const date = entry.completedAt || entry.startedAt;
    if (!date) return;
    
    const monthKey = `${date.year}-${String(date.month || 1).padStart(2, '0')}`;
    monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);
  });

  return Array.from(monthlyData.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months
}

function buildHottestTake(entries: MediaListEntry[], tasteProfile: TasteProfile, config: StudioConfig) {
  const hottestTakeModule = config.modules.find(m => m.id === "hottestTake");
  const source = (hottestTakeModule?.settings?.source as string) || "underrated";

  if (source === "underrated") {
    // Find most underrated: high user score vs low mean score
    const underrated = entries
      .filter(e => e.score && e.media)
      .map(entry => ({
        entry,
        diff: entry.score! - (entry.media?.meanScore || 7.0),
        title: entry.media?.title?.userPreferred || ""
      }))
      .sort((a, b) => a.diff - b.diff)[0];

    return underrated ? {
      type: "underrated",
      content: `You rated "${underrated.title}" ${underrated.entry.score} while others average ${underrated.entry.media?.meanScore || 7.0}`,
      mediaId: underrated.entry.media?.id
    } : {
      type: "underrated",
      content: "Not enough data for hottest take"
    };
  }

  return {
    type: "general",
    content: "Your taste is uniquely balanced between mainstream and niche content"
  };
}

function buildGamesRank(gamesData?: Record<string, unknown>) {
  if (!gamesData) {
    return {
      mmr: 1000,
      rank: "Iron",
      bestGame: "Quote Guessing",
      rankIcon: "🎯"
    };
  }

  return {
    mmr: (gamesData.overallRating as number) || 1000,
    rank: (gamesData.rank as string) || "Iron",
    bestGame: (gamesData.bestGame as string) || "Quote Guessing",
    rankIcon: (gamesData.rankIcon as string) || "🎯"
  };
}

function getConfidenceLevel(entryCount: number): "high" | "medium" | "low" {
  if (entryCount >= 100) return "high";
  if (entryCount >= 30) return "medium";
  return "low";
}

function getTimeRangeLabel(timeWindow: StudioTimeWindow): string {
  switch (timeWindow) {
    case "all": return "All-time";
    case "last12m": return "Last 12 months";
    case "year": return "This year";
    default: return "Custom range";
  }
}

// Utility functions
function getEngagementWeight(entry: MediaListEntry): number {
  if (entry.status === "COMPLETED") return 1.0;
  if (entry.status === "REPEATING") return 1.2;
  if (entry.status === "CURRENT") return 0.8; // Changed from WATCHING/READING
  if (entry.status === "PAUSED") return 0.5;
  if (entry.status === "DROPPED") return 0.3;
  return 0.1;
}

function getZScore(score: number, mean: number, std: number): number {
  return (score - mean) / std;
}

function getRecencyWeight(entry: MediaListEntry, timeWindow: StudioTimeWindow): number {
  if (timeWindow === "all") return 1.0;
  
  const entryDate = entry.completedAt || entry.startedAt;
  if (!entryDate) return 0.5;
  
  const entryTime = new Date(entryDate.year!, entryDate.month! || 1, entryDate.day! || 1).getTime();
  const now = Date.now();
  const daysSince = (now - entryTime) / (24 * 60 * 60 * 1000);
  
  // More recent = higher weight
  return Math.max(0.1, 1.0 - (daysSince / 365));
}
