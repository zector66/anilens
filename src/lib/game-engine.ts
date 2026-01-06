import { GameQuestion, GameSession, MediaListEntry, Media } from '@/types/anilist';

// Track recently used anime IDs to avoid repetition across sessions
const RECENT_ANIME_KEY = 'recent-game-anime';
const MAX_RECENT_TRACKED = 50;

function getRecentlyUsedIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_ANIME_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentlyUsedIds(ids: number[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep only the most recent entries
    const trimmed = ids.slice(-MAX_RECENT_TRACKED);
    localStorage.setItem(RECENT_ANIME_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
}

// Fisher-Yates shuffle for proper randomization
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Prioritize entries that haven't been used recently
function prioritizeUnused(entries: MediaListEntry[], recentIds: number[]): MediaListEntry[] {
  const recentSet = new Set(recentIds);
  const unused: MediaListEntry[] = [];
  const recent: MediaListEntry[] = [];
  
  for (const entry of entries) {
    if (entry.media?.id && recentSet.has(entry.media.id)) {
      recent.push(entry);
    } else {
      unused.push(entry);
    }
  }
  
  // Shuffle both arrays, then prioritize unused
  return [...shuffleArray(unused), ...shuffleArray(recent)];
}

export class GameEngine {
  static generateOPGuessingQuestions(entries: MediaListEntry[], count: number = 10): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const shuffled = prioritizeUnused(entries, recentIds);
    const usedIds: number[] = [];
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const entry = shuffled[i];
      if (!entry.media) continue;
      
      const media = entry.media;
      usedIds.push(media.id);
      const difficulty = this.calculateDifficulty(entry);
      
      const { options, optionImages } = this.generateOptionsWithImages(media, shuffled);
      questions.push({
        id: `op-guess-${i}`,
        type: 'OP_GUESS',
        media,
        difficulty,
        question: `Guess the anime from its theme song`,
        options,
        optionImages,
        correctAnswer: media.title.romaji || media.title.english || '',
        hints: [
          `Released in ${media.startDate.year || 'unknown'}`,
          `Genre: ${media.genres.slice(0, 2).join(', ')}`,
          `Episodes: ${media.episodes || 'unknown'}`,
        ],
        timeLimit: difficulty === 'EASY' ? 30 : difficulty === 'MEDIUM' ? 20 : 15,
        points: difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : 30,
        // Include AniList ID for fetching theme from AnimeThemes API
        themeData: {
          anilistId: media.id,
        },
      });
    }
    
    // Save used IDs to avoid repetition in future sessions
    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  static generateScreenshotQuestions(entries: MediaListEntry[], count: number = 10): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const shuffled = prioritizeUnused(entries, recentIds);
    const usedIds: number[] = [];
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const entry = shuffled[i];
      if (!entry.media) continue;
      
      const media = entry.media;
      usedIds.push(media.id);
      const difficulty = this.calculateDifficulty(entry);
      
      const { options, optionImages } = this.generateOptionsWithImages(media, shuffled);
      questions.push({
        id: `screenshot-${i}`,
        type: 'SCREENSHOT_GUESS',
        media,
        difficulty,
        question: `Guess the anime from this screenshot`,
        options,
        optionImages,
        correctAnswer: media.title.romaji || media.title.english || '',
        hints: [
          `Studio: ${media.studios.edges.find(e => e.isMain)?.node.name || 'Unknown'}`,
          `Year: ${media.startDate.year || 'unknown'}`,
          `Rating: ${media.meanScore || 'unknown'}/10`,
        ],
        timeLimit: difficulty === 'EASY' ? 25 : difficulty === 'MEDIUM' ? 15 : 10,
        points: difficulty === 'EASY' ? 15 : difficulty === 'MEDIUM' ? 25 : 40,
      });
    }
    
    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  static generateQuoteQuestions(entries: MediaListEntry[], count: number = 10): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    // Filter to only entries with descriptions
    const withDescription = entries.filter(e => e.media?.description && e.media.description.length > 50);
    const shuffled = prioritizeUnused(withDescription, recentIds);
    const usedIds: number[] = [];
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const entry = shuffled[i];
      if (!entry.media || !entry.media.description) continue;
      
      const media = entry.media;
      usedIds.push(media.id);
      const difficulty = this.calculateDifficulty(entry);
      
      // Extract a snippet from the actual anime description
      const snippet = this.extractDescriptionSnippet(media.description, difficulty);
      if (!snippet) continue;
      
      const { options, optionImages } = this.generateOptionsWithImages(media, shuffled);
      questions.push({
        id: `quote-${i}`,
        type: 'QUOTE_GUESS',
        media,
        difficulty,
        question: `Guess the anime from this synopsis snippet: "${snippet}"`,
        options,
        optionImages,
        correctAnswer: media.title.romaji || media.title.english || '',
        hints: [
          `Genre: ${media.genres?.[0] || 'Unknown'}`,
          `Year: ${media.startDate?.year || 'Unknown'}`,
          `Format: ${media.format || 'Unknown'}`,
        ],
        timeLimit: difficulty === 'EASY' ? 25 : difficulty === 'MEDIUM' ? 20 : 15,
        points: difficulty === 'EASY' ? 20 : difficulty === 'MEDIUM' ? 30 : 50,
      });
    }
    
    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }
  
  private static extractDescriptionSnippet(description: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): string | null {
    // Clean HTML tags from description
    const cleaned = description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
    if (cleaned.length < 50) return null;
    
    // Split into sentences
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length === 0) return null;
    
    // For harder difficulty, pick shorter/less obvious snippets
    let snippetLength = difficulty === 'EASY' ? 150 : difficulty === 'MEDIUM' ? 100 : 70;
    
    // Try to find a good sentence that doesn't contain the anime title
    const goodSentences = sentences.filter(s => s.length > 30 && s.length < 200);
    if (goodSentences.length === 0) {
      // Fall back to truncating the description
      return cleaned.substring(0, snippetLength) + '...';
    }
    
    // Pick a random sentence from the middle (avoid spoilery endings)
    const middleSentences = goodSentences.slice(0, Math.max(1, Math.floor(goodSentences.length * 0.6)));
    const picked = middleSentences[Math.floor(Math.random() * middleSentences.length)];
    
    return picked.trim().substring(0, snippetLength) + (picked.length > snippetLength ? '...' : '');
  }

  static generateScoreGuessQuestions(entries: MediaListEntry[], count: number = 10): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const shuffled = prioritizeUnused(entries, recentIds);
    const usedIds: number[] = [];
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const entry = shuffled[i];
      if (!entry.media) continue;
      
      const media = entry.media;
      usedIds.push(media.id);
      const difficulty = this.calculateDifficulty(entry);
      
      questions.push({
        id: `score-guess-${i}`,
        type: 'SCORE_GUESS',
        media,
        difficulty,
        question: `What score did you give to ${media.title.romaji || media.title.english || 'this anime'}?`,
        options: ['1-2', '3-4', '5-6', '7-8', '9-10'],
        correctAnswer: this.getScoreRange(entry.score),
        hints: [
          `You watched ${entry.progress || 0} episodes`,
          `Status: ${entry.status}`,
          `Community rating: ${media.meanScore || 'unknown'}/10`,
        ],
        timeLimit: 15,
        points: 10,
      });
    }
    
    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  static generateCharacterQuestions(entries: MediaListEntry[], count: number = 10): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const filtered = entries.filter(e => e.media?.characters?.edges && e.media.characters.edges.length > 0);
    const shuffled = prioritizeUnused(filtered, recentIds);
    const usedIds: number[] = [];
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const entry = shuffled[i];
      if (!entry.media) continue;
      
      const media = entry.media;
      usedIds.push(media.id);
      const characters = media.characters.edges;
      const mainChar = characters.find(c => c.role === 'MAIN') || characters[0];
      const charName = mainChar.node.name.full;
      const difficulty = this.calculateDifficulty(entry);
      
      const { options, optionImages } = this.generateOptionsWithImages(media, shuffled);
      questions.push({
        id: `char-guess-${i}`,
        type: 'CHARACTER_GUESS',
        media,
        difficulty,
        question: `Which series features the character "${charName}"?`,
        options,
        optionImages,
        correctAnswer: media.title.romaji || media.title.english || '',
        hints: [
          `Character Role: ${mainChar.role}`,
          `Genre: ${media.genres.slice(0, 2).join(', ')}`,
          `Released in ${media.startDate.year || 'unknown'}`,
        ],
        timeLimit: difficulty === 'EASY' ? 20 : 15,
        points: difficulty === 'EASY' ? 20 : 35,
      });
    }
    
    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  static generateSeasonMatchQuestions(entries: MediaListEntry[], count: number = 10): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const filtered = entries.filter(e => e.media?.season && e.media?.seasonYear);
    const shuffled = prioritizeUnused(filtered, recentIds);
    const usedIds: number[] = [];
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const entry = shuffled[i];
      if (!entry.media) continue;
      
      const media = entry.media;
      usedIds.push(media.id);
      const difficulty = this.calculateDifficulty(entry);
      const seasonStr = `${media.season} ${media.seasonYear}`;
      
      // Generate season options
      const seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
      const years = [media.seasonYear! - 1, media.seasonYear!, media.seasonYear! + 1];
      const seasonOptions = new Set<string>();
      seasonOptions.add(seasonStr);
      
      while (seasonOptions.size < 4) {
        const randSeason = seasons[Math.floor(Math.random() * seasons.length)];
        const randYear = years[Math.floor(Math.random() * years.length)];
        seasonOptions.add(`${randSeason} ${randYear}`);
      }
      
      questions.push({
        id: `season-match-${i}`,
        type: 'SEASON_MATCH',
        media,
        difficulty,
        question: `In which season did "${media.title.userPreferred || media.title.romaji}" air?`,
        options: Array.from(seasonOptions).sort(() => Math.random() - 0.5),
        correctAnswer: seasonStr,
        hints: [
          `Format: ${media.format}`,
          `Episodes: ${media.episodes || 'unknown'}`,
          `Studio: ${media.studios.edges.find(e => e.isMain)?.node.name || 'Unknown'}`,
        ],
        timeLimit: 15,
        points: 25,
      });
    }
    
    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  static generateCoverGuessQuestions(entries: MediaListEntry[], count: number = 10): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const shuffled = prioritizeUnused(entries, recentIds);
    const usedIds: number[] = [];
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const entry = shuffled[i];
      if (!entry.media) continue;
      
      const media = entry.media;
      usedIds.push(media.id);
      const difficulty = this.calculateDifficulty(entry);
      
      const { options, optionImages } = this.generateOptionsWithImages(media, shuffled);
      questions.push({
        id: `cover-guess-${i}`,
        type: 'COVER_GUESS',
        media,
        difficulty,
        question: `Guess the ${media.type === 'ANIME' ? 'anime' : 'manga'} from its cover`,
        options,
        optionImages,
        correctAnswer: media.title.romaji || media.title.english || '',
        hints: [
          `Format: ${media.format || 'Unknown'}`,
          `Year: ${media.startDate.year || 'unknown'}`,
          `Genre: ${media.genres.slice(0, 2).join(', ')}`,
        ],
        timeLimit: difficulty === 'EASY' ? 20 : 15,
        points: difficulty === 'EASY' ? 15 : 30,
      });
    }
    
    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  static generateChapterCountGuessQuestions(entries: MediaListEntry[], count: number = 10): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const filtered = entries.filter(e => e.media?.type === 'MANGA' && e.media?.chapters);
    const shuffled = prioritizeUnused(filtered, recentIds);
    const usedIds: number[] = [];
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const entry = shuffled[i];
      if (!entry.media) continue;
      
      const media = entry.media;
      usedIds.push(media.id);
      const chapters = media.chapters!;
      const difficulty = this.calculateDifficulty(entry);
      
      // Generate options around the correct chapter count
      const options = new Set<string>();
      options.add(chapters.toString());
      
      while (options.size < 4) {
        const variance = Math.max(5, Math.floor(chapters * 0.3));
        const fakeValue = chapters + (Math.floor(Math.random() * variance * 2) - variance);
        if (fakeValue > 0) options.add(fakeValue.toString());
      }
      
      questions.push({
        id: `chapters-guess-${i}`,
        type: 'CHAPTER_COUNT_GUESS',
        media,
        difficulty,
        question: `How many chapters are in "${media.title.userPreferred || media.title.romaji}"?`,
        options: Array.from(options).sort((a, b) => parseInt(a) - parseInt(b)),
        correctAnswer: chapters.toString(),
        hints: [
          `Status: ${media.status}`,
          `Volumes: ${media.volumes || 'unknown'}`,
          `Era: ${media.startDate.year || 'unknown'}`,
        ],
        timeLimit: 20,
        points: 25,
      });
    }
    
    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  private static calculateDifficulty(entry: MediaListEntry): 'EASY' | 'MEDIUM' | 'HARD' {
    if (!entry.media) return 'MEDIUM';
    
    const media = entry.media;
    const popularity = media.popularity || 0;
    const meanScore = media.meanScore || 0;
    
    // Easy: Popular, well-known anime
    if (popularity > 50000 && meanScore > 7) return 'EASY';
    
    // Hard: Niche, less popular anime
    if (popularity < 5000 || meanScore < 6) return 'HARD';
    
    return 'MEDIUM';
  }

  private static generateOptions(correctMedia: Media, allEntries: MediaListEntry[]): string[] {
    const options = [correctMedia.title.romaji || correctMedia.title.english || ''];
    
    // Add 3 random incorrect options
    const incorrectEntries = allEntries
      .filter(e => e.media && e.media.id !== correctMedia.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    incorrectEntries.forEach(entry => {
      if (entry.media) {
        options.push(entry.media.title.romaji || entry.media.title.english || '');
      }
    });
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  }

  // Generate options with their cover images
  private static generateOptionsWithImages(correctMedia: Media, allEntries: MediaListEntry[]): { options: string[], optionImages: Record<string, string> } {
    const optionImages: Record<string, string> = {};
    const correctTitle = correctMedia.title.romaji || correctMedia.title.english || '';
    const options = [correctTitle];
    optionImages[correctTitle] = correctMedia.coverImage?.medium || correctMedia.coverImage?.large || '';
    
    // Add 3 random incorrect options
    const incorrectEntries = allEntries
      .filter(e => e.media && e.media.id !== correctMedia.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    incorrectEntries.forEach(entry => {
      if (entry.media) {
        const title = entry.media.title.romaji || entry.media.title.english || '';
        options.push(title);
        optionImages[title] = entry.media.coverImage?.medium || entry.media.coverImage?.large || '';
      }
    });
    
    // Shuffle options (but keep the image mapping intact)
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    return { options: shuffledOptions, optionImages };
  }

  private static generateQuote(media: Media): string {
    // Extensive database of famous anime quotes by genre/theme
    const quoteDatabase: Record<string, string[]> = {
      'Action': [
        "A lesson without pain is meaningless. That's because no one can gain without sacrificing something.",
        "Power comes in response to a need, not a desire.",
        "The world isn't perfect. But it's there for us, doing the best it can.",
        "If you don't take risks, you can't create a future.",
        "Those who stand at the top determine what's wrong and what's right.",
        "Hard work betrays none, but dreams betray many.",
        "The moment you think of giving up, think of the reason why you held on so long.",
      ],
      'Romance': [
        "I want to be with you. That's all I want. I just want to be by your side.",
        "Even if we forget the faces of our friends, we will never forget the bonds that were carved into our souls.",
        "The loneliest people are the kindest. The saddest people smile the brightest.",
        "I'll always be by your side. Just like the moon is always there for Earth.",
        "Love isn't about possession. Love is about appreciation.",
        "I've always been searching for someone, but I never knew who until now.",
      ],
      'Comedy': [
        "An eye for an eye and the world goes blind.",
        "Life is like a tube of toothpaste. When you've used all the toothpaste, there's no going back.",
        "I'm not lazy, I'm just conserving energy.",
        "The only thing we're allowed to do is believe that we won't regret the choice we made.",
        "If you can't do something, then don't. Focus on what you can do.",
      ],
      'Psychological': [
        "The world is not beautiful, therefore it is.",
        "Fear is not evil. It tells you what your weakness is.",
        "People's lives don't end when they die. It ends when they lose faith.",
        "A person can change, at the moment when the person wishes to change.",
        "All we can do is live until the day we die. Control what we can... and fly free.",
        "The only ones who should kill are those prepared to be killed.",
      ],
      'Fantasy': [
        "Believing in someone... that's a scary thing, you know?",
        "A dream is worth less than nothing if you don't have someone else to share it.",
        "The ticket to the future is always open.",
        "No matter how deep the night, it always turns to day, eventually.",
        "Even if I die, I can be direct. Because our hearts are connected.",
      ],
      'Slice of Life': [
        "Yesterday is history, tomorrow is a mystery, but today is a gift.",
        "The past is the past. We cannot change it. But the future is something we create ourselves.",
        "Don't live your life making up excuses. The one making your choices is yourself.",
        "Even if things are painful and tough, people should appreciate what it means to be alive.",
      ],
      'Drama': [
        "Humans die. Animals die. Plants die. Even soul reapers die.",
        "The world is cruel, but also very beautiful.",
        "We are all like fireworks. We climb, shine, and always go our separate ways.",
        "Living is an everyday struggle. Our whole life is an effort to put food on the table.",
        "Forgetting is like a wound. The wound may heal but it has already left a scar.",
      ],
      'default': [
        "Believe in yourself. Not in the you who believes in me. Not the me who believes in you. Believe in the you who believes in yourself.",
        "People, who can't throw something important away, can never hope to change anything.",
        "Whatever you do, enjoy it to the fullest. That is the secret of life.",
        "If you don't share someone's pain, you can never understand them.",
        "A dropout will beat a genius through hard work.",
      ],
    };

    const genres = media.genres || [];
    let availableQuotes: string[] = [];
    
    // Collect quotes from matching genres
    genres.forEach(genre => {
      if (quoteDatabase[genre]) {
        availableQuotes = [...availableQuotes, ...quoteDatabase[genre]];
      }
    });
    
    // Fall back to default quotes if no genre match
    if (availableQuotes.length === 0) {
      availableQuotes = quoteDatabase['default'];
    }
    
    // Pick a random quote
    return availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
  }

  private static getScoreRange(score: number): string {
    if (score <= 2) return '1-2';
    if (score <= 4) return '3-4';
    if (score <= 6) return '5-6';
    if (score <= 8) return '7-8';
    return '9-10';
  }

  static createGameSession(type: string, questions: GameQuestion[]): GameSession {
    return {
      id: `game-${Date.now()}`,
      type,
      questions: questions.sort(() => Math.random() - 0.5),
      currentQuestionIndex: 0,
      score: 0,
      answers: [],
      startTime: Date.now(),
      completed: false,
    };
  }

  static calculateScore(session: GameSession): number {
    return session.answers.reduce((total, answer) => total + answer.points, 0);
  }

  static calculateAccuracy(session: GameSession): number {
    if (session.answers.length === 0) return 0;
    const correct = session.answers.filter(answer => answer.correct).length;
    return (correct / session.answers.length) * 100;
  }

  static getPerformanceLevel(score: number, totalPossible: number): string {
    const percentage = (score / totalPossible) * 100;
    
    if (percentage >= 90) return 'Anime Master';
    if (percentage >= 80) return 'Expert';
    if (percentage >= 70) return 'Advanced';
    if (percentage >= 60) return 'Intermediate';
    if (percentage >= 50) return 'Novice';
    return 'Beginner';
  }
}
