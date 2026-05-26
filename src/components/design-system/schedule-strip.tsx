'use client';

import Image from 'next/image';
import Link from 'next/link';
import { proxyImage } from '@/lib/image-proxy';

interface ScheduleEntry {
  id: number;
  title: string;
  image: string;
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
  format?: string;
  totalEpisodes?: number;
  score?: number;
}

interface ScheduleStripProps {
  entries: ScheduleEntry[];
}

function formatTimeUntil(seconds: number): string {
  if (seconds <= 0) return 'Airing now';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function formatAiringTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function ScheduleStrip({ entries }: ScheduleStripProps) {
  if (entries.length === 0) {
    return (
      <div className="px-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
        No episodes airing in the next 24 hours.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
        <Link
          key={`${entry.id}-${entry.episode}`}
          href={`/anime/${entry.id}`}
          className="group flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors"
          style={{
            background: 'rgba(255,255,255,0.02)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
          }}
        >
          {/* Thumbnail */}
          <div
            className="relative shrink-0 overflow-hidden"
            style={{
              width: '56px',
              height: '80px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Image
              src={proxyImage(entry.image)}
              alt={entry.title}
              fill
              sizes="56px"
              className="object-cover"
              loading="lazy"
              unoptimized
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4
              className="text-sm font-medium leading-tight truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {entry.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs" style={{ color: 'var(--accent-color)' }}>
                Ep {entry.episode}
                {entry.totalEpisodes ? ` / ${entry.totalEpisodes}` : ''}
              </span>
              {entry.format && (
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {entry.format}
                </span>
              )}
            </div>
          </div>

          {/* Time */}
          <div className="text-right shrink-0">
            <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {formatAiringTime(entry.airingAt)}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {formatTimeUntil(entry.timeUntilAiring)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
