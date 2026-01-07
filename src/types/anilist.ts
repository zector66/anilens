export interface AniListUser {
  id: number;
  name: string;
  avatar: {
    large: string;
    medium: string;
  };
  options: {
    titleLanguage: string;
    displayAdultContent: boolean;
  };
  statistics: {
    anime: {
      count: number;
      episodesWatched: number;
      meanScore: number;
    };
    manga: {
      count: number;
      chaptersRead: number;
      volumesRead: number;
      meanScore: number;
    };
  };
}

export interface Media {
  id: number;
  title: {
    romaji: string;
    english: string;
    native: string;
    userPreferred: string;
  };
  type: 'ANIME' | 'MANGA';
  format: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | 'MANGA' | 'NOVEL' | 'ONE_SHOT';
  status: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  description: string;
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  seasonYear?: number;
  seasonInt?: number;
  episodes?: number;
  duration?: number;
  chapters?: number;
  volumes?: number;
  coverImage: {
    extraLarge: string;
    large: string;
    medium: string;
    color?: string;
  };
  bannerImage?: string;
  genres: string[];
  synonyms: string[];
  tags: Array<{
    id: number;
    name: string;
    description: string;
    category: string;
    rank: number;
    isGeneralSpoiler: boolean;
    isMediaSpoiler: boolean;
    isAdult: boolean;
  }>;
  isAdult: boolean;
  meanScore: number;
  popularity: number;
  trending: number;
  favourites: number;
  startDate: {
    year?: number;
    month?: number;
    day?: number;
  };
  endDate: {
    year?: number;
    month?: number;
    day?: number;
  };
  studios: {
    edges: Array<{
      node: {
        id: number;
        name: string;
        isAnimationStudio: boolean;
      };
      isMain?: boolean;
    }>;
  };
  relations: {
    edges: Array<{
      node: Media;
      relationType: string;
    }>;
  };
  characters: {
    edges: Array<{
      node: {
        id: number;
        name: {
          first: string;
          last: string;
          full: string;
          native: string;
        };
        image: {
          large: string;
          medium: string;
        };
      };
      voiceActors: Array<{
        id: number;
        name: {
          first: string;
          last: string;
          full: string;
          native: string;
        };
        language: string;
      }>;
      role: string;
    }>;
  };
  staff: {
    edges: Array<{
      node: {
        id: number;
        name: {
          first: string;
          last: string;
          full: string;
          native: string;
        };
        image: {
          large: string;
          medium: string;
        };
      };
      role: string;
    }>;
  };
  externalLinks: Array<{
    id: number;
    site: string;
    url: string;
    type: string;
    color?: string;
    icon?: string;
  }>;
  streamingEpisodes?: Array<{
    title: string;
    thumbnail: string;
    url: string;
  }>;
  trailer?: {
    id: string;
    site: string;
    thumbnail: string;
  };
  rankings: Array<{
    rank: number;
    type: string;
    format: string;
    year: number;
    season: string;
    allTime: boolean;
    context: string;
  }>;
  mediaListEntry?: MediaListEntry;
}

export interface MediaListEntry {
  id: number;
  mediaId: number;
  media?: Media; // Add media object for easier access
  status: 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';
  score: number;
  progress: number;
  progressVolumes?: number;
  repeat: number;
  priority: number;
  private: boolean;
  notes: string;
  hiddenFromStatusLists: boolean;
  customLists: string[];
  advancedScores: {
    story?: number;
    characters?: number;
    art?: number;
    music?: number;
    enjoyment?: number;
    overall?: number;
  };
  startedAt: {
    year?: number;
    month?: number;
    day?: number;
  };
  completedAt: {
    year?: number;
    month?: number;
    day?: number;
  };
  updatedAt: number;
  createdAt: number;
}

export interface MediaList {
  lists: Array<{
    name: string;
    isCustomList: boolean;
    isSplitCompletedList: boolean;
    status: string;
    entries: MediaListEntry[];
  }>;
}

export interface UserStats {
  userId: number;
  anime: {
    count: number;
    episodesWatched: number;
    meanScore: number;
    formats: Array<{
      format: string;
      count: number;
      meanScore: number;
    }>;
    statuses: Array<{
      status: string;
      count: number;
      meanScore: number;
    }>;
    scores: Array<{
      score: number;
      count: number;
    }>;
    genres: Array<{
      genre: string;
      count: number;
      meanScore: number;
    }>;
    tags: Array<{
      tag: {
        id: number;
        name: string;
      };
      count: number;
      meanScore: number;
    }>;
    studios: Array<{
      studio: {
        id: number;
        name: string;
      };
      count: number;
      meanScore: number;
    }>;
    releaseYears: Array<{
      releaseYear: number;
      count: number;
      meanScore: number;
    }>;
    seasons: Array<{
      season: string;
      year: number;
      count: number;
      meanScore: number;
    }>;
  };
  manga: {
    count: number;
    chaptersRead: number;
    volumesRead: number;
    meanScore: number;
    formats: Array<{
      format: string;
      count: number;
      meanScore: number;
    }>;
    statuses: Array<{
      status: string;
      count: number;
      meanScore: number;
    }>;
    scores: Array<{
      score: number;
      count: number;
    }>;
    genres: Array<{
      genre: string;
      count: number;
      meanScore: number;
    }>;
    tags: Array<{
      tag: {
        id: number;
        name: string;
      };
      count: number;
      meanScore: number;
    }>;
    staff: Array<{
      staff: {
        id: number;
        name: string;
      };
      count: number;
      meanScore: number;
    }>;
    releaseYears: Array<{
      releaseYear: number;
      count: number;
      meanScore: number;
    }>;
  };
}

export interface TasteProfile {
  genreAffinity: Array<{
    genre: string;
    affinity: number;
    count: number;
    avgScore: number;
    confidence: number; // How reliable this signal is
  }>;
  tagAffinity: Array<{
    tag: string;
    affinity: number;
    count: number;
    avgScore: number;
    avgRank: number;
    confidence: number;
  }>;
  studioBias: Array<{
    studio: string;
    bias: number;
    count: number;
    avgScore: number;
  }>;
  eraPreference: Array<{
    era: string;
    preference: number;
    count: number;
    avgScore: number;
  }>;
  formatPreference: Array<{
    format: string;
    preference: number;
    count: number;
    avgScore: number;
  }>;
  formatWeights: Record<string, number>;
  scorePatterns: {
    meanScore: number;
    scoreDistribution: Array<{
      score: number;
      count: number;
      percentage: number;
    }>;
    scoreInflation: number;
    consistency: number;
  };
  behavioralMetrics: {
    completionRate: number;
    dropRate: number;
    rewatchRate: number;
    bingeIndex: number;
    mainstreamIndex: number;
    nicheIndex: number;
    experimentalIndex: number;
    diversityIndex: number;
    medianPopularity?: number;
    percentMainstream?: number;
    meanDropProgress?: number;
    logNormalizedPopularity?: number;
    popularityQuantile?: string;
    rawCompletionRate?: number;
    rawDropRate?: number;
  };
  personalityTraits: {
    completionist: number;
    seasonalTourist: number;
    cultHunter: number;
    nostalgiaAddict: number;
    mainstreamMaxxer: number;
    avantGarde: number;
    emotionalDamageIndex: number;
    chaosLevel: number;
    genreDiversity: number;
  };
  
  // NEW: Emotional Vector - How you experience stories
  emotionalProfile: {
    escapism: number;      // 0 = grounded realism, 1 = full fantasy escapism
    bleakness: number;     // 0 = wholesome/hopeful, 1 = dark/tragic
    idealism: number;      // 0 = cynical/realistic, 1 = idealistic/optimistic
    intensity: number;     // 0 = calm/subtle, 1 = high stakes/intense
    sentimentality: number; // 0 = stoic/detached, 1 = emotional/tearjerker
  };
  
  // NEW: Structural Preferences - How you like stories built
  structuralPreferences: {
    episodicVsSerial: number;    // 0 = episodic standalone, 1 = serialized arcs
    pacingPreference: number;    // 0 = slow burn, 1 = fast paced
    plotVsCharacter: number;     // 0 = character study, 1 = plot driven
    complexityPreference: number; // 0 = simple/accessible, 1 = complex/layered
  };
  
  // NEW: Risk Tolerance Curve - Engagement by popularity tier
  riskProfile: {
    curve: Array<{
      bucket: string;        // e.g., "<5k", "5k-20k", "20k-100k", "100k+"
      minPop: number;
      maxPop: number;
      engagement: number;    // 0-1 how much they engage with this tier
      completionRate: number;
      avgScore: number;
    }>;
    preferredTier: string;   // Which bucket they engage with most
    riskTolerance: number;   // Overall 0-1 score
  };
  
  // NEW: Detected Contradictions - Inconsistencies in taste behavior
  contradictions: Array<{
    id: string;
    type: 'RATING_VS_BEHAVIOR' | 'STATED_VS_ACTUAL' | 'GENRE_MISMATCH' | 'COMPLETION_PARADOX';
    severity: 'MILD' | 'MODERATE' | 'STRONG';
    description: string;
    evidence: string;
  }>;
  
  // NEW: Taste Fingerprint - Compact shareable hash
  fingerprint: {
    code: string;           // e.g., "PSY-EXP-NIC-SLOW-DIV"
    primaryArchetype: string;
    secondaryArchetype: string;
    uniquenessScore: number; // How unusual this taste profile is
  };
}

export interface Recommendation {
  media: Media;
  confidence: number;
  explanation: string;
  riskLevel: 'SAFE' | 'MODERATE' | 'EXPERIMENTAL';
  strategy: 'COLLABORATIVE' | 'CONTENT_BASED' | 'STAFF_BASED' | 'NOVELTY' | 'MISSED_CLASSIC';
  userMatch?: number;
  similarityFactors?: string[];
}

export interface GameQuestion {
  id: string;
  type: 'OP_GUESS' | 'SCREENSHOT_GUESS' | 'QUOTE_GUESS' | 'SCORE_GUESS' | 'CHARACTER_GUESS' | 'SEASON_MATCH' | 'COVER_GUESS' | 'CHAPTER_COUNT_GUESS' | 'HANGMAN' | 'WORDLE';
  media?: Media;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  question: string;
  options?: string[];
  optionImages?: Record<string, string>; // Map option title to cover image URL
  correctAnswer: string;
  hints?: string[];
  timeLimit?: number;
  points: number;
  // For OP/ED guessing - theme metadata from AnimeThemes API
  themeData?: {
    anilistId: number;
    themeMode?: 'openings' | 'endings' | 'mix';
    songTitle?: string;
    artistName?: string;
    videoUrl?: string;
    audioUrl?: string;
  };
}

export interface GameSession {
  id: string;
  type: string;
  questions: GameQuestion[];
  currentQuestionIndex: number;
  score: number;
  answers: Array<{
    questionId: string;
    answer: string;
    correct: boolean;
    timeTaken: number;
    points: number;
  }>;
  startTime: number;
  endTime?: number;
  completed: boolean;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}

// ============================================
// COMMUNITY & ELO SYSTEM TYPES
// ============================================

export interface PlayerRating {
  userId: number;
  username: string;
  avatar?: string;
  
  // Per-game ELO ratings (starting at 1200)
  ratings: {
    opGuessing: number;
    screenshotGuessing: number;
    quoteGuessing: number;
    scoreGuessing: number;
    characterGuessing: number;
    seasonMatching: number;
    coverGuessing: number;
    chapterGuessing: number;
    hangman: number;
    wordle: number;
    overall: number; // Weighted average
  };
  
  // Knowledge axes (0-100 expertise)
  knowledgeAxes: {
    modernEra: number;     // 2015+
    classicEra: number;    // Pre-2010
    goldenEra: number;     // 2010-2015
    obscurity: number;     // Knowledge of <20k popularity titles
    mainstream: number;    // Knowledge of 100k+ popularity titles
    genreExpertise: Record<string, number>; // Per-genre expertise
    studioKnowledge: Record<string, number>; // Per-studio expertise
  };
  
  // Stats
  stats: {
    totalGamesPlayed: number;
    totalWins: number;
    winStreak: number;
    bestWinStreak: number;
    totalQuestionsAnswered: number;
    correctAnswers: number;
    averageResponseTime: number;
    dailyChallengesCompleted: number;
    perfectGames: number;
  };
  
  // Seasonal tracking
  seasonalStats: {
    season: string; // e.g., "2024-Q1"
    gamesPlayed: number;
    rating: number;
    rank?: number;
    percentile?: number;
  };
  
  // Achievements
  achievements: string[];
  
  // Timestamps
  createdAt: number;
  lastPlayedAt: number;
}

export interface DailyChallenge {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  gameType: string;
  seed: number; // For deterministic question generation
  questions: GameQuestion[];
  
  // Leaderboard for this challenge
  leaderboard: Array<{
    userId: number;
    username: string;
    avatar?: string;
    score: number;
    time: number;
    rank: number;
    completedAt: number;
  }>;
  
  // Participation stats
  participantCount: number;
  averageScore: number;
  averageTime: number;
}

export interface HeadToHeadMatch {
  id: string;
  gameType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED' | 'EXPIRED';
  
  challenger: {
    userId: number;
    username: string;
    avatar?: string;
    score?: number;
    completedAt?: number;
  };
  
  opponent: {
    userId: number;
    username: string;
    avatar?: string;
    score?: number;
    completedAt?: number;
  };
  
  questions: GameQuestion[];
  winnerId?: number;
  ratingChange?: number; // ELO change for winner/loser
  
  createdAt: number;
  expiresAt: number;
}

export interface Rivalry {
  id: string;
  player1: {
    userId: number;
    username: string;
    avatar?: string;
    wins: number;
  };
  player2: {
    userId: number;
    username: string;
    avatar?: string;
    wins: number;
  };
  totalMatches: number;
  lastMatchAt: number;
  intensity: 'CASUAL' | 'HEATED' | 'LEGENDARY'; // Based on match count
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  avatar?: string;
  rating: number;
  gamesPlayed: number;
  winRate: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendAmount: number;
}

export interface MatchHistoryEntry {
  id: string;
  gameType: string;
  mode: 'SOLO' | 'DAILY' | 'HEAD_TO_HEAD';
  score: number;
  maxScore: number;
  accuracy: number;
  time: number;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  opponent?: {
    userId: number;
    username: string;
    score: number;
  };
  playedAt: number;
}
