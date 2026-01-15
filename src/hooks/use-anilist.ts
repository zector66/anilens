'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { anilistClient } from '@/lib/anilist-client';

export function useAnimeList(userId: number) {
  return useQuery({
    queryKey: ['animeList', userId],
    queryFn: async () => {
      console.log('[useAnimeList] queryFn triggered for userId:', userId);
      return anilistClient.getAnimeList(userId);
    },
    enabled: !!userId && userId > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes - lists don't change often
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Use cached data if available
  });
}

export function useMangaList(userId: number) {
  return useQuery({
    queryKey: ['mangaList', userId],
    queryFn: () => anilistClient.getMangaList(userId),
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useFavorites(userId: number) {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => anilistClient.getUserFavorites(userId),
    enabled: !!userId && userId > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes - favorites change rarely
    gcTime: 60 * 60 * 1000, // 1 hour in cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUserStats(userId: number) {
  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => anilistClient.getUserStats(userId),
    enabled: !!userId,
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 40 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useMediaSearch(search: string, type: 'ANIME' | 'MANGA' = 'ANIME') {
  return useQuery({
    queryKey: ['mediaSearch', search, type],
    queryFn: () => anilistClient.searchMedia(search, type),
    enabled: search.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useMediaDetails(mediaId: number) {
  return useQuery({
    queryKey: ['mediaDetails', mediaId],
    queryFn: () => anilistClient.getMediaDetails(mediaId),
    enabled: !!mediaId,
    staleTime: 30 * 60 * 1000, // 30 minutes - media details rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export interface RecommendationOptions {
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
  explorationLevel?: number; // 0-100, affects genre diversity and risk tolerance
}

export function useRecommendations(
  genreAffinity: { genre: string; affinity: number }[], 
  watchedIds: Set<number>, 
  type: 'ANIME' | 'MANGA' = 'ANIME',
  options: RecommendationOptions = {}
) {
  const { 
    selectedGenre, 
    selectedTags = [], 
    mode = 'all', 
    minScore = 60, 
    tagAffinity = [], 
    studioBias = [],
    formats = [],
    formatWeights = {},
    favoritesProfile,
    anchorToFavorites = true,
    favoritesInfluence = 15,
    explorationLevel = 50 
  } = options;
  
  // Create a stable hash of watched IDs for cache key
  const watchedIdsHash = `${watchedIds.size}-${Array.from(watchedIds).slice(0, 10).join(',')}`;
  
  return useQuery({
    queryKey: [
      'recommendations', 
      watchedIdsHash,
      genreAffinity.slice(0, 5).map(g => g.genre).join(','), 
      type,
      selectedGenre || 'all',
      mode,
      selectedTags.join(','),
      minScore,
      Math.floor(explorationLevel / 20), // Bucket exploration level for caching
      studioBias.slice(0, 3).map(s => s.studio).join(','),
      formats.join(',')
    ],
    queryFn: async () => {
      const results = await anilistClient.getRecommendations(genreAffinity, watchedIds, type, {
        selectedGenre,
        selectedTags,
        mode,
        minScore,
        tagAffinity,
        studioBias,
        formats,
        formatWeights,
        favoritesProfile,
        anchorToFavorites,
        favoritesInfluence,
        explorationLevel,
        limit: 18
      });
      // Double-check filtering on client side to ensure no watched titles
      return results.filter(media => !watchedIds.has(media.id)).slice(0, 12);
    },
    enabled: genreAffinity.length > 0 && watchedIds.size > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - recommendations can be reused
    gcTime: 20 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useInvalidateAnimeList() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['animeList'] });
  };
}

export function useInvalidateUserStats() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['userStats'] });
  };
}
