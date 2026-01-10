'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MediaListEntry, TasteProfile, Media } from '@/types/anilist';
import { FavoritesProfile, TasteAnalyzer } from '@/lib/taste-analyzer';

type AnalyzeTasteRequest = { type: 'analyzeTaste'; mediaList: MediaListEntry[]; mediaType: 'ANIME' | 'MANGA' };
type AnalyzeFavoritesRequest = { type: 'analyzeFavorites'; favorites: Media[]; mediaType: 'ANIME' | 'MANGA' };
type WorkerRequestBase = AnalyzeTasteRequest | AnalyzeFavoritesRequest;
type WorkerRequest = WorkerRequestBase & { id: string };

type WorkerResponse =
  | { type: 'analyzeTaste'; id: string; result: TasteProfile }
  | { type: 'analyzeFavorites'; id: string; result: FavoritesProfile }
  | { type: 'error'; id: string; error: string }
  | { type: 'ready' };

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

/**
 * Hook to use TasteAnalyzer in a Web Worker
 * Falls back to main thread if Web Workers are not supported
 */
export function useTasteWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, PendingRequest<unknown>>>(new Map());
  const [isReady, setIsReady] = useState(() => typeof Worker === 'undefined');
  const [isSupported] = useState(() => typeof Worker !== 'undefined');
  const requestIdCounter = useRef(0);

  // Initialize worker
  useEffect(() => {
    // Skip if Web Workers are not supported
    if (!isSupported) {
      return;
    }

    try {
      // Create worker using dynamic import for Next.js compatibility
      const worker = new Worker(
        new URL('../workers/taste-analyzer.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const data = event.data;

        if (data.type === 'ready') {
          setIsReady(true);
          return;
        }

        if ('id' in data) {
          const pending = pendingRequests.current.get(data.id);
          if (pending) {
            pendingRequests.current.delete(data.id);
            
            if (data.type === 'error') {
              pending.reject(new Error(data.error));
            } else {
              pending.resolve(data.result);
            }
          }
        }
      };

      worker.onerror = (error) => {
        console.error('[TasteWorker] Worker error:', error);
        // Reject all pending requests
        pendingRequests.current.forEach((pending) => {
          pending.reject(new Error('Worker error occurred'));
        });
        pendingRequests.current.clear();
      };

      workerRef.current = worker;

      // Set ready after a short timeout if no ready message received
      const timeout = setTimeout(() => {
        setIsReady(true);
      }, 1000);

      return () => {
        clearTimeout(timeout);
        worker.terminate();
        workerRef.current = null;
      };
    } catch (error) {
      console.warn('[TasteWorker] Failed to create worker, using main thread fallback:', error);
      // Worker creation failed - will use fallback in analyzeTaste/analyzeFavorites
      workerRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  // Generate unique request ID
  const generateId = useCallback(() => {
    return `req-${++requestIdCounter.current}-${Date.now()}`;
  }, []);

  // Send message to worker and return promise
  const sendMessage = useCallback(<T,>(message: WorkerRequestBase): Promise<T> => {
    const id = generateId();
    const fullMessage = { ...message, id };

    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      pendingRequests.current.set(id, { 
        resolve: resolve as (value: unknown) => void, 
        reject 
      });

      // Timeout after 30 seconds
      const timeout = setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          pendingRequests.current.delete(id);
          reject(new Error('Worker request timed out'));
        }
      }, 30000);

      // Clear timeout when resolved
      const originalResolve = pendingRequests.current.get(id)!.resolve;
      pendingRequests.current.get(id)!.resolve = (value: unknown) => {
        clearTimeout(timeout);
        originalResolve(value);
      };

      workerRef.current.postMessage(fullMessage);
    });
  }, [generateId]);

  // Analyze taste - uses worker or falls back to main thread
  const analyzeTaste = useCallback(async (
    mediaList: MediaListEntry[],
    mediaType: 'ANIME' | 'MANGA'
  ): Promise<TasteProfile> => {
    // Fallback to main thread if worker not supported
    if (!isSupported || !workerRef.current) {
      return TasteAnalyzer.analyzeTaste(mediaList, mediaType);
    }

    return sendMessage<TasteProfile>({
      type: 'analyzeTaste',
      mediaList,
      mediaType,
    });
  }, [isSupported, sendMessage]);

  // Analyze favorites - uses worker or falls back to main thread
  const analyzeFavorites = useCallback(async (
    favorites: Media[],
    mediaType: 'ANIME' | 'MANGA'
  ): Promise<FavoritesProfile> => {
    // Fallback to main thread if worker not supported
    if (!isSupported || !workerRef.current) {
      return TasteAnalyzer.analyzeFavorites(favorites, mediaType);
    }

    return sendMessage<FavoritesProfile>({
      type: 'analyzeFavorites',
      favorites,
      mediaType,
    });
  }, [isSupported, sendMessage]);

  return {
    isReady,
    isSupported,
    analyzeTaste,
    analyzeFavorites,
  };
}

/**
 * Simpler hook that returns taste profile for a media list
 * Automatically handles loading state and worker communication
 */
export function useTasteProfile(
  mediaList: MediaListEntry[] | undefined,
  mediaType: 'ANIME' | 'MANGA'
) {
  const { analyzeTaste, isReady } = useTasteWorker();
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Async effect for worker communication - setState in callbacks is valid here
  useEffect(() => {
    if (!isReady || !mediaList || mediaList.length === 0) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    analyzeTaste(mediaList, mediaType)
      .then((result) => {
        if (!cancelled) {
          setProfile(result);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mediaList, mediaType, analyzeTaste, isReady]);

  return { profile, isLoading, error };
}
