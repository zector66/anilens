'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import type { ConsumetNewsItem, ConsumetScheduleEntry } from '@/lib/consumet-client';

interface TodayRailProps {
  /** User's favorite genres - used to filter/highlight relevant news */
  userGenres?: string[];
  /** AniList IDs of shows the user is currently watching - highlights matches in schedule */
  watchingIds?: number[];
}

/**
 * "Today" rail: News + Airing Schedule personalized to the user's taste.
 * Powered by Consumet (AnimeNewsNetwork + AniList airing schedule).
 */
export function TodayRail({ userGenres = [], watchingIds = [] }: TodayRailProps) {
  const [news, setNews] = useState<ConsumetNewsItem[]>([]);
  const [schedule, setSchedule] = useState<ConsumetScheduleEntry[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    let alive = true;

    fetch('/api/consumet/news')
      .then(r => { if (!r.ok) throw new Error(`News API ${r.status}`); return r.json(); })
      .then(data => {
        if (alive && data.success) setNews(data.news || []);
      })
      .catch(() => {})
      .finally(() => alive && setLoadingNews(false));

    fetch('/api/consumet/schedule')
      .then(r => { if (!r.ok) throw new Error(`Schedule API ${r.status}`); return r.json(); })
      .then(data => {
        if (alive && data.success) setSchedule(data.schedule || []);
      })
      .catch(() => {})
      .finally(() => alive && setLoadingSchedule(false));

    return () => {
      alive = false;
    };
  }, []);

  // Score news by genre relevance to user
  const lowerGenres = userGenres.map(g => g.toLowerCase());
  const scoredNews = news
    .map(item => {
      const text = (item.title + ' ' + (item.preview?.intro || '')).toLowerCase();
      const score = lowerGenres.reduce((acc, g) => (text.includes(g) ? acc + 1 : acc), 0);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(s => s.item);

  // Sort schedule by airing time and pull out user's watching matches first
  const watchingSet = new Set(watchingIds);
  const userMatches = schedule.filter(s => watchingSet.has(Number(s.id)));
  const otherUpcoming = schedule
    .filter(s => !watchingSet.has(Number(s.id)))
    .sort((a, b) => (a.timeUntilAiring || 0) - (b.timeUntilAiring || 0))
    .slice(0, 5);

  if (loadingNews && loadingSchedule) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading today&apos;s anime…</span>
      </div>
    );
  }

  // Hide if both sources have no data
  if (!loadingNews && !loadingSchedule && news.length === 0 && schedule.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Schedule column */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
          <Clock className="w-5 h-5 text-purple-400" />
          Airing Next
        </h3>

        {loadingSchedule ? (
          <div className="text-sm text-gray-500">Loading schedule…</div>
        ) : userMatches.length === 0 && otherUpcoming.length === 0 ? (
          <div className="text-sm text-gray-500">No upcoming episodes found.</div>
        ) : (
          <ul className="space-y-3">
            {userMatches.length > 0 && (
              <li className="text-xs uppercase tracking-wider text-purple-400 mb-1">
                From your watchlist
              </li>
            )}
            {userMatches.map(entry => (
              <ScheduleRow key={entry.id} entry={entry} highlighted />
            ))}
            {userMatches.length > 0 && otherUpcoming.length > 0 && (
              <li className="text-xs uppercase tracking-wider text-gray-500 pt-2 mb-1">
                Other shows
              </li>
            )}
            {otherUpcoming.map(entry => (
              <ScheduleRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>

      {/* News column */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
          <Newspaper className="w-5 h-5 text-pink-400" />
          Anime News
          {lowerGenres.length > 0 && (
            <span className="text-xs font-normal text-gray-500">
              · personalized
            </span>
          )}
        </h3>

        {loadingNews ? (
          <div className="text-sm text-gray-500">Loading news…</div>
        ) : scoredNews.length === 0 ? (
          <div className="text-sm text-gray-500">No news available right now.</div>
        ) : (
          <ul className="space-y-3">
            {scoredNews.map(item => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 group hover:bg-white/5 -mx-2 px-2 py-2 rounded-lg transition-colors"
                >
                  {item.thumbnail && (
                    <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-white/10">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white line-clamp-2 group-hover:text-pink-300">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(item.uploadedAt)}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-pink-400 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ScheduleRow({ entry, highlighted = false }: { entry: ConsumetScheduleEntry; highlighted?: boolean }) {
  const title =
    entry.title?.userPreferred ||
    entry.title?.english ||
    entry.title?.romaji ||
    'Unknown';
  const timeLeft = formatCountdown(entry.timeUntilAiring || 0);

  return (
    <li
      className={`flex items-center gap-3 p-2 rounded-lg ${
        highlighted ? 'bg-purple-500/10 border border-purple-500/30' : 'hover:bg-white/5'
      }`}
    >
      {entry.image && (
        <div className="relative w-10 h-14 shrink-0 rounded overflow-hidden bg-white/10">
          <OptimizedImage src={entry.image} alt="" fill className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-gray-500">
          Ep {entry.airingEpisode || entry.episode || '?'} · {timeLeft}
        </p>
      </div>
    </li>
  );
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatCountdown(seconds: number): string {
  if (!seconds || seconds <= 0) return 'airing now';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}
