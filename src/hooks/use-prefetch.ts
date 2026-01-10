'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { anilistClient } from '@/lib/anilist-client';

/**
 * Prefetch user data when hovering over profile links or predictable navigation
 */
export function usePrefetchUser() {
  const queryClient = useQueryClient();
  const prefetchedIds = useRef<Set<number>>(new Set());

  const prefetchUser = useCallback((userId: number) => {
    if (prefetchedIds.current.has(userId)) return;
    prefetchedIds.current.add(userId);

    // Prefetch anime list
    queryClient.prefetchQuery({
      queryKey: ['animeList', userId],
      queryFn: () => anilistClient.getAnimeList(userId),
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch manga list
    queryClient.prefetchQuery({
      queryKey: ['mangaList', userId],
      queryFn: () => anilistClient.getMangaList(userId),
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch favorites
    queryClient.prefetchQuery({
      queryKey: ['favorites', userId],
      queryFn: () => anilistClient.getUserFavorites(userId),
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient]);

  return { prefetchUser };
}

/**
 * Prefetch media details when hovering over cards
 */
export function usePrefetchMedia() {
  const queryClient = useQueryClient();
  const prefetchedIds = useRef<Set<number>>(new Set());

  const prefetchMedia = useCallback((mediaId: number) => {
    if (prefetchedIds.current.has(mediaId)) return;
    prefetchedIds.current.add(mediaId);

    queryClient.prefetchQuery({
      queryKey: ['mediaDetails', mediaId],
      queryFn: () => anilistClient.getMediaDetails(mediaId),
      staleTime: 15 * 60 * 1000,
    });
  }, [queryClient]);

  // Debounced version for hover events
  const prefetchMediaDebounced = useCallback((mediaId: number) => {
    const timeoutId = setTimeout(() => prefetchMedia(mediaId), 100);
    return () => clearTimeout(timeoutId);
  }, [prefetchMedia]);

  return { prefetchMedia, prefetchMediaDebounced };
}

/**
 * Prefetch on hover with automatic cleanup
 */
export function usePrefetchOnHover(
  prefetchFn: () => void,
  delay = 150
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => prefetchFn(), delay);
  }, [prefetchFn, delay]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { onMouseEnter, onMouseLeave };
}

/**
 * Prefetch recommendations when user is likely to view them
 */
export function usePrefetchRecommendations() {
  const queryClient = useQueryClient();
  const hasPrefetched = useRef(false);

  const prefetchRecommendations = useCallback((
    genreAffinity: Array<{ genre: string; affinity: number }>,
    watchedIds: Set<number>,
    type: 'ANIME' | 'MANGA'
  ) => {
    if (hasPrefetched.current) return;
    if (genreAffinity.length === 0) return;
    
    hasPrefetched.current = true;

    queryClient.prefetchQuery({
      queryKey: ['recommendations', type, genreAffinity.slice(0, 3).map(g => g.genre).join(',')],
      queryFn: () => anilistClient.getRecommendations(
        genreAffinity,
        watchedIds,
        type,
        { limit: 12, mode: 'safe' }
      ),
      staleTime: 3 * 60 * 1000,
    });
  }, [queryClient]);

  return { prefetchRecommendations };
}

/**
 * Warm cache for frequently accessed data
 */
export function useWarmCache(userId: number | undefined) {
  const queryClient = useQueryClient();
  const hasWarmed = useRef(false);

  useEffect(() => {
    if (!userId || hasWarmed.current) return;
    hasWarmed.current = true;

    // Warm the cache in the background after initial load
    const warmUp = async () => {
      // Wait for initial render to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Prefetch user stats
      queryClient.prefetchQuery({
        queryKey: ['userStats', userId],
        queryFn: () => anilistClient.getUserStats(userId),
        staleTime: 10 * 60 * 1000,
      });
    };

    warmUp();
  }, [userId, queryClient]);
}
