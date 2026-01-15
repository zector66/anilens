'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SettingsProvider } from '@/contexts/settings-context';
import { MediaProvider } from '@/contexts/media-context';
import { UIProvider } from '@/contexts/ui-context';
import { ContentFilterProvider } from '@/components/content-filter-provider';
import { ToastProvider } from '@/components/ui/toast';
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts';
import { SettingsPanel } from '@/components/ui/settings-panel';

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
