'use client';

import { useState, useMemo } from 'react';
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

interface WeeklyScheduleProps {
  entries: ScheduleEntry[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayLabel(timestamp: number): { dayIndex: number; label: string } {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const dayIndex = date.getDay();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return { dayIndex, label: 'Today' };

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) return { dayIndex, label: 'Tomorrow' };

  return { dayIndex, label: DAYS[dayIndex] };
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatTimeUntil(seconds: number): string {
  if (seconds <= 0) return 'Airing now';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export function WeeklySchedule({ entries }: WeeklyScheduleProps) {
  const [nowTs] = useState(() => Date.now() / 1000);

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<number, ScheduleEntry[]>();
    for (const entry of entries) {
      const { dayIndex } = getDayLabel(entry.airingAt);
      const list = map.get(dayIndex) || [];
      list.push(entry);
      map.set(dayIndex, list);
    }
    // Sort each day's entries by time
    for (const list of map.values()) {
      list.sort((a, b) => a.airingAt - b.airingAt);
    }
    return map;
  }, [entries]);

  // Build ordered day tabs for all days that have data,
  // sorted by actual date (earliest first) so users can scroll past → future.
  const dayTabs = useMemo(() => {
    const tabs: { index: number; label: string; count: number; sortKey: number }[] = [];
    for (const [idx, entriesForDay] of grouped.entries()) {
      if (entriesForDay.length === 0) continue;
      // Use the earliest airing timestamp in this day as the sort key
      const sortKey = entriesForDay[0].airingAt;
      const { label } = getDayLabel(sortKey);
      tabs.push({ index: idx, label, count: entriesForDay.length, sortKey });
    }
    tabs.sort((a, b) => a.sortKey - b.sortKey);
    return tabs;
  }, [grouped]);

  const [activeDay, setActiveDay] = useState<number | null>(null);

  // Derive the default active day: prefer today, then nearest future, then latest past
  const defaultActiveDay = useMemo(() => {
    if (dayTabs.length === 0) return 0;
    const todayIdx = new Date().getDay();
    if (grouped.has(todayIdx)) return todayIdx;
    const future = dayTabs.filter((t) => t.sortKey > nowTs);
    if (future.length > 0) return future[0].index;
    return dayTabs[dayTabs.length - 1].index;
  }, [dayTabs, grouped, nowTs]);

  const currentActiveDay = activeDay ?? defaultActiveDay;
  const activeEntries = grouped.get(currentActiveDay) || [];

  if (entries.length === 0) {
    return (
      <div className="px-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
        No episodes airing this week.
      </div>
    );
  }

  return (
    <div>
      {/* Header with Full Schedule link */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Airing Schedule
        </span>
        <Link
          href="/schedule"
          className="text-[10px] transition-colors hover:opacity-80"
          style={{ color: 'var(--accent-color)' }}
        >
          Full Schedule →
        </Link>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {dayTabs.map((tab) => (
          <button
            key={tab.index}
            onClick={() => setActiveDay(tab.index)}
            className="px-3 py-1.5 rounded-md text-xs font-medium shrink-0 transition-colors"
            style={{
              background: currentActiveDay === tab.index ? 'var(--accent-color)' : 'rgba(255,255,255,0.04)',
              color: currentActiveDay === tab.index ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {tab.label}
            <span className="ml-1 opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Episode list for selected day */}
      <div className="relative">
        <div
          className="flex flex-col gap-2 overflow-y-auto pr-1"
          style={{
            maxHeight: '640px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.12) transparent',
          }}
        >
          {activeEntries.map((entry) => (
            <Link
              key={`${entry.id}-${entry.episode}`}
              href={`/anime/${entry.id}`}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              <div
                className="relative shrink-0 overflow-hidden"
                style={{ width: '56px', height: '80px', borderRadius: 'var(--radius-sm)' }}
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

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                  {entry.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={{ color: 'var(--accent-color)' }}>
                    Ep {entry.episode}{entry.totalEpisodes ? ` / ${entry.totalEpisodes}` : ''}
                  </span>
                  {entry.format && (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{entry.format}</span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatTime(entry.airingAt)}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {formatTimeUntil(entry.timeUntilAiring)}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Fade hint when scrollable */}
        {activeEntries.length > 7 && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-8"
            style={{
              background: 'linear-gradient(to bottom, transparent, var(--bg-base, rgb(10,10,10)))',
            }}
          />
        )}
      </div>
    </div>
  );
}
