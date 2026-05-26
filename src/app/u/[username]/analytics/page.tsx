'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { anilistClient } from '@/lib/anilist-client';
import { SmartHeader } from '@/components/layout/smart-header';
import { AnalyticsShell } from '@/components/analytics/analytics-shell';
import { Activity } from 'lucide-react';

export default function UserAnalyticsPage() {
  const params = useParams();
  const username = (params.username as string) || '';

  const {
    data: anilistUser,
    isLoading: isResolving,
    error: resolveError,
  } = useQuery({
    queryKey: ['userByUsername', username],
    queryFn: async () => {
      if (!username) throw new Error('No username provided');
      return anilistClient.getUserByUsername(username);
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deepest)' }}>
      <SmartHeader />
      <div className="h-14" />
      <main className="max-w-[1400px] mx-auto px-4 pb-20">
        {isResolving ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Looking up {username}...
              </p>
            </div>
          </div>
        ) : resolveError || !anilistUser ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,70,70,0.1)' }}>
              <Activity size={28} style={{ color: '#ef4444' }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              User not found
            </h2>
            <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              We couldn&apos;t find an AniList user named &quot;{username}&quot;. Check the spelling and try again.
            </p>
          </div>
        ) : (
          <AnalyticsShell userId={anilistUser.id} username={anilistUser.name} />
        )}
      </main>
    </div>
  );
}
