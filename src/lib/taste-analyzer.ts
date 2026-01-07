import { Media, MediaListEntry, TasteProfile } from '@/types/anilist';

// Favorites profile vectors for blending
export interface FavoritesProfile {
  genreAffinity: Array<{ genre: string; affinity: number }>;
  tagAffinity: Array<{ tag: string; affinity: number }>;
  staffAffinity: Array<{ name: string; affinity: number }>;
  formatAffinity: Array<{ format: string; affinity: number }>;
  favoriteIds: Set<number>;
  count: number;
}

export class TasteAnalyzer {
  // Constants for Bayesian/Dirichlet smoothing and shrinkage
  private static readonly GLOBAL_MEAN_SCORE = 6.8;
  private static readonly SCORE_SHRINKAGE_LAMBDA = 5;
  private static readonly PROPORTION_PRIOR_ALPHA = 2;
  private static readonly PROPORTION_PRIOR_BETA = 2;
  private static readonly DIRICHLET_ALPHA = 0.5;

  // Completionist correction utilities
  private static getCompletionistWeights(completionRate: number) {
    // Downweight completion evidence for high completionists
    const completionEvidenceWeight = Math.max(0.2, Math.min(1.0, 1 - (completionRate - 0.75) * 2));
    
    // Amplify score evidence for completionists
    const scoreWeightMultiplier = completionRate > 0.75 
      ? 1 + 0.4 * ((completionRate - 0.75) / 0.25)  // 1.0 to 1.4
      : 1.0;
    
    return { completionEvidenceWeight, scoreWeightMultiplier };
  }

  private static calculateUserScoreStats(mediaList: MediaListEntry[]) {
    const scoredEntries = mediaList.filter(e => e.score && e.score > 0);
    if (scoredEntries.length === 0) return { mean: this.GLOBAL_MEAN_SCORE, std: 2, count: 0 };
    
    const scores = scoredEntries.map(e => e.score!);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const std = Math.sqrt(variance) || 1;
    
    return { mean, std, count: scores.length };
  }

  private static getScoreZScore(score: number, userStats: { mean: number; std: number }): number {
    return (score - userStats.mean) / userStats.std;
  }

  static analyzeTaste(mediaList: MediaListEntry[], type: 'ANIME' | 'MANGA' = 'ANIME'): TasteProfile {
    const genreData = new Map<string, { count: number; totalScore: number; progressUnits: number; scoredCount: number }>();
    const tagData = new Map<string, { count: number; totalScore: number; progressUnits: number; scoredCount: number; avgRank: number }>();
    const sourceData = new Map<string, { count: number; totalScore: number; progressUnits: number; scoredCount: number }>();
    const yearData = new Map<number, { count: number; totalScore: number; progressUnits: number; scoredCount: number }>();
    const formatData = new Map<string, { count: number; totalScore: number; progressUnits: number; scoredCount: number }>();
    
    let totalProgress = 0;
    let completedCount = 0;
    let droppedCount = 0;
    let rewatchCount = 0;
    let totalScoreSum = 0;
    let scoredCountNum = 0;
    const scores: number[] = [];

    const analyzedList = mediaList.filter(entry => entry.status !== 'PLANNING');
    const n = analyzedList.length;
    
    analyzedList.forEach(entry => {
      const media = entry.media;
      if (!media) return;
      
      const mediaTotal = type === 'ANIME' ? (media.episodes || 1) : (media.chapters || 1);
      const progress = entry.progress || 0;
      const repeats = entry.repeat || 0;
      
      const progressWatched = entry.status === 'COMPLETED' 
        ? mediaTotal * (repeats + 1)
        : progress;
      
      const score = entry.score || 0;
      
      totalProgress += progressWatched;
      
      if (entry.status === 'COMPLETED') completedCount++;
      else if (entry.status === 'DROPPED') droppedCount++;
      
      rewatchCount += repeats;
      
      if (score > 0) {
        totalScoreSum += score;
        scoredCountNum++;
        scores.push(score);
      }

      if (media.genres) {
        media.genres.forEach((genre: string) => {
          const existing = genreData.get(genre) || { count: 0, totalScore: 0, progressUnits: 0, scoredCount: 0 };
          genreData.set(genre, {
            count: existing.count + 1,
            totalScore: existing.totalScore + score,
            progressUnits: existing.progressUnits + progressWatched,
            scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
          });
        });
      }

      if (media.tags) {
        media.tags.forEach((tag) => {
          if (tag.isGeneralSpoiler || tag.isMediaSpoiler) return;
          const existing = tagData.get(tag.name) || { count: 0, totalScore: 0, progressUnits: 0, scoredCount: 0, avgRank: 0 };
          const newCount = existing.count + 1;
          tagData.set(tag.name, {
            count: newCount,
            totalScore: existing.totalScore + score,
            progressUnits: existing.progressUnits + progressWatched,
            scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
            avgRank: ((existing.avgRank * existing.count) + (tag.rank || 50)) / newCount,
          });
        });
      }

      if (type === 'ANIME' && media.studios?.edges) {
        media.studios.edges.forEach((studioEdge) => {
          if (studioEdge.isMain && studioEdge.node.isAnimationStudio) {
            const studioName = studioEdge.node.name;
            const existing = sourceData.get(studioName) || { count: 0, totalScore: 0, progressUnits: 0, scoredCount: 0 };
            sourceData.set(studioName, {
              count: existing.count + 1,
              totalScore: existing.totalScore + score,
              progressUnits: existing.progressUnits + progressWatched,
              scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
            });
          }
        });
      } else if (type === 'MANGA' && media.staff?.edges) {
        media.staff.edges.forEach((staffEdge) => {
          const staffName = staffEdge.node.name.full;
          const existing = sourceData.get(staffName) || { count: 0, totalScore: 0, progressUnits: 0, scoredCount: 0 };
          sourceData.set(staffName, {
            count: existing.count + 1,
            totalScore: existing.totalScore + score,
            progressUnits: existing.progressUnits + progressWatched,
            scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
          });
        });
      }

      if (media.startDate?.year) {
        const year = media.startDate.year;
        const existing = yearData.get(year) || { count: 0, totalScore: 0, progressUnits: 0, scoredCount: 0 };
        yearData.set(year, {
          count: existing.count + 1,
          totalScore: existing.totalScore + score,
          progressUnits: existing.progressUnits + progressWatched,
          scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
        });
      }

      if (media.format) {
        const format = media.format;
        const existing = formatData.get(format) || { count: 0, totalScore: 0, progressUnits: 0, scoredCount: 0 };
        formatData.set(format, {
          count: existing.count + 1,
          totalScore: existing.totalScore + score,
          progressUnits: existing.progressUnits + progressWatched,
          scoredCount: existing.scoredCount + (score > 0 ? 1 : 0),
        });
      }
    });

    // Shrinkage for mean score
    const rawMeanScore = scoredCountNum > 0 ? totalScoreSum / scoredCountNum : this.GLOBAL_MEAN_SCORE;
    const meanScore = (scoredCountNum * rawMeanScore + this.SCORE_SHRINKAGE_LAMBDA * this.GLOBAL_MEAN_SCORE) / (scoredCountNum + this.SCORE_SHRINKAGE_LAMBDA);
    
    const consistency = this.calculateScoreConsistency(scores);
    const scoreInflation = this.calculateScoreInflation(scores);
    const scoreDistribution = this.calculateScoreDistribution(scores);

    // Bayesian proportions
    const completionRate = (completedCount + this.PROPORTION_PRIOR_ALPHA) / (n + this.PROPORTION_PRIOR_ALPHA + this.PROPORTION_PRIOR_BETA);
    const dropRate = (droppedCount + this.PROPORTION_PRIOR_ALPHA) / (n + this.PROPORTION_PRIOR_ALPHA + this.PROPORTION_PRIOR_BETA);
    const rewatchRate = (rewatchCount + this.PROPORTION_PRIOR_ALPHA) / (n + this.PROPORTION_PRIOR_ALPHA + this.PROPORTION_PRIOR_BETA);
    
    // Get completionist correction weights
    const { completionEvidenceWeight, scoreWeightMultiplier } = this.getCompletionistWeights(completionRate);

    // Dirichlet smoothing for genres with completionist correction
    const genreAffinity = Array.from(genreData.entries())
      .map(([genre, data]) => {
        const totalGenreCount = Array.from(genreData.values()).reduce((sum, d) => sum + d.count, 0);
        const volumeFactor = (data.count + this.DIRICHLET_ALPHA) / (totalGenreCount + genreData.size * this.DIRICHLET_ALPHA);
        const avgScore = data.scoredCount > 0 ? (data.totalScore / data.scoredCount) : this.GLOBAL_MEAN_SCORE;
        const shrunkScore = (data.scoredCount * avgScore + this.SCORE_SHRINKAGE_LAMBDA * meanScore) / (data.scoredCount + this.SCORE_SHRINKAGE_LAMBDA);
        const scoreFactor = ((shrunkScore - 5) / 5) * scoreWeightMultiplier; // Amplified for completionists
        const countFactor = Math.min(1, data.count / (type === 'ANIME' ? 20 : 15)) * completionEvidenceWeight; // Downweighted for completionists
        const affinity = Math.max(0, Math.min(1, (volumeFactor * 4.0) + (scoreFactor * 0.35) + (countFactor * 0.15) + 0.10));
        const confidence = Math.min(1, (data.count / 8) * (data.scoredCount / Math.max(1, data.count)));
        return { genre, affinity, count: data.count, avgScore: shrunkScore, confidence };
      })
      .sort((a, b) => b.affinity - a.affinity)
      .slice(0, 15);

    const tagAffinity = Array.from(tagData.entries())
      .map(([tag, data]) => {
        const totalTagCount = Array.from(tagData.values()).reduce((sum, d) => sum + d.count, 0);
        const volumeFactor = (data.count + this.DIRICHLET_ALPHA) / (totalTagCount + tagData.size * this.DIRICHLET_ALPHA);
        const avgScore = data.scoredCount > 0 ? (data.totalScore / data.scoredCount) : this.GLOBAL_MEAN_SCORE;
        const shrunkScore = (data.scoredCount * avgScore + this.SCORE_SHRINKAGE_LAMBDA * meanScore) / (data.scoredCount + this.SCORE_SHRINKAGE_LAMBDA);
        const scoreFactor = ((shrunkScore - 5) / 5) * scoreWeightMultiplier; // Amplified for completionists
        const countFactor = Math.min(1, data.count / (type === 'ANIME' ? 25 : 20)) * completionEvidenceWeight; // Downweighted for completionists
        const affinity = Math.max(0, Math.min(1, (volumeFactor * 4.0) + (scoreFactor * 0.3) + (countFactor * 0.2) + 0.10));
        const confidence = Math.min(1, (data.count / 6) * (data.scoredCount / Math.max(1, data.count)));
        return { tag, affinity, count: data.count, avgScore: shrunkScore, avgRank: data.avgRank, confidence };
      })
      .sort((a, b) => b.affinity - a.affinity)
      .slice(0, 20);

    const studioBias = Array.from(sourceData.entries())
      .map(([source, data]) => {
        const volumeFactor = totalProgress > 0 ? (data.progressUnits / totalProgress) : 0;
        const avgScore = data.scoredCount > 0 ? (data.totalScore / data.scoredCount) : 7;
        const scoreFactor = avgScore / 10;
        const countFactor = Math.min(1, data.count / (type === 'ANIME' ? 10 : 5));
        const bias = (volumeFactor * 0.5) + (scoreFactor * 0.3) + (countFactor * 0.2);
        return { studio: source, bias, count: data.count, avgScore };
      })
      .sort((a, b) => b.bias - a.bias)
      .slice(0, 10);

    const eraPreference = Array.from(yearData.entries())
      .map(([year, data]) => {
        let era: string;
        if (year < 1990) era = '80s & Before';
        else if (year < 2000) era = '90s';
        else if (year < 2010) era = '2000s';
        else if (year < 2020) era = '2010s';
        else era = '2020s';
        const volumeFactor = totalProgress > 0 ? (data.progressUnits / totalProgress) : 0;
        const scoreFactor = (data.totalScore / (data.count || 1)) / 10;
        const preference = (volumeFactor * 0.6) + (scoreFactor * 0.4);
        return { era, preference, count: data.count, avgScore: data.totalScore / (data.count || 1) };
      })
      .reduce((acc: Array<{ era: string; preference: number; count: number; avgScore: number }>, curr) => {
        const existing = acc.find(item => item.era === curr.era);
        if (existing) {
          existing.preference += curr.preference;
          existing.count += curr.count;
        } else {
          acc.push(curr);
        }
        return acc;
      }, [])
      .sort((a, b) => b.preference - a.preference);

    const formatPreference = Array.from(formatData.entries())
      .map(([format, data]) => {
        const volumeFactor = totalProgress > 0 ? (data.progressUnits / totalProgress) : 0;
        const scoreFactor = (data.totalScore / (data.count || 1)) / 10;
        const preference = (volumeFactor * 0.6) + (scoreFactor * 0.4);
        return { format, preference, count: data.count, avgScore: data.totalScore / (data.count || 1) };
      })
      .sort((a, b) => b.preference - a.preference);

    const formatWeights = this.calculateFormatWeights(formatData);

    const bingeIndex = this.calculateBingeIndex(analyzedList, type);
    const mainstreamIndex = this.calculateMainstreamIndex(analyzedList, type);
    const nicheIndex = this.calculateNicheIndex(analyzedList, type);
    const experimentalIndex = this.calculateExperimentalIndex(analyzedList, type);
    const diversityIndex = this.calculateDiversityIndex(genreData, tagData);

    const popularities = analyzedList.map(e => e.media?.popularity || 0).filter(p => p > 0).sort((a, b) => a - b);
    const medianPopularity = popularities.length > 0 ? popularities[Math.floor(popularities.length / 2)] : 0;
    const percentMainstream = n > 0 ? analyzedList.filter(e => (e.media?.popularity || 0) > 100000).length / n : 0;
    const logNormalizedPopularity = this.calculateLogNormalizedPopularity(popularities);
    const popularityQuantile = this.calculatePopularityQuantile(medianPopularity);

    const personalityTraits = {
      completionist: completionRate * 10,
      seasonalTourist: this.calculateSeasonalTouristScore(analyzedList),
      cultHunter: (1 - mainstreamIndex) * 10,
      nostalgiaAddict: this.calculateNostalgiaScore(yearData),
      mainstreamMaxxer: mainstreamIndex * 10,
      avantGarde: experimentalIndex * 10,
      emotionalDamageIndex: this.calculateEmotionalDamageIndex(analyzedList, type),
      chaosLevel: this.calculateChaosLevel(analyzedList, type),
      genreDiversity: diversityIndex * 10,
    };

    const emotionalProfile = this.calculateEmotionalProfile(analyzedList);
    const structuralPreferences = this.calculateStructuralPreferences(analyzedList);
    const riskProfile = this.calculateRiskProfile(analyzedList);
    const contradictions = this.detectContradictions(analyzedList, genreAffinity, tagAffinity, { completionRate, nicheIndex, mainstreamIndex, experimentalIndex }, scores, type);
    const fingerprint = this.generateFingerprint(emotionalProfile, structuralPreferences, riskProfile, genreAffinity, nicheIndex, diversityIndex);

    return {
      genreAffinity,
      tagAffinity,
      studioBias,
      eraPreference,
      formatPreference,
      formatWeights,
      scorePatterns: { meanScore, scoreDistribution, scoreInflation, consistency },
      behavioralMetrics: {
        completionRate, dropRate, rewatchRate, bingeIndex, mainstreamIndex, nicheIndex, experimentalIndex, diversityIndex,
        medianPopularity, percentMainstream, logNormalizedPopularity, popularityQuantile,
        rawCompletionRate: n > 0 ? completedCount / n : 0,
        rawDropRate: n > 0 ? droppedCount / n : 0
      },
      personalityTraits,
      emotionalProfile,
      structuralPreferences,
      riskProfile,
      contradictions,
      fingerprint,
    };
  }

  private static calculateFormatWeights(formatData: Map<string, { count: number; totalScore: number; progressUnits: number; scoredCount: number }>): Record<string, number> {
    const formats = Array.from(formatData.entries());
    if (formats.length === 0) return {};
    const totalItems = formats.reduce((sum, [, d]) => sum + d.count, 0);
    const weights: Record<string, number> = {};
    formats.forEach(([format, data]) => {
      const volumeShare = data.count / totalItems;
      const avgScore = data.scoredCount > 0 ? (data.totalScore / data.scoredCount) : this.GLOBAL_MEAN_SCORE;
      const scoreWeight = avgScore / this.GLOBAL_MEAN_SCORE;
      const engagement = (volumeShare * 0.7) + (scoreWeight * 0.3);
      const avgEngagement = 1 / Math.max(1, formatData.size);
      weights[format] = Math.max(0.2, Math.min(1.4, 0.6 + 0.8 * (engagement - avgEngagement)));
    });
    return weights;
  }

  private static calculateSeasonalTouristScore(mediaList: MediaListEntry[]): number {
    const year = new Date().getFullYear();
    let y0 = 0, y1 = 0, y2 = 0;
    mediaList.forEach(e => {
      const sy = e.media?.startDate?.year;
      if (sy === year) y0++; else if (sy === year - 1) y1++; else if (sy === year - 2) y2++;
    });
    const weighted = (y0 * 1.5) + (y1 * 1.0) + (y2 * 0.5);
    return Math.min(10, Math.min(5, (y0 + y1) / 10) + Math.min(3, (weighted / (mediaList.length || 1)) * 15) + Math.min(2, y0 / 15));
  }

  private static calculateNostalgiaScore(yearData: Map<number, { count: number; totalScore: number; progressUnits: number; scoredCount: number }>): number {
    let nCount = 0, total = 0;
    yearData.forEach((d, y) => { if (y < 2010) nCount += d.count; total += d.count; });
    return total > 0 ? (nCount / total) * 10 : 0;
  }

  private static calculateLogNormalizedPopularity(popularities: number[]): number {
    if (popularities.length === 0) return 0;
    const logPops = popularities.map(p => Math.log10(Math.max(1, p)));
    const mean = logPops.reduce((a, b) => a + b, 0) / logPops.length;
    // Normalize to 0-1 scale where log10(1M) ≈ 6 is max
    return Math.min(1, mean / 6);
  }

  private static calculatePopularityQuantile(medianPop: number): string {
    // Reference quantiles based on AniList population distribution
    if (medianPop < 5000) return 'obscure';
    if (medianPop < 20000) return 'niche';
    if (medianPop < 50000) return 'moderate';
    if (medianPop < 150000) return 'popular';
    return 'mainstream';
  }

  private static calculateScoreDistribution(scores: number[]): Array<{ score: number; count: number; percentage: number }> {
    const distribution = new Map<number, number>();
    for (let score = 1; score <= 10; score++) distribution.set(score, 0);
    scores.forEach(score => {
      const rounded = Math.round(score);
      distribution.set(rounded, (distribution.get(rounded) || 0) + 1);
    });
    const total = scores.length || 1;
    return Array.from(distribution.entries()).map(([score, count]) => ({ score, count, percentage: (count / total) * 100 }));
  }

  private static calculateScoreInflation(scores: number[]): number {
    if (scores.length === 0) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.max(-1, Math.min(1, (mean - this.GLOBAL_MEAN_SCORE) / (10 - this.GLOBAL_MEAN_SCORE)));
  }

  private static calculateScoreConsistency(scores: number[]): number {
    if (scores.length < 2) return 1;
    const sorted = [...scores].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const deviations = scores.map(s => Math.abs(s - median)).sort((a, b) => a - b);
    const mad = deviations[Math.floor(deviations.length / 2)];
    const robustSigma = 1.4826 * mad;
    return Math.exp(-robustSigma / 2.0);
  }

  private static calculateBingeIndex(mediaList: MediaListEntry[], type: 'ANIME' | 'MANGA' = 'ANIME'): number {
    const completed = mediaList.filter(e => e.status === 'COMPLETED' && e.startedAt?.year && e.completedAt?.year);
    if (completed.length === 0) return 0;
    const bingeScores = completed.map(e => {
      try {
        const start = new Date(e.startedAt.year!, (e.startedAt.month || 1) - 1, e.startedAt.day || 1);
        const end = new Date(e.completedAt.year!, (e.completedAt.month || 1) - 1, e.completedAt.day || 1);
        const diffDays = Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const units = type === 'ANIME' 
          ? (e.media?.episodes || e.progress || 1) 
          : (e.media?.chapters || e.progress || 1);
        const unitsPerDay = units / diffDays;
        if (unitsPerDay <= 1) return unitsPerDay * 0.15;
        if (unitsPerDay <= 3) return 0.15 + ((unitsPerDay - 1) / 2) * 0.35;
        if (unitsPerDay <= 6) return 0.5 + ((unitsPerDay - 3) / 3) * 0.35;
        return Math.min(1, 0.85 + ((unitsPerDay - 6) / 4) * 0.15);
      } catch { return 0; }
    });
    return bingeScores.reduce((a, b) => a + b, 0) / bingeScores.length;
  }

  private static calculateMainstreamIndex(mediaList: MediaListEntry[], type: 'ANIME' | 'MANGA' = 'ANIME'): number {
    if (mediaList.length === 0) return 0;
    const weighted = mediaList.map(e => {
      const pop = e.media?.popularity || 0;
      const weight = e.status === 'COMPLETED' ? 1.0 : e.status === 'CURRENT' ? 0.7 : e.status === 'DROPPED' ? 0.3 : 0.5;
      const total = type === 'ANIME' ? (e.media?.episodes || 1) : (e.media?.chapters || 1);
      const progressWeight = e.status === 'COMPLETED' ? 1.0 : Math.min(1, (e.progress || 0) / total);
      
      // Formula: log10(popularity) normalized to 0-1 (roughly 0 to 6.5 for AniList)
      const normPop = Math.min(1, Math.log10(pop + 1) / 6.0);
      return normPop * weight * progressWeight;
    });
    const totalW = mediaList.length; // Simplified
    return weighted.reduce((a, b) => a + b, 0) / totalW;
  }

  private static calculateNicheIndex(mediaList: MediaListEntry[], type: 'ANIME' | 'MANGA' = 'ANIME'): number {
    if (mediaList.length === 0) return 0;
    let nicheW = 0, totalW = 0;
    mediaList.forEach(e => {
      const pop = e.media?.popularity || 0;
      if (pop === 0) return;
      const total = type === 'ANIME' ? (e.media?.episodes || 1) : (e.media?.chapters || 1);
      const weight = e.status === 'COMPLETED' ? 1.0 : Math.min(1, (e.progress || 0) / total) * 0.7;
      totalW += weight;
      if (pop < 5000) nicheW += weight * (1 - pop / 5000);
      else if (pop < 20000) nicheW += weight * (1 - (pop - 5000) / 15000) * 0.5;
    });
    return totalW > 0 ? (nicheW / totalW) * 10 : 0;
  }

  private static calculateExperimentalIndex(mediaList: MediaListEntry[], type: 'ANIME' | 'MANGA' = 'ANIME'): number {
    const expTags = [
      'Experimental', 'Surreal', 'Abstract', 'Avant Garde', 'Psychological', 
      'Philosophical', 'Deconstruction', 'Meta', 'Non-linear', 'Symbolism'
    ];
    if (mediaList.length === 0) return 0;
    let expW = 0, totalW = 0;
    mediaList.forEach(e => {
      const total = type === 'ANIME' ? (e.media?.episodes || 1) : (e.media?.chapters || 1);
      const weight = e.status === 'COMPLETED' ? 1.0 : Math.min(1, (e.progress || 0) / total) * 0.6;
      totalW += weight;
      const matches = (e.media?.tags || []).filter(t => expTags.some(et => t.name.includes(et)));
      if (matches.length > 0) expW += weight * (matches.reduce((s, t) => s + (t.rank || 50), 0) / matches.length / 100);
    });
    return totalW > 0 ? (expW / totalW) : 0;
  }

  private static calculateEmotionalDamageIndex(mediaList: MediaListEntry[], type: 'ANIME' | 'MANGA' = 'ANIME'): number {
    const emotionalTags = [
      // Core emotional damage
      'Tragedy', 'Drama', 'Psychological', 'Horror', 'Thriller', 'Gore', 'Tearjerker',
      // Mental health & trauma
      'Mental Illness', 'Depression', 'Suicide', 'Loneliness', 'Isolation', 'Post-Apocalyptic', 'Dystopian',
      // Narrative weight
      'Bittersweet', 'Melancholy', 'Existential', 'Death', 'Loss of a Loved One', 'Nihilism', 'Suffering'
    ];
    
    if (mediaList.length === 0) return 0;
    
    const userScoreStats = this.calculateUserScoreStats(mediaList);
    let totalScore = 0;
    let totalWeight = 0;
    
    mediaList.forEach(entry => {
      const score = entry.score || 0;
      if (score === 0) return; // Skip unrated entries
      
      const matches = (entry.media?.tags || []).filter(t => 
        emotionalTags.some(et => t.name.includes(et))
      );
      
      if (matches.length > 0) {
        // Calculate preference based on z-score, not completion
        const zScore = this.getScoreZScore(score, userScoreStats);
        
        // Only count positive preferences (above their mean)
        if (zScore > 0) {
          // Weight by tag relevance (higher rank = more relevant)
          const tagRelevance = matches.reduce((sum, tag) => sum + (100 - (tag.rank || 50)), 0) / (matches.length * 100);
          
          // Light completion weight, but preference is primary
          const total = type === 'ANIME' ? (entry.media?.episodes || 1) : (entry.media?.chapters || 1);
          const completionWeight = entry.status === 'COMPLETED' ? 1.0 : Math.min(1, (entry.progress || 0) / total) * 0.3;
          
          const finalWeight = (zScore * 0.7) + (tagRelevance * 0.2) + (completionWeight * 0.1);
          totalScore += finalWeight;
          totalWeight += 1;
        }
      }
    });
    
    if (totalWeight === 0) return 0;
    
    // Normalize to 0-10 scale
    const baseIndex = (totalScore / totalWeight) * 10;
    
    // Apply guard: if average score on emotional content is below user's mean, reduce index
    const emotionalEntries = mediaList.filter(entry => {
      const score = entry.score || 0;
      if (score === 0) return false;
      const matches = (entry.media?.tags || []).filter(t => 
        emotionalTags.some(et => t.name.includes(et))
      );
      return matches.length > 0;
    });
    
    if (emotionalEntries.length > 0) {
      const avgEmotionalScore = emotionalEntries.reduce((sum, e) => sum + (e.score || 0), 0) / emotionalEntries.length;
      const scoreDiff = avgEmotionalScore - userScoreStats.mean;
      
      // If they rate emotional content below their average, reduce the index
      if (scoreDiff < 0) {
        return Math.max(0, baseIndex + (scoreDiff / userScoreStats.std) * 2);
      }
    }
    
    return Math.min(10, baseIndex);
  }

  private static calculateChaosLevel(mediaList: MediaListEntry[], type: 'ANIME' | 'MANGA' = 'ANIME'): number {
    const chaosTags = [
      // Meta & Surreal
      'Surreal Comedy', 'Parody', 'Satire', 'Absurdist', 'Slapstick', 'Crossover',
      // Subversive
      'Deconstruction', 'Subversive', 'Cosplay', '4th Wall', 'Meta', 'Self-Insert', 'Isekai', 'Reincarnation',
      // Trope-heavy
      'School Battle Harem', 'Battle Harem', 'Accidental Pervert', 'Hot Springs',
      'Beach Episode', 'Festival', 'Cultural Festival', 'Sports Festival',
      // Wild premises
      'Absurdist', 'Random', 'Gag Humor', 'Dark Comedy', 'Deadpan', 'Satire',
      'Delinquents', 'Yakuza', 'Gambling', 'Death Game', 'Battle Royale',
      'Prison', 'Underground', 'Cult', 'Demons', 'Magic', 'Supernatural'
    ];
    if (mediaList.length === 0) return 0;
    let score = 0;
    mediaList.forEach(e => {
      const total = type === 'ANIME' ? (e.media?.episodes || 1) : (e.media?.chapters || 1);
      const pct = Math.min(1, (e.progress || 0) / total);
      const matches = (e.media?.tags || []).filter(t => chaosTags.some(ct => t.name.includes(ct)));
      if (matches.length > 0) score += (matches.reduce((s, t) => s + (t.rank || 0), 0) / 100) * pct;
    });
    return Math.min(10, (score / mediaList.length) * 8);
  }

  private static calculateEmotionalProfile(mediaList: MediaListEntry[]): { escapism: number; bleakness: number; idealism: number; intensity: number; sentimentality: number } {
    const escapismTags = [
      // Fantasy & otherworldly
      'Fantasy', 'Isekai', 'Magic', 'Supernatural', 'Virtual World', 'Reincarnation',
      'Time Travel', 'Parallel Universe', 'Alternate Universe', 'Portal Fantasy',
      // Sci-fi escapism
      'Space', 'Space Opera', 'Mecha', 'Cyberpunk', 'Steampunk', 'Post-Apocalyptic',
      // Adventure & exploration
      'Adventure', 'Quest', 'Dungeon', 'RPG', 'VRMMO', 'Game',
      // Power fantasy
      'Super Power', 'Overpowered', 'Cultivation', 'Martial Arts', 'Battle',
      'Shounen', 'Transformation', 'Magical Girl'
    ];
    const groundedTags = [
      // Daily life
      'Slice of Life', 'School', 'Workplace', 'Daily Life', 'Realistic', 'Documentary',
      // Relationships & social
      'School Club', 'College', 'Office Lady', 'Salaryman', 'Part-Time Job',
      // Hobbies & activities
      'Cooking', 'Food', 'Music', 'Band', 'Sports', 'Camping', 'Fishing',
      // Grounded genres
      'Drama', 'Josei', 'Seinen', 'Historical', 'Period Piece'
    ];
    const bleakTags = [
      // Death & suffering
      'Tragedy', 'Death', 'War', 'Post-Apocalyptic', 'Dystopia', 'Genocide',
      // Psychological darkness
      'Psychological', 'Gore', 'Dark Fantasy', 'Suicide', 'Depression', 'Trauma',
      // Horror elements
      'Horror', 'Body Horror', 'Cosmic Horror', 'Survival Horror',
      // Moral darkness
      'Nihilism', 'Corruption', 'Betrayal', 'Revenge', 'Murder', 'Crime',
      // Heavy themes
      'Abuse', 'Slavery', 'Torture', 'Terminal Illness', 'PTSD'
    ];
    const wholesomeTags = [
      // Healing & comfort
      'Cute Girls Doing Cute Things', 'Iyashikei', 'Wholesome', 'Feel-Good', 'Heartwarming',
      // Family & bonds
      'Family', 'Found Family', 'Friendship', 'Pets', 'Childcare',
      // Light & fluffy
      'Cute', 'Moe', 'Slice of Life', 'Comedy', 'Gag Humor',
      // Positive themes
      'Coming of Age', 'Self-Discovery', 'Redemption', 'Happy Ending'
    ];
    const idealisticGenres = ['Comedy', 'Romance', 'Adventure', 'Sports', 'Music', 'Slice of Life'];
    const cynicalTags = [
      // Anti-establishment
      'Anti-Hero', 'Revenge', 'Nihilism', 'Corruption', 'Betrayal', 'Morally Grey',
      // Dark worldviews
      'Dystopia', 'Conspiracy', 'Political', 'War', 'Crime', 'Mafia',
      // Character cynicism
      'Villain Protagonist', 'Antihero', 'Manipulative', 'Sociopath',
      // System critique
      'Satire', 'Deconstruction', 'Subversive'
    ];
    const intenseTags = [
      // Action & combat
      'Action', 'Thriller', 'Horror', 'Suspense', 'Battle Royale', 'Survival', 'Gore',
      // High stakes
      'Death Game', 'War', 'Military', 'Martial Arts', 'Fighting',
      // Adrenaline
      'Racing', 'Sports', 'Competition', 'Tournament', 'Esports',
      // Psychological intensity
      'Psychological', 'Mind Game', 'Conspiracy', 'Mystery'
    ];
    const calmTags = [
      // Healing & relaxing
      'Slice of Life', 'Iyashikei', 'Relaxing', 'Cute', 'Peaceful', 'Wholesome',
      // Slow activities
      'Cooking', 'Gardening', 'Fishing', 'Camping', 'Travel',
      // Contemplative
      'Philosophical', 'Atmospheric', 'Scenery', 'Nature'
    ];
    const sentimentalTags = [
      // Romance & love
      'Romance', 'Drama', 'Coming of Age', 'Family', 'Tearjerker',
      'Love Triangle', 'Unrequited Love', 'First Love', 'Childhood Friends',
      // Emotional bonds
      'Friendship', 'Found Family', 'Pets', 'Parenting', 'Sibling',
      // Life stages
      'School', 'Graduation', 'Marriage', 'Pregnancy', 'Aging',
      // Specific romance types
      'Shoujo', 'Josei', 'BL', 'GL', 'Yuri', 'Yaoi', 'Otome'
    ];

    let esc = 0, grd = 0, blk = 0, whl = 0, idl = 0, cyn = 0, inten = 0, clm = 0, sen = 0, totalW = 0;
    mediaList.forEach(e => {
      const weight = e.status === 'COMPLETED' ? 1.0 : 0.5; totalW += weight;
      const t = e.media?.tags?.map(x => x.name) || []; const g = e.media?.genres || [];
      if (t.some(x => escapismTags.some(et => x.includes(et)))) esc += weight;
      if (t.some(x => groundedTags.some(gt => x.includes(gt)))) grd += weight;
      if (t.some(x => bleakTags.some(bt => x.includes(bt)))) blk += weight;
      if (t.some(x => wholesomeTags.some(wt => x.includes(wt)))) whl += weight;
      if (g.some(x => idealisticGenres.includes(x))) idl += weight;
      if (t.some(x => cynicalTags.some(ct => x.includes(ct)))) cyn += weight;
      if (t.some(x => intenseTags.some(it => x.includes(it))) || g.includes('Action')) inten += weight;
      if (t.some(x => calmTags.some(ct => x.includes(ct)))) clm += weight;
      if (t.some(x => sentimentalTags.some(st => x.includes(st))) || g.includes('Romance') || g.includes('Drama')) sen += weight;
    });
    if (totalW === 0) return { escapism: 0.5, bleakness: 0.3, idealism: 0.5, intensity: 0.5, sentimentality: 0.5 };
    return {
      escapism: Math.min(1, esc / (esc + grd + 0.1)),
      bleakness: Math.min(1, blk / (blk + whl + 0.1)),
      idealism: Math.min(1, idl / (idl + cyn + 0.1)),
      intensity: Math.min(1, inten / (inten + clm + 0.1)),
      sentimentality: Math.min(1, sen / totalW),
    };
  }

  private static calculateDiversityIndex(
    genreData: Map<string, { count: number; totalScore: number; progressUnits: number; scoredCount: number }>,
    tagData: Map<string, { count: number; totalScore: number; progressUnits: number; scoredCount: number; avgRank: number }>
  ): number {
    // Genre Entropy
    const totalGenres = Array.from(genreData.values()).reduce((s, d) => s + d.count, 0);
    let genreEntropy = 0;
    if (totalGenres > 0) {
      genreData.forEach(d => { const p = d.count / totalGenres; if (p > 0) genreEntropy -= p * Math.log(p); });
    }

    // Tag Entropy (use top 50 tags to reduce noise from very rare tags)
    const sortedTags = Array.from(tagData.values()).sort((a, b) => b.count - a.count).slice(0, 50);
    const totalTags = sortedTags.reduce((s, d) => s + d.count, 0);
    let tagEntropy = 0;
    if (totalTags > 0) {
      sortedTags.forEach(d => { const p = d.count / totalTags; if (p > 0) tagEntropy -= p * Math.log(p); });
    }

    // Weighted average: 40% Genre, 60% Tag (Tags provide more granular diversity info)
    // Normalize by approximate max entropy (Genre ~3.0, Tag ~4.0 for varied tastes)
    const normGenre = Math.min(1, genreEntropy / 2.5);
    const normTag = Math.min(1, tagEntropy / 3.5);
    
    return (normGenre * 0.4) + (normTag * 0.6);
  }

  private static calculateStructuralPreferences(mediaList: MediaListEntry[]): { episodicVsSerial: number; pacingPreference: number; plotVsCharacter: number; complexityPreference: number } {
    // Episodic: standalone stories, each entry works alone
    const epi = [
      'Episodic', 'Anthology', 'Slice of Life', 'Comedy', 'Gag Humor',
      'Monster of the Week', 'Sketch Comedy', 'Vignette', 'Short Episodes',
      'Iyashikei', 'Cute Girls Doing Cute Things', 'Daily Life'
    ];
    // Serialized: continuous plot across entries
    const ser = [
      'Story Arc', 'Shounen', 'Plot Continuity', 'Mystery', 'Thriller',
      'Epic', 'Saga', 'War', 'Revenge', 'Conspiracy', 'Tournament',
      'Survival', 'Death Game', 'Battle Royale', 'Cultivation'
    ];
    // Slow-paced: deliberate, contemplative
    const slw = [
      'Slow Burn', 'Slice of Life', 'Iyashikei', 'Character Development',
      'Atmospheric', 'Scenery', 'Philosophical', 'Drama', 'Romance',
      'Cooking', 'Fishing', 'Gardening', 'Travel', 'Countryside',
      'Coming of Age', 'Primarily Adult Cast', 'Josei', 'Seinen'
    ];
    // Fast-paced: action-heavy, quick progression
    const fst = [
      'Action', 'Thriller', 'Battle Royale', 'Fast-Paced', 'Fighting',
      'Martial Arts', 'Sports', 'Racing', 'Esports', 'Competition',
      'Shounen', 'Battle', 'War', 'Military', 'Mecha', 'Superhero',
      'Death Game', 'Survival', 'Chase', 'Heist'
    ];
    // Character-driven: focus on character growth and relationships
    const chr = [
      'Character Development', 'Ensemble Cast', 'Coming of Age', 'Psychological',
      'Slice of Life', 'Romance', 'Drama', 'Family', 'Friendship',
      'Found Family', 'Redemption', 'Self-Discovery', 'Trauma',
      'Bildungsroman', 'Aging', 'Identity', 'LGBT'
    ];
    // Plot-driven: focus on events and story
    const plt = [
      'Plot Twists', 'Mystery', 'Conspiracy', 'War', 'Thriller',
      'Detective', 'Crime', 'Heist', 'Revenge', 'Political',
      'Death Game', 'Survival', 'Battle Royale', 'Tournament',
      'Shounen', 'Epic', 'Isekai', 'Quest', 'Adventure'
    ];
    // Complex narratives: require attention, layered storytelling
    const cpx = [
      'Non-linear', 'Philosophical', 'Psychological', 'Time Manipulation',
      'Unreliable Narrator', 'Multiple Timelines', 'Time Loop', 'Mind Game',
      'Surreal', 'Abstract', 'Avant Garde', 'Experimental', 'Meta',
      'Deconstruction', 'Subversive', 'Cosmic Horror', 'Existential',
      'Amnesia', 'Memory Manipulation', 'Dream World', 'Alternate Reality',
      'Parallel Universe', 'Anthology', 'Fragmented'
    ];
    
    let epiS = 0, serS = 0, slwS = 0, fstS = 0, chrS = 0, pltS = 0, cpxS = 0, totalW = 0;
    mediaList.forEach(e => {
      const weight = e.status === 'COMPLETED' ? 1.0 : 0.5; totalW += weight;
      const t = e.media?.tags?.map(x => x.name) || [];
      if (t.some(x => epi.some(et => x.includes(et)))) epiS += weight;
      if (t.some(x => ser.some(st => x.includes(st)))) serS += weight;
      if (t.some(x => slw.some(sb => x.includes(sb)))) slwS += weight;
      if (t.some(x => fst.some(fp => x.includes(fp)))) fstS += weight;
      if (t.some(x => chr.some(ct => x.includes(ct)))) chrS += weight;
      if (t.some(x => plt.some(pt => x.includes(pt)))) pltS += weight;
      if (t.some(x => cpx.some(cx => x.includes(cx)))) cpxS += weight;
    });
    if (totalW === 0) return { episodicVsSerial: 0.5, pacingPreference: 0.5, plotVsCharacter: 0.5, complexityPreference: 0.3 };
    return {
      episodicVsSerial: serS / (epiS + serS + 0.1),
      pacingPreference: fstS / (slwS + fstS + 0.1),
      plotVsCharacter: pltS / (chrS + pltS + 0.1),
      complexityPreference: Math.min(1, cpxS / (totalW * 0.3)),
    };
  }

  private static calculateRiskProfile(mediaList: MediaListEntry[]): { curve: Array<{ bucket: string; minPop: number; maxPop: number; engagement: number; completionRate: number; avgScore: number }>; preferredTier: string; riskTolerance: number } {
    const buckets = [
      { bucket: '<5k', min: 0, max: 5000, e: [] as MediaListEntry[] },
      { bucket: '5k-20k', min: 5000, max: 20000, e: [] as MediaListEntry[] },
      { bucket: '20k-100k', min: 20000, max: 100000, e: [] as MediaListEntry[] },
      { bucket: '100k+', min: 100000, max: Infinity, e: [] as MediaListEntry[] },
    ];
    mediaList.forEach(e => {
      const p = e.media?.popularity || 0;
      const b = buckets.find(x => p >= x.min && p < x.max);
      if (b) b.e.push(e);
    });
    const total = mediaList.length || 1;
    const curve = buckets.map(b => {
      const comp = b.e.filter(x => x.status === 'COMPLETED').length;
      const scored = b.e.filter(x => x.score && x.score > 0);
      const avg = scored.length > 0 ? scored.reduce((s, x) => s + (x.score || 0), 0) / scored.length : 0;
      return { bucket: b.bucket, minPop: b.min, maxPop: b.max === Infinity ? 999999999 : b.max, engagement: b.e.length / total, completionRate: b.e.length > 0 ? comp / b.e.length : 0, avgScore: avg };
    });
    const pref = curve.reduce((m, c) => c.engagement > m.engagement ? c : m, curve[0]).bucket;
    const obscure = curve.slice(0, 2).reduce((s, c) => s + c.engagement, 0);
    return { curve, preferredTier: pref, riskTolerance: Math.min(1, obscure * 1.5) };
  }

  private static detectContradictions(
    mediaList: MediaListEntry[],
    genreAffinity: Array<{ genre: string; affinity: number; count: number; avgScore: number; confidence: number }>,
    tagAffinity: Array<{ tag: string; affinity: number; count: number; avgScore: number; avgRank: number; confidence: number }>,
    metrics: { completionRate: number; nicheIndex: number; mainstreamIndex: number; experimentalIndex: number },
    scores: number[],
    type: 'ANIME' | 'MANGA' = 'ANIME'
  ): Array<{ id: string; type: 'RATING_VS_BEHAVIOR' | 'STATED_VS_ACTUAL' | 'GENRE_MISMATCH' | 'COMPLETION_PARADOX'; severity: 'MILD' | 'MODERATE' | 'STRONG'; description: string; evidence: string }> {
    const contradictions: Array<{ id: string; type: 'RATING_VS_BEHAVIOR' | 'STATED_VS_ACTUAL' | 'GENRE_MISMATCH' | 'COMPLETION_PARADOX'; severity: 'MILD' | 'MODERATE' | 'STRONG'; description: string; evidence: string }> = [];
    const expTags = tagAffinity.filter(t => ['Psychological', 'Surreal', 'Philosophical', 'Experimental'].some(et => t.tag.includes(et)));
    if (expTags.length > 2 && metrics.mainstreamIndex > 0.7) {
      const action = type === 'ANIME' ? 'watching' : 'reading';
      contradictions.push({ 
        id: 'exp-mainstream', 
        type: 'STATED_VS_ACTUAL', 
        severity: metrics.mainstreamIndex > 0.85 ? 'STRONG' : 'MODERATE', 
        description: `You gravitate toward experimental tags but primarily ${action} mainstream titles.`, 
        evidence: `Experimental tag affinity detected, but ${Math.round(metrics.mainstreamIndex * 100)}% mainstream index.` 
      });
    }
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 7;
    const action = type === 'ANIME' ? 'rewatch' : 'reread';
    const rewatch = mediaList.filter(e => (e.repeat || 0) > 0).length / (mediaList.length || 1);
    if (avg < 6.5 && rewatch > 0.15) {
      contradictions.push({ 
        id: 'harsh-rewatch', 
        type: 'RATING_VS_BEHAVIOR', 
        severity: avg < 6 ? 'STRONG' : 'MODERATE', 
        description: `You rate harshly but ${action} frequently—secretly enjoying more than you admit?`, 
        evidence: `Average score ${avg.toFixed(1)}/10, but ${Math.round(rewatch * 100)}% ${action} rate.` 
      });
    }
    const topByCount = [...genreAffinity].sort((a, b) => b.count - a.count)[0];
    const topByScore = [...genreAffinity].filter(g => g.count >= 5).sort((a, b) => b.avgScore - a.avgScore)[0];
    if (topByCount && topByScore && topByCount.genre !== topByScore.genre && Math.abs(topByCount.avgScore - topByScore.avgScore) > 1) {
      const action = type === 'ANIME' ? 'watch' : 'read';
      const unit = type === 'ANIME' ? 'episodes' : 'chapters';
      contradictions.push({ 
        id: 'genre-score-mismatch', 
        type: 'GENRE_MISMATCH', 
        severity: 'MILD', 
        description: `You ${action} a lot of ${topByCount.genre}, but you clearly enjoy ${topByScore.genre} more.`,
        evidence: `Highest ${unit} in ${topByCount.genre}, but average score is only ${topByCount.avgScore.toFixed(1)}.`
      });
    }
    return contradictions;
  }

  private static generateFingerprint(
    emotional: { escapism: number; bleakness: number; idealism: number; intensity: number; sentimentality: number },
    structural: { episodicVsSerial: number; pacingPreference: number; plotVsCharacter: number; complexityPreference: number },
    risk: { preferredTier: string; riskTolerance: number },
    genreAffinity: Array<{ genre: string; affinity: number }>,
    nicheIndex: number,
    diversity: number
  ): { code: string; primaryArchetype: string; secondaryArchetype: string; uniquenessScore: number } {
    const segments: string[] = [];
    if (emotional.bleakness > 0.6) segments.push('DRK'); else if (emotional.idealism > 0.6) segments.push('OPT'); else segments.push('BAL');
    if (emotional.escapism > 0.7) segments.push('ESC'); else if (emotional.escapism < 0.3) segments.push('GRD'); else segments.push('MIX');
    if (risk.riskTolerance > 0.6) segments.push('NIC'); else if (risk.riskTolerance < 0.3) segments.push('POP'); else segments.push('MID');
    if (structural.pacingPreference > 0.6) segments.push('FAST'); else if (structural.pacingPreference < 0.4) segments.push('SLOW'); else segments.push('MDRN');
    if (diversity > 0.7) segments.push('DIV'); else if (diversity < 0.3) segments.push('FOC'); else segments.push('VAR');
    const archetypes = this.determineArchetypes(emotional, structural, risk, genreAffinity, nicheIndex);
    const avgDev = Math.abs(emotional.escapism - 0.5) + Math.abs(emotional.bleakness - 0.3) + Math.abs(risk.riskTolerance - 0.4) + Math.abs(diversity - 0.5);
    return { code: segments.join('-'), primaryArchetype: archetypes.primary, secondaryArchetype: archetypes.secondary, uniquenessScore: Math.min(1, avgDev / 2) };
  }

  private static determineArchetypes(
    emotional: { escapism: number; bleakness: number; idealism: number; intensity: number; sentimentality: number },
    structural: { pacingPreference: number; complexityPreference: number },
    risk: { riskTolerance: number },
    genreAffinity: Array<{ genre: string; affinity: number }>,
    nicheIndex: number
  ): { primary: string; secondary: string } {
    const s: Record<string, number> = {
      'The Escapist': emotional.escapism * 2 + (genreAffinity.some(g => g.genre === 'Fantasy') ? 1 : 0),
      'The Analyst': structural.complexityPreference * 2 + (emotional.sentimentality < 0.3 ? 1 : 0),
      'The Romantic': emotional.sentimentality * 2 + (genreAffinity.some(g => g.genre === 'Romance') ? 1 : 0),
      'The Thrill-Seeker': emotional.intensity * 2 + structural.pacingPreference,
      'The Connoisseur': risk.riskTolerance * 2 + nicheIndex,
      'The Idealist': emotional.idealism * 2 + (1 - emotional.bleakness),
      'The Realist': (1 - emotional.escapism) * 2 + emotional.bleakness,
      'The Casual': (1 - structural.complexityPreference) * 2 + (1 - risk.riskTolerance),
    };
    const sorted = Object.entries(s).sort((a, b) => b[1] - a[1]);
    return { primary: sorted[0][0], secondary: sorted[1][0] };
  }

  /**
   * Analyze favorites to create a favorites-only profile vector
   */
  static analyzeFavorites(favorites: Media[], type: 'ANIME' | 'MANGA' = 'ANIME'): FavoritesProfile {
    const genreCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    const staffCounts = new Map<string, number>();
    const formatCounts = new Map<string, number>();
    const favoriteIds = new Set<number>();

    favorites.forEach(media => {
      if (!media) return;
      favoriteIds.add(media.id);

      // Genre counts
      if (media.genres) {
        media.genres.forEach((genre: string) => {
          genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
        });
      }

      // Tag counts
      if (media.tags) {
        media.tags.forEach(tag => {
          if (!tag.isGeneralSpoiler && !tag.isMediaSpoiler) {
            tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1);
          }
        });
      }

      // Staff/Studio counts
      if (type === 'ANIME' && media.studios?.edges) {
        media.studios.edges.forEach(edge => {
          if (edge.isMain && edge.node.isAnimationStudio) {
            staffCounts.set(edge.node.name, (staffCounts.get(edge.node.name) || 0) + 1);
          }
        });
      } else if (type === 'MANGA' && media.staff?.edges) {
        media.staff.edges.forEach(edge => {
          const name = edge.node.name.full;
          staffCounts.set(name, (staffCounts.get(name) || 0) + 1);
        });
      }

      // Format counts
      if (media.format) {
        formatCounts.set(media.format, (formatCounts.get(media.format) || 0) + 1);
      }
    });

    const n = favorites.length || 1;

    // Convert to affinity arrays (normalized by count)
    const genreAffinity = Array.from(genreCounts.entries())
      .map(([genre, count]) => ({ genre, affinity: count / n }))
      .sort((a, b) => b.affinity - a.affinity);

    const tagAffinity = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, affinity: count / n }))
      .sort((a, b) => b.affinity - a.affinity);

    const staffAffinity = Array.from(staffCounts.entries())
      .map(([name, count]) => ({ name, affinity: count / n }))
      .sort((a, b) => b.affinity - a.affinity);

    const formatAffinity = Array.from(formatCounts.entries())
      .map(([format, count]) => ({ format, affinity: count / n }))
      .sort((a, b) => b.affinity - a.affinity);

    return {
      genreAffinity,
      tagAffinity,
      staffAffinity,
      formatAffinity,
      favoriteIds,
      count: favorites.length
    };
  }

  /**
   * Calculate adaptive blending lambda based on favorites count
   * λ = clamp(0.05 + 0.25 * (1 - e^(-n/10)), 0.05, 0.30)
   */
  static calculateFavoritesLambda(favoritesCount: number): number {
    if (favoritesCount === 0) return 0;
    const raw = 0.05 + 0.25 * (1 - Math.exp(-favoritesCount / 10));
    return Math.max(0.05, Math.min(0.30, raw));
  }

  /**
   * Blend list profile with favorites profile
   * P' = (1 - λ)P + λF
   */
  static blendGenreAffinity(
    listAffinity: Array<{ genre: string; affinity: number }>,
    favAffinity: Array<{ genre: string; affinity: number }>,
    lambda: number
  ): Array<{ genre: string; affinity: number; count: number; avgScore: number; confidence: number; favoritesBoost: number }> {
    const allGenres = new Set([
      ...listAffinity.map(g => g.genre),
      ...favAffinity.map(g => g.genre)
    ]);

    const blended: Array<{ genre: string; affinity: number; count: number; avgScore: number; confidence: number; favoritesBoost: number }> = [];

    allGenres.forEach(genre => {
      const listItem = listAffinity.find(g => g.genre === genre);
      const favItem = favAffinity.find(g => g.genre === genre);
      
      const listVal = listItem?.affinity || 0;
      const favVal = favItem?.affinity || 0;
      const favoritesBoost = favVal * lambda;
      
      const blendedAffinity = (1 - lambda) * listVal + lambda * favVal;
      
      blended.push({
        genre,
        affinity: blendedAffinity,
        count: (listItem as { count?: number })?.count || 0,
        avgScore: (listItem as { avgScore?: number })?.avgScore || this.GLOBAL_MEAN_SCORE,
        confidence: (listItem as { confidence?: number })?.confidence || 0,
        favoritesBoost
      });
    });

    return blended.sort((a, b) => b.affinity - a.affinity);
  }

  /**
   * Blend staff/studio bias with favorites (2x weight for favorites)
   */
  static blendStaffBias(
    listBias: Array<{ studio: string; bias: number; count: number; avgScore: number }>,
    favStaff: Array<{ name: string; affinity: number }>,
    lambda: number
  ): Array<{ studio: string; bias: number; count: number; avgScore: number; fromFavorites: boolean }> {
    const allStaff = new Set([
      ...listBias.map(s => s.studio),
      ...favStaff.map(s => s.name)
    ]);

    const blended: Array<{ studio: string; bias: number; count: number; avgScore: number; fromFavorites: boolean }> = [];
    const FAVORITES_STAFF_MULTIPLIER = 2.0;
    const MAX_STAFF_BIAS = 1.5; // Cap to prevent one creator dominating

    allStaff.forEach(studio => {
      const listItem = listBias.find(s => s.studio === studio);
      const favItem = favStaff.find(s => s.name === studio);
      
      const listVal = listItem?.bias || 0;
      const favVal = favItem?.affinity || 0;
      
      // Apply 2x weight to favorites staff
      const blendedBias = Math.min(MAX_STAFF_BIAS, listVal + FAVORITES_STAFF_MULTIPLIER * favVal * lambda);
      
      blended.push({
        studio,
        bias: blendedBias,
        count: listItem?.count || 0,
        avgScore: listItem?.avgScore || this.GLOBAL_MEAN_SCORE,
        fromFavorites: favItem !== undefined && favItem.affinity > 0
      });
    });

    return blended.sort((a, b) => b.bias - a.bias);
  }

  /**
   * Compare favorites DNA vs list DNA for UI display
   */
  static compareFavoritesVsList(
    listProfile: TasteProfile,
    favProfile: FavoritesProfile
  ): {
    genreSkew: Array<{ genre: string; listPct: number; favPct: number; diff: number }>;
    dominantInFavorites: string[];
    insights: string[];
  } {
    if (favProfile.count === 0) {
      return { genreSkew: [], dominantInFavorites: [], insights: ['No favorites to analyze'] };
    }

    // Compare genre distribution
    const listGenres = new Map(listProfile.genreAffinity.map(g => [g.genre, g.affinity]));
    const favGenres = new Map(favProfile.genreAffinity.map(g => [g.genre, g.affinity]));
    const allGenres = new Set([...listGenres.keys(), ...favGenres.keys()]);

    const genreSkew: Array<{ genre: string; listPct: number; favPct: number; diff: number }> = [];
    allGenres.forEach(genre => {
      const listPct = (listGenres.get(genre) || 0) * 100;
      const favPct = (favGenres.get(genre) || 0) * 100;
      genreSkew.push({ genre, listPct, favPct, diff: favPct - listPct });
    });
    genreSkew.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    // Find genres dominant in favorites
    const dominantInFavorites = genreSkew
      .filter(g => g.diff > 10)
      .slice(0, 3)
      .map(g => g.genre);

    // Generate insights
    const insights: string[] = [];
    const topFavSkew = genreSkew.filter(g => g.diff > 15);
    const topListSkew = genreSkew.filter(g => g.diff < -15);

    if (topFavSkew.length > 0) {
      insights.push(`Your favorites skew toward ${topFavSkew.map(g => g.genre).join(', ')}`);
    }
    if (topListSkew.length > 0) {
      insights.push(`You consume more ${topListSkew.map(g => g.genre).join(', ')} than you favorite`);
    }
    
    // Check for psychological/dark skew
    const darkTags = ['Psychological', 'Tragedy', 'Drama', 'Thriller'];
    const favDarkCount = favProfile.tagAffinity.filter(t => darkTags.includes(t.tag)).length;
    if (favDarkCount >= 2) {
      insights.push('Your favorites lean darker and more psychological than your overall list');
    }

    return { genreSkew: genreSkew.slice(0, 10), dominantInFavorites, insights };
  }

  /**
   * Calculate cosine similarity between a media item and favorites
   * Returns the max similarity to any favorite
   */
  static calculateFavoriteSimilarity(
    media: Media,
    favProfile: FavoritesProfile
  ): { similarity: number; matchedFavorite?: string } {
    if (favProfile.count === 0) return { similarity: 0 };

    // Simple genre/tag overlap similarity
    const mediaGenres = new Set(media.genres || []);
    const mediaTags = new Set((media.tags || []).map(t => t.name));

    let maxSimilarity = 0;

    // Genre similarity (Jaccard-like)
    const favGenreSet = new Set(favProfile.genreAffinity.slice(0, 5).map(g => g.genre));
    const genreIntersect = [...mediaGenres].filter(g => favGenreSet.has(g)).length;
    const genreUnion = new Set([...mediaGenres, ...favGenreSet]).size;
    const genreSim = genreUnion > 0 ? genreIntersect / genreUnion : 0;

    // Tag similarity
    const favTagSet = new Set(favProfile.tagAffinity.slice(0, 10).map(t => t.tag));
    const tagIntersect = [...mediaTags].filter(t => favTagSet.has(t)).length;
    const tagUnion = new Set([...mediaTags, ...favTagSet]).size;
    const tagSim = tagUnion > 0 ? tagIntersect / tagUnion : 0;

    maxSimilarity = 0.6 * genreSim + 0.4 * tagSim;

    return { similarity: maxSimilarity };
  }
}
