'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAnimeList, useMangaList, useFavorites } from '@/hooks/use-anilist';
import { TasteAnalyzer, FavoritesProfile } from '@/lib/taste-analyzer';
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
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Info,
  Tag
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
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  const effectiveUserId = userId || user?.id || 0;
  
  const { data: animeList, isLoading: isLoadingAnime, error: animeError } = useAnimeList(effectiveUserId);
  const { data: mangaList, isLoading: isLoadingManga, error: mangaError } = useMangaList(effectiveUserId);
  const { data: favorites, isLoading: isLoadingFavorites } = useFavorites(effectiveUserId);

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

  // Analyze favorites to create favorites-only profile
  const favoritesProfile = useMemo<FavoritesProfile | null>(() => {
    if (!favorites || isLoadingFavorites) return null;
    const favList = activeTab === 'ANIME' ? favorites.anime : favorites.manga;
    if (favList.length === 0) return null;
    return TasteAnalyzer.analyzeFavorites(favList, activeTab);
  }, [favorites, isLoadingFavorites, activeTab]);

  // Compare favorites DNA vs list DNA
  const favoritesComparison = useMemo(() => {
    if (!tasteProfile || !favoritesProfile) return null;
    return TasteAnalyzer.compareFavoritesVsList(tasteProfile, favoritesProfile);
  }, [tasteProfile, favoritesProfile]);

  // Calculate favorites lambda for display
  const favoritesLambda = useMemo(() => {
    if (!favoritesProfile) return 0;
    return TasteAnalyzer.calculateFavoritesLambda(favoritesProfile.count);
  }, [favoritesProfile]);

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
      tooltip: 'Measures your completion rate. High score = you finish most titles you start.',
      receipts: [
        { label: 'Completion Rate', value: `${(tasteProfile.behavioralMetrics.completionRate * 100).toFixed(1)}%` },
        { label: 'Drop Rate', value: `${(tasteProfile.behavioralMetrics.dropRate * 100).toFixed(1)}%` },
        { label: 'Avg progress before drop', value: `${((tasteProfile.behavioralMetrics.meanDropProgress || 0) * 100).toFixed(0)}%` }
      ]
    },
    { 
      label: 'Seasonal Tourist', 
      value: tasteProfile.personalityTraits.seasonalTourist, 
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      description: 'Following current season trends',
      tooltip: 'Based on % of your list from the current/last year.',
      receipts: [
        { label: 'Recent Titles', value: analyzedEntries.filter(e => e.media?.startDate?.year && e.media.startDate.year >= new Date().getFullYear() - 1).length.toString() },
        { label: 'Seasonal Ratio', value: `${((analyzedEntries.filter(e => e.media?.startDate?.year && e.media.startDate.year >= new Date().getFullYear() - 1).length / (analyzedEntries.length || 1)) * 100).toFixed(1)}%` }
      ]
    },
    { 
      label: 'Cult Hunter', 
      value: tasteProfile.personalityTraits.cultHunter, 
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      description: 'Seeking hidden gems and classics',
      tooltip: `Measures how many low-popularity titles you ${activeTab === 'ANIME' ? 'watch' : 'read'}.`,
      receipts: [
        { label: 'Median Popularity', value: (tasteProfile.behavioralMetrics.medianPopularity || 0).toLocaleString() },
        { label: 'Niche Index', value: (tasteProfile.behavioralMetrics.nicheIndex * 10).toFixed(1) }
      ]
    },
    { 
      label: 'Avant-Garde', 
      value: tasteProfile.personalityTraits.avantGarde, 
      icon: Palette,
      color: 'from-pink-500 to-rose-500',
      description: 'Appreciation for experimental works',
      tooltip: `Based on experimental/avant-garde titles in your ${activeTab === 'ANIME' ? 'list' : 'collection'}.`,
      receipts: [
        { label: 'Experimental Index', value: (tasteProfile.behavioralMetrics.experimentalIndex * 10).toFixed(1) },
        { label: 'Unique Tags', value: tasteProfile.tagAffinity.filter(t => t.affinity > 0.6).length.toString() }
      ]
    },
    { 
      label: 'Mainstream Maxxer', 
      value: tasteProfile.personalityTraits.mainstreamMaxxer, 
      icon: Zap,
      color: 'from-blue-400 to-indigo-600',
      description: 'Following the cultural phenomena',
      tooltip: `Measures how many highly popular titles you ${activeTab === 'ANIME' ? 'watch' : 'read'}.`,
      receipts: [
        { label: 'Median Popularity', value: (tasteProfile.behavioralMetrics.medianPopularity || 0).toLocaleString() },
        { label: '% over 100k pop', value: `${((tasteProfile.behavioralMetrics.percentMainstream || 0) * 100).toFixed(1)}%` }
      ]
    },
    { 
      label: 'Nostalgia Addict', 
      value: tasteProfile.personalityTraits.nostalgiaAddict, 
      icon: Clock,
      color: 'from-amber-700 to-orange-800',
      description: 'Classic-focused taste',
      tooltip: 'Based on older titles in your list.',
      receipts: [
        { label: 'Pre-2010 Titles', value: tasteProfile.eraPreference.filter(e => ['80s & Before', '90s', '2000s'].includes(e.era)).reduce((sum, e) => sum + e.count, 0).toString() },
        { label: 'Vintage Ratio', value: `${((tasteProfile.eraPreference.filter(e => ['80s & Before', '90s', '2000s'].includes(e.era)).reduce((sum, e) => sum + e.count, 0) / (analyzedEntries.length || 1)) * 100).toFixed(1)}%` }
      ]
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
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          Personality Traits
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-500 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 border border-white/10 rounded-lg text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              These traits represent your behavioral patterns. Click on a card to see the raw stats (&quot;receipts&quot;) that calculated your score.
            </div>
          </div>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personalityCards.map((trait, i) => (
            <div 
              key={i} 
              className={`p-5 rounded-xl bg-white/5 border transition-all cursor-pointer group relative ${
                expandedTrait === trait.label ? 'border-white/30 bg-white/10' : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => setExpandedTrait(expandedTrait === trait.label ? null : trait.label)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${trait.color} flex items-center justify-center`}>
                  <trait.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-white">{trait.value.toFixed(1)}</div>
              </div>
              
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-semibold text-white">{trait.label}</div>
                {expandedTrait === trait.label ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
              
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full bg-linear-to-r ${trait.color} rounded-full transition-all duration-500`}
                  style={{ width: `${trait.value * 10}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{trait.description}</p>

              {expandedTrait === trait.label && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">The Receipts</p>
                  {trait.receipts.map((receipt, j) => (
                    <div key={j} className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{receipt.label}</span>
                      <span className="text-white font-mono">{receipt.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Special Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-linear-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 group relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold flex items-center gap-2">
                Emotional Damage Index
                <div className="group/tooltip relative">
                  <Info className="w-3 h-3 text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-72 p-2 bg-gray-900 border border-white/10 rounded-lg text-[10px] text-gray-400 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-20 font-normal">
                    <p className="font-bold text-white mb-1">How it&apos;s calculated:</p>
                    <ul className="list-disc pl-3 space-y-1">
                      <li>Based on your <b>enjoyment</b> of emotional content, not just completion</li>
                      <li>Uses z-scores to compare ratings vs your personal average</li>
                      <li>Only counts content you rated <b>above your mean</b> score</li>
                      <li>Adjusted for completionist behavior (high completion = ratings matter more)</li>
                      <li>Guard: Low emotional ratings reduce the index</li>
                    </ul>
                    <p className="text-green-400 mt-2 italic">Now reflects true preference, not persistence!</p>
                  </div>
                </div>
              </h4>
              <p className="text-sm text-gray-400">How much suffering do you seek?</p>
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
              ? `You enjoy some emotional depth in your ${activeTab === 'ANIME' ? 'anime' : 'manga'}.`
              : "You prefer to keep things light and fun."
            }
          </p>
        </div>

        <div className="p-6 rounded-xl bg-linear-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 group relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold flex items-center gap-2">
                Chaos Level
                <div className="group/tooltip relative">
                  <Info className="w-3 h-3 text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 border border-white/10 rounded-lg text-[10px] text-gray-400 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-20 font-normal">
                    <p className="font-bold text-white mb-1">How it&apos;s calculated:</p>
                    <ul className="list-disc pl-3 space-y-1">
                      <li>Frequency of Parody, Comedy, Surreal, and Gore tags</li>
                      <li>High scores for non-linear or abstract storytelling</li>
                      <li>Penalized by high ratios of grounded {activeTab === 'ANIME' ? 'Slice of Life' : 'Daily Life'}</li>
                    </ul>
                  </div>
                </div>
              </h4>
              <p className="text-sm text-gray-400">How wild is your taste?</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-2">Format Preference</h3>
          <p className="text-sm text-gray-400 mb-4">Which distribution formats you engage with most</p>
          
          {/* Format Weights Summary */}
          {tasteProfile.formatWeights && Object.keys(tasteProfile.formatWeights).length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400 mb-2">Recommendation Weight Multipliers:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(tasteProfile.formatWeights)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([format, weight]) => (
                    <span 
                      key={format}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        weight > 1.1 ? 'bg-green-500/20 text-green-400' :
                        weight < 0.9 ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}
                      title={`${format} recommendations are ${weight > 1 ? 'boosted' : weight < 1 ? 'reduced' : 'neutral'} by ${Math.abs((weight - 1) * 100).toFixed(0)}%`}
                    >
                      {format}: {weight.toFixed(2)}x
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasteProfile.formatPreference.slice(0, 8)} layout="vertical">
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="format" stroke="#6b7280" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0]?.payload as { format: string; count: number; avgScore: number; preference: number } | undefined;
                    if (!data) return null;
                    const weight = tasteProfile.formatWeights?.[data.format] ?? 1.0;
                    return (
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm">
                        <div className="font-medium text-white mb-1">{data.format}</div>
                        <div className="text-gray-300">Engagement: {(data.preference * 100).toFixed(1)}%</div>
                        <div className="text-gray-300">Count: {data.count} titles</div>
                        <div className="text-gray-300">Avg Score: {data.avgScore.toFixed(1)}</div>
                        <div className={weight > 1 ? 'text-green-400' : weight < 1 ? 'text-red-400' : 'text-gray-300'}>
                          Rec Weight: {weight.toFixed(2)}x
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="preference" fill="url(#blueGradient)" radius={[0, 4, 4, 0]} />
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Tags */}
      <div className="p-6 rounded-xl bg-linear-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-green-400" />
              Top Tags
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Your strongest affinities for specific themes and content
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
            {tasteProfile.tagAffinity.length} total tags
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tasteProfile.tagAffinity
            .filter(tag => tag.affinity > 0.3 && tag.count >= 2) // Show meaningful tags with enough data
            .slice(0, 12)
            .map((tag) => (
              <div 
                key={tag.tag}
                className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate" title={tag.tag}>
                      {tag.tag}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {tag.count} titles • {tag.avgScore.toFixed(1)}★ avg
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`text-xs font-bold ${
                      tag.affinity > 0.7 ? 'text-green-400' : 
                      tag.affinity > 0.5 ? 'text-yellow-400' : 
                      'text-gray-400'
                    }`}>
                      {(tag.affinity * 100).toFixed(0)}%
                    </div>
                    <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          tag.affinity > 0.7 ? 'bg-green-400' : 
                          tag.affinity > 0.5 ? 'bg-yellow-400' : 
                          'bg-gray-400'
                        }`}
                        style={{ width: `${tag.affinity * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {tasteProfile.tagAffinity.filter(tag => tag.affinity > 0.3 && tag.count >= 2).length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <Tag className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-gray-400">
              Not enough data yet. Watch more {activeTab === 'ANIME' ? 'anime' : 'manga'} to see your tag preferences!
            </p>
          </div>
        )}
      </div>

      {/* Favorites DNA vs List DNA */}
      {favoritesProfile && favoritesProfile.count > 0 && favoritesComparison && (
        <div className="p-6 rounded-xl bg-linear-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Favorites DNA vs List DNA
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {favoritesProfile.count} favorites • {(favoritesLambda * 100).toFixed(0)}% influence on recommendations
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
              λ = {favoritesLambda.toFixed(2)}
            </div>
          </div>

          {/* Insights */}
          {favoritesComparison.insights.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <div className="text-sm text-gray-300">
                  {favoritesComparison.insights.map((insight: string, i: number) => (
                    <p key={i} className={i > 0 ? 'mt-1' : ''}>{insight}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Genre Skew Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Top in Favorites (vs List)</p>
              <div className="space-y-2">
                {favoritesComparison.genreSkew
                  .filter((g: { genre: string; listPct: number; favPct: number; diff: number }) => g.diff > 5)
                  .slice(0, 4)
                  .map((g: { genre: string; listPct: number; favPct: number; diff: number }) => (
                    <div key={g.genre} className="flex items-center justify-between">
                      <span className="text-sm text-white">{g.genre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{g.listPct.toFixed(0)}%</span>
                        <span className="text-green-400">→</span>
                        <span className="text-xs text-green-400 font-medium">{g.favPct.toFixed(0)}%</span>
                        <span className="text-xs text-green-400">(+{g.diff.toFixed(0)})</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">More Consumed Than Favorited</p>
              <div className="space-y-2">
                {favoritesComparison.genreSkew
                  .filter((g: { genre: string; listPct: number; favPct: number; diff: number }) => g.diff < -5)
                  .slice(0, 4)
                  .map((g: { genre: string; listPct: number; favPct: number; diff: number }) => (
                    <div key={g.genre} className="flex items-center justify-between">
                      <span className="text-sm text-white">{g.genre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-400 font-medium">{g.listPct.toFixed(0)}%</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-xs text-gray-400">{g.favPct.toFixed(0)}%</span>
                        <span className="text-xs text-red-400">({g.diff.toFixed(0)})</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Favorite Staff/Studios */}
          {favoritesProfile.staffAffinity.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-400 mb-2 font-medium">
                {activeTab === 'ANIME' ? 'Studios' : 'Authors'} in Your Favorites
              </p>
              <div className="flex flex-wrap gap-2">
                {favoritesProfile.staffAffinity.slice(0, 6).map((s: { name: string; affinity: number }) => (
                  <span 
                    key={s.name}
                    className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-medium"
                    title={`Appears in ${(s.affinity * 100).toFixed(0)}% of favorites`}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Studio/Author Bias */}
      {tasteProfile.studioBias.length > 0 && (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">{activeTab === 'ANIME' ? 'Favorite Studios' : 'Top Authors'}</h3>
        <p className="text-sm text-gray-400 mb-6">Your most {activeTab === 'ANIME' ? 'watched animation studios' : 'read authors'}</p>
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

                  // Extract studio/author name from payload or data item
                  const sourceName = payload?.studio || payload?.name || 'Unknown';

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#9ca3af"
                      textAnchor={x > (cx as number) ? 'start' : 'end'}
                      dominantBaseline="central"
                      className="text-[10px] md:text-xs"
                    >
                      {`${sourceName} (${(percent * 100).toFixed(0)}%)`}
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
            activeType={activeTab}
          />
        </div>

        {/* Studio/Author Cards */}
        {tasteProfile.studioBias.length > 0 && (
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-bold text-white">{activeTab === 'ANIME' ? 'Top Studios' : 'Top Authors'}</h3>
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
                    <div className="text-xs text-gray-500">{studio.count} series {activeTab === 'ANIME' ? 'watched' : 'read'}</div>
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
          <EmotionalProfileChart emotionalProfile={tasteProfile.emotionalProfile} activeType={activeTab} />
          <StructuralPreferencesChart structuralPreferences={tasteProfile.structuralPreferences} activeType={activeTab} />
        </div>

        {/* Risk Profile & Contradictions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RiskProfileChart riskProfile={tasteProfile.riskProfile} activeType={activeTab} />
          <div className="space-y-8">
            <ContradictionsCard contradictions={tasteProfile.contradictions} />
          </div>
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
            <p className="text-gray-400 text-sm">Compare your {activeTab === 'ANIME' ? 'anime' : 'manga'} DNA with any other user</p>
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
