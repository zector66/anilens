import { gql, GraphQLClient } from 'graphql-request';
import { AniListUser, Media, MediaList, UserStats } from '@/types/anilist';
import { logger } from './logger';
import { 
  createFallbackLog, 
  updateFallbackStage, 
  finalizeFallbackLog
} from './recommendation-fallback';
import { shouldFilterMedia, ContentFilterSettings, DEFAULT_CONTENT_FILTER } from './content-filter';

const ANILIST_API_URL = 'https://graphql.anilist.co';

export class AniListClient {
  private client: GraphQLClient;
  private accessToken: string | null = null;

  constructor() {
    this.client = new GraphQLClient(ANILIST_API_URL);
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    this.client = new GraphQLClient(ANILIST_API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Generic request method for custom GraphQL queries
   */
  async request<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    return this.client.request<T>(query, variables);
  }

  async getCurrentUser(): Promise<AniListUser> {
    const query = gql`
      query {
        Viewer {
          id
          name
          avatar {
            large
            medium
          }
          options {
            titleLanguage
            displayAdultContent
          }
          statistics {
            anime {
              count
              episodesWatched
              meanScore
            }
            manga {
              count
              chaptersRead
              volumesRead
              meanScore
            }
          }
        }
      }
    `;

    const response = await this.client.request<{ Viewer: AniListUser }>(query);
    return response.Viewer;
  }

  async getUserByUsername(username: string): Promise<AniListUser> {
    // In the browser, AniList's GraphQL endpoint blocks cross-origin requests.
    // Proxy through our own API route instead.
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/anilist/user?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `User "${username}" not found`);
      }
      return data.user as AniListUser;
    }

    const query = gql`
      query($name: String) {
        User(name: $name) {
          id
          name
          avatar {
            large
            medium
          }
          bannerImage
          options {
            titleLanguage
            displayAdultContent
          }
          statistics {
            anime {
              count
              episodesWatched
              minutesWatched
              meanScore
            }
            manga {
              count
              chaptersRead
              volumesRead
              meanScore
            }
          }
        }
      }
    `;

    try {
      logger.debug('[AniListClient] Fetching user by username:', username);
      const response = await this.client.request<{ User: AniListUser }>(query, { name: username });
      logger.debug('[AniListClient] User response:', response.User);
      if (!response.User) {
        throw new Error(`User "${username}" not found`);
      }
      return response.User;
    } catch (error) {
      logger.error('[AniListClient] Error in getUserByUsername:', error);
      throw error;
    }
  }

  async getUserFavorites(userId: number): Promise<{ anime: Media[]; manga: Media[] }> {
    const query = gql`
      query($userId: Int) {
        User(id: $userId) {
          favourites {
            anime(perPage: 50) {
              nodes {
                id
                title {
                  romaji
                  english
                  native
                  userPreferred
                }
                type
                format
                status
                genres
                tags {
                  name
                  rank
                  isGeneralSpoiler
                  isMediaSpoiler
                }
                meanScore
                popularity
                startDate {
                  year
                }
                studios(isMain: true) {
                  edges {
                    isMain
                    node {
                      id
                      name
                      isAnimationStudio
                    }
                  }
                }
                coverImage {
                  large
                }
              }
            }
            manga(perPage: 50) {
              nodes {
                id
                title {
                  romaji
                  english
                  native
                  userPreferred
                }
                type
                format
                status
                genres
                tags {
                  name
                  rank
                  isGeneralSpoiler
                  isMediaSpoiler
                }
                meanScore
                popularity
                startDate {
                  year
                }
                staff(perPage: 5) {
                  edges {
                    role
                    node {
                      id
                      name {
                        full
                      }
                    }
                  }
                }
                coverImage {
                  extraLarge
                  large
                  medium
                  color
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.client.request<{ 
        User: { 
          favourites: { 
            anime: { nodes: Media[] }; 
            manga: { nodes: Media[] } 
          } 
        } 
      }>(query, { userId });
      
      return {
        anime: response.User?.favourites?.anime?.nodes || [],
        manga: response.User?.favourites?.manga?.nodes || []
      };
    } catch (error) {
      logger.error('[AniListClient] Error fetching favorites:', error);
      return { anime: [], manga: [] };
    }
  }

  /**
   * Lightweight query that only fetches updatedAt timestamps for all entries.
   * Used for cache validation - avoids fetching the full bloated list payload.
   */
  async getListMaxUpdatedAt(userId: number, type: 'ANIME' | 'MANGA'): Promise<number> {
    const query = gql`
      query($userId: Int, $type: MediaType) {
        MediaListCollection(userId: $userId, type: $type) {
          lists {
            entries {
              updatedAt
            }
          }
        }
      }
    `;
    try {
      const response = await this.client.request<{
        MediaListCollection: { lists: Array<{ entries: Array<{ updatedAt: number }> }> }
      }>(query, { userId, type });

      let maxUpdatedAt = 0;
      for (const list of response.MediaListCollection?.lists || []) {
        for (const entry of list.entries || []) {
          if (entry.updatedAt && entry.updatedAt > maxUpdatedAt) {
            maxUpdatedAt = entry.updatedAt;
          }
        }
      }
      return maxUpdatedAt || Date.now();
    } catch (error) {
      logger.error('[AniListClient] Error fetching list maxUpdatedAt:', error);
      return Date.now();
    }
  }

  async getAnimeList(userId: number): Promise<MediaList> {
    const query = gql`
      query($userId: Int) {
        MediaListCollection(userId: $userId, type: ANIME) {
          lists {
            name
            isCustomList
            status
            entries {
              id
              mediaId
              status
              score(format: POINT_10_DECIMAL)
              progress
              repeat
              notes
              updatedAt
              createdAt
              startedAt {
                year
                month
                day
              }
              completedAt {
                year
                month
                day
              }
              media {
                id
                title {
                  romaji
                  english
                  native
                  userPreferred
                }
                type
                format
                status
                description
                season
                seasonYear
                episodes
                duration
                coverImage {
                  extraLarge
                  large
                  medium
                  color
                }
                bannerImage
                genres
                meanScore
                popularity
                trending
                favourites
                startDate {
                  year
                  month
                  day
                }
                endDate {
                  year
                  month
                  day
                }
                studios(isMain: true) {
                  edges {
                    node {
                      id
                      name
                      isAnimationStudio
                    }
                    isMain
                  }
                }
                tags {
                  id
                  name
                  rank
                  category
                }
                characters(sort: ROLE, perPage: 10) {
                  edges {
                    node {
                      id
                      name {
                        full
                      }
                      image {
                        large
                        medium
                      }
                    }
                    role
                    voiceActors(language: JAPANESE) {
                      id
                      name {
                        full
                      }
                      image {
                        large
                        medium
                      }
                      language
                    }
                  }
                }
                relations {
                  edges {
                    relationType
                    node {
                      id
                      title {
                        romaji
                        english
                      }
                      type
                      format
                      coverImage {
                        medium
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      logger.debug('[AniListClient] Fetching anime list for user:', userId);
      const response = await this.client.request<{ MediaListCollection: MediaList }>(query, { userId });
      logger.debug('[AniListClient] Anime list response received');
      return response.MediaListCollection;
    } catch (error) {
      logger.error('[AniListClient] Error in getAnimeList:', error);
      throw error;
    }
  }

  async getMangaList(userId: number): Promise<MediaList> {
    const query = gql`
      query($userId: Int) {
        MediaListCollection(userId: $userId, type: MANGA) {
          lists {
            name
            isCustomList
            status
            entries {
              id
              mediaId
              status
              score(format: POINT_10_DECIMAL)
              progress
              progressVolumes
              repeat
              notes
              updatedAt
              createdAt
              startedAt {
                year
                month
                day
              }
              completedAt {
                year
                month
                day
              }
              media {
                id
                title {
                  romaji
                  english
                  native
                  userPreferred
                }
                type
                format
                status
                description
                chapters
                volumes
                coverImage {
                  extraLarge
                  large
                  medium
                  color
                }
                bannerImage
                genres
                meanScore
                popularity
                trending
                favourites
                startDate {
                  year
                  month
                  day
                }
                endDate {
                  year
                  month
                  day
                }
                tags {
                  id
                  name
                  rank
                  category
                }
                staff(sort: RELEVANCE, perPage: 3) {
                  edges {
                    node {
                      id
                      name {
                        full
                      }
                    }
                    role
                  }
                }
                relations {
                  edges {
                    relationType
                    node {
                      id
                      title {
                        romaji
                        english
                      }
                      type
                      format
                      coverImage {
                        large
                        medium
                        color
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      logger.debug('[AniListClient] Fetching manga list for user:', userId);
      const response = await this.client.request<{ MediaListCollection: MediaList }>(query, { userId });
      logger.debug('[AniListClient] Manga list response received');
      return response.MediaListCollection;
    } catch (error) {
      logger.error('[AniListClient] Error in getMangaList:', error);
      throw error;
    }
  }

  async getUserStats(userId: number): Promise<UserStats> {
    const query = gql`
      query($userId: Int!) {
        User(id: $userId) {
          id
          statistics {
            anime {
              count
              episodesWatched
              meanScore
              formats {
                format
                count
                meanScore
              }
              statuses {
                status
                count
                meanScore
              }
              scores {
                score
                count
              }
              genres {
                genre
                count
                meanScore
              }
              tags {
                tag {
                  id
                  name
                }
                count
                meanScore
              }
              studios {
                studio {
                  id
                  name
                }
                count
                meanScore
              }
              releaseYears {
                releaseYear
                count
                meanScore
              }
              seasons {
                season
                year
                count
                meanScore
              }
            }
            manga {
              count
              chaptersRead
              volumesRead
              meanScore
              formats {
                format
                count
                meanScore
              }
              statuses {
                status
                count
                meanScore
              }
              scores {
                score
                count
              }
              genres {
                genre
                count
                meanScore
              }
              tags {
                tag {
                  id
                  name
                }
                count
                meanScore
              }
              staff {
                staff {
                  id
                  name
                }
                count
                meanScore
              }
              releaseYears {
                releaseYear
                count
                meanScore
              }
            }
          }
        }
      }
    `;

    const response = await this.client.request<{ User: { statistics: UserStats } }>(query, {
      userId,
    });

    return {
      userId,
      anime: response.User.statistics.anime,
      manga: response.User.statistics.manga
    };
  }

  async searchMedia(
    search: string,
    type: 'ANIME' | 'MANGA' = 'ANIME',
    page: number = 1,
    perPage: number = 10
  ): Promise<{ media: Media[]; hasNextPage: boolean }> {
    const query = gql`
      query($search: String, $type: MediaType, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            hasNextPage
          }
          media(search: $search, type: $type, sort: POPULARITY_DESC) {
            id
            title {
              romaji
              english
              native
              userPreferred
            }
            type
            format
            status
            description
            season
            seasonYear
            episodes
            duration
            coverImage {
              extraLarge
              large
              medium
              color
            }
            bannerImage
            genres
            tags {
              id
              name
              rank
              category
            }
            meanScore
            popularity
            trending
            favourites
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            studios(isMain: true) {
              edges {
                node {
                  id
                  name
                  isAnimationStudio
                }
                isMain
              }
            }
          }
        }
      }
    `;

    const response = await this.client.request<{ Page: { media: Media[], pageInfo: { hasNextPage: boolean } } }>(query, {
      search,
      type,
      page,
      perPage,
    });

    return {
      media: response.Page.media,
      hasNextPage: response.Page.pageInfo.hasNextPage,
    };
  }

  async getMediaDetails(mediaId: number): Promise<Media> {
    const query = gql`
      query($mediaId: Int!) {
        Media(id: $mediaId) {
          id
          title {
            romaji
            english
            native
            userPreferred
          }
          type
          format
          status
          description
          season
          seasonYear
          episodes
          duration
          chapters
          volumes
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          genres
          synonyms
          tags {
            id
            name
            rank
            category
          }
          meanScore
          popularity
          trending
          favourites
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          studios(isMain: true) {
            edges {
              node {
                id
                name
                isAnimationStudio
              }
              isMain
            }
          }
          relations {
            edges {
              node {
                id
                title {
                  romaji
                  english
                  native
                }
                type
                format
              }
              relationType
            }
          }
          characters {
            edges {
              node {
                id
                name {
                  full
                }
                image {
                  medium
                }
              }
              role
            }
          }
          externalLinks {
            id
            site
            url
            type
          }
        }
      }
    `;

    const response = await this.client.request<{ Media: Media }>(query, {
      mediaId,
    });

    return response.Media;
  }
  /**
   * Advanced recommendation engine with multiple filtering strategies
   * @param genreAffinity - User's genre preferences with affinity scores
   * @param tagAffinity - User's tag preferences with affinity scores
   * @param watchedIds - Set of media IDs already on user's list
   * @param type - ANIME or MANGA
   * @param options - Advanced options for filtering
   */
  async getRecommendations(
    genreAffinity: { genre: string; affinity: number }[],
    watchedIds: Set<number>,
    type: 'ANIME' | 'MANGA' = 'ANIME',
    options: {
      limit?: number;
      selectedGenre?: string | null;
      selectedTags?: string[];
      mode?: 'safe' | 'experimental' | 'hidden-gem' | 'all' | 'opposite';
      minScore?: number;
      tagAffinity?: Array<{ tag: string; affinity: number; confidence?: number }>;
      studioBias?: Array<{ studio: string; bias: number }>;
      formats?: string[];
      formatWeights?: Record<string, number>;
      favoritesProfile?: {
        genreAffinity: Array<{ genre: string; affinity: number }>;
        tagAffinity: Array<{ tag: string; affinity: number }>;
        staffAffinity: Array<{ name: string; affinity: number }>;
        count: number;
      };
      anchorToFavorites?: boolean;
      favoritesInfluence?: number; // 0-30%
      explorationLevel?: number;
      contentFilter?: ContentFilterSettings;
    } = {}
  ): Promise<Media[]> {
    const { 
      limit = 12, 
      selectedGenre = null, 
      selectedTags = [],
      mode = 'all',
      minScore = 60,
      tagAffinity = [],
      studioBias = [],
      formats = [],
      formatWeights = {},
      favoritesProfile = null,
      anchorToFavorites = true,
      favoritesInfluence = 15,
      explorationLevel = 50,
      contentFilter = DEFAULT_CONTENT_FILTER
    } = options;

    // Special modes that override categorization
    const isOppositeMode = mode === 'opposite';
    const isExperimentalMode = mode === 'experimental';
    const isHiddenGemMode = mode === 'hidden-gem';
    
    // Determine genres to search based on selection or affinity
    let searchGenres: string[];
    if (selectedGenre) {
      searchGenres = [selectedGenre];
    } else if (isOppositeMode) {
      // For opposite mode, use LOWEST affinity genres (things user avoids)
      const allGenres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 
                         'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 
                         'Sports', 'Supernatural', 'Thriller', 'Mecha', 'Music'];
      const userGenres = new Set(genreAffinity.map(g => g.genre));
      const avoidedGenres = allGenres.filter(g => !userGenres.has(g));
      const lowestAffinity = genreAffinity.slice(-5).map(g => g.genre);
      searchGenres = [...avoidedGenres.slice(0, 2), ...lowestAffinity.slice(0, 1)];
    } else {
      // Logic for selecting genres to search
      const topGenres = genreAffinity.slice(0, 5).map(g => g.genre);
      const midGenres = genreAffinity.slice(5, 10).map(g => g.genre);
      
      if (explorationLevel > 70) {
        // High exploration: Pick a mix of top and less-watched genres
        const randomTop = topGenres.sort(() => Math.random() - 0.5).slice(0, 1);
        const randomMid = midGenres.sort(() => Math.random() - 0.5).slice(0, 2);
        searchGenres = [...randomTop, ...randomMid];
      } else if (explorationLevel < 30) {
        // Comfort mode: Stick to top 2 genres
        searchGenres = topGenres.slice(0, 2);
      } else {
        // Balanced: Top 3 genres randomized
        searchGenres = topGenres.sort(() => Math.random() - 0.5).slice(0, 3);
      }
    }

    // Determine tags to include
    let searchTags: string[] = [];
    if (selectedTags.length > 0) {
      searchTags = selectedTags;
    } else if (isOppositeMode) {
      // For opposite mode, use lowest affinity tags
      const lowestTags = tagAffinity.slice(-5).map(t => t.tag);
      searchTags = lowestTags.slice(0, 2);
    } else if (tagAffinity.length > 0) {
      // Exploration affects how many tags we include
      const tagCount = explorationLevel > 70 ? 1 : 3;
      searchTags = tagAffinity.slice(0, tagCount).map(t => t.tag);
    }

    // Adjust query parameters based on mode
    let sortCriteria: string[];
    let popularityRange: { min?: number; max?: number } = {};
    
    switch (mode) {
      case 'safe':
        sortCriteria = ['SCORE_DESC', 'POPULARITY_DESC'];
        popularityRange = { min: 50000 };
        break;
      case 'experimental':
        sortCriteria = ['SCORE_DESC', 'TRENDING_DESC'];
        break;
      case 'hidden-gem':
        sortCriteria = ['SCORE_DESC'];
        popularityRange = { max: 30000 };
        break;
      case 'opposite':
        // For opposite, still want quality but prioritize different sorting
        sortCriteria = ['SCORE_DESC', 'FAVOURITES_DESC'];
        break;
      default:
        sortCriteria = ['SCORE_DESC', 'POPULARITY_DESC'];
    }

    const query = gql`
      query($genres: [String], $tags: [String], $type: MediaType, $perPage: Int, $minScore: Int, $sort: [MediaSort], $formats: [MediaFormat]) {
        Page(page: 1, perPage: $perPage) {
          media(
            genre_in: $genres, 
            tag_in: $tags,
            sort: $sort, 
            type: $type, 
            isAdult: false,
            averageScore_greater: $minScore,
            format_in: $formats
          ) {
            id
            title {
              romaji
              english
              native
              userPreferred
            }
            type
            format
            status
            description
            season
            seasonYear
            episodes
            duration
            chapters
            volumes
            coverImage {
              extraLarge
              large
              medium
              color
            }
            bannerImage
            genres
            meanScore
            popularity
            trending
            favourites
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            studios(isMain: true) {
              edges {
                node {
                  id
                  name
                  isAnimationStudio
                }
                isMain
              }
            }
            tags {
              id
              name
              rank
              category
            }
            staff(sort: RELEVANCE, perPage: 3) {
              edges {
                node {
                  id
                  name {
                    full
                  }
                }
                role
              }
            }
          }
        }
      }
    `;

    // Initialize fallback log for debug tracking
    const fallbackLog = createFallbackLog(mode, minScore, searchGenres, searchTags, formats);
    let currentMinScore = minScore;

    try {
      logger.debug(`[AniListClient] getRecommendations started. Type: ${type}, Mode: ${mode}, Formats: ${formats.join(',') || 'any'}`);
      
      // 1. Initial Attempt (Stage 1)
      const response = await this.client.request<{ Page: { media: Media[] } }>(query, {
        genres: searchGenres.length > 0 ? searchGenres : undefined,
        tags: searchTags.length > 0 ? searchTags : undefined,
        type,
        perPage: 100, // Fetch more to filter and score
        minScore: minScore,
        sort: sortCriteria,
        formats: formats.length > 0 ? formats : undefined,
      });

      let results = response.Page.media.filter(media => !watchedIds.has(media.id));
      
      // CRITICAL: Filter out adult content immediately (safety requirement)
      results = results.filter(media => !shouldFilterMedia(media, contentFilter));
      
      logger.debug(`[AniListClient] Stage 1 results: ${results.length} (after content filter)`);
      updateFallbackStage(fallbackLog, 1, results.length);

      // 2. Fallback Stage 2: Drop tags, lower score threshold
      if (results.length < limit && (searchGenres.length > 0 || searchTags.length > 0 || formats.length > 0)) {
        logger.debug('[AniListClient] Stage 2: Dropping tags, lowering score...');
        currentMinScore = Math.max(40, minScore - 15);
        
        const fallbackResponse = await this.client.request<{ Page: { media: Media[] } }>(query, {
          genres: searchGenres.length > 0 ? searchGenres : undefined,
          tags: undefined, // Drop tags for broader search
          type,
          perPage: 100,
          minScore: currentMinScore,
          sort: sortCriteria,
          formats: formats.length > 0 ? formats : undefined,
        });

        let fallbackResults = fallbackResponse.Page.media.filter(media => !watchedIds.has(media.id));
        fallbackResults = fallbackResults.filter(media => !shouldFilterMedia(media, contentFilter));
        logger.debug(`[AniListClient] Stage 2 results: ${fallbackResults.length}`);
        updateFallbackStage(fallbackLog, 2, fallbackResults.length, 'Dropped tag requirement');
        
        // Merge results, prioritizing original results
        const existingIds = new Set(results.map(m => m.id));
        fallbackResults.forEach(m => {
          if (!existingIds.has(m.id)) {
            results.push(m);
          }
        });
      }

      // 3. Fallback Stage 3: Relax format constraints
      if (results.length < limit && formats.length > 0) {
        logger.debug('[AniListClient] Stage 3: Relaxing format constraints...');
        currentMinScore = 40;
        
        const fallbackResponse = await this.client.request<{ Page: { media: Media[] } }>(query, {
          genres: searchGenres.length > 0 ? searchGenres : undefined,
          tags: undefined,
          type,
          perPage: 100,
          minScore: currentMinScore,
          sort: sortCriteria,
          formats: undefined, // Drop formats
        });

        let fallbackResults = fallbackResponse.Page.media.filter(media => !watchedIds.has(media.id));
        fallbackResults = fallbackResults.filter(media => !shouldFilterMedia(media, contentFilter));
        logger.debug(`[AniListClient] Stage 3 results: ${fallbackResults.length}`);
        updateFallbackStage(fallbackLog, 3, fallbackResults.length, 'Dropped format requirement');
        
        const existingIds = new Set(results.map(m => m.id));
        fallbackResults.forEach(m => {
          if (!existingIds.has(m.id)) {
            results.push(m);
          }
        });
      }

      // 4. Fallback Stage 4: Global Trending (Last Resort)
      if (results.length < 5) {
        logger.debug('[AniListClient] Stage 4: Global trending fallback...');
        currentMinScore = 50;
        
        const lastResortResponse = await this.client.request<{ Page: { media: Media[] } }>(query, {
          genres: undefined,
          tags: undefined,
          type,
          perPage: 50,
          minScore: currentMinScore,
          sort: ['TRENDING_DESC', 'POPULARITY_DESC'],
          formats: undefined,
        });
        
        let lastResortResults = lastResortResponse.Page.media.filter(media => !watchedIds.has(media.id));
        lastResortResults = lastResortResults.filter(media => !shouldFilterMedia(media, contentFilter));
        logger.debug(`[AniListClient] Stage 4 results: ${lastResortResults.length}`);
        updateFallbackStage(fallbackLog, 4, lastResortResults.length, 'Global trending fallback');
        
        const existingIds = new Set(results.map(m => m.id));
        lastResortResults.forEach(m => {
          if (!existingIds.has(m.id)) {
            results.push(m);
          }
        });
      }
      
      // Finalize fallback log
      finalizeFallbackLog(fallbackLog, results.length, currentMinScore);
      logger.debug(`[AniListClient] Fallback summary: Stage ${fallbackLog.finalStageUsed}, ${results.length} candidates`);
      if (fallbackLog.warnings.length > 0) {
        logger.debug(`[AniListClient] Warnings: ${fallbackLog.warnings.join(', ')}`);
      }

      // Apply popularity filter based on mode (only if we have enough results)
      if (results.length > 20) {
        if (popularityRange.min) {
          results = results.filter(m => m.popularity >= popularityRange.min!);
        }
        if (popularityRange.max) {
          results = results.filter(m => m.popularity <= popularityRange.max!);
        }
      }

      // Calculate match scores for each result with detailed multi-reason explanations
      const scoredResults = results.map(media => {
        let matchScore = 0;
        const reasons: Array<{ type: string; text: string; weight: number }> = [];

        // Genre match scoring (0-40 points)
        const matchingGenres = media.genres.filter(g => 
          genreAffinity.some(ga => ga.genre === g)
        );
        const genreScore = matchingGenres.reduce((sum, g) => {
          const ga = genreAffinity.find(x => x.genre === g);
          return sum + (ga ? ga.affinity * 40 : 0);
        }, 0);
        const cappedGenreScore = Math.min(40, genreScore);
        matchScore += cappedGenreScore;
        if (matchingGenres.length > 0) {
          reasons.push({
            type: 'genre',
            text: `Matches your top genre${matchingGenres.length > 1 ? 's' : ''}: ${matchingGenres.slice(0, 2).join(', ')}`,
            weight: cappedGenreScore
          });
        }

        // Tag match scoring (0-30 points)
        const mediaTags = media.tags?.map(t => t.name) || [];
        const matchingTags = mediaTags.filter(t => 
          tagAffinity.some(ta => ta.tag === t)
        );
        const tagScore = matchingTags.reduce((sum, t) => {
          const ta = tagAffinity.find(x => x.tag === t);
          return sum + (ta ? ta.affinity * 30 : 0);
        }, 0);
        const cappedTagScore = Math.min(30, tagScore);
        matchScore += cappedTagScore;
        if (matchingTags.length > 0) {
          reasons.push({
            type: 'tag',
            text: `Features ${matchingTags[0]}${matchingTags.length > 1 ? ` (+${matchingTags.length - 1} more)` : ''}`,
            weight: cappedTagScore
          });
        }

        // Quality score (0-20 points)
        const qualityScore = (media.meanScore / 100) * 20;
        matchScore += qualityScore;
        if (media.meanScore >= 80) {
          reasons.push({
            type: 'quality',
            text: `Highly rated (${media.meanScore}% score)`,
            weight: qualityScore
          });
        }

        // Author/Studio match scoring (0-15 points)
        const sourceLabel = type === 'ANIME' ? 'studio' : 'author';
        const mediaSources = type === 'ANIME' 
          ? media.studios?.edges?.filter(e => e.isMain).map(e => e.node.name) || []
          : media.staff?.edges?.map(e => e.node.name.full) || [];
        
        const matchingSources = mediaSources.filter(s => 
          studioBias.some(sb => sb.studio === s && sb.bias > 0.4)
        );

        if (matchingSources.length > 0) {
          const bias = studioBias.find(sb => sb.studio === matchingSources[0])?.bias || 0.5;
          const score = bias * 15;
          matchScore += score;
          reasons.push({
            type: 'staff',
            text: `By a preferred ${sourceLabel}: ${matchingSources[0]}`,
            weight: score
          });
        }

        // Popularity/Risk scoring (0-10 points)
        let popularityScore = 0;
        let riskText = '';
        
        if (media.popularity < 10000) {
          popularityScore = 8;
          riskText = 'Hidden gem — obscure but quality';
        } else if (media.popularity < 50000) {
          popularityScore = 10;
          riskText = 'Sweet spot — quality without oversaturation';
        } else if (media.popularity > 200000) {
          popularityScore = 3;
          riskText = 'Popular classic';
        } else {
          popularityScore = 5;
        }
        matchScore += popularityScore;
        
        if (riskText) {
          reasons.push({
            type: 'risk',
            text: riskText,
            weight: popularityScore
          });
        }

        // Favorites similarity tie-breaker scoring (+5-12 points)
        let favoritesBonus = 0;
        if (anchorToFavorites && favoritesProfile && favoritesProfile.count > 0) {
          // Calculate similarity to favorites profile
          const mediaGenres = new Set(media.genres || []);
          const mediaTags = new Set((media.tags || []).map(t => t.name));
          const mediaStaff = type === 'ANIME'
            ? (media.studios?.edges?.filter(e => e.isMain).map(e => e.node.name) || [])
            : (media.staff?.edges?.map(e => e.node.name.full) || []);

          // Genre similarity
          const favGenreSet = new Set(favoritesProfile.genreAffinity.slice(0, 5).map(g => g.genre));
          const genreOverlap = [...mediaGenres].filter(g => favGenreSet.has(g)).length;
          const genreSim = favGenreSet.size > 0 ? genreOverlap / favGenreSet.size : 0;

          // Tag similarity
          const favTagSet = new Set(favoritesProfile.tagAffinity.slice(0, 10).map(t => t.tag));
          const tagOverlap = [...mediaTags].filter(t => favTagSet.has(t)).length;
          const tagSim = favTagSet.size > 0 ? tagOverlap / favTagSet.size : 0;

          // Staff similarity (higher weight for favorites staff)
          const favStaffSet = new Set(favoritesProfile.staffAffinity.slice(0, 5).map(s => s.name));
          const staffMatch = mediaStaff.some(s => favStaffSet.has(s));

          // Combined similarity (0-1 scale)
          const similarity = 0.4 * genreSim + 0.3 * tagSim + (staffMatch ? 0.3 : 0);
          
          // Scale to bonus points based on favoritesInfluence (0-30% maps to 0-12 bonus)
          const maxBonus = (favoritesInfluence / 30) * 12;
          favoritesBonus = similarity * maxBonus;
          matchScore += favoritesBonus;

          if (favoritesBonus > 3) {
            const matchReason = staffMatch 
              ? `Shares ${sourceLabel} with a favorite`
              : genreOverlap >= 2 
                ? 'Matches your favorites DNA'
                : 'Similar to your favorites';
            reasons.push({
              type: 'favorite',
              text: matchReason,
              weight: favoritesBonus
            });
          }
        }

        // Apply format weight multiplier (default 1.0 if not specified)
        const formatWeight = media.format ? (formatWeights[media.format] ?? 1.0) : 1.0;
        const weightedMatchScore = matchScore * formatWeight;
        
        if (formatWeight !== 1.0 && Math.abs(formatWeight - 1.0) > 0.1) {
          reasons.push({
            type: 'format',
            text: formatWeight > 1.0 
              ? `Preferred format: ${media.format}` 
              : `Less preferred format: ${media.format}`,
            weight: (formatWeight - 1.0) * 10
          });
        }

        // Sort reasons by weight and take top 3
        const topReasons = reasons.sort((a, b) => b.weight - a.weight).slice(0, 3);
        
        // Override category based on mode - special modes force their category
        let category: 'safe' | 'experimental' | 'hidden-gem' | 'opposite';
        let primaryReason: string;
        
        if (isOppositeMode) {
          category = 'opposite';
          primaryReason = 'Something different from your usual picks';
        } else if (isExperimentalMode) {
          category = 'experimental';
          primaryReason = topReasons[0]?.text || 'An experimental pick outside your comfort zone';
        } else if (isHiddenGemMode) {
          category = 'hidden-gem';
          primaryReason = topReasons[0]?.text || 'A hidden gem waiting to be discovered';
        } else {
          category = this.categorizeRecommendation(media, matchingGenres.length, tagAffinity.length);
          primaryReason = topReasons[0]?.text || 'Matches your taste profile';
        }

        return {
          media,
          matchScore: Math.round(weightedMatchScore),
          formatWeight,
          reasons: topReasons,
          primaryReason,
          category
        };
      });

      // Sort by match score
      scoredResults.sort((a, b) => b.matchScore - a.matchScore);

      // Greedy reranking with dynamic format caps for diversity
      const formatCaps: Record<string, number> = {
        TV: 5,
        TV_SHORT: 3,
        MOVIE: 3,
        SPECIAL: 2,
        OVA: 2,
        ONA: 3,
        MUSIC: 1,
        MANGA: 5,
        NOVEL: 3,
        ONE_SHOT: 2,
      };
      const formatCounts: Record<string, number> = {};
      const diverseResults: typeof scoredResults = [];

      for (const result of scoredResults) {
        const format = result.media.format || 'OTHER';
        const cap = formatCaps[format] ?? 2;
        const currentCount = formatCounts[format] || 0;

        if (currentCount < cap) {
          diverseResults.push(result);
          formatCounts[format] = currentCount + 1;
        }

        if (diverseResults.length >= limit) break;
      }

      // If we don't have enough diverse results, fill with remaining top scores
      if (diverseResults.length < limit) {
        for (const result of scoredResults) {
          if (!diverseResults.includes(result)) {
            diverseResults.push(result);
            if (diverseResults.length >= limit) break;
          }
        }
      }

      return diverseResults.map(r => ({
        ...r.media,
        _matchScore: r.matchScore,
        _matchReason: r.primaryReason,
        _reasons: r.reasons,
        _category: r.category
      }));

    } catch (error) {
      logger.error('[AniListClient] Error in getRecommendations:', error);
      throw error;
    }
  }

  private categorizeRecommendation(
    media: Media, 
    genreMatches: number,
    userTagCount: number
  ): 'safe' | 'experimental' | 'hidden-gem' | 'opposite' {
    // Hidden gem: Low popularity but decent score
    if (media.popularity < 20000 && media.meanScore >= 70) {
      return 'hidden-gem';
    }
    // Safe pick: High popularity, high score, multiple genre matches
    if (media.popularity > 50000 && media.meanScore >= 75 && genreMatches >= 2) {
      return 'safe';
    }
    // Experimental: Doesn't fit the typical profile but might surprise
    if (genreMatches < 2 || userTagCount === 0) {
      return 'experimental';
    }
    return 'safe';
  }
}

export const anilistClient = new AniListClient();

