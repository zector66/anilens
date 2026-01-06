'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAnimeList, useMangaList } from '@/hooks/use-anilist';
import { TasteAnalyzer } from '@/lib/taste-analyzer';
import { MediaListEntry, type TasteProfile as TasteProfileType } from '@/types/anilist';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  PieLabelRenderProps
} from 'recharts';
import { 
  Flame, 
  Zap, 
  Target, 
  Palette,
  Skull,
  TrendingUp,
  Clock,
  BarChart3,
  Activity,
  Award,
  BookOpen,
  Share2,
  Sword,
  Search,
  User as UserIcon
} from 'lucide-react';
import { TasteBattle } from './taste-battle';
import { ShareableTasteCard } from './shareable-taste-card';
import { 
  EmotionalProfileChart, 
  StructuralPreferencesChart, 
  RiskProfileChart, 
  ContradictionsCard,
  TasteFingerprintCard 
} from './elite-taste-visuals';
import { anilistClient } from '@/lib/anilist-client';
import { useQuery } from '@tanstack/react-query';

const COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

interface TasteProfileProps {
  userId?: number;
}

export function TasteProfile({ userId }: TasteProfileProps) {
  const { user } = useAuth();
  const [opponentUsername, setOpponentUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ANIME' | 'MANGA'>('ANIME');

  const effectiveUserId = userId || user?.id || 0;
  
  const { data: animeList, isLoading: isLoadingAnime, error: animeError } = useAnimeList(effectiveUserId);
  const { data: mangaList, isLoading: isLoadingManga, error: mangaError } = useMangaList(effectiveUserId);

  const isLoading = activeTab === 'ANIME' ? isLoadingAnime : isLoadingManga;
  const error = activeTab === 'ANIME' ? animeError : mangaError;
  const currentList = activeTab === 'ANIME' ? animeList : mangaList;

  // Opponent Data Fetching
  const { 
    data: opponentData, 
    isLoading: isSearching, 
    error: searchError,
    refetch: searchOpponent 
  } = useQuery({
    queryKey: ['opponent', searchQuery, activeTab],
    queryFn: async () => {
      const opponent = await anilistClient.getUserByUsername(searchQuery);
      const list = activeTab === 'ANIME' 
        ? await anilistClient.getAnimeList(opponent.id)
        : await anilistClient.getMangaList(opponent.id);
      // Deduplicate entries by mediaId and filter out Planning
      const entriesMap = new Map<number, MediaListEntry>();
      list.lists.forEach((l: { entries: MediaListEntry[], isCustomList?: boolean }) => {
        l.entries.forEach((entry: MediaListEntry) => {
          const mediaId = entry.media?.id || entry.mediaId;
          if (!entriesMap.has(mediaId) || !l.isCustomList) {
            entriesMap.set(mediaId, entry);
          }
        });
      });
      // Only include watched entries (exclude Planning, Paused, Dropped)
      const validStatuses = ['COMPLETED', 'CURRENT', 'REPEATING'];
      const entries = Array.from(entriesMap.values()).filter(e => validStatuses.includes(e.status || ''));
      const profile = TasteAnalyzer.analyzeTaste(entries, activeTab);
      return { user: opponent, profile };
    },
    enabled: false,
  });

  const allEntries = useMemo(() => {
    if (!currentList?.lists) return [];
    // Deduplicate entries by mediaId - AniList returns same entry in both status lists and custom lists
    const entriesMap = new Map<number, MediaListEntry>();
    currentList.lists.forEach((list: { entries: MediaListEntry[], isCustomList?: boolean }) => {
      // Prefer non-custom list entries as they have the official status
      list.entries.forEach((entry: MediaListEntry) => {
        const mediaId = entry.media?.id || entry.mediaId;
        if (!entriesMap.has(mediaId) || !list.isCustomList) {
          entriesMap.set(mediaId, entry);
        }
      });
    });
    return Array.from(entriesMap.values());
  }, [currentList]);

  // Only include watched entries for stats (exclude Planning, Paused, Dropped)
  const analyzedEntries = useMemo(() => {
    const validStatuses = ['COMPLETED', 'CURRENT', 'REPEATING'];
    return allEntries.filter((entry: MediaListEntry) => validStatuses.includes(entry.status || ''));
  }, [allEntries]);

  const tasteProfile = useMemo<TasteProfileType | null>(() => {
    if (analyzedEntries.length === 0) return null;
    return TasteAnalyzer.analyzeTaste(analyzedEntries, activeTab);
  }, [analyzedEntries, activeTab]);

  const totalProgressWatched = useMemo(() => {
    if (!tasteProfile) return 0;
    return analyzedEntries.reduce((sum: number, entry: MediaListEntry) => {
      const mediaTotal = activeTab === 'ANIME' ? (entry.media?.episodes || 1) : (entry.media?.chapters || 1);
      const progress = entry.progress || 0;
      const repeats = entry.repeat || 0;
      return sum + (entry.status === 'COMPLETED' ? mediaTotal * (repeats + 1) : progress);
    }, 0);
  }, [analyzedEntries, tasteProfile, activeTab]);

  const bingeDataQuality = useMemo(() => {
    const hasDates = analyzedEntries.filter((e: MediaListEntry) => 
      e.status === 'COMPLETED' && e.startedAt?.year && e.completedAt?.year
    ).length;
    const totalCompleted = analyzedEntries.filter((e: MediaListEntry) => e.status === 'COMPLETED').length;
    if (totalCompleted === 0) return 0;
    return (hasDates / totalCompleted) * 100;
  }, [analyzedEntries]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (opponentUsername.trim()) {
      setSearchQuery(opponentUsername.trim());
      setTimeout(() => searchOpponent(), 0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-400">Analyzing your {activeTab.toLowerCase()} taste...</p>
      </div>
    );
  }

  if (error || !currentList) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
          <Skull className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-white font-medium mb-2">Failed to load {activeTab.toLowerCase()} data</p>
        <p className="text-gray-400 text-sm">Please try refreshing the page</p>
      </div>
    );
  }

  if (!tasteProfile) {
    return (
      <div className="space-y-8">
        {/* Type Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              onClick={() => setActiveTab('ANIME')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'ANIME' 
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Anime
            </button>
            <button
              onClick={() => setActiveTab('MANGA')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'MANGA' 
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Manga
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Activity className="w-12 h-12 text-gray-600 mb-4" />
          <p className="text-white font-medium mb-2">No {activeTab.toLowerCase()} data found</p>
          <p className="text-gray-400 text-sm max-w-xs">We couldn&apos;t find enough {activeTab.toLowerCase()} in your AniList to perform an analysis. Try switching to {activeTab === 'ANIME' ? 'Manga' : 'Anime'} or add more titles to your list!</p>
        </div>
      </div>
    );
  }

  const personalityCards = [
    { 
      label: 'Completionist', 
      value: tasteProfile.personalityTraits.completionist, 
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      description: 'Your drive to finish what you start',
      tooltip: 'Measures your completion rate minus drop rate. High score = you finish most titles you start and rarely drop.'
    },
    { 
      label: 'Seasonal Tourist', 
      value: tasteProfile.personalityTraits.seasonalTourist, 
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      description: 'Following current season trends',
      tooltip: 'Based on % of your list from the current/last year. High score = you watch lots of currently airing or recent titles.'
    },
    { 
      label: 'Cult Hunter', 
      value: tasteProfile.personalityTraits.cultHunter, 
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      description: 'Seeking hidden gems and classics',
      tooltip: 'Measures how many low-popularity titles you watch. High score = you dig deep for obscure gems others miss.'
    },
    { 
      label: 'Art Snob', 
      value: tasteProfile.personalityTraits.artSnob, 
      icon: Palette,
      color: 'from-pink-500 to-rose-500',
      description: 'Appreciation for visual excellence',
      tooltip: 'Based on experimental/avant-garde titles in your list. High score = you appreciate unique visual styles and art.'
    },
    { 
      label: 'Mainstream Maxxer', 
      value: tasteProfile.personalityTraits.mainstreamMaxxer, 
      icon: Zap,
      color: 'from-blue-400 to-indigo-600',
      description: 'Following the cultural phenomena',
      tooltip: 'Measures how many highly popular titles you watch. High score = you watch what everyone is talking about.'
    },
    { 
      label: 'Nostalgia Addict', 
      value: tasteProfile.personalityTraits.nostalgiaAddict, 
      icon: Clock,
      color: 'from-amber-700 to-orange-800',
      description: 'Classic-focused taste',
      tooltip: 'Based on older titles in your list. High score = your heart belongs to anime from previous decades.'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Type Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab('ANIME')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'ANIME' 
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Anime
          </button>
          <button
            onClick={() => setActiveTab('MANGA')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'MANGA' 
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Manga
          </button>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: `Total ${activeTab === 'ANIME' ? 'Anime' : 'Manga'}`, value: allEntries.length, icon: BarChart3 },
          { label: activeTab === 'ANIME' ? 'Watched' : 'Read', value: analyzedEntries.length, icon: Activity },
          { label: activeTab === 'ANIME' ? 'Episodes' : 'Chapters', value: totalProgressWatched, icon: Clock },
          { label: 'Diversity', value: `${(tasteProfile.behavioralMetrics.diversityIndex * 100).toFixed(0)}%`, icon: Palette },
          { label: 'Mean Score', value: tasteProfile.scorePatterns.meanScore.toFixed(1), icon: TrendingUp },
          { label: 'Completion', value: `${(tasteProfile.behavioralMetrics.completionRate * 100).toFixed(0)}%`, icon: Target },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Personality Traits */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Personality Traits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {personalityCards.map((trait, i) => (
            <div 
              key={i} 
              className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group relative"
              title={trait.tooltip}
            >
              <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${trait.color} flex items-center justify-center mb-3`}>
                <trait.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm text-gray-400 mb-1">{trait.label}</div>
              <div className="text-2xl font-bold text-white mb-2">{trait.value.toFixed(1)}</div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-linear-to-r ${trait.color} rounded-full transition-all duration-500`}
                  style={{ width: `${trait.value * 10}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{trait.description}</p>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-white/20 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center z-10 shadow-xl">
                {trait.tooltip}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-linear-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold">Emotional Damage Index</h4>
              <p className="text-sm text-gray-400" title="Based on Drama, Tragedy, Psychological, and emotionally heavy genres in your list">How much suffering do you seek?</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-red-400 mb-3">
            {tasteProfile.personalityTraits.emotionalDamageIndex.toFixed(1)}
            <span className="text-lg text-gray-500">/10</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-linear-to-r from-red-500 to-orange-500 rounded-full"
              style={{ width: `${tasteProfile.personalityTraits.emotionalDamageIndex * 10}%` }}
            />
          </div>
          <p className="text-sm text-gray-400">
            {tasteProfile.personalityTraits.emotionalDamageIndex > 7 
              ? "You love to suffer. Tragedy is your middle name."
              : tasteProfile.personalityTraits.emotionalDamageIndex > 4
              ? "You enjoy some emotional depth in your anime."
              : "You prefer to keep things light and fun."
            }
          </p>
        </div>

        <div className="p-6 rounded-xl bg-linear-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold">Chaos Level</h4>
              <p className="text-sm text-gray-400" title="Based on Ecchi, Harem, Comedy, Parody, Gore, Psychological, and other chaotic genres/tags">How wild is your taste?</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-purple-400 mb-3">
            {tasteProfile.personalityTraits.chaosLevel.toFixed(1)}
            <span className="text-lg text-gray-500">/10</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full"
              style={{ width: `${tasteProfile.personalityTraits.chaosLevel * 10}%` }}
            />
          </div>
          <p className="text-sm text-gray-400">
            {tasteProfile.personalityTraits.chaosLevel > 7 
              ? "Pure chaos. Ecchi, gore, and madness await."
              : tasteProfile.personalityTraits.chaosLevel > 4
              ? "A healthy mix of chaos and order."
              : "You prefer structured, predictable content."
            }
          </p>
        </div>
      </div>

      {/* Genre Affinity */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">Genre Affinity</h3>
        <p className="text-sm text-gray-400 mb-6">Your favorite genres based on {activeTab === 'ANIME' ? 'watch time' : 'reading'} and scores</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tasteProfile.genreAffinity.slice(0, 8)} layout="vertical">
              <XAxis type="number" stroke="#6b7280" />
              <YAxis type="category" dataKey="genre" stroke="#6b7280" width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="affinity" fill="url(#purpleGradient)" radius={[0, 4, 4, 0]} />
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Studio/Author Bias */}
      {activeTab === 'ANIME' && tasteProfile.studioBias.length > 0 && (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">Favorite Studios</h3>
        <p className="text-sm text-gray-400 mb-6">Your most watched animation studios</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tasteProfile.studioBias.slice(0, 6)}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="bias"
                nameKey="studio"
                label={(props: PieLabelRenderProps) => {
                  const { cx, cy, midAngle, innerRadius, outerRadius, percent, payload } = props;
                  if (cx === undefined || cy === undefined || midAngle === undefined || innerRadius === undefined || outerRadius === undefined || percent === undefined) return null;

                  const RADIAN = Math.PI / 180;
                  const radius = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 1.5;
                  const x = (cx as number) + radius * Math.cos(-midAngle * RADIAN);
                  const y = (cy as number) + radius * Math.sin(-midAngle * RADIAN);

                  // Extract studio name from payload or data item
                  const studioName = payload?.studio || payload?.name || 'Unknown';

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#9ca3af"
                      textAnchor={x > (cx as number) ? 'start' : 'end'}
                      dominantBaseline="central"
                      className="text-[10px] md:text-xs"
                    >
                      {`${studioName} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  );
                }}
              >
                {tasteProfile.studioBias.slice(0, 6).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* Detailed Genre & Studio Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Genre Cards */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Top Genres</h3>
          </div>
          <div className="grid gap-3">
            {tasteProfile.genreAffinity.slice(0, 5).map((genre, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">{genre.genre}</div>
                    <div className="text-xs text-gray-500">{genre.count} series {activeTab === 'ANIME' ? 'watched' : 'read'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-bold">{(genre.affinity * 100).toFixed(1)}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Affinity</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shareable Card (Centerpiece) */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Your Taste Card</h3>
          </div>
          <ShareableTasteCard 
            profile={tasteProfile} 
            username={user?.name || 'User'} 
            avatarUrl={user?.avatar?.large} 
          />
        </div>

        {/* Studio Cards - Only show for Anime */}
        {activeTab === 'ANIME' && tasteProfile.studioBias.length > 0 && (
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Top Studios</h3>
          </div>
          <div className="grid gap-3">
            {tasteProfile.studioBias.slice(0, 5).map((studio, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">{studio.studio}</div>
                    <div className="text-xs text-gray-500">{studio.count} series watched</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-blue-400 font-bold">{(studio.bias * 100).toFixed(1)}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Bias</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Score Distribution */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">Score Distribution</h3>
        <p className="text-sm text-gray-400 mb-6">How you rate your {activeTab === 'ANIME' ? 'anime' : 'manga'}</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tasteProfile.scorePatterns.scoreDistribution}>
              <XAxis dataKey="score" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="url(#greenGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Elite Taste Intelligence Section */}
      <div className="pt-8 border-t border-white/10">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            Deep Taste Intelligence
          </h2>
          <p className="text-gray-400 text-sm">Advanced behavioral analysis and taste vectors</p>
        </div>

        {/* Taste Fingerprint - Featured */}
        <div className="mb-8">
          <TasteFingerprintCard fingerprint={tasteProfile.fingerprint} />
        </div>

        {/* Emotional & Structural Vectors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <EmotionalProfileChart emotionalProfile={tasteProfile.emotionalProfile} />
          <StructuralPreferencesChart structuralPreferences={tasteProfile.structuralPreferences} />
        </div>

        {/* Risk Profile & Contradictions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RiskProfileChart riskProfile={tasteProfile.riskProfile} />
          <ContradictionsCard contradictions={tasteProfile.contradictions} />
        </div>
      </div>

      {/* Battle Mode */}
      <div className="pt-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Sword className="w-6 h-6 text-purple-400" />
              Taste Battle Mode
            </h3>
            <p className="text-gray-400 text-sm">Compare your anime DNA with any other user</p>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                value={opponentUsername}
                onChange={(e) => setOpponentUsername(e.target.value)}
                placeholder="AniList Username..."
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors w-64"
              />
            </div>
            <button 
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-all"
            >
              {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              Battle
            </button>
          </form>
        </div>

        {searchError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-8">
            User not found or profile is private.
          </div>
        )}

        {opponentData && (
          <TasteBattle 
            user1={{ name: user?.name || 'You', profile: tasteProfile }}
            user2={{ name: opponentData.user.name, profile: opponentData.profile }}
          />
        )}
      </div>

      {/* Behavioral Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Behavioral Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Completion Rate', value: `${(tasteProfile.behavioralMetrics.completionRate * 100).toFixed(1)}%`, sub: `${activeTab === 'ANIME' ? 'anime' : 'manga'} completed` },
            { label: 'Drop Rate', value: `${(tasteProfile.behavioralMetrics.dropRate * 100).toFixed(1)}%`, sub: `${activeTab === 'ANIME' ? 'anime' : 'manga'} dropped` },
            { label: activeTab === 'ANIME' ? 'Rewatch Rate' : 'Reread Rate', value: `${(tasteProfile.behavioralMetrics.rewatchRate * 100).toFixed(1)}%`, sub: `${activeTab === 'ANIME' ? 'anime rewatched' : 'manga reread'}` },
            { 
              label: 'Binge Index', 
              value: bingeDataQuality > 10 ? (tasteProfile.behavioralMetrics.bingeIndex * 10).toFixed(1) : 'N/A', 
              sub: bingeDataQuality > 10 ? `data quality: ${bingeDataQuality.toFixed(0)}%` : 'need start/end dates'
            },
            { label: 'Mainstream Index', value: (tasteProfile.behavioralMetrics.mainstreamIndex * 10).toFixed(1), sub: 'popularity score' },
            { label: 'Niche Index', value: (tasteProfile.behavioralMetrics.nicheIndex * 10).toFixed(1), sub: 'rarity score' },
            { label: 'Diversity Index', value: (tasteProfile.behavioralMetrics.diversityIndex * 10).toFixed(1), sub: 'genre spread' },
            { label: 'Average Score', value: tasteProfile.scorePatterns.meanScore.toFixed(1), sub: 'mean rating' },
          ].map((metric, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-gray-400 mb-1">{metric.label}</div>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <div className="text-xs text-gray-500">{metric.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
