import { 
  PlayerRating, 
  GameSession, 
  MatchHistoryEntry,
  GameQuestion 
} from '@/types/anilist';

const DEFAULT_RATING = 0; // Start at Iron IV
const K_FACTOR = 32; // ELO K-factor for rating changes
const PERFORMANCE_K = 16; // K-factor for solo performance-based rating

export class RatingSystem {
  /**
   * Calculate ELO rating change after a head-to-head match
   */
  static calculateEloChange(
    winnerRating: number,
    loserRating: number,
    isDraw: boolean = false
  ): { winnerChange: number; loserChange: number } {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 - expectedWinner;

    if (isDraw) {
      return {
        winnerChange: Math.round(K_FACTOR * (0.5 - expectedWinner)),
        loserChange: Math.round(K_FACTOR * (0.5 - expectedLoser)),
      };
    }

    return {
      winnerChange: Math.round(K_FACTOR * (1 - expectedWinner)),
      loserChange: Math.round(K_FACTOR * (0 - expectedLoser)),
    };
  }

  /**
   * Calculate rating change based on solo game performance
   * Uses accuracy and speed to determine expected vs actual performance
   */
  static calculateSoloRatingChange(
    currentRating: number,
    accuracy: number,
    averageTime: number,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  ): number {
    // Expected performance based on current rating
    const ratingFactor = (currentRating - 800) / 800; // 0.5 at 1200, 1.0 at 1600
    const expectedAccuracy = Math.min(0.9, 0.5 + ratingFactor * 0.2);
    
    // Difficulty multiplier
    const difficultyMultiplier = {
      'EASY': 0.5,
      'MEDIUM': 1.0,
      'HARD': 1.5,
    }[difficulty];

    // Performance score (0-1)
    const performanceScore = accuracy;
    
    // Time bonus/penalty (faster = better)
    const timeBonus = Math.max(-0.1, Math.min(0.1, (10000 - averageTime) / 100000));
    
    // Calculate change
    const performanceDelta = performanceScore - expectedAccuracy + timeBonus;
    const change = Math.round(PERFORMANCE_K * performanceDelta * difficultyMultiplier);
    
    // Cap changes to prevent wild swings
    return Math.max(-30, Math.min(30, change));
  }

  /**
   * Calculate knowledge axis updates based on game questions answered
   */
  static updateKnowledgeAxes(
    currentAxes: PlayerRating['knowledgeAxes'],
    questions: GameQuestion[],
    answers: GameSession['answers']
  ): PlayerRating['knowledgeAxes'] {
    const updated = { ...currentAxes };
    
    questions.forEach((question, i) => {
      const answer = answers[i];
      if (!answer) return;
      
      const media = question.media;
      if (!media) return; // Skip if no media associated (e.g. Wordle)

      const correct = answer.correct;
      const delta = correct ? 2 : -1; // Gain more for correct, lose less for wrong
      
      // Era expertise
      const year = media.startDate?.year || 2020;
      if (year >= 2015) {
        updated.modernEra = Math.max(0, Math.min(100, updated.modernEra + delta));
      } else if (year < 2010) {
        updated.classicEra = Math.max(0, Math.min(100, updated.classicEra + delta));
      } else {
        updated.goldenEra = Math.max(0, Math.min(100, updated.goldenEra + delta));
      }
      
      // Popularity expertise
      const popularity = media.popularity || 50000;
      if (popularity < 20000) {
        updated.obscurity = Math.max(0, Math.min(100, updated.obscurity + delta));
      } else if (popularity > 100000) {
        updated.mainstream = Math.max(0, Math.min(100, updated.mainstream + delta));
      }
      
      // Genre expertise
      media.genres?.forEach(genre => {
        const current = updated.genreExpertise[genre] || 50;
        updated.genreExpertise[genre] = Math.max(0, Math.min(100, current + delta));
      });
      
      // Studio expertise
      media.studios?.edges?.forEach(edge => {
        if (edge.isMain) {
          const studio = edge.node.name;
          const current = updated.studioKnowledge[studio] || 50;
          updated.studioKnowledge[studio] = Math.max(0, Math.min(100, current + delta));
        }
      });
    });
    
    return updated;
  }

  /**
   * Get the game type key for ratings
   */
  static getGameTypeKey(gameType: string): keyof PlayerRating['ratings'] | null {
    const mapping: Record<string, keyof PlayerRating['ratings']> = {
      'op-guessing': 'opGuessing',
      'screenshot-guessing': 'screenshotGuessing',
      'quote-guessing': 'quoteGuessing',
      'score-guessing': 'scoreGuessing',
      'character-guessing': 'characterGuessing',
      'season-matching': 'seasonMatching',
      'cover-guessing': 'coverGuessing',
      'chapters-guessing': 'chapterGuessing',
      'hangman': 'hangman',
      'wordle': 'wordle',
    };
    return mapping[gameType] || null;
  }

  /**
   * Calculate overall rating from per-game ratings (SUM of all game type ratings)
   */
  static calculateOverallRating(ratings: PlayerRating['ratings']): number {
    const gameTypeKeys: (keyof PlayerRating['ratings'])[] = [
      'opGuessing',
      'screenshotGuessing',
      'quoteGuessing',
      'scoreGuessing',
      'characterGuessing',
      'seasonMatching',
      'coverGuessing',
      'chapterGuessing',
      'hangman',
      'wordle',
    ];
    
    let sum = 0;
    
    gameTypeKeys.forEach((key) => {
      const rating = ratings[key];
      if (rating !== DEFAULT_RATING) { // Only count if played
        sum += rating;
      }
    });
    
    return sum;
  }

  /**
   * Create initial player rating profile
   */
  static createInitialRating(userId: number, username: string, avatar?: string): PlayerRating {
    return {
      userId,
      username,
      avatar,
      ratings: {
        opGuessing: DEFAULT_RATING,
        screenshotGuessing: DEFAULT_RATING,
        quoteGuessing: DEFAULT_RATING,
        scoreGuessing: DEFAULT_RATING,
        characterGuessing: DEFAULT_RATING,
        seasonMatching: DEFAULT_RATING,
        coverGuessing: DEFAULT_RATING,
        chapterGuessing: DEFAULT_RATING,
        hangman: DEFAULT_RATING,
        wordle: DEFAULT_RATING,
        overall: DEFAULT_RATING,
      },
      knowledgeAxes: {
        modernEra: 50,
        classicEra: 50,
        goldenEra: 50,
        obscurity: 50,
        mainstream: 50,
        genreExpertise: {},
        studioKnowledge: {},
      },
      stats: {
        totalGamesPlayed: 0,
        totalWins: 0,
        winStreak: 0,
        bestWinStreak: 0,
        totalQuestionsAnswered: 0,
        correctAnswers: 0,
        averageResponseTime: 0,
        dailyChallengesCompleted: 0,
        perfectGames: 0,
      },
      seasonalStats: {
        season: this.getCurrentSeason(),
        gamesPlayed: 0,
        rating: DEFAULT_RATING,
      },
      achievements: [],
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
    };
  }

  /**
   * Get current season string (e.g., "2024-Q1")
   */
  static getCurrentSeason(): string {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `${now.getFullYear()}-Q${quarter}`;
  }

  /**
   * Generate deterministic daily challenge based on date
   */
  static generateDailyChallengeId(date: Date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0];
    return `daily-${dateStr}`;
  }

  /**
   * Generate seed for daily challenge (deterministic based on date)
   */
  static getDailyChallengeSeed(date: Date = new Date()): number {
    const dateStr = date.toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      const char = dateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Get rank title based on rating
   */
  static getRankTitle(rating: number): { title: string; color: string; icon: string } {
    // New rank system: Iron IV (0) to Challenger (3000+)
    if (rating >= 3000) return { title: 'Challenger', color: 'text-amber-300', icon: '👑' };
    if (rating >= 2800) return { title: 'Grandmaster', color: 'text-red-400', icon: '🔥' };
    if (rating >= 2400) return { title: 'Master', color: 'text-purple-400', icon: '💎' };
    if (rating >= 2000) return { title: 'Diamond', color: 'text-cyan-400', icon: '💠' };
    if (rating >= 1600) return { title: 'Platinum', color: 'text-emerald-400', icon: '🏆' };
    if (rating >= 1200) return { title: 'Gold', color: 'text-yellow-400', icon: '🥇' };
    if (rating >= 800) return { title: 'Silver', color: 'text-gray-300', icon: '🥈' };
    if (rating >= 400) return { title: 'Bronze', color: 'text-orange-400', icon: '🥉' };
    return { title: 'Iron', color: 'text-stone-400', icon: '⚙️' };
  }

  /**
   * Calculate percentile from rating (approximate)
   */
  static estimatePercentile(rating: number): number {
    // Estimate percentile based on new rank system (0-3000+)
    // Most players are in Iron-Gold range (0-1600)
    const z = (rating - 800) / 400;
    // Approximate CDF using logistic function
    const percentile = 100 / (1 + Math.exp(-1.2 * z));
    return Math.round(Math.max(1, Math.min(99, percentile)));
  }

  /**
   * Check for new achievements based on updated stats
   */
  static checkAchievements(rating: PlayerRating): string[] {
    const newAchievements: string[] = [];
    const { stats, achievements } = rating;

    const achievementChecks = [
      { id: 'first_game', condition: stats.totalGamesPlayed >= 1 },
      { id: 'ten_games', condition: stats.totalGamesPlayed >= 10 },
      { id: 'hundred_games', condition: stats.totalGamesPlayed >= 100 },
      { id: 'first_perfect', condition: stats.perfectGames >= 1 },
      { id: 'ten_perfects', condition: stats.perfectGames >= 10 },
      { id: 'streak_5', condition: stats.bestWinStreak >= 5 },
      { id: 'streak_10', condition: stats.bestWinStreak >= 10 },
      { id: 'daily_7', condition: stats.dailyChallengesCompleted >= 7 },
      { id: 'daily_30', condition: stats.dailyChallengesCompleted >= 30 },
      { id: 'accuracy_90', condition: stats.correctAnswers / Math.max(1, stats.totalQuestionsAnswered) >= 0.9 },
      { id: 'gold_rank', condition: rating.ratings.overall >= 1200 },
      { id: 'platinum_rank', condition: rating.ratings.overall >= 1400 },
      { id: 'diamond_rank', condition: rating.ratings.overall >= 1600 },
      { id: 'master_rank', condition: rating.ratings.overall >= 1800 },
      { id: 'grandmaster', condition: rating.ratings.overall >= 2000 },
    ];

    achievementChecks.forEach(({ id, condition }) => {
      if (condition && !achievements.includes(id)) {
        newAchievements.push(id);
      }
    });

    return newAchievements;
  }

  /**
   * Format rating change for display
   */
  static formatRatingChange(change: number): string {
    if (change > 0) return `+${change}`;
    return `${change}`;
  }

  /**
   * Calculate rivalry intensity based on match history
   */
  static getRivalryIntensity(totalMatches: number): 'CASUAL' | 'HEATED' | 'LEGENDARY' {
    if (totalMatches >= 20) return 'LEGENDARY';
    if (totalMatches >= 10) return 'HEATED';
    return 'CASUAL';
  }
}

/**
 * Local storage keys for community data
 * In production, this would be replaced with a proper database
 */
export const STORAGE_KEYS = {
  PLAYER_RATING: 'anilist_player_rating',
  MATCH_HISTORY: 'anilist_match_history',
  DAILY_PROGRESS: 'anilist_daily_progress',
  LEADERBOARD_CACHE: 'anilist_leaderboard_cache',
};

/**
 * Helper to save player rating to local storage
 */
export function savePlayerRating(rating: PlayerRating): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PLAYER_RATING, JSON.stringify(rating));
  }
}

/**
 * Helper to load player rating from local storage
 */
export function loadPlayerRating(userId: number, username: string, avatar?: string): PlayerRating {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_RATING);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.userId === userId) {
        return parsed;
      }
    }
  }
  return RatingSystem.createInitialRating(userId, username, avatar);
}

/**
 * Helper to save match history
 */
export function saveMatchHistory(entry: MatchHistoryEntry): void {
  if (typeof window !== 'undefined') {
    const history = loadMatchHistory();
    history.unshift(entry);
    // Keep last 100 matches
    const trimmed = history.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.MATCH_HISTORY, JSON.stringify(trimmed));
  }
}

/**
 * Helper to load match history
 */
export function loadMatchHistory(): MatchHistoryEntry[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.MATCH_HISTORY);
    if (saved) {
      return JSON.parse(saved);
    }
  }
  return [];
}

/**
 * Check if daily challenge was completed today
 */
export function isDailyChallengeCompleted(): boolean {
  if (typeof window !== 'undefined') {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
    if (saved) {
      const { date } = JSON.parse(saved);
      return date === today;
    }
  }
  return false;
}

/**
 * Mark daily challenge as completed
 */
export function markDailyChallengeCompleted(score: number): void {
  if (typeof window !== 'undefined') {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify({
      date: today,
      score,
      completedAt: Date.now(),
    }));
  }
}
