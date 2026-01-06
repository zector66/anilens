import { gql, GraphQLClient } from 'graphql-request';
import { AniListUser, Media, MediaList, UserStats } from '@/types/anilist';

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
    const query = gql`
      query($name: String) {
        User(name: $name) {
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

    try {
      console.log('[AniListClient] Fetching user by username:', username);
      const response = await this.client.request<{ User: AniListUser }>(query, { name: username });
      console.log('[AniListClient] User response:', response.User);
      if (!response.User) {
        throw new Error(`User "${username}" not found`);
      }
      return response.User;
    } catch (error) {
      console.error('[AniListClient] Error in getUserByUsername:', error);
      throw error;
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
              score(format: POINT_10)
              progress
              repeat
              notes
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
                characters(sort: ROLE, perPage: 5) {
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
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      console.log('[AniListClient] Fetching anime list for user:', userId);
      const response = await this.client.request<{ MediaListCollection: MediaList }>(query, { userId });
      console.log('[AniListClient] Anime list response received');
      return response.MediaListCollection;
    } catch (error) {
      console.error('[AniListClient] Error in getAnimeList:', error);
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
              score(format: POINT_10)
              progress
              progressVolumes
              repeat
              notes
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
              }
            }
          }
        }
      }
    `;

    try {
      console.log('[AniListClient] Fetching manga list for user:', userId);
      const response = await this.client.request<{ MediaListCollection: MediaList }>(query, { userId });
      console.log('[AniListClient] Manga list response received');
      return response.MediaListCollection;
    } catch (error) {
      console.error('[AniListClient] Error in getMangaList:', error);
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
      tagAffinity?: { tag: string; affinity: number }[];
    } = {}
  ): Promise<Media[]> {
    const { 
      limit = 12, 
      selectedGenre = null, 
      selectedTags = [],
      mode = 'all',
      minScore = 60,
      tagAffinity = []
    } = options;

    // OPPOSITE MODE: Intentionally invert taste preferences
    const isOppositeMode = mode === 'opposite';
    
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
      const topGenres = genreAffinity.slice(0, 5).map(g => g.genre);
      searchGenres = topGenres.sort(() => Math.random() - 0.5).slice(0, 3);
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
      searchTags = tagAffinity.slice(0, 3).map(t => t.tag);
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
      query($genres: [String], $tags: [String], $type: MediaType, $perPage: Int, $minScore: Int, $sort: [MediaSort]) {
        Page(page: 1, perPage: $perPage) {
          media(
            genre_in: $genres, 
            tag_in: $tags,
            sort: $sort, 
            type: $type, 
            isAdult: false,
            averageScore_greater: $minScore
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
          }
        }
      }
    `;

    try {
      const response = await this.client.request<{ Page: { media: Media[] } }>(query, {
        genres: searchGenres.length > 0 ? searchGenres : undefined,
        tags: searchTags.length > 0 ? searchTags : undefined,
        type,
        perPage: 100, // Fetch more to filter and score
        minScore: minScore,
        sort: sortCriteria,
      });

      let results = response.Page.media
        .filter(media => !watchedIds.has(media.id));

      // Apply popularity filter based on mode
      if (popularityRange.min) {
        results = results.filter(m => m.popularity >= popularityRange.min!);
      }
      if (popularityRange.max) {
        results = results.filter(m => m.popularity <= popularityRange.max!);
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

        // Sort reasons by weight and take top 3
        const topReasons = reasons.sort((a, b) => b.weight - a.weight).slice(0, 3);
        const category = this.categorizeRecommendation(media, matchingGenres.length, tagAffinity.length);

        return {
          media,
          matchScore: Math.round(matchScore),
          reasons: topReasons,
          primaryReason: topReasons[0]?.text || 'Matches your taste profile',
          category
        };
      });

      // Sort by match score and return with enhanced metadata
      return scoredResults
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit)
        .map(r => ({
          ...r.media,
          _matchScore: r.matchScore,
          _matchReason: r.primaryReason,
          _reasons: r.reasons,
          _category: r.category
        }));

    } catch (error) {
      console.error('[AniListClient] Error in getRecommendations:', error);
      throw error;
    }
  }

  private categorizeRecommendation(
    media: Media, 
    genreMatches: number,
    userTagCount: number
  ): 'safe' | 'experimental' | 'hidden-gem' {
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

