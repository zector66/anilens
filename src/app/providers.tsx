'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { SettingsProvider } from '@/contexts/settings-context';
import { MediaProvider } from '@/contexts/media-context';
import { UIProvider } from '@/contexts/ui-context';
import { ContentFilterProvider } from '@/components/content-filter-provider';
import { ToastProvider } from '@/components/ui/toast';
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts';
import { SettingsPanel } from '@/components/ui/settings-panel';

// Simple localStorage-based query cache persistence
const CACHE_KEY = 'anilens_query_cache';
const CACHE_VERSION = 1;
const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  version: number;
  timestamp: number;
  data: Record<string, unknown>;
}

function saveQueryCache(client: QueryClient) {
  try {
    const cache = client.getQueryCache();
    const queries = cache.getAll();
    
    // Only persist specific query keys that are expensive to refetch
    const persistKeys = ['animeList', 'mangaList', 'tasteProfile', 'favorites'];
    const dataToSave: Record<string, unknown> = {};
    
    queries.forEach((query) => {
      const key = query.queryKey[0];
      if (typeof key === 'string' && persistKeys.includes(key)) {
        if (query.state.data && query.state.status === 'success') {
          dataToSave[JSON.stringify(query.queryKey)] = {
            data: query.state.data,
            dataUpdatedAt: query.state.dataUpdatedAt,
          };
        }
      }
    });
    
    if (Object.keys(dataToSave).length > 0) {
      const cacheEntry: CacheEntry = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        data: dataToSave,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
      console.log('[QueryCache] Saved', Object.keys(dataToSave).length, 'queries to cache');
    }
  } catch (e) {
    // Silently fail - caching is optional
    console.warn('[QueryCache] Failed to save cache:', e);
  }
}

function restoreQueryCache(client: QueryClient) {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;
    
    const entry: CacheEntry = JSON.parse(cached);
    
    // Version check
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }
    
    // Age check
    if (Date.now() - entry.timestamp > CACHE_MAX_AGE) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }
    
    // Restore queries
    Object.entries(entry.data).forEach(([keyStr, value]) => {
      const queryKey = JSON.parse(keyStr);
      const { data, dataUpdatedAt } = value as { data: unknown; dataUpdatedAt: number };
      
      client.setQueryData(queryKey, data, {
        updatedAt: dataUpdatedAt,
      });
    });
    
    console.log('[QueryCache] Restored', Object.keys(entry.data).length, 'queries from cache');
  } catch (e) {
    // Silently fail
    console.warn('[QueryCache] Failed to restore cache:', e);
    localStorage.removeItem(CACHE_KEY);
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for 10 minutes before refetching
        staleTime: 10 * 60 * 1000,
        // Keep unused data in cache for 1 hour
        gcTime: 60 * 60 * 1000,
        // Don't refetch on window focus (AniList data doesn't change often)
        refetchOnWindowFocus: false,
        // Don't refetch on mount if data is fresh
        refetchOnMount: false,
        // Don't refetch on reconnect
        refetchOnReconnect: false,
        // Retry failed requests twice
        retry: 2,
        // Exponential backoff for retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Use structural sharing for better performance
        structuralSharing: true,
        // Network mode - online only (don't queue requests)
        networkMode: 'online',
      },
    },
  }));
  
  // Restore cache on mount, save on unmount
  useEffect(() => {
    restoreQueryCache(queryClient);
    
    // Save cache periodically and on unload
    const saveInterval = setInterval(() => saveQueryCache(queryClient), 60000); // Every minute
    
    const handleUnload = () => saveQueryCache(queryClient);
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleUnload);
      saveQueryCache(queryClient);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ContentFilterProvider>
          <MediaProvider>
            <UIProvider>
              <ToastProvider>
                {children}
                <KeyboardShortcutsModal />
                <SettingsPanel />
              </ToastProvider>
            </UIProvider>
          </MediaProvider>
        </ContentFilterProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
