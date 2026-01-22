import { GameQuestion, GameSession, MediaListEntry, Media } from '@/types/anilist';
import { shouldFilterMedia, ContentFilterSettings, DEFAULT_CONTENT_FILTER } from './content-filter';

// Track recently used anime IDs to avoid repetition across sessions
const RECENT_ANIME_KEY = 'recent-game-anime';
const MAX_RECENT_TRACKED = 50;

// P0-3 FIX: Track used media IDs within a single session to prevent duplicates
let sessionUsedMediaIds: Set<number> = new Set();

// Call this at the start of a new game session
export function resetSessionTracking(): void {
  sessionUsedMediaIds = new Set();
}

// Check if a media ID has been used in this session
function isMediaUsedInSession(mediaId: number): boolean {
  return sessionUsedMediaIds.has(mediaId);
}

// Mark a media ID as used in this session
function markMediaUsedInSession(mediaId: number): void {
  sessionUsedMediaIds.add(mediaId);
}

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
  // Filter entries based on difficulty setting and content filter
  static filterEntriesByDifficulty(
    entries: MediaListEntry[], 
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
    contentFilter: ContentFilterSettings = DEFAULT_CONTENT_FILTER
  ): MediaListEntry[] {
    // CRITICAL: Filter out adult content first (safety requirement)
    const safeEntries = entries.filter(entry => {
      if (!entry.media) return false;
      return !shouldFilterMedia(entry.media, contentFilter);
    });
    
    if (difficulty === 'mixed') return safeEntries;
    
    const now = new Date();
    const sortedEntries = [...safeEntries].sort((a, b) => {
      // Calculate "obscurity" score based on popularity and recency
      const aPopularity = a.media?.popularity || 0;
      const bPopularity = b.media?.popularity || 0;
      const aYear = a.media?.startDate?.year || 2000;
      const bYear = b.media?.startDate?.year || 2000;
      const currentYear = now.getFullYear();
      
      // Combine popularity and recency into a single score
      // Higher score = more popular/recent (easier)
      const aScore = (aPopularity / 100000) + ((aYear - 1990) / (currentYear - 1990));
      const bScore = (bPopularity / 100000) + ((bYear - 1990) / (currentYear - 1990));
      
      return bScore - aScore; // Sort by easiest first
    });
    
    const totalEntries = sortedEntries.length;
    
    switch (difficulty) {
      case 'easy':
        // Top 40% most popular/recent
        return sortedEntries.slice(0, Math.ceil(totalEntries * 0.4));
      case 'medium':
        // Middle 40%
        return sortedEntries.slice(Math.ceil(totalEntries * 0.2), Math.ceil(totalEntries * 0.8));
      case 'hard':
        // Bottom 40%
        return sortedEntries.slice(Math.floor(totalEntries * 0.6));
      default:
        return sortedEntries;
    }
  }

  static generateOPGuessingQuestions(entries: MediaListEntry[], count: number = 10, themeMode: 'openings' | 'endings' | 'mix' = 'mix'): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const shuffled = prioritizeUnused(entries, recentIds);
    const usedIds: number[] = [];
    
    let idx = 0;
    while (questions.length < count && idx < shuffled.length) {
      const entry = shuffled[idx++];
      if (!entry.media) continue;
      
      const media = entry.media;
      // P0-3 FIX: Skip if already used in this session
      if (isMediaUsedInSession(media.id)) continue;
      
      markMediaUsedInSession(media.id);
      usedIds.push(media.id);
      const difficulty = this.calculateDifficulty(entry);
      
      const { options, optionImages } = this.generateOptionsWithImages(media, shuffled);
      questions.push({
        id: `op-guess-${questions.length}`,
        type: 'OP_GUESS',
        media,
        difficulty,
        question: `Guess the ${media.type === 'ANIME' ? 'anime' : 'manga'} from its theme song`,
        options,
        optionImages,
        correctAnswer: media.title.romaji || media.title.english || '',
        hints: [
          `Released in ${media.startDate.year || 'unknown'}`,
          `Genre: ${media.genres.slice(0, 2).join(', ')}`,
          `${media.type === 'ANIME' ? 'Episodes' : 'Chapters'}: ${media.episodes || media.chapters || 'unknown'}`,
        ],
        timeLimit: difficulty === 'EASY' ? 30 : difficulty === 'MEDIUM' ? 20 : 15,
        points: difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : 30,
        // Include AniList ID and theme mode for fetching theme from AnimeThemes API
        themeData: {
          anilistId: media.id,
          themeMode,
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
      
      // Skip if no valid options generated (missing images)
      if (options.length === 0) {
        continue;
      }
      
      questions.push({
        id: `screenshot-${i}`,
        type: 'SCREENSHOT_GUESS',
        media,
        difficulty,
        question: `Guess the ${media.type === 'ANIME' ? 'anime' : 'manga'} from this screenshot`,
        options,
        optionImages,
        correctAnswer: media.title.romaji || media.title.english || '',
        hints: [
          `Studio/Author: ${media.studios?.edges?.find(e => e.isMain)?.node.name || media.staff?.edges?.find(e => e.role === 'Story & Art' || e.role === 'Art')?.node.name.full || 'Unknown'}`,
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
      const snippet = this.extractDescriptionSnippet(media, difficulty);
      if (!snippet) continue;
      
      const { options, optionImages } = this.generateOptionsWithImages(media, shuffled);
      questions.push({
        id: `quote-${i}`,
        type: 'QUOTE_GUESS',
        media,
        difficulty,
        question: `Guess the ${media.type === 'ANIME' ? 'anime' : 'manga'} from this synopsis snippet: "${snippet}"`,
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
  
  private static extractDescriptionSnippet(media: Media, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): string | null {
    const description = media.description;
    if (!description) return null;

    // Clean HTML tags from description
    const cleaned = description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
    if (cleaned.length < 50) return null;
    
    // Split into sentences
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length === 0) return null;
    
    // For harder difficulty, pick shorter/less obvious snippets
    const snippetLength = difficulty === 'EASY' ? 150 : difficulty === 'MEDIUM' ? 100 : 70;
    
    // Try to find a good sentence that doesn't contain the anime title
    const titles = [
      media.title.romaji?.toLowerCase(),
      media.title.english?.toLowerCase(),
      media.title.userPreferred?.toLowerCase()
    ].filter(Boolean) as string[];

    const goodSentences = sentences.filter(s => {
      const sentenceLower = s.toLowerCase();
      // Avoid sentences that are too long or contain the titles
      return s.length > 30 && s.length < 200 && !titles.some(t => sentenceLower.includes(t));
    });

    if (goodSentences.length === 0) {
      // Fall back to first few sentences but still try to hide title if it's right at start
      const fallback = cleaned.substring(0, 300);
      let snippet = fallback.substring(0, snippetLength);
    // Simple attempt to hide titles if they are in the snippet
      titles.forEach(t => {
        if (!t) return;
        // Escape special characters for regex
        const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp(escaped, 'gi');
        snippet = snippet.replace(reg, '___');
      });
      return snippet + (fallback.length > snippetLength ? '...' : '');
    }
    
    // Pick a random sentence from the middle (avoid spoilery endings)
    const middleSentences = goodSentences.slice(0, Math.max(1, Math.floor(goodSentences.length * 0.7)));
    const picked = middleSentences[Math.floor(Math.random() * middleSentences.length)];
    
    return picked.trim().substring(0, snippetLength) + (picked.length > snippetLength ? '...' : '');
  }

  static generateScoreGuessQuestions(entries: MediaListEntry[], count: number = 10, includeUnrated: boolean = false): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    // P0-5 FIX: Exclude unrated entries (score === null/0) unless explicitly included
    const scoredEntries = includeUnrated 
      ? entries 
      : entries.filter(e => e.score && e.score > 0);
    const shuffled = prioritizeUnused(scoredEntries, recentIds);
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
        question: `What score did you give to ${media.title.romaji || media.title.english || (media.type === 'ANIME' ? 'this anime' : 'this manga')}?`,
        options: ['1-2', '3-4', '5-6', '7-8', '9-10'],
        correctAnswer: this.getScoreRange(entry.score),
        hints: [
          `${media.type === 'ANIME' ? 'You watched' : 'You read'} ${entry.progress || 0} ${media.type === 'ANIME' ? 'episodes' : 'chapters'}`,
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

  // P3-14: Seiyuu (Voice Actor) guessing game
  static generateSeiyuuQuestions(entries: MediaListEntry[], count: number = 10): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    // Filter to anime only (voice actors) with character data that has voice actors
    const filtered = entries.filter(e => 
      e.media?.type === 'ANIME' && 
      e.media?.characters?.edges?.some(c => c.voiceActors && c.voiceActors.length > 0)
    );
    const shuffled = prioritizeUnused(filtered, recentIds);
    const usedIds: number[] = [];
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const entry = shuffled[i];
      if (!entry.media) continue;
      
      const media = entry.media;
      const characters = media.characters.edges;
      
      // Find a character with a Japanese voice actor
      const charWithVA = characters.find(c => 
        c.voiceActors && c.voiceActors.some(va => va.language === 'JAPANESE')
      );
      
      if (!charWithVA) continue;
      
      const japaneseVA = charWithVA.voiceActors?.find(va => va.language === 'JAPANESE');
      if (!japaneseVA) continue;
      
      usedIds.push(media.id);
      const difficulty = this.calculateDifficulty(entry);
      const charName = charWithVA.node.name.full;
      const vaName = japaneseVA.name.full;
      
      const { options, optionImages } = this.generateOptionsWithImages(media, shuffled);
      questions.push({
        id: `seiyuu-guess-${i}`,
        type: 'SEIYUU_GUESS',
        media,
        difficulty,
        question: `${vaName} voiced "${charName}" in which anime?`,
        options,
        optionImages,
        correctAnswer: media.title.romaji || media.title.english || '',
        hints: [
          `Character Role: ${charWithVA.role}`,
          `Genre: ${media.genres.slice(0, 2).join(', ')}`,
          `Year: ${media.startDate.year || 'unknown'}`,
        ],
        timeLimit: difficulty === 'EASY' ? 25 : 20,
        points: difficulty === 'EASY' ? 25 : 40,
        // Store VA info for display
        themeData: {
          voiceActor: vaName,
          character: charName,
          vaImage: japaneseVA.image?.medium || japaneseVA.image?.large,
        },
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
        question: `In which season did "${media.title.userPreferred || media.title.romaji}" ${media.type === 'ANIME' ? 'air' : 'start'}?`,
        options: Array.from(seasonOptions).sort(() => Math.random() - 0.5),
        correctAnswer: seasonStr,
        hints: [
          `Format: ${media.format}`,
          `${media.type === 'ANIME' ? 'Episodes' : 'Chapters'}: ${media.episodes || media.chapters || 'unknown'}`,
          `Studio/Author: ${media.studios?.edges?.find(e => e.isMain)?.node.name || media.staff?.edges?.find(e => e.role === 'Story & Art' || e.role === 'Art')?.node.name.full || 'Unknown'}`,
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
      
      // Check if media has a valid cover image
      const hasCover = media.coverImage?.extraLarge || 
                      media.coverImage?.large || 
                      media.coverImage?.medium;
      
      if (!hasCover) {
        continue; // Skip media without cover image
      }
      
      usedIds.push(media.id);
      const difficulty = this.calculateDifficulty(entry);
      
      // P0-4 FIX: Don't include cover images in options (would reveal the answer)
      const { options } = this.generateOptionsWithImages(media, shuffled, true);
      
      // Skip if no valid options generated
      if (options.length === 0) {
        continue;
      }
      
      questions.push({
        id: `cover-guess-${i}`,
        type: 'COVER_GUESS',
        media,
        difficulty,
        question: `Guess the ${media.type === 'ANIME' ? 'anime' : 'manga'} from its cover`,
        options,
        // No optionImages for COVER_GUESS - would give away the answer
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

  // Helper to check if two titles are likely related (same franchise/different seasons)
  private static areTitlesRelated(title1: string, title2: string): boolean {
    if (!title1 || !title2) return false;
    
    // Normalize titles for comparison
    const normalize = (t: string) => t.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+(season|part|cour|2nd|3rd|4th|5th|ii|iii|iv|v|s\d+|ep\d+|ova|movie|film|special)\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const norm1 = normalize(title1);
    const norm2 = normalize(title2);
    
    // Check if one is a prefix of the other (e.g., "Attack on Titan" and "Attack on Titan Season 2")
    if (norm1.startsWith(norm2) || norm2.startsWith(norm1)) return true;
    
    // Check if they share a significant common prefix (at least 10 chars)
    const minLen = Math.min(norm1.length, norm2.length);
    if (minLen >= 10) {
      let commonLen = 0;
      for (let i = 0; i < minLen; i++) {
        if (norm1[i] === norm2[i]) commonLen++;
        else break;
      }
      if (commonLen >= 10) return true;
    }
    
    return false;
  }

  // Generate options with their cover images
  // P0-4 FIX: Added excludeCorrectCover option to hide the correct answer's cover in COVER_GUESS games
  // FIX: Filter out related series (different seasons of same show) to avoid confusing options
  private static generateOptionsWithImages(
    correctMedia: Media, 
    allEntries: MediaListEntry[],
    excludeCorrectCover: boolean = false
  ): { options: string[], optionImages: Record<string, string> } {
    const optionImages: Record<string, string> = {};
    const correctTitle = correctMedia.title.romaji || correctMedia.title.english || '';
    const options = [correctTitle];
    
    // Get the best available cover image with proper fallback
    const getCoverImage = (media: Media): string => {
      return media.coverImage?.extraLarge || 
             media.coverImage?.large || 
             media.coverImage?.medium || 
             '';
    };
    
    // Don't include cover for correct answer in COVER_GUESS (would give it away)
    if (!excludeCorrectCover) {
      const coverImg = getCoverImage(correctMedia);
      if (!coverImg) {
        // Skip this media if no cover image available
        return { options: [], optionImages: {} };
      }
      optionImages[correctTitle] = coverImg;
    }
    
    // Add 3 random incorrect options, excluding related series
    const incorrectEntries = allEntries
      .filter(e => {
        if (!e.media || e.media.id === correctMedia.id) return false;
        // Filter out related series (sequels, prequels, different seasons)
        const entryTitle = e.media.title.romaji || e.media.title.english || '';
        return !this.areTitlesRelated(correctTitle, entryTitle);
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    incorrectEntries.forEach(entry => {
      if (entry.media) {
        const title = entry.media.title.romaji || entry.media.title.english || '';
        const coverImg = getCoverImage(entry.media);
        
        // Skip entries without cover images
        if (!excludeCorrectCover && !coverImg) {
          return;
        }
        
        options.push(title);
        // Don't include covers in answer options for COVER_GUESS
        if (!excludeCorrectCover) {
          optionImages[title] = coverImg;
        }
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

  // ============ NEW GAMES ============

  // Common fake tags that sound plausible but aren't real AniList tags
  private static readonly FAKE_TAGS = [
    'Time Loop', 'Time Skip', 'Memory Loss', 'Dream World', 'Parallel World',
    'Power Awakening', 'Hidden Power', 'Sealed Power', 'Power Transfer',
    'School Battle', 'School Mystery', 'School Sports', 'School Music',
    'Dark Fantasy', 'Light Fantasy', 'Urban Fantasy', 'Modern Fantasy',
    'Cyberpunk', 'Steampunk', 'Dieselpunk', 'Solarpunk',
    'Revenge Plot', 'Rescue Arc', 'Training Arc', 'Tournament Arc',
    'Childhood Promise', 'Lost Sibling', 'Secret Identity', 'Double Life',
    'Monster Hunter', 'Demon Hunter', 'Vampire Hunter', 'Ghost Hunter',
    'Virtual World', 'Digital World', 'Game World', 'Fantasy World',
    'Ancient Prophecy', 'Chosen One', 'Destined Hero', 'Reluctant Hero',
    'Magic School', 'Combat School', 'Spy School', 'Monster School',
    'Alien Invasion', 'Robot Uprising', 'Zombie Outbreak', 'Demon Invasion',
    'Love Polygon', 'Forbidden Love', 'First Love', 'Unrequited Love',
    'Coming of Age', 'Self Discovery', 'Personal Growth', 'Identity Crisis',
  ];

  /**
   * Tag or Cap? - Show anime + 3 tags, guess which is real or fake
   */
  static generateTagOrCapQuestions(entries: MediaListEntry[], count: number): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const prioritized = prioritizeUnused(entries, recentIds);
    
    // Filter entries that have tags
    const withTags = prioritized.filter(e => e.media?.tags && e.media.tags.length >= 2);
    const shuffled = shuffleArray(withTags);
    const usedIds: number[] = [];

    for (const entry of shuffled) {
      if (questions.length >= count) break;
      if (!entry.media || isMediaUsedInSession(entry.media.id)) continue;

      const media = entry.media;
      const realTags = media.tags?.map(t => t.name) || [];
      if (realTags.length < 2) continue;

      // Pick 1 real tag for the answer
      const shuffledReal = shuffleArray(realTags);
      const realTag = shuffledReal[0];

      // Pick 1 fake tag that's NOT in real tags
      const availableFakes = this.FAKE_TAGS.filter(f => !realTags.includes(f));
      const fakeTag = shuffleArray(availableFakes)[0];

      // Pick 1 more fake tag for the third option
      const remainingFakes = availableFakes.filter(f => f !== fakeTag);
      const secondFake = shuffleArray(remainingFakes)[0];

      // 50% chance: "Which tag is FAKE?" vs "Which tag is REAL?"
      const askForFake = Math.random() > 0.5;
      const options = shuffleArray([realTag, fakeTag, secondFake]);
      const correctAnswer = askForFake ? fakeTag : realTag;

      const title = media.title.english || media.title.romaji || 'Unknown';

      questions.push({
        id: `tag-${media.id}-${questions.length}`,
        type: 'TAG_OR_CAP',
        difficulty: 'MEDIUM',
        question: askForFake 
          ? `Which tag is FAKE for "${title}"?`
          : `Which tag is REAL for "${title}"?`,
        correctAnswer,
        options,
        media,
        timeLimit: 15,
        points: 100,
      });

      markMediaUsedInSession(media.id);
      usedIds.push(media.id);
    }

    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  /**
   * Popularity Battle - Two titles, which is more popular? (Endless potential)
   */
  static generatePopularityBattleQuestions(entries: MediaListEntry[], count: number): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const prioritized = prioritizeUnused(entries, recentIds);
    
    // Need entries with popularity data
    const withPopularity = prioritized.filter(e => e.media?.popularity && e.media.popularity > 0);
    const shuffled = shuffleArray(withPopularity);
    const usedIds: number[] = [];

    for (let i = 0; i < shuffled.length - 1 && questions.length < count; i += 2) {
      const entry1 = shuffled[i];
      const entry2 = shuffled[i + 1];
      
      if (!entry1?.media || !entry2?.media) continue;
      if (isMediaUsedInSession(entry1.media.id) || isMediaUsedInSession(entry2.media.id)) continue;

      const media1 = entry1.media;
      const media2 = entry2.media;

      // Skip if popularity is too similar (within 10%)
      const popDiff = Math.abs(media1.popularity - media2.popularity);
      const avgPop = (media1.popularity + media2.popularity) / 2;
      if (popDiff / avgPop < 0.1) continue;

      const title1 = media1.title.english || media1.title.romaji || 'Unknown';
      const title2 = media2.title.english || media2.title.romaji || 'Unknown';
      const morePopular = media1.popularity > media2.popularity ? title1 : title2;

      questions.push({
        id: `pop-${media1.id}-${media2.id}`,
        type: 'POPULARITY_BATTLE',
        difficulty: 'EASY',
        question: 'Which title is MORE POPULAR on AniList?',
        correctAnswer: morePopular,
        options: [title1, title2],
        media: media1.popularity > media2.popularity ? media1 : media2,
        timeLimit: 10,
        points: 100,
        optionImages: {
          [title1]: media1.coverImage?.medium || '',
          [title2]: media2.coverImage?.medium || '',
        },
      });

      markMediaUsedInSession(media1.id);
      markMediaUsedInSession(media2.id);
      usedIds.push(media1.id, media2.id);
    }

    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  /**
   * Taste Consistency - Two shows you rated, which did you rate higher?
   */
  static generateTasteConsistencyQuestions(entries: MediaListEntry[], count: number): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    
    // Only include entries with scores
    const withScores = entries.filter(e => e.score && e.score > 0 && e.media);
    const prioritized = prioritizeUnused(withScores, recentIds);
    const shuffled = shuffleArray(prioritized);
    const usedIds: number[] = [];

    for (let i = 0; i < shuffled.length - 1 && questions.length < count; i += 2) {
      const entry1 = shuffled[i];
      const entry2 = shuffled[i + 1];
      
      if (!entry1?.media || !entry2?.media) continue;
      if (isMediaUsedInSession(entry1.media.id) || isMediaUsedInSession(entry2.media.id)) continue;

      // Skip if scores are identical
      if (entry1.score === entry2.score) continue;

      const media1 = entry1.media;
      const media2 = entry2.media;
      const title1 = media1.title.english || media1.title.romaji || 'Unknown';
      const title2 = media2.title.english || media2.title.romaji || 'Unknown';
      const higherRated = entry1.score! > entry2.score! ? title1 : title2;

      questions.push({
        id: `taste-${media1.id}-${media2.id}`,
        type: 'TASTE_CONSISTENCY',
        difficulty: 'MEDIUM',
        question: 'Which title did YOU rate higher?',
        correctAnswer: higherRated,
        options: [title1, title2],
        media: entry1.score! > entry2.score! ? media1 : media2,
        timeLimit: 10,
        points: 100,
        optionImages: {
          [title1]: media1.coverImage?.medium || '',
          [title2]: media2.coverImage?.medium || '',
        },
      });

      markMediaUsedInSession(media1.id);
      markMediaUsedInSession(media2.id);
      usedIds.push(media1.id, media2.id);
    }

    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  /**
   * Studio Match - Guess the studio from the anime
   */
  static generateStudioMatchQuestions(entries: MediaListEntry[], count: number): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const prioritized = prioritizeUnused(entries, recentIds);
    
    // Build a pool of all studios for decoys
    const allStudios = new Set<string>();
    entries.forEach(e => {
      e.media?.studios?.edges?.forEach(edge => {
        if (edge.node.isAnimationStudio) allStudios.add(edge.node.name);
      });
    });
    const studioPool = Array.from(allStudios);

    // Filter entries with studio data
    const withStudios = prioritized.filter(e => 
      e.media?.studios?.edges?.some(edge => edge.node.isAnimationStudio)
    );
    const shuffled = shuffleArray(withStudios);
    const usedIds: number[] = [];

    for (const entry of shuffled) {
      if (questions.length >= count) break;
      if (!entry.media || isMediaUsedInSession(entry.media.id)) continue;

      const media = entry.media;
      const mainStudioEdge = media.studios?.edges?.find(edge => edge.node.isAnimationStudio);
      const mainStudio = mainStudioEdge?.node;
      if (!mainStudio) continue;

      const title = media.title.english || media.title.romaji || 'Unknown';

      // Get 3 decoy studios (not the correct one)
      const decoys = shuffleArray(studioPool.filter(s => s !== mainStudio.name)).slice(0, 3);
      if (decoys.length < 3) continue; // Need enough decoys

      const options = shuffleArray([mainStudio.name, ...decoys]);

      questions.push({
        id: `studio-${media.id}-${questions.length}`,
        type: 'STUDIO_MATCH',
        difficulty: 'HARD',
        question: `Which studio made "${title}"?`,
        correctAnswer: mainStudio.name,
        options,
        media,
        timeLimit: 15,
        points: 100,
      });

      markMediaUsedInSession(media.id);
      usedIds.push(media.id);
    }

    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  /**
   * VA Connection - Do two characters share the same voice actor? Yes/No
   */
  static generateVAConnectionQuestions(entries: MediaListEntry[], count: number): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    
    // Build a map of VA name -> list of characters they voiced
    const vaToCharacters = new Map<string, Array<{ charName: string; charImage: string; animeName: string; animeId: number }>>();
    
    entries.forEach(e => {
      if (!e.media?.characters?.edges) return;
      e.media.characters.edges.forEach(edge => {
        edge.voiceActors?.forEach(va => {
          if (!va.name?.full) return;
          const vaName = va.name.full;
          if (!vaToCharacters.has(vaName)) {
            vaToCharacters.set(vaName, []);
          }
          vaToCharacters.get(vaName)!.push({
            charName: edge.node.name.full,
            charImage: edge.node.image?.large || edge.node.image?.medium || '',
            animeName: e.media!.title.english || e.media!.title.romaji || 'Unknown',
            animeId: e.media!.id,
          });
        });
      });
    });

    // Get VAs with at least 2 characters
    const vasWithMultiple = Array.from(vaToCharacters.entries())
      .filter(([_, chars]) => chars.length >= 2)
      .map(([vaName, chars]) => ({ vaName, chars }));

    const shuffledVAs = shuffleArray(vasWithMultiple);
    const usedPairs = new Set<string>();

    for (let i = 0; i < count && shuffledVAs.length > 0; i++) {
      // 50% chance: same VA (yes) or different VA (no)
      const isSameVA = Math.random() > 0.5;

      if (isSameVA && shuffledVAs.length > 0) {
        // Pick 2 characters from the same VA
        const va = shuffledVAs[i % shuffledVAs.length];
        if (va.chars.length < 2) continue;
        
        const shuffledChars = shuffleArray(va.chars);
        const char1 = shuffledChars[0];
        const char2 = shuffledChars[1];
        
        const pairKey = [char1.charName, char2.charName].sort().join('|');
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);

        questions.push({
          id: `va-${char1.animeId}-${char2.animeId}-${questions.length}`,
          type: 'VA_CONNECTION',
          difficulty: 'HARD',
          question: `Do "${char1.charName}" and "${char2.charName}" share the same voice actor?`,
          correctAnswer: 'Yes',
          options: ['Yes', 'No'],
          timeLimit: 10,
          points: 100,
          optionImages: {
            [char1.charName]: char1.charImage,
            [char2.charName]: char2.charImage,
          },
          hints: [`${char1.animeName}`, `${char2.animeName}`],
        });
      } else {
        // Pick 2 characters from different VAs
        if (shuffledVAs.length < 2) continue;
        
        const va1 = shuffledVAs[i % shuffledVAs.length];
        const va2 = shuffledVAs[(i + 1) % shuffledVAs.length];
        if (va1.vaName === va2.vaName) continue;
        
        const char1 = va1.chars[0];
        const char2 = va2.chars[0];
        
        const pairKey = [char1.charName, char2.charName].sort().join('|');
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);

        questions.push({
          id: `va-${char1.animeId}-${char2.animeId}-${questions.length}`,
          type: 'VA_CONNECTION',
          difficulty: 'HARD',
          question: `Do "${char1.charName}" and "${char2.charName}" share the same voice actor?`,
          correctAnswer: 'No',
          options: ['Yes', 'No'],
          timeLimit: 10,
          points: 100,
          optionImages: {
            [char1.charName]: char1.charImage,
            [char2.charName]: char2.charImage,
          },
          hints: [`${char1.animeName}`, `${char2.animeName}`],
        });
      }
    }

    return questions;
  }

  /**
   * Sequel or Spin-off? - Identify the relation type between two titles
   */
  static generateRelationTypeQuestions(entries: MediaListEntry[], count: number): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    
    // Collect all relation pairs
    const relationPairs: Array<{
      source: Media;
      target: { id: number; title: string; coverImage: string };
      relationType: string;
    }> = [];

    // Only use relation types that will be in the options
    const validRelationTypes = ['SEQUEL', 'PREQUEL', 'SIDE_STORY', 'SPIN_OFF'];
    
    entries.forEach(e => {
      if (!e.media?.relations?.edges) return;
      e.media.relations.edges.forEach(edge => {
        if (!edge.node || !edge.relationType) return;
        // Only include relation types that are in our options
        if (validRelationTypes.includes(edge.relationType)) {
          relationPairs.push({
            source: e.media!,
            target: {
              id: edge.node.id,
              title: edge.node.title?.english || edge.node.title?.romaji || 'Unknown',
              coverImage: edge.node.coverImage?.medium || '',
            },
            relationType: edge.relationType,
          });
        }
      });
    });

    const shuffled = shuffleArray(relationPairs);
    const usedPairs = new Set<string>();

    for (const pair of shuffled) {
      if (questions.length >= count) break;
      
      const pairKey = `${pair.source.id}-${pair.target.id}`;
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      const sourceTitle = pair.source.title.english || pair.source.title.romaji || 'Unknown';
      
      // Format relation type for display
      const formatRelation = (r: string) => r.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      
      // Generate decoy options from valid types
      const correctFormatted = formatRelation(pair.relationType);
      const decoys = validRelationTypes
        .filter(r => r !== pair.relationType)
        .map(formatRelation);
      
      const options = shuffleArray([correctFormatted, ...decoys]);

      questions.push({
        id: `rel-${pair.source.id}-${pair.target.id}`,
        type: 'RELATION_TYPE',
        difficulty: 'MEDIUM',
        question: `What is "${pair.target.title}" to "${sourceTitle}"?`,
        correctAnswer: correctFormatted,
        options,
        media: pair.source,
        timeLimit: 15,
        points: 100,
        optionImages: {
          [sourceTitle]: pair.source.coverImage?.medium || '',
          [pair.target.title]: pair.target.coverImage,
        },
      });
    }

    return questions;
  }

  /**
   * Score Ladder - Order 5 titles by your score (drag and drop style, but as multiple choice)
   */
  static generateScoreLadderQuestions(entries: MediaListEntry[], count: number): GameQuestion[] {
    const questions: GameQuestion[] = [];
    
    // Only include entries with scores
    const withScores = entries.filter(e => e.score && e.score > 0 && e.media);
    if (withScores.length < 5) return questions;

    const shuffled = shuffleArray(withScores);

    for (let i = 0; i < count && i * 5 + 4 < shuffled.length; i++) {
      // Take 5 consecutive entries
      const batch = shuffled.slice(i * 5, i * 5 + 5);
      
      // Sort by score descending to get correct order
      const sorted = [...batch].sort((a, b) => (b.score || 0) - (a.score || 0));
      const highestTitle = sorted[0].media!.title.english || sorted[0].media!.title.romaji || 'Unknown';
      
      // Ask which one was rated highest
      const titles = batch.map(e => e.media!.title.english || e.media!.title.romaji || 'Unknown');
      const optionImages: Record<string, string> = {};
      batch.forEach(e => {
        const title = e.media!.title.english || e.media!.title.romaji || 'Unknown';
        optionImages[title] = e.media!.coverImage?.medium || '';
      });

      questions.push({
        id: `ladder-${batch.map(e => e.media!.id).join('-')}`,
        type: 'SCORE_LADDER',
        difficulty: 'MEDIUM',
        question: 'Which of these 5 titles did you rate HIGHEST?',
        correctAnswer: highestTitle,
        options: shuffleArray(titles),
        media: sorted[0].media,
        timeLimit: 20,
        points: 150,
        optionImages,
      });
    }

    return questions;
  }

  /**
   * Tag Ladder - Progressive tag reveal, guess the anime
   */
  static generateTagLadderQuestions(entries: MediaListEntry[], count: number): GameQuestion[] {
    const questions: GameQuestion[] = [];
    const recentIds = getRecentlyUsedIds();
    const prioritized = prioritizeUnused(entries, recentIds);
    
    // Filter entries with enough tags
    const withTags = prioritized.filter(e => e.media?.tags && e.media.tags.length >= 4);
    const shuffled = shuffleArray(withTags);
    const usedIds: number[] = [];

    for (const entry of shuffled) {
      if (questions.length >= count) break;
      if (!entry.media || isMediaUsedInSession(entry.media.id)) continue;

      const media = entry.media;
      const tags = media.tags?.map(t => t.name) || [];
      if (tags.length < 4) continue;

      const title = media.title.english || media.title.romaji || 'Unknown';
      
      // Pick 4 random tags to reveal progressively (stored in hints)
      const selectedTags = shuffleArray(tags).slice(0, 4);
      
      // Generate 3 decoy options from other anime
      const decoys = shuffleArray(
        entries
          .filter(e => e.media && e.media.id !== media.id)
          .map(e => e.media!.title.english || e.media!.title.romaji || 'Unknown')
      ).slice(0, 3);

      if (decoys.length < 3) continue;

      const options = shuffleArray([title, ...decoys]);
      const optionImages: Record<string, string> = {};
      [entry, ...entries.filter(e => decoys.includes(e.media?.title.english || e.media?.title.romaji || ''))].forEach(e => {
        if (e.media) {
          const t = e.media.title.english || e.media.title.romaji || 'Unknown';
          optionImages[t] = e.media.coverImage?.medium || '';
        }
      });

      questions.push({
        id: `tagladder-${media.id}-${questions.length}`,
        type: 'TAG_LADDER',
        difficulty: 'HARD',
        question: `Tags: ${selectedTags.join(' • ')}\n\nWhich anime has these tags?`,
        correctAnswer: title,
        options,
        media,
        timeLimit: 20,
        points: 120,
        hints: selectedTags,
        optionImages,
      });

      markMediaUsedInSession(media.id);
      usedIds.push(media.id);
    }

    saveRecentlyUsedIds([...recentIds, ...usedIds]);
    return questions;
  }

  // ============ END NEW GAMES ============

  static createGameSession(type: string, questions: GameQuestion[]): GameSession {
    return {
      id: `game-${Date.now()}`,
      type,
      questions, // Don't reshuffle here, order is determined by generator
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

  static getPerformanceLevel(score: number, totalPossible: number, type: 'ANIME' | 'MANGA' = 'ANIME'): string {
    const percentage = (score / totalPossible) * 100;
    const term = type === 'ANIME' ? 'Anime' : 'Manga';
    
    if (percentage >= 90) return `${term} Master`;
    if (percentage >= 80) return 'Expert';
    if (percentage >= 70) return 'Advanced';
    if (percentage >= 60) return 'Intermediate';
    if (percentage >= 50) return 'Novice';
    return 'Beginner';
  }
}
