/**
 * Recommendation Staged Fallback System
 * 
 * Ensures recommendations never return empty by using progressive relaxation.
 * Tracks fallback stages for debugging and transparency.
 */

export interface FallbackStage {
  stage: number;
  name: string;
  description: string;
  constraints: {
    minScore?: number;
    maxPopularity?: number;
    minPopularity?: number;
    genreRequired?: boolean;
    tagRequired?: boolean;
    formatRequired?: boolean;
  };
  resultsFound: number;
  wasUsed: boolean;
}

export interface FallbackLog {
  mode: 'safe' | 'experimental' | 'hidden-gem' | 'opposite' | 'all';
  stages: FallbackStage[];
  finalStageUsed: number;
  totalCandidates: number;
  finalResults: number;
  relaxationApplied: string[];
  warnings: string[];
  debugInfo: {
    searchGenres: string[];
    searchTags: string[];
    formats: string[];
    originalMinScore: number;
    finalMinScore: number;
  };
}

/**
 * Get fallback stages for a specific mode
 */
export function getFallbackStages(
  mode: 'safe' | 'experimental' | 'hidden-gem' | 'opposite' | 'all',
  originalMinScore: number
): FallbackStage[] {
  const stages: FallbackStage[] = [];
  
  switch (mode) {
    case 'safe':
      stages.push(
        {
          stage: 1,
          name: 'Strict Safe',
          description: 'High-match popular titles with full criteria',
          constraints: { minScore: originalMinScore, minPopularity: 50000, genreRequired: true, tagRequired: true },
          resultsFound: 0,
          wasUsed: true
        },
        {
          stage: 2,
          name: 'Relaxed Tags',
          description: 'Dropped tag requirement, kept genre match',
          constraints: { minScore: originalMinScore - 10, minPopularity: 30000, genreRequired: true, tagRequired: false },
          resultsFound: 0,
          wasUsed: false
        },
        {
          stage: 3,
          name: 'Lowered Score',
          description: 'Reduced minimum score threshold',
          constraints: { minScore: Math.max(50, originalMinScore - 20), minPopularity: 20000, genreRequired: true, tagRequired: false },
          resultsFound: 0,
          wasUsed: false
        },
        {
          stage: 4,
          name: 'Popular Fallback',
          description: 'Trending popular titles',
          constraints: { minScore: 60, minPopularity: 0, genreRequired: false, tagRequired: false },
          resultsFound: 0,
          wasUsed: false
        }
      );
      break;
      
    case 'experimental':
      stages.push(
        {
          stage: 1,
          name: 'Strict Experimental',
          description: 'Novel genres/tags with quality floor',
          constraints: { minScore: originalMinScore, genreRequired: false, tagRequired: true },
          resultsFound: 0,
          wasUsed: true
        },
        {
          stage: 2,
          name: 'Reduced Novelty',
          description: 'Lowered novelty threshold',
          constraints: { minScore: originalMinScore - 10, genreRequired: false, tagRequired: false },
          resultsFound: 0,
          wasUsed: false
        },
        {
          stage: 3,
          name: 'Quality Priority',
          description: 'High-quality diverse picks',
          constraints: { minScore: Math.max(60, originalMinScore - 15), genreRequired: false, tagRequired: false },
          resultsFound: 0,
          wasUsed: false
        },
        {
          stage: 4,
          name: 'Trending Diverse',
          description: 'Trending titles outside comfort zone',
          constraints: { minScore: 55, genreRequired: false, tagRequired: false },
          resultsFound: 0,
          wasUsed: false
        }
      );
      break;
      
    case 'hidden-gem':
      stages.push(
        {
          stage: 1,
          name: 'Strict Hidden Gem',
          description: 'Low popularity, high quality matches',
          constraints: { minScore: originalMinScore, maxPopularity: 20000, genreRequired: true },
          resultsFound: 0,
          wasUsed: true
        },
        {
          stage: 2,
          name: 'Expanded Popularity',
          description: 'Increased popularity ceiling',
          constraints: { minScore: originalMinScore - 5, maxPopularity: 40000, genreRequired: true },
          resultsFound: 0,
          wasUsed: false
        },
        {
          stage: 3,
          name: 'Relaxed Genre',
          description: 'Dropped genre requirement',
          constraints: { minScore: originalMinScore - 10, maxPopularity: 50000, genreRequired: false },
          resultsFound: 0,
          wasUsed: false
        },
        {
          stage: 4,
          name: 'Quality Obscure',
          description: 'Any quality obscure title',
          constraints: { minScore: 60, maxPopularity: 80000, genreRequired: false },
          resultsFound: 0,
          wasUsed: false
        }
      );
      break;
      
    case 'opposite':
      stages.push(
        {
          stage: 1,
          name: 'Strict Opposite',
          description: 'Minimal genre overlap with quality floor',
          constraints: { minScore: originalMinScore, genreRequired: false },
          resultsFound: 0,
          wasUsed: true
        },
        {
          stage: 2,
          name: 'Reduced Quality',
          description: 'Lowered score requirement',
          constraints: { minScore: originalMinScore - 15, genreRequired: false },
          resultsFound: 0,
          wasUsed: false
        },
        {
          stage: 3,
          name: 'Popular Different',
          description: 'Popular titles outside preferences',
          constraints: { minScore: 60, minPopularity: 50000, genreRequired: false },
          resultsFound: 0,
          wasUsed: false
        },
        {
          stage: 4,
          name: 'Any Different',
          description: 'Any non-watched quality title',
          constraints: { minScore: 55, genreRequired: false },
          resultsFound: 0,
          wasUsed: false
        }
      );
      break;
      
    default: // 'all'
      stages.push(
        {
          stage: 1,
          name: 'Full Criteria',
          description: 'All filters applied',
          constraints: { minScore: originalMinScore, genreRequired: true, tagRequired: true },
          resultsFound: 0,
          wasUsed: true
        },
        {
          stage: 2,
          name: 'Relaxed Tags',
          description: 'Dropped tag requirement',
          constraints: { minScore: originalMinScore - 10, genreRequired: true, tagRequired: false },
          resultsFound: 0,
          wasUsed: false
        },
        {
          stage: 3,
          name: 'Relaxed All',
          description: 'Minimal constraints',
          constraints: { minScore: 50, genreRequired: false, tagRequired: false },
          resultsFound: 0,
          wasUsed: false
        },
        {
          stage: 4,
          name: 'Global Trending',
          description: 'Trending popular titles',
          constraints: { minScore: 50, genreRequired: false, tagRequired: false },
          resultsFound: 0,
          wasUsed: false
        }
      );
      break;
  }
  
  return stages;
}

/**
 * Create a new fallback log
 */
export function createFallbackLog(
  mode: 'safe' | 'experimental' | 'hidden-gem' | 'opposite' | 'all',
  originalMinScore: number,
  searchGenres: string[],
  searchTags: string[],
  formats: string[]
): FallbackLog {
  return {
    mode,
    stages: getFallbackStages(mode, originalMinScore),
    finalStageUsed: 1,
    totalCandidates: 0,
    finalResults: 0,
    relaxationApplied: [],
    warnings: [],
    debugInfo: {
      searchGenres,
      searchTags,
      formats,
      originalMinScore,
      finalMinScore: originalMinScore
    }
  };
}

/**
 * Update fallback log when a stage is used
 */
export function updateFallbackStage(
  log: FallbackLog,
  stageNumber: number,
  resultsFound: number,
  relaxation?: string
): void {
  const stage = log.stages.find(s => s.stage === stageNumber);
  if (stage) {
    stage.wasUsed = true;
    stage.resultsFound = resultsFound;
    log.finalStageUsed = stageNumber;
    log.totalCandidates += resultsFound;
  }
  
  if (relaxation) {
    log.relaxationApplied.push(relaxation);
  }
}

/**
 * Finalize the log with results
 */
export function finalizeFallbackLog(
  log: FallbackLog,
  finalResults: number,
  finalMinScore: number
): void {
  log.finalResults = finalResults;
  log.debugInfo.finalMinScore = finalMinScore;
  
  // Generate warnings
  if (log.finalStageUsed >= 3) {
    log.warnings.push(`Relaxed to stage ${log.finalStageUsed} to find results`);
  }
  if (finalResults < 5) {
    log.warnings.push(`Only ${finalResults} recommendations found`);
  }
  if (log.relaxationApplied.length > 0) {
    log.warnings.push(`Applied ${log.relaxationApplied.length} relaxation(s)`);
  }
}

/**
 * Format fallback log for display
 */
export function formatFallbackSummary(log: FallbackLog): string {
  const usedStages = log.stages.filter(s => s.wasUsed);
  const finalStage = usedStages[usedStages.length - 1];
  
  if (log.finalStageUsed === 1 && log.warnings.length === 0) {
    return ''; // No fallback needed, don't show anything
  }
  
  let summary = `Found ${log.finalResults} recommendations`;
  
  if (log.finalStageUsed > 1) {
    summary += ` using "${finalStage?.name || 'fallback'}" criteria`;
  }
  
  if (log.relaxationApplied.length > 0) {
    summary += `. Relaxed: ${log.relaxationApplied.join(', ')}`;
  }
  
  return summary;
}

/**
 * Get UI-friendly fallback banner text
 */
export function getFallbackBannerText(log: FallbackLog): { show: boolean; text: string; type: 'info' | 'warning' } | null {
  if (log.finalStageUsed === 1 && log.warnings.length === 0) {
    return null; // No banner needed
  }
  
  if (log.finalResults === 0) {
    return {
      show: true,
      text: 'No recommendations found. Try adjusting your filters.',
      type: 'warning'
    };
  }
  
  if (log.finalStageUsed >= 3) {
    return {
      show: true,
      text: `Showing broader results — strict ${log.mode} criteria had limited matches`,
      type: 'info'
    };
  }
  
  if (log.finalResults < 5) {
    return {
      show: true,
      text: `Limited results for ${log.mode} mode. Consider trying a different category.`,
      type: 'info'
    };
  }
  
  return null;
}
