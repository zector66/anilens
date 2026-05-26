'use client';

import { useState } from 'react';
import { useTaste } from '@/hooks/useTaste';
import { useAuth } from '@/hooks/use-auth';
import { CardSkeleton } from './shared/loading-state';
import { EmptyState } from './shared/empty-state';
import { HeaderCard } from './cards/header-card';
import { TopTraitsCard } from './cards/top-traits-card';
import { SignatureTraitsCard } from './cards/signature-traits-card';
import { ExposurePreferenceCard } from './cards/exposure-preference-card';
import { ScoreBehaviorCard } from './cards/score-behavior-card';
import { ShapedByCard } from './cards/shaped-by-card';
import { ContradictionsCard } from './cards/contradictions-card';
import { AlertTriangle } from 'lucide-react';

interface AnalyticsShellProps {
  userId: number;
  username: string;
}

export function AnalyticsShell({ userId, username }: AnalyticsShellProps) {
  const { user, isAuthenticated } = useAuth();
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const isSelf = isAuthenticated && user?.name === username;

  const {
    taste,
    loading,
    error,
    topTraits,
    shapedBy,
    contradictions,
    personality,
    behavioral,
    confidence,
    sampleSize,
    warnings,
  } = useTaste({
    userId,
    mediaType,
    includeLegacy: true,
    enableCache: true,
  });

  if (loading) {
    return (
      <div className="pt-8">
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-xl">
            <button className="px-6 py-2 rounded-lg font-bold text-sm bg-purple-500 text-white shadow-lg">
              Anime
            </button>
            <button className="px-6 py-2 rounded-lg font-bold text-sm text-gray-400">
              Manga
            </button>
          </div>
        </div>
        <CardSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,70,70,0.1)' }}>
          <AlertTriangle size={28} style={{ color: '#ef4444' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Something went wrong
        </h2>
        <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          {error}
        </p>
      </div>
    );
  }

  if (!taste || sampleSize === undefined || sampleSize < 5) {
    return (
      <div className="pt-8">
        <EmptyState mediaType={mediaType} sampleSize={sampleSize || 0} />
      </div>
    );
  }

  return (
    <div className="pt-6">
      {/* Type Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => setMediaType('ANIME')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              mediaType === 'ANIME'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Anime
          </button>
          <button
            onClick={() => setMediaType('MANGA')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              mediaType === 'MANGA'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Manga
          </button>
        </div>
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="mb-6 space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: 'rgba(255, 180, 0, 0.08)',
                border: '1px solid rgba(255, 180, 0, 0.15)',
                color: '#f5c542',
              }}
            >
              <AlertTriangle size={14} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <HeaderCard
        username={username}
        isSelf={isSelf}
        mediaType={mediaType}
        sampleSize={sampleSize}
        confidence={confidence || 0}
        topTrait={topTraits?.[0]?.trait}
      />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <TopTraitsCard traits={topTraits || []} />
        <SignatureTraitsCard traits={taste?.views?.signature?.topTraits || []} />
        <ExposurePreferenceCard traits={taste?.traits} />
        <ScoreBehaviorCard personality={personality} behavioral={behavioral} />
        <ShapedByCard shapers={shapedBy || []} />
        <ContradictionsCard contradictions={contradictions || []} />
      </div>
    </div>
  );
}
