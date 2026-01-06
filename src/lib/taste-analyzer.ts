import { MediaListEntry, TasteProfile } from '@/types/anilist';

export class TasteAnalyzer {
  static analyzeTaste(mediaList: MediaListEntry[], type: 'ANIME' | 'MANGA' = 'ANIME'): TasteProfile {
    const genreData = new Map<string, { count: number; totalScore: number; episodes: number; scoredCount: number }>();
    const tagData = new Map<string, { count: number; totalScore: number; episodes: number; scoredCount: number; avgRank: number }>();
    const sourceData = new Map<string, { count: number; totalScore: number; episodes: number; scoredCount: number }>();
    const yearData = new Map<number, { count: number; totalScore: number; episodes: number; scoredCount: number }>();
    const formatData = new Map<string, { count: number; totalScore: number; episodes: number; scoredCount: number }>();
    
    let totalProgress = 0;
    let completedCount = 0;
    let droppedCount = 0;
    let rewatchCount = 0;
    let totalScore = 0;
    let scoredCount = 0;
    const scores: number[] = [];

    const analyzedList = mediaList.filter(entry => entry.status !== 'PLANNING');
    
    analyzedList.forEach(entry => {
      const media = entry.media;
      if (!media) return;
      
      const mediaTotal = type === 'ANIME' ? (media.episodes || 1) : (media.chapters || 1);
      const progress = type === 'ANIME' ? (entry.progress || 0) : (entry.progress || 0);
      const repeats = entry.repeat || 0;
      
      const progressWatched = entry.status === 'COMPLETED' 
        ? mediaTotal * (repeats + 1)
        : progress;
      
      const score = entry.score || 0;
      
      totalProgress += progressWatched;
      
      if (entry.status === 'COMPLETED') {
        completedCount++;
      } else if (entry.status === 'DROPPED') {
        droppedCount++;
      }
      
      rewatchCount += repeats;
      
      if (score > 0) {
        totalScore += score;
        scoredCount++;
        scores.push(score);
      }

      // Analyze genres
      if (media.genres) {
        media.genres.forEach((genre: string) => {
          const existing = genreData.get(genre) || { count: 0, totalScore: 0, episodes: 0, scoredCount: 0 };
          genreData.set(genre, {
            count: existing.count + 1,
            totalScore: existing.totalScore + score,
            episodes: existing.episodes + progressWatched,
            scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
          });
        });
      }

      // Analyze tags (important for nuanced recommendations)
      if (media.tags) {
        media.tags.forEach((tag) => {
          if (tag.isGeneralSpoiler || tag.isMediaSpoiler) return; // Skip spoiler tags
          const existing = tagData.get(tag.name) || { count: 0, totalScore: 0, episodes: 0, scoredCount: 0, avgRank: 0 };
          const newCount = existing.count + 1;
          tagData.set(tag.name, {
            count: newCount,
            totalScore: existing.totalScore + score,
            episodes: existing.episodes + progressWatched,
            scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
            avgRank: ((existing.avgRank * existing.count) + (tag.rank || 50)) / newCount,
          });
        });
      }

      // Analyze source (Studios for Anime, Staff/Authors for Manga)
      if (type === 'ANIME' && media.studios?.edges) {
        media.studios.edges.forEach((studioEdge) => {
          if (studioEdge.isMain && studioEdge.node.isAnimationStudio) {
            const studioName = studioEdge.node.name;
            const existing = sourceData.get(studioName) || { count: 0, totalScore: 0, episodes: 0, scoredCount: 0 };
            sourceData.set(studioName, {
              count: existing.count + 1,
              totalScore: existing.totalScore + score,
              episodes: existing.episodes + progressWatched,
              scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
            });
          }
        });
      } else if (type === 'MANGA' && media.staff?.edges) {
        media.staff.edges.forEach((staffEdge) => {
          const staffName = staffEdge.node.name.full;
          const existing = sourceData.get(staffName) || { count: 0, totalScore: 0, episodes: 0, scoredCount: 0 };
          sourceData.set(staffName, {
            count: existing.count + 1,
            totalScore: existing.totalScore + score,
            episodes: existing.episodes + progressWatched,
            scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
          });
        });
      }

      // Analyze release years
      if (media.startDate?.year) {
        const year = media.startDate.year;
        const existing = yearData.get(year) || { count: 0, totalScore: 0, episodes: 0, scoredCount: 0 };
        yearData.set(year, {
          count: existing.count + 1,
          totalScore: existing.totalScore + score,
          episodes: existing.episodes + progressWatched,
          scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
        });
      }

      // Analyze formats
      if (media.format) {
        const format = media.format;
        const existing = formatData.get(format) || { count: 0, totalScore: 0, episodes: 0, scoredCount: 0 };
        formatData.set(format, {
          count: existing.count + 1,
          totalScore: existing.totalScore + score,
          episodes: existing.episodes + progressWatched,
          scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
        });
      }
    });

    // Calculate genre affinity with confidence intervals
    const genreAffinity = Array.from(genreData.entries())
      .map(([genre, data]) => {
        const volumeFactor = totalProgress > 0 ? (data.episodes / totalProgress) : 0;
        const avgScore = data.scoredCount > 0 ? (data.totalScore / data.scoredCount) : 7;
        const scoreFactor = (avgScore - 5) / 5;
        const countFactor = Math.min(1, data.count / (type === 'ANIME' ? 20 : 15));
        
        const affinity = Math.max(0, Math.min(1,
          (volumeFactor * 0.40) + (scoreFactor * 0.35) + (countFactor * 0.15) + 0.10
        ));
        
        // Confidence based on sample size and score consistency
        // More data = higher confidence, minimum 5 entries for "confident"
        const confidence = Math.min(1, (data.count / 8) * (data.scoredCount / Math.max(1, data.count)));
        
        return { genre, affinity, count: data.count, avgScore, confidence };
      })
      .sort((a, b) => b.affinity - a.affinity)
      .slice(0, 15);

    // Calculate tag affinity with confidence
    const tagAffinity = Array.from(tagData.entries())
      .map(([tag, data]) => {
        const volumeFactor = totalProgress > 0 ? (data.episodes / totalProgress) : 0;
        const avgScore = data.scoredCount > 0 ? (data.totalScore / data.scoredCount) : 7;
        const scoreFactor = (avgScore - 5) / 5;
        const countFactor = Math.min(1, data.count / 10);
        const rankFactor = data.avgRank / 100;
        
        const affinity = Math.max(0, Math.min(1,
          (volumeFactor * 0.30) + (scoreFactor * 0.30) + (countFactor * 0.20) + (rankFactor * 0.20)
        ));
        
        const confidence = Math.min(1, (data.count / 5) * (data.scoredCount / Math.max(1, data.count)));
        
        return { tag, affinity, count: data.count, avgScore, avgRank: data.avgRank, confidence };
      })
      .sort((a, b) => b.affinity - a.affinity)
      .slice(0, 20);

    // Calculate studio/staff bias
    const studioBias = Array.from(sourceData.entries())
      .map(([source, data]) => {
        const volumeFactor = totalProgress > 0 ? (data.episodes / totalProgress) : 0;
        const avgScore = data.scoredCount > 0 ? (data.totalScore / data.scoredCount) : 7;
        const scoreFactor = avgScore / 10;
        const countFactor = Math.min(1, data.count / (type === 'ANIME' ? 10 : 5));
        const bias = (volumeFactor * 0.5) + (scoreFactor * 0.3) + (countFactor * 0.2);

        return {
          studio: source,
          bias,
          count: data.count,
          avgScore: avgScore,
        };
      })
      .sort((a, b) => b.bias - a.bias)
      .slice(0, 10);

    // Calculate era preference
    const eraPreference = Array.from(yearData.entries())
      .map(([year, data]) => {
        let era: string;
        if (year < 1990) era = '80s & Before';
        else if (year < 2000) era = '90s';
        else if (year < 2010) era = '2000s';
        else if (year < 2020) era = '2010s';
        else era = '2020s';
        
        const volumeFactor = totalProgress > 0 ? (data.episodes / totalProgress) : 0;
        const scoreFactor = (data.totalScore / (data.count || 1)) / 10;
        const preference = (volumeFactor * 0.6) + (scoreFactor * 0.4);

        return {
          era,
          preference,
          count: data.count,
          avgScore: data.totalScore / (data.count || 1),
        };
      })
      .reduce((acc: Array<{ era: string; preference: number; count: number; avgScore: number }>, curr) => {
        const existing = acc.find(item => item.era === curr.era);
        if (existing) {
          existing.preference += curr.preference;
          existing.count += curr.count;
          existing.avgScore = (existing.avgScore * (existing.count - curr.count) + curr.avgScore * curr.count) / existing.count;
        } else {
          acc.push(curr);
        }
        return acc;
      }, [])
      .sort((a, b) => b.preference - a.preference);

    // Calculate format preference
    const formatPreference = Array.from(formatData.entries())
      .map(([format, data]) => {
        const volumeFactor = totalProgress > 0 ? (data.episodes / totalProgress) : 0;
        const scoreFactor = (data.totalScore / (data.count || 1)) / 10;
        const preference = (volumeFactor * 0.6) + (scoreFactor * 0.4);

        return {
          format,
          preference,
          count: data.count,
          avgScore: data.totalScore / (data.count || 1),
        };
      })
      .sort((a, b) => b.preference - a.preference);

    // Calculate score patterns
    const meanScore = scoredCount > 0 ? totalScore / scoredCount : 0;
    const scoreDistribution = this.calculateScoreDistribution(scores);
    const scoreInflation = this.calculateScoreInflation(scores);
    const consistency = this.calculateScoreConsistency(scores);

    // Calculate behavioral metrics
    const completionRate = analyzedList.length > 0 ? completedCount / analyzedList.length : 0;
    const dropRate = analyzedList.length > 0 ? droppedCount / analyzedList.length : 0;
    const rewatchRate = analyzedList.length > 0 ? rewatchCount / analyzedList.length : 0;
    const bingeIndex = this.calculateBingeIndex(analyzedList);
    const mainstreamIndex = this.calculateMainstreamIndex(analyzedList);
    const nicheIndex = this.calculateNicheIndex(analyzedList);
    const experimentalIndex = this.calculateExperimentalIndex(analyzedList);
    const diversityIndex = this.calculateDiversityIndex(genreData);

    // Calculate personality traits
    // Completionist score: high completion rate, penalized by drops
    const completionistScore = Math.max(0, (completionRate - dropRate) * 10);
    const personalityTraits = {
      completionist: completionistScore,
      seasonalTourist: this.calculateSeasonalTouristScore(analyzedList),
      cultHunter: nicheIndex * 10,
      nostalgiaAddict: this.calculateNostalgiaScore(yearData),
      mainstreamMaxxer: mainstreamIndex * 10,
      artSnob: experimentalIndex * 10,
      emotionalDamageIndex: this.calculateEmotionalDamageIndex(analyzedList),
      chaosLevel: this.calculateChaosLevel(analyzedList),
      genreDiversity: diversityIndex * 10,
    };

    // NEW: Calculate Emotional Profile Vector
    const emotionalProfile = this.calculateEmotionalProfile(analyzedList, tagData, genreData);
    
    // NEW: Calculate Structural Preferences Vector
    const structuralPreferences = this.calculateStructuralPreferences(analyzedList, tagData, formatData);
    
    // NEW: Calculate Risk Tolerance Profile
    const riskProfile = this.calculateRiskProfile(analyzedList);
    
    // NEW: Detect Taste Contradictions
    const contradictions = this.detectContradictions(
      analyzedList, genreAffinity, tagAffinity, 
      { completionRate, nicheIndex, mainstreamIndex, experimentalIndex },
      scores
    );
    
    // NEW: Generate Taste Fingerprint
    const fingerprint = this.generateFingerprint(
      emotionalProfile, structuralPreferences, riskProfile,
      genreAffinity, nicheIndex, diversityIndex
    );

    return {
      genreAffinity,
      tagAffinity,
      studioBias,
      eraPreference,
      formatPreference,
      scorePatterns: {
        meanScore,
        scoreDistribution,
        scoreInflation,
        consistency,
      },
      behavioralMetrics: {
        completionRate,
        dropRate,
        rewatchRate,
        bingeIndex,
        mainstreamIndex,
        nicheIndex,
        experimentalIndex,
        diversityIndex,
      },
      personalityTraits,
      emotionalProfile,
      structuralPreferences,
      riskProfile,
      contradictions,
      fingerprint,
    };
  }

  private static calculateScoreDistribution(scores: number[]): Array<{ score: number; count: number; percentage: number }> {
    const distribution = new Map<number, number>();
    
    for (let score = 1; score <= 10; score++) {
      distribution.set(score, 0);
    }
    
    scores.forEach(score => {
      const roundedScore = Math.round(score);
      distribution.set(roundedScore, (distribution.get(roundedScore) || 0) + 1);
    });

    const total = scores.length;
    return Array.from(distribution.entries()).map(([score, count]) => ({
      score,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  /**
   * Calculate score inflation relative to global AniList average (~6.8)
   * Returns -1 to 1 where:
   *  -1 = Very harsh scorer (avg ~4)
   *   0 = Average scorer (avg ~6.8)
   *  +1 = Very generous scorer (avg ~9.5)
   */
  private static calculateScoreInflation(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    // AniList global average is around 6.8, use that as baseline
    const GLOBAL_AVG = 6.8;
    const inflation = (mean - GLOBAL_AVG) / (10 - GLOBAL_AVG); // Normalize: 6.8 = 0, 10 = 1
    return Math.max(-1, Math.min(1, inflation));
  }

  /**
   * Calculate scoring consistency based on standard deviation
   * Returns 0 to 1 where:
   *   0 = Very inconsistent (std dev >= 2.5, scores all over the place)
   *   1 = Very consistent (std dev ~0, always gives similar scores)
   * Most users have std dev around 1.5-2.0
   */
  private static calculateScoreConsistency(scores: number[]): number {
    if (scores.length < 2) return 1;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Typical std dev is 1.5-2.0. Max reasonable is ~3.0
    // Using 2.5 as the threshold for "inconsistent"
    return Math.max(0, 1 - (standardDeviation / 2.5));
  }

  /**
   * Calculate binge-watching tendency based on completion speed
   * Returns 0 to 1 where:
   *   0 = Slow watcher (< 1 ep/day average)
   *   0.5 = Moderate (2-3 eps/day)
   *   1 = Heavy binger (6+ eps/day consistently)
   */
  private static calculateBingeIndex(mediaList: MediaListEntry[]): number {
    const completedEntries = mediaList.filter(entry => 
      entry.status === 'COMPLETED' && 
      entry.startedAt?.year && 
      entry.completedAt?.year
    );
    
    if (completedEntries.length === 0) return 0;

    const bingeScores = completedEntries.map(entry => {
      try {
        const start = new Date(entry.startedAt.year!, (entry.startedAt.month || 1) - 1, entry.startedAt.day || 1);
        const end = new Date(entry.completedAt.year!, (entry.completedAt.month || 1) - 1, entry.completedAt.day || 1);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
        
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        const episodes = entry.media?.episodes || entry.progress || 1;
        const epsPerDay = episodes / diffDays;
        
        // Scoring curve:
        // 1 ep/day = 0.15, 3 eps/day = 0.5, 6 eps/day = 0.85, 10+ eps/day = 1.0
        if (epsPerDay <= 1) return epsPerDay * 0.15;
        if (epsPerDay <= 3) return 0.15 + ((epsPerDay - 1) / 2) * 0.35;
        if (epsPerDay <= 6) return 0.5 + ((epsPerDay - 3) / 3) * 0.35;
        return Math.min(1, 0.85 + ((epsPerDay - 6) / 4) * 0.15);
      } catch {
        return null;
      }
    }).filter((score): score is number => score !== null);

    if (bingeScores.length === 0) return 0;
    return bingeScores.reduce((a, b) => a + b, 0) / bingeScores.length;
  }

  /**
   * Calculate mainstream preference based on weighted popularity of watched media
   * Uses logarithmic scale since popularity follows power law distribution
   * Returns 0 to 1 where:
   *   0 = Watches mostly obscure titles (<1k popularity)
   *   0.5 = Mixed watching habits
   *   1 = Primarily watches mega-popular titles (100k+)
   */
  private static calculateMainstreamIndex(mediaList: MediaListEntry[]): number {
    if (mediaList.length === 0) return 0;

    // Weight by completion - completed shows count more than dropped/watching
    const weightedScores = mediaList.map(entry => {
      const pop = entry.media?.popularity || 0;
      const weight = entry.status === 'COMPLETED' ? 1.0 : 
                     entry.status === 'CURRENT' ? 0.7 : 
                     entry.status === 'DROPPED' ? 0.3 : 0.5;
      
      if (pop <= 500) return { score: 0, weight };
      
      // Logarithmic scale: 500 to 500k popularity
      // log10(500) ≈ 2.7, log10(500,000) ≈ 5.7
      const normalizedPop = (Math.log10(pop) - 2.7) / 3;
      return { score: Math.max(0, Math.min(1, normalizedPop)), weight };
    });

    const totalWeight = weightedScores.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight === 0) return 0;
    
    return weightedScores.reduce((sum, w) => sum + w.score * w.weight, 0) / totalWeight;
  }

  /**
   * Calculate niche/obscure anime preference
   * Measures how much of the user's watchlist consists of lesser-known titles
   * Returns 0 to 1 where:
   *   0 = Only watches popular titles
   *   0.5 = Some niche titles in collection
   *   1 = Primarily seeks out obscure titles
   */
  private static calculateNicheIndex(mediaList: MediaListEntry[]): number {
    if (mediaList.length === 0) return 0;

    let nicheWeight = 0;
    let totalWeight = 0;

    mediaList.forEach(entry => {
      const popularity = entry.media?.popularity || 0;
      if (popularity === 0) return;
      
      // Weight by how much they engaged with this title
      const progress = entry.progress || 0;
      const total = entry.media?.episodes || entry.media?.chapters || progress || 1;
      const engagementWeight = entry.status === 'COMPLETED' ? 1.0 : 
                               Math.min(1, progress / total) * 0.7;
      
      totalWeight += engagementWeight;

      // Niche scoring: exponential decay based on popularity
      // < 5k = very niche, 5k-20k = somewhat niche, > 20k = not niche
      if (popularity < 5000) {
        nicheWeight += engagementWeight * (1 - popularity / 5000) * 1.0;
      } else if (popularity < 20000) {
        nicheWeight += engagementWeight * (1 - (popularity - 5000) / 15000) * 0.5;
      }
    });

    if (totalWeight === 0) return 0;
    return Math.min(1, nicheWeight / totalWeight);
  }

  /**
   * Calculate preference for experimental/avant-garde content
   * Based on presence of specific tags that indicate unconventional storytelling
   * Returns 0 to 1 where:
   *   0 = Prefers conventional storytelling
   *   0.5 = Occasionally watches experimental content  
   *   1 = Actively seeks experimental/arthouse content
   */
  private static calculateExperimentalIndex(mediaList: MediaListEntry[]): number {
    if (mediaList.length === 0) return 0;

    // Tags that indicate experimental/unconventional content (AniList tag names)
    const experimentalTags = [
      'Surreal', 'Avant Garde', 'Psychological', 'Abstract', 
      'Non-linear', 'Fragmented', 'Philosophical', 'Meta',
      'Episodic', 'Iyashikei', 'Primarily Adult Cast'
    ];
    
    let experimentalWeight = 0;
    let totalWeight = 0;

    mediaList.forEach(entry => {
      const mediaTags = entry.media?.tags || [];
      const progress = entry.progress || 0;
      const total = entry.media?.episodes || entry.media?.chapters || progress || 1;
      const engagementWeight = entry.status === 'COMPLETED' ? 1.0 : 
                               Math.min(1, progress / total) * 0.6;
      
      totalWeight += engagementWeight;
      
      // Find matching experimental tags and weight by their rank
      const matchingTags = mediaTags.filter(tag => 
        experimentalTags.some(et => tag.name.includes(et) || et.includes(tag.name))
      );
      
      if (matchingTags.length > 0) {
        // Average the tag ranks (0-100) and normalize
        const avgRank = matchingTags.reduce((sum, tag) => sum + (tag.rank || 50), 0) / matchingTags.length;
        experimentalWeight += engagementWeight * (avgRank / 100);
      }
    });

    if (totalWeight === 0) return 0;
    return Math.min(1, experimentalWeight / totalWeight);
  }

  private static calculateSeasonalTouristScore(mediaList: MediaListEntry[]): number {
    if (mediaList.length === 0) return 0;

    const currentYear = new Date().getFullYear();
    const seasonalEntries = mediaList.filter(entry => {
      const year = entry.media?.startDate?.year;
      return year === currentYear || year === currentYear - 1;
    });

    return (seasonalEntries.length / mediaList.length) * 10;
  }

  private static calculateNostalgiaScore(yearData: Map<number, { count: number; totalScore: number; episodes: number }>): number {
    let nostalgiaCount = 0;
    let totalCount = 0;

    yearData.forEach((data, year) => {
      if (year < 2010) { // Consider pre-2010 as nostalgic
        nostalgiaCount += data.count;
      }
      totalCount += data.count;
    });

    return totalCount > 0 ? (nostalgiaCount / totalCount) * 10 : 0;
  }

  private static calculateEmotionalDamageIndex(mediaList: MediaListEntry[]): number {
    if (mediaList.length === 0) return 0;

    const emotionalTags = ['Tragedy', 'Drama', 'Psychological', 'Horror', 'Thriller', 'Gore', 'Tearjerker', 'Depression'];
    let emotionalScore = 0;

    mediaList.forEach(entry => {
      const episodes = entry.progress || 0;
      const totalMediaEpisodes = entry.media?.episodes || episodes || 1;
      const watchPercentage = Math.min(1, episodes / totalMediaEpisodes);
      
      const mediaTags = entry.media?.tags || [];
      const hasEmotionalTag = mediaTags.some(tag => emotionalTags.includes(tag.name));
      
      if (hasEmotionalTag) {
        const avgTagRank = mediaTags
          .filter(tag => emotionalTags.includes(tag.name))
          .reduce((sum, tag) => sum + (tag.rank || 0), 0) / 100;
        // Weight by watch percentage - if you dropped it, it didn't damage you as much
        emotionalScore += avgTagRank * watchPercentage;
      }
    });

    return Math.min(10, (emotionalScore / (mediaList.length * 0.3)) * 10);
  }

  private static calculateChaosLevel(mediaList: MediaListEntry[]): number {
    if (mediaList.length === 0) return 0;

    const chaosTags = ['Ecchi', 'Harem', 'Comedy', 'Parody', 'Gore', 'Action', 'Psychological', 'Dementia', 'Surreal', 'Supernatural'];
    let chaosScore = 0;

    mediaList.forEach(entry => {
      const episodes = entry.progress || 0;
      const totalMediaEpisodes = entry.media?.episodes || episodes || 1;
      const watchPercentage = Math.min(1, episodes / totalMediaEpisodes);

      const mediaTags = entry.media?.tags || [];
      const hasChaosTag = mediaTags.some(tag => chaosTags.includes(tag.name));
      
      if (hasChaosTag) {
        const avgTagRank = mediaTags
          .filter(tag => chaosTags.includes(tag.name))
          .reduce((sum, tag) => sum + (tag.rank || 0), 0) / 100;
        chaosScore += avgTagRank * watchPercentage;
      }
    });

    return Math.min(10, (chaosScore / (mediaList.length * 0.4)) * 10);
  }

  private static calculateDiversityIndex(genreData: Map<string, { count: number; totalScore: number; episodes: number; scoredCount: number }>): number {
    if (genreData.size === 0) return 0;
    
    // Using a simplified Shannon Diversity Index approach
    // Higher number of unique genres and more even distribution = higher diversity
    const totalGenreAppearances = Array.from(genreData.values()).reduce((sum, data) => sum + data.count, 0);
    if (totalGenreAppearances === 0) return 0;

    let shannonIndex = 0;
    genreData.forEach((data) => {
      const p = data.count / totalGenreAppearances;
      if (p > 0) {
        shannonIndex -= p * Math.log(p);
      }
    });

    // Normalize: Max Shannon index for N categories is log(N). 
    // AniList has about 15-20 common genres. log(15) ~ 2.7
    // Using 2.2 as a more reachable "high diversity" threshold
    return Math.min(1, shannonIndex / 2.2);
  }

  /**
   * Calculate Emotional Profile Vector
   * Maps user's taste to emotional axes based on genre/tag patterns
   */
  private static calculateEmotionalProfile(
    mediaList: MediaListEntry[],
    _tagData: Map<string, { count: number; totalScore: number; episodes: number; scoredCount: number; avgRank: number }>,
    _genreData: Map<string, { count: number; totalScore: number; episodes: number; scoredCount: number }>
  ): { escapism: number; bleakness: number; idealism: number; intensity: number; sentimentality: number } {
    
    // Tag/genre mappings to emotional axes
    const escapismTags = ['Isekai', 'Fantasy', 'Magic', 'Virtual World', 'Reincarnation', 'Alternate Universe'];
    const groundedTags = ['Slice of Life', 'Workplace', 'School', 'Family Life', 'Realistic'];
    const bleakTags = ['Tragedy', 'Death', 'War', 'Survival', 'Gore', 'Dystopian', 'Post-Apocalyptic'];
    const wholesomeTags = ['Iyashikei', 'Cute Girls Doing Cute Things', 'Found Family', 'Heartwarming'];
    const idealisticGenres = ['Shounen', 'Mahou Shoujo', 'Sports'];
    const cynicalTags = ['Seinen', 'Psychological', 'Noir', 'Anti-Hero', 'Moral Ambiguity'];
    const intenseTags = ['Action', 'Thriller', 'Horror', 'Battle Royale', 'Survival'];
    const calmTags = ['Slice of Life', 'Iyashikei', 'Music', 'Gourmet'];
    const sentimentalTags = ['Romance', 'Drama', 'Tragedy', 'Coming of Age', 'Tearjerker'];
    
    let escapismScore = 0, groundedScore = 0;
    let bleakScore = 0, wholesomeScore = 0;
    let idealisticScore = 0, cynicalScore = 0;
    let intenseScore = 0, calmScore = 0;
    let sentimentalScore = 0;
    let totalWeight = 0;

    mediaList.forEach(entry => {
      const tags = entry.media?.tags?.map(t => t.name) || [];
      const genres = entry.media?.genres || [];
      const weight = entry.status === 'COMPLETED' ? 1.0 : 0.5;
      totalWeight += weight;

      // Escapism vs Grounded
      if (tags.some(t => escapismTags.some(et => t.includes(et)))) escapismScore += weight;
      if (tags.some(t => groundedTags.some(gt => t.includes(gt)))) groundedScore += weight;
      
      // Bleakness vs Wholesome
      if (tags.some(t => bleakTags.some(bt => t.includes(bt)))) bleakScore += weight;
      if (tags.some(t => wholesomeTags.some(wt => t.includes(wt)))) wholesomeScore += weight;
      
      // Idealism vs Cynicism
      if (genres.some(g => idealisticGenres.includes(g))) idealisticScore += weight;
      if (tags.some(t => cynicalTags.some(ct => t.includes(ct)))) cynicalScore += weight;
      
      // Intensity vs Calm
      if (tags.some(t => intenseTags.some(it => t.includes(it))) || genres.includes('Action')) intenseScore += weight;
      if (tags.some(t => calmTags.some(ct => t.includes(ct)))) calmScore += weight;
      
      // Sentimentality
      if (tags.some(t => sentimentalTags.some(st => t.includes(st))) || genres.includes('Romance') || genres.includes('Drama')) {
        sentimentalScore += weight;
      }
    });

    if (totalWeight === 0) {
      return { escapism: 0.5, bleakness: 0.3, idealism: 0.5, intensity: 0.5, sentimentality: 0.5 };
    }

    return {
      escapism: Math.min(1, escapismScore / (escapismScore + groundedScore + 0.1)),
      bleakness: Math.min(1, bleakScore / (bleakScore + wholesomeScore + 0.1)),
      idealism: Math.min(1, idealisticScore / (idealisticScore + cynicalScore + 0.1)),
      intensity: Math.min(1, intenseScore / (intenseScore + calmScore + 0.1)),
      sentimentality: Math.min(1, sentimentalScore / totalWeight),
    };
  }

  /**
   * Calculate Structural Preferences Vector
   * How users prefer stories to be constructed
   */
  private static calculateStructuralPreferences(
    mediaList: MediaListEntry[],
    _tagData: Map<string, { count: number; totalScore: number; episodes: number; scoredCount: number; avgRank: number }>,
    _formatData: Map<string, { count: number; totalScore: number; episodes: number; scoredCount: number }>
  ): { episodicVsSerial: number; pacingPreference: number; plotVsCharacter: number; complexityPreference: number } {
    
    const episodicTags = ['Episodic', 'Anthology', 'Slice of Life', 'Comedy'];
    const serialTags = ['Story Arc', 'Shounen', 'Plot Continuity', 'Mystery'];
    const slowBurnTags = ['Slow Burn', 'Slice of Life', 'Iyashikei', 'Character Development'];
    const fastPacedTags = ['Action', 'Thriller', 'Battle Royale', 'Fast-Paced'];
    const characterTags = ['Character Development', 'Ensemble Cast', 'Coming of Age', 'Psychological'];
    const plotTags = ['Plot Twists', 'Mystery', 'Conspiracy', 'War'];
    const complexTags = ['Non-linear', 'Philosophical', 'Psychological', 'Time Manipulation', 'Unreliable Narrator'];
    
    let episodicScore = 0, serialScore = 0;
    let slowScore = 0, fastScore = 0;
    let characterScore = 0, plotScore = 0;
    let complexScore = 0;
    let totalWeight = 0;

    mediaList.forEach(entry => {
      const tags = entry.media?.tags?.map(t => t.name) || [];
      const weight = entry.status === 'COMPLETED' ? 1.0 : 0.5;
      totalWeight += weight;

      if (tags.some(t => episodicTags.some(et => t.includes(et)))) episodicScore += weight;
      if (tags.some(t => serialTags.some(st => t.includes(st)))) serialScore += weight;
      if (tags.some(t => slowBurnTags.some(sb => t.includes(sb)))) slowScore += weight;
      if (tags.some(t => fastPacedTags.some(fp => t.includes(fp)))) fastScore += weight;
      if (tags.some(t => characterTags.some(ct => t.includes(ct)))) characterScore += weight;
      if (tags.some(t => plotTags.some(pt => t.includes(pt)))) plotScore += weight;
      if (tags.some(t => complexTags.some(cx => t.includes(cx)))) complexScore += weight;
    });

    if (totalWeight === 0) {
      return { episodicVsSerial: 0.5, pacingPreference: 0.5, plotVsCharacter: 0.5, complexityPreference: 0.3 };
    }

    return {
      episodicVsSerial: serialScore / (episodicScore + serialScore + 0.1),
      pacingPreference: fastScore / (slowScore + fastScore + 0.1),
      plotVsCharacter: plotScore / (characterScore + plotScore + 0.1),
      complexityPreference: Math.min(1, complexScore / (totalWeight * 0.3)),
    };
  }

  /**
   * Calculate Risk Tolerance Profile
   * How users engage across different popularity tiers
   */
  private static calculateRiskProfile(mediaList: MediaListEntry[]): {
    curve: Array<{ bucket: string; minPop: number; maxPop: number; engagement: number; completionRate: number; avgScore: number }>;
    preferredTier: string;
    riskTolerance: number;
  } {
    const buckets = [
      { bucket: '<5k', minPop: 0, maxPop: 5000, entries: [] as MediaListEntry[] },
      { bucket: '5k-20k', minPop: 5000, maxPop: 20000, entries: [] as MediaListEntry[] },
      { bucket: '20k-100k', minPop: 20000, maxPop: 100000, entries: [] as MediaListEntry[] },
      { bucket: '100k+', minPop: 100000, maxPop: Infinity, entries: [] as MediaListEntry[] },
    ];

    mediaList.forEach(entry => {
      const pop = entry.media?.popularity || 0;
      const bucket = buckets.find(b => pop >= b.minPop && pop < b.maxPop);
      if (bucket) bucket.entries.push(entry);
    });

    const totalEntries = mediaList.length || 1;
    
    const curve = buckets.map(b => {
      const completed = b.entries.filter(e => e.status === 'COMPLETED').length;
      const scored = b.entries.filter(e => e.score && e.score > 0);
      const avgScore = scored.length > 0 
        ? scored.reduce((sum, e) => sum + (e.score || 0), 0) / scored.length 
        : 0;
      
      return {
        bucket: b.bucket,
        minPop: b.minPop,
        maxPop: b.maxPop === Infinity ? 999999999 : b.maxPop,
        engagement: b.entries.length / totalEntries,
        completionRate: b.entries.length > 0 ? completed / b.entries.length : 0,
        avgScore,
      };
    });

    // Find preferred tier (highest engagement)
    const preferredTier = curve.reduce((max, c) => c.engagement > max.engagement ? c : max, curve[0]).bucket;
    
    // Risk tolerance = how much they engage with obscure content (<20k)
    const obscureEngagement = curve.slice(0, 2).reduce((sum, c) => sum + c.engagement, 0);
    
    return { curve, preferredTier, riskTolerance: Math.min(1, obscureEngagement * 1.5) };
  }

  /**
   * Detect Taste Contradictions
   * Find inconsistencies between stated preferences and actual behavior
   */
  private static detectContradictions(
    mediaList: MediaListEntry[],
    genreAffinity: Array<{ genre: string; affinity: number; count: number; avgScore: number; confidence: number }>,
    tagAffinity: Array<{ tag: string; affinity: number; count: number; avgScore: number; avgRank: number; confidence: number }>,
    metrics: { completionRate: number; nicheIndex: number; mainstreamIndex: number; experimentalIndex: number },
    scores: number[]
  ): Array<{ id: string; type: 'RATING_VS_BEHAVIOR' | 'STATED_VS_ACTUAL' | 'GENRE_MISMATCH' | 'COMPLETION_PARADOX'; severity: 'MILD' | 'MODERATE' | 'STRONG'; description: string; evidence: string }> {
    const contradictions: Array<{ id: string; type: 'RATING_VS_BEHAVIOR' | 'STATED_VS_ACTUAL' | 'GENRE_MISMATCH' | 'COMPLETION_PARADOX'; severity: 'MILD' | 'MODERATE' | 'STRONG'; description: string; evidence: string }> = [];

    // 1. High experimental tags but only completes mainstream
    const experimentalTagAffinity = tagAffinity.filter(t => 
      ['Psychological', 'Surreal', 'Philosophical', 'Experimental'].some(et => t.tag.includes(et))
    );
    if (experimentalTagAffinity.length > 2 && metrics.mainstreamIndex > 0.7) {
      contradictions.push({
        id: 'exp-mainstream',
        type: 'STATED_VS_ACTUAL',
        severity: metrics.mainstreamIndex > 0.85 ? 'STRONG' : 'MODERATE',
        description: 'You gravitate toward experimental tags but primarily finish mainstream titles.',
        evidence: `Experimental tag affinity detected, but ${Math.round(metrics.mainstreamIndex * 100)}% mainstream index.`
      });
    }

    // 2. Rates harshly but rewatches a lot
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 7;
    const rewatchCount = mediaList.filter(e => (e.repeat || 0) > 0).length;
    const rewatchRate = mediaList.length > 0 ? rewatchCount / mediaList.length : 0;
    if (avgScore < 6.5 && rewatchRate > 0.15) {
      contradictions.push({
        id: 'harsh-rewatch',
        type: 'RATING_VS_BEHAVIOR',
        severity: avgScore < 6 ? 'STRONG' : 'MODERATE',
        description: 'You rate harshly but rewatch frequently—secretly enjoying more than you admit?',
        evidence: `Average score ${avgScore.toFixed(1)}/10, but ${Math.round(rewatchRate * 100)}% rewatch rate.`
      });
    }

    // 3. Claims niche but drops obscure titles
    const obscureEntries = mediaList.filter(e => (e.media?.popularity || 0) < 10000);
    const obscureDrops = obscureEntries.filter(e => e.status === 'DROPPED').length;
    const obscureDropRate = obscureEntries.length > 5 ? obscureDrops / obscureEntries.length : 0;
    if (metrics.nicheIndex > 0.5 && obscureDropRate > 0.3) {
      contradictions.push({
        id: 'niche-dropper',
        type: 'COMPLETION_PARADOX',
        severity: obscureDropRate > 0.5 ? 'STRONG' : 'MODERATE',
        description: 'You seek out obscure titles but drop them more often than mainstream ones.',
        evidence: `${Math.round(obscureDropRate * 100)}% drop rate on titles under 10k popularity.`
      });
    }

    // 4. Top genre by count doesn't match top genre by score
    const topByCount = [...genreAffinity].sort((a, b) => b.count - a.count)[0];
    const topByScore = [...genreAffinity].filter(g => g.count >= 5).sort((a, b) => b.avgScore - a.avgScore)[0];
    if (topByCount && topByScore && topByCount.genre !== topByScore.genre && Math.abs(topByCount.avgScore - topByScore.avgScore) > 1) {
      contradictions.push({
        id: 'genre-score-mismatch',
        type: 'GENRE_MISMATCH',
        severity: Math.abs(topByCount.avgScore - topByScore.avgScore) > 1.5 ? 'MODERATE' : 'MILD',
        description: `You watch the most ${topByCount.genre} but rate ${topByScore.genre} higher.`,
        evidence: `${topByCount.genre}: ${topByCount.count} titles (${topByCount.avgScore.toFixed(1)} avg) vs ${topByScore.genre}: ${topByScore.count} titles (${topByScore.avgScore.toFixed(1)} avg).`
      });
    }

    return contradictions;
  }

  /**
   * Generate Taste Fingerprint
   * Compact shareable representation of taste profile
   */
  private static generateFingerprint(
    emotionalProfile: { escapism: number; bleakness: number; idealism: number; intensity: number; sentimentality: number },
    structuralPreferences: { episodicVsSerial: number; pacingPreference: number; plotVsCharacter: number; complexityPreference: number },
    riskProfile: { preferredTier: string; riskTolerance: number },
    genreAffinity: Array<{ genre: string; affinity: number }>,
    nicheIndex: number,
    diversityIndex: number
  ): { code: string; primaryArchetype: string; secondaryArchetype: string; uniquenessScore: number } {
    
    // Build code segments
    const segments: string[] = [];
    
    // Emotional tone (3 chars)
    if (emotionalProfile.bleakness > 0.6) segments.push('DRK');
    else if (emotionalProfile.idealism > 0.6) segments.push('OPT');
    else segments.push('BAL');
    
    // Content type (3 chars)
    if (emotionalProfile.escapism > 0.7) segments.push('ESC');
    else if (emotionalProfile.escapism < 0.3) segments.push('GRD');
    else segments.push('MIX');
    
    // Risk level (3 chars)
    if (riskProfile.riskTolerance > 0.6) segments.push('NIC');
    else if (riskProfile.riskTolerance < 0.3) segments.push('POP');
    else segments.push('MID');
    
    // Pacing (4 chars)
    if (structuralPreferences.pacingPreference > 0.6) segments.push('FAST');
    else if (structuralPreferences.pacingPreference < 0.4) segments.push('SLOW');
    else segments.push('MDRN');
    
    // Diversity (3 chars)
    if (diversityIndex > 0.7) segments.push('DIV');
    else if (diversityIndex < 0.3) segments.push('FOC');
    else segments.push('VAR');

    const code = segments.join('-');

    // Determine archetypes
    const archetypes = this.determineArchetypes(emotionalProfile, structuralPreferences, riskProfile, genreAffinity, nicheIndex);
    
    // Uniqueness = how far from "average" taste
    const avgDeviation = Math.abs(emotionalProfile.escapism - 0.5) + 
                        Math.abs(emotionalProfile.bleakness - 0.3) +
                        Math.abs(riskProfile.riskTolerance - 0.4) +
                        Math.abs(diversityIndex - 0.5);
    const uniquenessScore = Math.min(1, avgDeviation / 2);

    return {
      code,
      primaryArchetype: archetypes.primary,
      secondaryArchetype: archetypes.secondary,
      uniquenessScore,
    };
  }

  private static determineArchetypes(
    emotionalProfile: { escapism: number; bleakness: number; idealism: number; intensity: number; sentimentality: number },
    structuralPreferences: { episodicVsSerial: number; pacingPreference: number; plotVsCharacter: number; complexityPreference: number },
    riskProfile: { riskTolerance: number },
    genreAffinity: Array<{ genre: string; affinity: number }>,
    nicheIndex: number
  ): { primary: string; secondary: string } {
    const scores: Record<string, number> = {
      'The Escapist': emotionalProfile.escapism * 2 + (genreAffinity.some(g => g.genre === 'Fantasy') ? 1 : 0),
      'The Analyst': structuralPreferences.complexityPreference * 2 + (emotionalProfile.sentimentality < 0.3 ? 1 : 0),
      'The Romantic': emotionalProfile.sentimentality * 2 + (genreAffinity.some(g => g.genre === 'Romance') ? 1 : 0),
      'The Thrill-Seeker': emotionalProfile.intensity * 2 + structuralPreferences.pacingPreference,
      'The Connoisseur': riskProfile.riskTolerance * 2 + nicheIndex,
      'The Idealist': emotionalProfile.idealism * 2 + (1 - emotionalProfile.bleakness),
      'The Realist': (1 - emotionalProfile.escapism) * 2 + emotionalProfile.bleakness,
      'The Casual': (1 - structuralPreferences.complexityPreference) * 2 + (1 - riskProfile.riskTolerance),
    };

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return { primary: sorted[0][0], secondary: sorted[1][0] };
  }
}
