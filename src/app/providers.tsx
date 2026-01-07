'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SettingsProvider } from '@/contexts/settings-context';
import { MediaProvider } from '@/contexts/media-context';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <MediaProvider>
          {children}
        </MediaProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
