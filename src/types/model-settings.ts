export interface ModelSettings {
  // List filtering
  includeCompleted: boolean;
  includeWatching: boolean;
  includePlanning: boolean;
  includeDropped: boolean;
  includePaused: boolean;
  
  // Format exclusions
  excludeMovies: boolean;
  excludeShorts: boolean;
  excludeOVA: boolean;
  excludeONA: boolean;
  excludeSpecials: boolean;
  excludeMusic: boolean;
  
  // Rating filters
  includeUnrated: boolean;
  minRating: number; // 0-10 scale
  
  // Time window
  timeWindow: 'all-time' | 'last-year' | 'last-2-years' | 'last-5-years';
  
  // Content filters
  includeMature: boolean; // Adult/NSFW content
  
  // Recommendation preferences
  recommendationDiversity: 'safe' | 'balanced' | 'adventurous';
  favoriteInfluence: number; // 0-100, how much to weight favorites
}

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  // Include all statuses by default
  includeCompleted: true,
  includeWatching: true,
  includePlanning: false,
  includeDropped: false,
  includePaused: true,
  
  // Don't exclude any formats by default
  excludeMovies: false,
  excludeShorts: false,
  excludeOVA: false,
  excludeONA: false,
  excludeSpecials: false,
  excludeMusic: false,
  
  // Include all ratings
  includeUnrated: true,
  minRating: 0,
  
  // All-time by default
  timeWindow: 'all-time',
  
  // Include mature content by default
  includeMature: true,
  
  // Balanced recommendations
  recommendationDiversity: 'balanced',
  favoriteInfluence: 30,
};

export const STORAGE_KEY = 'anilens_model_settings';
