'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SettingsProvider } from '@/contexts/settings-context';
import { MediaProvider } from '@/contexts/media-context';
import { UIProvider } from '@/contexts/ui-context';
import { ToastProvider } from '@/components/ui/toast';
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts';
import { SettingsPanel } from '@/components/ui/settings-panel';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for 5 minutes before refetching
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Don't refetch on window focus by default (AniList data doesn't change often)
        refetchOnWindowFocus: false,
        // Retry failed requests once
        retry: 1,
        // Use structural sharing for better performance
        structuralSharing: true,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <MediaProvider>
          <UIProvider>
            <ToastProvider>
              {children}
              <KeyboardShortcutsModal />
              <SettingsPanel />
            </ToastProvider>
          </UIProvider>
        </MediaProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
