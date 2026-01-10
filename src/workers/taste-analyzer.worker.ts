/**
 * Web Worker for TasteAnalyzer computation
 * Offloads heavy taste analysis from the main thread
 */

import { TasteAnalyzer, FavoritesProfile } from '@/lib/taste-analyzer';
import { MediaListEntry, TasteProfile, Media } from '@/types/anilist';

// Message types for worker communication
export type WorkerRequest = 
  | { type: 'analyzeTaste'; id: string; mediaList: MediaListEntry[]; mediaType: 'ANIME' | 'MANGA' }
  | { type: 'analyzeFavorites'; id: string; favorites: Media[]; mediaType: 'ANIME' | 'MANGA' };

export type WorkerResponse =
  | { type: 'analyzeTaste'; id: string; result: TasteProfile }
  | { type: 'analyzeFavorites'; id: string; result: FavoritesProfile }
  | { type: 'error'; id: string; error: string };

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, id } = event.data;

  try {
    switch (type) {
      case 'analyzeTaste': {
        const { mediaList, mediaType } = event.data;
        const result = TasteAnalyzer.analyzeTaste(mediaList, mediaType);
        self.postMessage({ type: 'analyzeTaste', id, result } as WorkerResponse);
        break;
      }
      case 'analyzeFavorites': {
        const { favorites, mediaType } = event.data;
        const result = TasteAnalyzer.analyzeFavorites(favorites, mediaType);
        self.postMessage({ type: 'analyzeFavorites', id, result } as WorkerResponse);
        break;
      }
      default:
        self.postMessage({ type: 'error', id, error: `Unknown message type: ${type}` } as WorkerResponse);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    self.postMessage({ type: 'error', id, error: errorMessage } as WorkerResponse);
  }
};

// Signal that worker is ready
self.postMessage({ type: 'ready' });
