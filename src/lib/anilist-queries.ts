/**
 * AniList Query Fragments
 * 
 * Thin vs Thick queries to avoid over-fetching:
 * - THIN: For taste analysis (no covers, minimal media details)
 * - THICK: For display/UI (includes covers, banners, full details)
 */

import { gql } from 'graphql-request';

// ============================================
// THIN QUERIES - For computation/analysis
// ============================================

/**
 * Thin media fragment - only what's needed for taste analysis
 * Does NOT include: coverImage, bannerImage, description, characters, staff details
 */
export const THIN_MEDIA_FRAGMENT = gql`
  fragment ThinMedia on Media {
    id
    type
    format
    status
    seasonYear
    popularity
    meanScore
    genres
    tags {
      id
      name
      rank
      isGeneralSpoiler
      isMediaSpoiler
    }
    studios {
      edges {
        isMain
        node {
          id
          name
          isAnimationStudio
        }
      }
    }
    startDate {
      year
      month
    }
    episodes
    chapters
    volumes
  }
`;

/**
 * Thin list entry fragment - for taste analysis
 */
export const THIN_LIST_ENTRY_FRAGMENT = gql`
  fragment ThinListEntry on MediaList {
    id
    mediaId
    status
    score
    progress
    progressVolumes
    repeat
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
    updatedAt
    media {
      ...ThinMedia
    }
  }
  ${THIN_MEDIA_FRAGMENT}
`;

/**
 * Thin anime list query - for taste analysis
 */
export const THIN_ANIME_LIST_QUERY = gql`
  query ThinAnimeList($userId: Int!) {
    MediaListCollection(userId: $userId, type: ANIME) {
      lists {
        name
        status
        entries {
          ...ThinListEntry
        }
      }
    }
  }
  ${THIN_LIST_ENTRY_FRAGMENT}
`;

/**
 * Thin manga list query - for taste analysis
 */
export const THIN_MANGA_LIST_QUERY = gql`
  query ThinMangaList($userId: Int!) {
    MediaListCollection(userId: $userId, type: MANGA) {
      lists {
        name
        status
        entries {
          ...ThinListEntry
        }
      }
    }
  }
  ${THIN_LIST_ENTRY_FRAGMENT}
`;

// ============================================
// THICK QUERIES - For display/UI
// ============================================

/**
 * Thick media fragment - full details for display
 */
export const THICK_MEDIA_FRAGMENT = gql`
  fragment ThickMedia on Media {
    id
    type
    format
    status
    description(asHtml: false)
    seasonYear
    season
    popularity
    meanScore
    favourites
    trending
    genres
    tags {
      id
      name
      description
      category
      rank
      isGeneralSpoiler
      isMediaSpoiler
      isAdult
    }
    title {
      romaji
      english
      native
      userPreferred
    }
    coverImage {
      extraLarge
      large
      medium
      color
    }
    bannerImage
    studios {
      edges {
        isMain
        node {
          id
          name
          isAnimationStudio
        }
      }
    }
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
    episodes
    duration
    chapters
    volumes
    isAdult
    synonyms
    externalLinks {
      id
      site
      url
      type
    }
    trailer {
      id
      site
      thumbnail
    }
    relations {
      edges {
        node {
          id
          title {
            userPreferred
          }
          type
          format
          coverImage {
            medium
          }
        }
        relationType
      }
    }
  }
`;

/**
 * Thick list entry fragment - for display
 */
export const THICK_LIST_ENTRY_FRAGMENT = gql`
  fragment ThickListEntry on MediaList {
    id
    mediaId
    status
    score
    progress
    progressVolumes
    repeat
    priority
    private
    notes
    hiddenFromStatusLists
    advancedScores
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
    updatedAt
    createdAt
    media {
      ...ThickMedia
    }
  }
  ${THICK_MEDIA_FRAGMENT}
`;

/**
 * Single media detail query - for media pages
 */
export const MEDIA_DETAIL_QUERY = gql`
  query MediaDetail($id: Int!) {
    Media(id: $id) {
      ...ThickMedia
      characters(sort: [ROLE, FAVOURITES_DESC], perPage: 25) {
        edges {
          node {
            id
            name {
              first
              last
              full
              native
            }
            image {
              large
              medium
            }
          }
          voiceActors(language: JAPANESE) {
            id
            name {
              first
              last
              full
              native
            }
            language
            image {
              large
              medium
            }
          }
          role
        }
      }
      staff(sort: [RELEVANCE, FAVOURITES_DESC], perPage: 10) {
        edges {
          node {
            id
            name {
              first
              last
              full
              native
            }
            image {
              large
              medium
            }
          }
          role
        }
      }
      recommendations(sort: RATING_DESC, perPage: 10) {
        nodes {
          rating
          mediaRecommendation {
            id
            title {
              userPreferred
            }
            coverImage {
              medium
            }
            meanScore
            popularity
          }
        }
      }
    }
  }
  ${THICK_MEDIA_FRAGMENT}
`;

// ============================================
// MINIMAL QUERIES - For specific use cases
// ============================================

/**
 * Cover-only query - for recommendation cards
 */
export const COVERS_ONLY_QUERY = gql`
  query MediaCovers($ids: [Int!]!) {
    Page(perPage: 50) {
      media(id_in: $ids) {
        id
        title {
          userPreferred
        }
        coverImage {
          large
          medium
          color
        }
        bannerImage
      }
    }
  }
`;

/**
 * IDs-only query - for quick list checks
 */
export const IDS_ONLY_QUERY = gql`
  query UserMediaIds($userId: Int!, $type: MediaType!) {
    MediaListCollection(userId: $userId, type: $type) {
      lists {
        entries {
          mediaId
          status
        }
      }
    }
  }
`;

/**
 * Search query - minimal for autocomplete
 */
export const SEARCH_MINIMAL_QUERY = gql`
  query SearchMinimal($search: String!, $type: MediaType!) {
    Page(perPage: 10) {
      media(search: $search, type: $type, sort: POPULARITY_DESC) {
        id
        title {
          userPreferred
        }
        coverImage {
          medium
        }
        format
        seasonYear
        meanScore
      }
    }
  }
`;

// ============================================
// QUERY SELECTOR HELPER
// ============================================

export type QueryType = 'thin' | 'thick' | 'covers' | 'ids' | 'detail';

export interface QueryConfig {
  type: QueryType;
  description: string;
  estimatedFields: number;
  useCase: string;
}

export const QUERY_CONFIGS: Record<QueryType, QueryConfig> = {
  thin: {
    type: 'thin',
    description: 'Minimal data for analysis',
    estimatedFields: 15,
    useCase: 'Taste profile computation, statistics'
  },
  thick: {
    type: 'thick',
    description: 'Full data for display',
    estimatedFields: 50,
    useCase: 'Media pages, detailed views'
  },
  covers: {
    type: 'covers',
    description: 'Only cover images and titles',
    estimatedFields: 5,
    useCase: 'Recommendation cards, grids'
  },
  ids: {
    type: 'ids',
    description: 'Only IDs and status',
    estimatedFields: 2,
    useCase: 'Checking watched status, deduplication'
  },
  detail: {
    type: 'detail',
    description: 'Full detail with relations',
    estimatedFields: 80,
    useCase: 'Single media detail pages'
  }
};

/**
 * Helper to determine which query type to use
 */
export function selectQueryType(purpose: string): QueryType {
  const purposeLower = purpose.toLowerCase();
  
  if (purposeLower.includes('analysis') || purposeLower.includes('taste') || purposeLower.includes('stats')) {
    return 'thin';
  }
  if (purposeLower.includes('cover') || purposeLower.includes('card') || purposeLower.includes('grid')) {
    return 'covers';
  }
  if (purposeLower.includes('check') || purposeLower.includes('dedupe') || purposeLower.includes('watched')) {
    return 'ids';
  }
  if (purposeLower.includes('detail') || purposeLower.includes('page') || purposeLower.includes('full')) {
    return 'detail';
  }
  
  return 'thick'; // Default to thick for display
}
