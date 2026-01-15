'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAnimeList, useMangaList } from '@/hooks/use-anilist';
import { useMedia } from '@/contexts/media-context';
import { TasteAnalyzer } from '@/lib/taste-analyzer';
import { normalizeMediaList } from '@/lib/normalize-media-list';
import { 
  Calendar,
  TrendingUp,
  Star,
  Zap,
  Heart,
  Sparkles,
  Trophy,
  Target,
  Flame
} from 'lucide-react';

export function TodayPanel() {
  const { user } = useAuth();
  const { activeType, getSeriesTerm } = useMedia();
  const { data: animeList } = useAnimeList(user?.id || 0);
  const { data: mangaList } = useMangaList(user?.id || 0);

  const currentList = activeType === 'ANIME' ? animeList : mangaList;
  const allEntries = useMemo(() => normalizeMediaList(currentList), [currentList]);

  const tasteProfile = useMemo(() => {
    if (allEntries.length === 0) return null;
    return TasteAnalyzer.analyzeTaste(allEntries, activeType);
  }, [allEntries, activeType]);

  // Get daily stat highlight (changes based on day of year)
  const dailyStatHighlight = useMemo(() => {
    if (!tasteProfile) return null;
    
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const stats = [
      {
        label: 'Top Genre',
        value: tasteProfile.genreAffinity[0]?.genre || 'N/A',
        subtext: `${((tasteProfile.genreAffinity[0]?.affinity || 0) * 100).toFixed(0)}% affinity`,
        icon: Star,
        color: 'purple'
      },
      {
        label: 'Favorite Era',
        value: tasteProfile.eraPreference[0]?.era || 'N/A',
        subtext: `${((tasteProfile.eraPreference[0]?.preference || 0) * 100).toFixed(0)}% preference`,
        icon: Calendar,
        color: 'blue'
      },
      {
        label: 'Top Studio',
        value: tasteProfile.studioBias[0]?.studio || 'N/A',
        subtext: `${tasteProfile.studioBias[0]?.count || 0} titles`,
        icon: Trophy,
        color: 'yellow'
      },
      {
        label: 'Avg Rating',
        value: tasteProfile.averageScore.toFixed(1),
        subtext: `across ${allEntries.length} titles`,
        icon: TrendingUp,
        color: 'green'
      },
      {
        label: 'Completion Rate',
        value: `${tasteProfile.completionRate.toFixed(0)}%`,
        subtext: 'of started series',
        icon: Target,
        color: 'pink'
      }
    ];

    return stats[dayOfYear % stats.length];
  }, [tasteProfile, allEntries.length]);

  // Get today's date string
  const todayDate = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  if (!user || !tasteProfile) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Today</h2>
          <p className="text-sm text-gray-400">{todayDate}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Daily Stat Highlight */}
      {dailyStatHighlight && (
        <div className={`p-6 rounded-2xl bg-gradient-to-br ${
          dailyStatHighlight.color === 'purple' ? 'from-purple-500/20 to-purple-600/10' :
          dailyStatHighlight.color === 'blue' ? 'from-blue-500/20 to-blue-600/10' :
          dailyStatHighlight.color === 'yellow' ? 'from-yellow-500/20 to-yellow-600/10' :
          dailyStatHighlight.color === 'green' ? 'from-green-500/20 to-green-600/10' :
          'from-pink-500/20 to-pink-600/10'
        } border border-white/10`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${
              dailyStatHighlight.color === 'purple' ? 'bg-purple-500/30' :
              dailyStatHighlight.color === 'blue' ? 'bg-blue-500/30' :
              dailyStatHighlight.color === 'yellow' ? 'bg-yellow-500/30' :
              dailyStatHighlight.color === 'green' ? 'bg-green-500/30' :
              'bg-pink-500/30'
            } flex items-center justify-center flex-shrink-0`}>
              <dailyStatHighlight.icon className={`w-6 h-6 ${
                dailyStatHighlight.color === 'purple' ? 'text-purple-300' :
                dailyStatHighlight.color === 'blue' ? 'text-blue-300' :
                dailyStatHighlight.color === 'yellow' ? 'text-yellow-300' :
                dailyStatHighlight.color === 'green' ? 'text-green-300' :
                'text-pink-300'
              }`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">Your taste today</p>
              <h3 className="text-2xl font-bold text-white mb-1">{dailyStatHighlight.value}</h3>
              <p className="text-sm text-gray-300">{dailyStatHighlight.label} • {dailyStatHighlight.subtext}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Daily Challenge Placeholder */}
        <button className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 hover:border-orange-500/50 transition-all text-left group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5 text-orange-300" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white">Daily Challenge</h4>
              <p className="text-xs text-gray-400">Coming soon</p>
            </div>
          </div>
        </button>

        {/* Streak Tracker Placeholder */}
        <button className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 hover:border-green-500/50 transition-all text-left group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5 text-green-300" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white">Your Streak</h4>
              <p className="text-xs text-gray-400">Track progress</p>
            </div>
          </div>
        </button>
      </div>

      {/* 3 Picks for Today */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-400" />
          3 Picks for You
        </h3>
        <div className="space-y-3">
          {/* Safe Pick */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-green-400">Safe Pick</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">Matches your taste</span>
                </div>
                <p className="text-sm text-gray-400">Check Recommendations tab →</p>
              </div>
            </div>
          </div>

          {/* Hidden Gem */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-yellow-400">Hidden Gem</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">Underrated quality</span>
                </div>
                <p className="text-sm text-gray-400">Check Recommendations tab →</p>
              </div>
            </div>
          </div>

          {/* Experimental */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-purple-400">Experimental</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">Try something new</span>
                </div>
                <p className="text-sm text-gray-400">Check Recommendations tab →</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white mb-1">{allEntries.length}</div>
            <div className="text-xs text-gray-400">{getSeriesTerm()}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white mb-1">{tasteProfile.genreAffinity.length}</div>
            <div className="text-xs text-gray-400">Genres</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white mb-1">{tasteProfile.averageScore.toFixed(1)}</div>
            <div className="text-xs text-gray-400">Avg Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
