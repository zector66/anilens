'use client';

import { useMemo } from 'react';
import { Calendar, Film, BookOpen, Star, Clock } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useAuth } from '@/hooks/use-auth';
import { useAnimeList, useMangaList } from '@/hooks/use-anilist';
import { useSettings } from '@/contexts/settings-context';
import { MediaListEntry } from '@/types/anilist';

interface TimelineEntry {
  id: number;
  media: MediaListEntry['media'];
  type: 'ANIME' | 'MANGA';
  date: Date;
  dateType: 'completed' | 'started';
  score?: number;
}

export function WatchHistoryTimeline() {
  const { user } = useAuth();
  const { data: animeList } = useAnimeList(user?.id || 0);
  const { data: mangaList } = useMangaList(user?.id || 0);
  const { getPreferredTitle } = useSettings();

  const timelineData = useMemo(() => {
    const entries: TimelineEntry[] = [];

    // Process anime
    animeList?.lists?.forEach(list => {
      list.entries?.forEach(entry => {
        if (!entry.media) return;

        // Add completed date
        if (entry.completedAt?.year) {
          entries.push({
            id: entry.id,
            media: entry.media,
            type: 'ANIME',
            date: new Date(entry.completedAt.year, (entry.completedAt.month || 1) - 1, entry.completedAt.day || 1),
            dateType: 'completed',
            score: entry.score,
          });
        }
        // Add started date if no completed date
        else if (entry.startedAt?.year) {
          entries.push({
            id: entry.id,
            media: entry.media,
            type: 'ANIME',
            date: new Date(entry.startedAt.year, (entry.startedAt.month || 1) - 1, entry.startedAt.day || 1),
            dateType: 'started',
            score: entry.score,
          });
        }
      });
    });

    // Process manga
    mangaList?.lists?.forEach(list => {
      list.entries?.forEach(entry => {
        if (!entry.media) return;

        if (entry.completedAt?.year) {
          entries.push({
            id: entry.id,
            media: entry.media,
            type: 'MANGA',
            date: new Date(entry.completedAt.year, (entry.completedAt.month || 1) - 1, entry.completedAt.day || 1),
            dateType: 'completed',
            score: entry.score,
          });
        } else if (entry.startedAt?.year) {
          entries.push({
            id: entry.id,
            media: entry.media,
            type: 'MANGA',
            date: new Date(entry.startedAt.year, (entry.startedAt.month || 1) - 1, entry.startedAt.day || 1),
            dateType: 'started',
            score: entry.score,
          });
        }
      });
    });

    // Sort by date descending
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Group by year-month
    const grouped = new Map<string, TimelineEntry[]>();
    entries.forEach(entry => {
      const key = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entry);
    });

    return grouped;
  }, [animeList, mangaList]);

  const formatMonthYear = (key: string) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (timelineData.size === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No History Yet</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Start tracking your anime and manga with dates on AniList to see your history timeline here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Watch History</h2>
          <p className="text-sm text-gray-400">Your anime & manga journey over time</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Film className="w-4 h-4" />
            <span className="text-sm">Anime</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {Array.from(timelineData.values()).flat().filter(e => e.type === 'ANIME').length}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-pink-400 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm">Manga</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {Array.from(timelineData.values()).flat().filter(e => e.type === 'MANGA').length}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-sm">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {(() => {
              const scores = Array.from(timelineData.values()).flat().filter(e => e.score).map(e => e.score!);
              return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
            })()}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Months Active</span>
          </div>
          <p className="text-2xl font-bold text-white">{timelineData.size}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />

        {Array.from(timelineData.entries()).map(([monthKey, entries]) => (
          <div key={monthKey} className="relative pl-12 pb-8">
            {/* Month marker */}
            <div className="absolute left-0 w-8 h-8 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>

            {/* Month label */}
            <h3 className="text-lg font-semibold text-white mb-4">{formatMonthYear(monthKey)}</h3>

            {/* Entries for this month */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {entries.slice(0, 12).map(entry => (
                <div 
                  key={`${entry.id}-${entry.dateType}`}
                  className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all card-hover"
                >
                  {/* Cover */}
                  <div className="relative aspect-[2/3]">
                    <OptimizedImage
                      src={entry.media?.coverImage?.medium || entry.media?.coverImage?.large || ''}
                      alt={entry.media?.title ? getPreferredTitle(entry.media.title) : ''}
                      fill
                      className="object-cover"
                    />
                    {/* Type badge */}
                    <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                      entry.type === 'ANIME' ? 'bg-purple-500/80' : 'bg-pink-500/80'
                    } text-white`}>
                      {entry.type === 'ANIME' ? <Film className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                    </div>
                    {/* Score badge */}
                    {entry.score && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-xs font-medium text-yellow-400 flex items-center gap-0.5">
                        <Star className="w-3 h-3" />
                        {entry.score}
                      </div>
                    )}
                    {/* Status badge */}
                    <div className={`absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded text-xs text-center ${
                      entry.dateType === 'completed' ? 'bg-green-500/80 text-white' : 'bg-blue-500/80 text-white'
                    }`}>
                      {entry.dateType === 'completed' ? 'Completed' : 'Started'}
                    </div>
                  </div>
                  {/* Title */}
                  <div className="p-2">
                    <p className="text-xs text-gray-300 line-clamp-2">
                      {entry.media?.title ? getPreferredTitle(entry.media.title) : 'Unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {entries.length > 12 && (
              <p className="text-sm text-gray-500 mt-2">+{entries.length - 12} more</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
