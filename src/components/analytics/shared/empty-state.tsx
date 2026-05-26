import { Activity } from 'lucide-react';

interface EmptyStateProps {
  mediaType: 'ANIME' | 'MANGA';
  sampleSize: number;
}

export function EmptyState({ mediaType, sampleSize }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <Activity size={28} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        Not enough data
      </h2>
      <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        We found {sampleSize} {mediaType.toLowerCase()} entries, but need more to build a meaningful taste profile.
        Try switching to {mediaType === 'ANIME' ? 'Manga' : 'Anime'} or add more titles to your AniList.
      </p>
    </div>
  );
}
