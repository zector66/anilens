'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SmartHeader } from '@/components/layout/smart-header';
import { proxyImage } from '@/lib/image-proxy';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay());
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // Fetch schedule (7 days from base)
  useEffect(() => {
    fetch('/api/anilist/schedule')
      .then((r) => { if (!r.ok) throw new Error(`Schedule API ${r.status}`); return r.json(); })
      .then((data) => {
        setSchedule(data.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const weekDates = useMemo(() => {
    // Build dates for the week containing baseDate, starting from Sunday
    const startOfWeek = new Date(baseDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [baseDate]);

  const selectedDate = weekDates[selectedDay];

  const entriesForSelectedDay = useMemo(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const startUnix = Math.floor(startOfDay.getTime() / 1000);
    const endUnix = Math.floor(endOfDay.getTime() / 1000);

    return schedule
      .filter((e) => e.airingAt >= startUnix && e.airingAt <= endUnix)
      .sort((a, b) => a.airingAt - b.airingAt);
  }, [schedule, selectedDate]);

  // Group entries by hour for the timeline view
  const groupedByHour = useMemo(() => {
    const groups: Record<string, ScheduleEntry[]> = {};
    for (const entry of entriesForSelectedDay) {
      const hour = formatTime(entry.airingAt);
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(entry);
    }
    return groups;
  }, [entriesForSelectedDay]);

  const sortedHours = Object.keys(groupedByHour).sort((a, b) => {
    // Parse times like "12:00 AM" for sorting
    const parse = (t: string) => {
      const [time, period] = t.split(' ');
      const [h, m] = time.split(':').map(Number);
      let hour = h;
      if (period === 'PM' && h !== 12) hour += 12;
      if (period === 'AM' && h === 12) hour = 0;
      return hour * 60 + m;
    };
    return parse(a) - parse(b);
  });

  // Top 3 upcoming shows
  const upcomingTop = useMemo(() => {
    if (!now) return [];
    return schedule
      .filter((e) => e.airingAt > now)
      .sort((a, b) => a.airingAt - b.airingAt)
      .slice(0, 3);
  }, [schedule, now]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setBaseDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setBaseDate(today);
    setSelectedDay(today.getDay());
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base, rgb(10,10,10))' }}>
      <SmartHeader />

      <main className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Schedule
          </h1>
        </div>

        {/* Top upcoming cards */}
        {upcomingTop.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {upcomingTop.map((entry) => (
              <Link
                key={entry.id}
                href={`/anime/${entry.id}`}
                className="group relative overflow-hidden rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center gap-3 p-3">
                  <div
                    className="relative shrink-0 overflow-hidden"
                    style={{ width: '80px', height: '112px', borderRadius: 'var(--radius-sm)' }}
                  >
                    <Image
                      src={proxyImage(entry.image)}
                      alt={entry.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-sm font-medium leading-tight truncate mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {entry.title}
                    </h3>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      EP {entry.episode}
                      {entry.totalEpisodes ? ` / ${entry.totalEpisodes}` : ''}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--accent-color)' }}>
                      {formatTime(entry.airingAt)} · {formatDate(entry.airingAt)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Week navigation */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-1.5 rounded-md transition-colors hover:bg-white/5"
            title="Previous week"
          >
            <ChevronLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              background: 'var(--accent-color)',
              color: '#fff',
            }}
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-1.5 rounded-md transition-colors hover:bg-white/5"
            title="Next week"
          >
            <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>
            {formatDate(weekDates[0].getTime() / 1000)} - {formatDate(weekDates[6].getTime() / 1000)}
          </span>
        </div>

        {/* Day selector */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {DAYS.map((day, i) => {
            const date = weekDates[i];
            const isSelected = selectedDay === i;
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(i)}
                className="flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium shrink-0 transition-colors min-w-[64px]"
                style={{
                  background: isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.04)',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                }}
              >
                <span>{DAY_SHORT[i]}</span>
                <span className={isToday ? 'font-bold' : ''}>{date.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
            Loading schedule...
          </div>
        ) : entriesForSelectedDay.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
            No episodes airing on {DAYS[selectedDay]}.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedHours.map((hour) => (
              <div key={hour}>
                {/* Hour label */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    {hour}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Shows at this hour */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedByHour[hour].map((entry) => (
                    <Link
                      key={`${entry.id}-${entry.episode}`}
                      href={`/anime/${entry.id}`}
                      className="group flex items-center gap-3 p-2.5 rounded-lg transition-colors"
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
                        style={{ width: '48px', height: '68px', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Image
                          src={proxyImage(entry.image)}
                          alt={entry.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-xs font-medium leading-tight truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {entry.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px]" style={{ color: 'var(--accent-color)' }}>
                            Ep {entry.episode}
                            {entry.totalEpisodes ? ` / ${entry.totalEpisodes}` : ''}
                          </span>
                          {entry.format && (
                            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                              {entry.format}
                            </span>
                          )}
                        </div>
                        {entry.score !== undefined && entry.score > 0 && (
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            Score: {entry.score}%
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
