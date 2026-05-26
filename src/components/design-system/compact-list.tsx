'use client';

import Image from 'next/image';
import Link from 'next/link';
import { proxyImage } from '@/lib/image-proxy';
import { Star } from 'lucide-react';

interface CompactItem {
  id: number;
  title: string;
  image: string;
  format?: string;
  year?: number;
  episodes?: number;
  score?: number;
  nextEpisode?: number;
  timeUntil?: number;
}

interface CompactListProps {
  title: string;
  items: CompactItem[];
  showUpcoming?: boolean;
}

function formatTimeUntil(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d`;
  if (hrs > 0) return `${hrs}h`;
  return `${Math.floor(seconds / 60)}m`;
}

export function CompactList({ title, items, showUpcoming }: CompactListProps) {
  return (
    <div className="mb-6">
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {title}
      </h3>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/anime/${item.id}`}
            className="group flex items-center gap-2.5"
          >
            <div
              className="relative shrink-0 overflow-hidden"
              style={{
                width: '48px',
                height: '68px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Image
                src={proxyImage(item.image)}
                alt={item.title}
                fill
                sizes="48px"
                className="object-cover"
                loading="lazy"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="text-xs font-medium leading-tight truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                {item.format && (
                  <span
                    className="text-[10px] px-1 py-0.5 rounded"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {item.format}
                  </span>
                )}
                {item.year && (
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {item.year}
                  </span>
                )}
                {item.episodes !== undefined && item.episodes > 0 && (
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {item.episodes}/{item.nextEpisode ?? item.episodes}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {item.score !== undefined && item.score > 0 && (
                  <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--accent-color)' }}>
                    <Star size={8} fill="currentColor" /> {item.score}%
                  </span>
                )}
                {showUpcoming && item.timeUntil !== undefined && (
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {formatTimeUntil(item.timeUntil)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
