'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAnimeList, useMangaList, useRecommendations, RecommendationOptions } from '@/hooks/use-anilist';
import { useSettings } from '@/contexts/settings-context';
import { TasteAnalyzer } from '@/lib/taste-analyzer';
import { MediaListEntry, Media } from '@/types/anilist';
import { 
  Sparkles, 
  TrendingUp, 
  Shuffle, 
  Star,
  Play,
  ExternalLink,
  Zap,
  Heart,
  Skull,
  Filter,
  ChevronDown,
  Tag,
  BarChart3,
  Info,
  Flame
} from 'lucide-react';

interface RecommendationsProps {
  userId?: number;
}

interface ExtendedMedia extends Media {
  _matchScore?: number;
  _matchReason?: string;
  _category?: 'safe' | 'experimental' | 'hidden-gem';
}

export function Recommendations({ userId }: RecommendationsProps) {
  const { user } = useAuth();
  const { getPreferredTitle } = useSettings();
  const [activeType, setActiveType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const [activeFilter, setActiveFilter] = useState<'all' | 'safe' | 'experimental' | 'hidden-gem' | 'opposite'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [minScore, setMinScore] = useState(60);
  const [explorationLevel, setExplorationLevel] = useState(50); // 0 = comfort, 100 = full exploration

  const effectiveUserId = userId || user?.id || 0;
  const { data: animeList, isLoading: isLoadingAnime, error: animeError } = useAnimeList(effectiveUserId);
  const { data: mangaList, isLoading: isLoadingManga, error: mangaError } = useMangaList(effectiveUserId);

  const isLoadingList = activeType === 'ANIME' ? isLoadingAnime : isLoadingManga;
  const listError = activeType === 'ANIME' ? animeError : mangaError;
  const currentList = activeType === 'ANIME' ? animeList : mangaList;

  // Only include watched entries for recommendations (exclude Planning, Paused, Dropped)
  const allEntries = useMemo(() => {
    if (!currentList?.lists) return [];
    const validStatuses = ['COMPLETED', 'CURRENT', 'REPEATING'];
    return currentList.lists
      .flatMap((list: { entries: MediaListEntry[] }) => list.entries)
      .filter((entry: MediaListEntry) => validStatuses.includes(entry.status || ''));
  }, [currentList]);

  const tasteProfile = useMemo(() => {
    if (allEntries.length === 0) return null;
    return TasteAnalyzer.analyzeTaste(allEntries, activeType);
  }, [allEntries, activeType]);

  const watchedIds = useMemo(() => {
    return new Set(allEntries.map((e: MediaListEntry) => e.media?.id).filter(Boolean) as number[]);
  }, [allEntries]);

  // Build recommendation options with exploration level
  // explorationLevel: 0 = safe/comfort picks, 100 = experimental/exploration
  const recOptions: RecommendationOptions = useMemo(() => {
    // Determine mode based on exploration level if no filter is selected
    let mode: 'safe' | 'experimental' | 'hidden-gem' | 'all' | 'opposite' = activeFilter;
    if (activeFilter === 'all') {
      if (explorationLevel < 30) mode = 'safe';
      else if (explorationLevel > 70) mode = 'experimental';
    }
    
    // Adjust min score based on exploration - more exploration = accept lower scores
    const adjustedMinScore = Math.max(40, minScore - Math.floor(explorationLevel / 5));
    
    return {
      selectedGenre,
      mode,
      minScore: adjustedMinScore,
      tagAffinity: tasteProfile?.tagAffinity || [],
      explorationLevel, // Pass to backend for genre diversity
    };
  }, [selectedGenre, activeFilter, minScore, explorationLevel, tasteProfile?.tagAffinity]);

  const { data: recommendedMedia, isLoading: isLoadingRecs, refetch: refetchRecs, isRefetching } = useRecommendations(
    tasteProfile?.genreAffinity || [],
    watchedIds,
    activeType,
    recOptions
  );

  if (isLoadingList) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-400">Generating recommendations...</p>
      </div>
    );
  }

  if (listError || !animeList) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
          <Skull className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-white font-medium mb-2">Failed to load recommendations</p>
        <p className="text-gray-400 text-sm">Please try refreshing the page</p>
      </div>
    );
  }

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-purple-400" />
        </div>
        <p className="text-white font-medium mb-2">No anime data found</p>
        <p className="text-gray-400 text-sm">Watch some anime to get personalized recommendations!</p>
      </div>
    );
  }

  if (!tasteProfile) return null;

  // Cast to extended media type for accessing computed properties
  const extendedMedia = (recommendedMedia || []) as ExtendedMedia[];

  // Process recommendations - they now come with match scores from the API
  const processedRecommendations = extendedMedia.map(media => ({
    id: media.id,
    title: getPreferredTitle(media.title),
    coverImage: media.coverImage?.extraLarge || media.coverImage?.large || '',
    genres: media.genres || [],
    score: media.meanScore || 0,
    popularity: media.popularity || 0,
    reason: media._matchReason || 'Matches your taste profile',
    matchScore: media._matchScore || 70,
    category: media._category || 'safe' as const
  }));

  const topGenres = tasteProfile.genreAffinity.slice(0, 5);
  const topTags = tasteProfile.tagAffinity.slice(0, 5);
  const topStudios = tasteProfile.studioBias.slice(0, 3).map(s => s.studio);
  
  const filters = [
    { id: 'all' as const, label: 'All', icon: Sparkles },
    { id: 'safe' as const, label: 'Safe Picks', icon: Heart },
    { id: 'hidden-gem' as const, label: 'Hidden Gems', icon: Star },
    { id: 'experimental' as const, label: 'Experimental', icon: Zap },
    { id: 'opposite' as const, label: 'Opposite Day', icon: Flame },
  ];

  // Filter based on category from API
  const filteredRecs = activeFilter === 'all' 
    ? processedRecommendations 
    : processedRecommendations.filter(r => r.category === activeFilter);

  return (
    <div className="space-y-8">
      {/* Type Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveType('ANIME')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeType === 'ANIME' 
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Anime
          </button>
          <button
            onClick={() => setActiveType('MANGA')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeType === 'MANGA' 
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Manga
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Personalized Recommendations</h2>
          <p className="text-gray-400">Based on your {activeType.toLowerCase()} DNA and {allEntries.length} titles discovered</p>
        </div>
        <button 
          onClick={() => refetchRecs()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
        >
          <Shuffle className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          {isRefetching ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {/* Taste Summary */}
      <div className="p-6 rounded-xl bg-linear-to-r from-purple-500/10 to-blue-500/10 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Your Taste DNA
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Top Genres</p>
            <div className="flex flex-wrap gap-1">
              {topGenres.slice(0, 3).map((g, i) => (
                <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                  {g.genre}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Top Tags</p>
            <div className="flex flex-wrap gap-1">
              {topTags.slice(0, 2).map((t, i) => (
                <span key={i} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs rounded-full">
                  {t.tag}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">{activeType === 'ANIME' ? 'Favorite Studios' : 'Top Authors'}</p>
            <div className="flex flex-wrap gap-1">
              {topStudios.slice(0, 2).map((studio, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                  {studio}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Mean Score</p>
            <p className="text-xl font-bold text-white">{tasteProfile.scorePatterns.meanScore.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Diversity</p>
            <p className="text-xl font-bold text-white">{(tasteProfile.behavioralMetrics.diversityIndex * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Genre Picker */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" />
            Filter by Genre
          </h4>
          <button
            onClick={() => setShowGenrePicker(!showGenrePicker)}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            {showGenrePicker ? 'Hide' : 'Show All'}
            <ChevronDown className={`w-3 h-3 inline ml-1 transition-transform ${showGenrePicker ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedGenre === null
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            All Genres
          </button>
          {(showGenrePicker ? tasteProfile.genreAffinity : topGenres).map((g) => (
            <button
              key={g.genre}
              onClick={() => setSelectedGenre(g.genre)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                selectedGenre === g.genre
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {g.genre}
              <span className="text-xs opacity-60">({(g.affinity * 100).toFixed(0)}%)</span>
            </button>
          ))}
        </div>
        {selectedGenre && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
            <Info className="w-4 h-4" />
            <span>Showing recommendations filtered by <strong className="text-purple-300">{selectedGenre}</strong></span>
          </div>
        )}
      </div>

      {/* Min Score Slider */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
        <Tag className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">Min Score:</span>
        <input
          type="range"
          min="40"
          max="80"
          step="5"
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <span className="text-sm font-medium text-white w-12">{minScore}%</span>
      </div>

      {/* Exploration Slider */}
      <div className="p-4 rounded-xl bg-linear-to-r from-green-500/10 via-purple-500/10 to-orange-500/10 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-green-400">Comfort</span>
          <span className="text-xs text-gray-400">Discovery Mode</span>
          <span className="text-sm font-medium text-orange-400">Exploration</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={explorationLevel}
          onChange={(e) => setExplorationLevel(Number(e.target.value))}
          className="w-full h-3 bg-linear-to-r from-green-500/30 via-purple-500/30 to-orange-500/30 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, rgb(34 197 94 / 0.5) 0%, rgb(168 85 247 / 0.5) 50%, rgb(249 115 22 / 0.5) 100%)`
          }}
        />
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-400">
            {explorationLevel < 30 ? '🛡️ Safe picks matching your taste' : 
             explorationLevel > 70 ? '🚀 Venturing outside your comfort zone' :
             '⚖️ Balanced mix of familiar and new'}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeFilter === filter.id
                ? 'bg-purple-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <filter.icon className="w-4 h-4" />
            {filter.label}
          </button>
        ))}
      </div>

      {/* Recommendation Cards */}
      {isLoadingRecs ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-3/4 rounded-xl bg-white/5 border border-white/10" />
          ))}
        </div>
      ) : filteredRecs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecs.map((rec) => (
            <div 
              key={rec.id}
              className="group relative rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all"
            >
              <div className="aspect-3/4 relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent z-10" />
                <div 
                  className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-300"
                  style={{ backgroundImage: `url(${rec.coverImage})` }}
                />
                <div className="absolute top-3 right-3 z-20">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rec.category === 'safe' ? 'bg-green-500/80 text-white' :
                    rec.category === 'hidden-gem' ? 'bg-yellow-500/80 text-black' :
                    'bg-purple-500/80 text-white'
                  }`}>
                    {rec.category === 'safe' ? 'Safe Pick' : rec.category === 'hidden-gem' ? 'Hidden Gem' : 'Experimental'}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{rec.title}</h3>
                  <p className="text-sm text-gray-300 mb-2 line-clamp-2">{rec.reason}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{rec.score}%</span>
                    </div>
                    <span className="text-gray-500">•</span>
                    <div className="flex items-center gap-1 text-purple-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">{rec.matchScore}% match</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 flex gap-2">
                <a 
                  href={`https://anilist.co/${activeType.toLowerCase()}/${rec.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  <Play className="w-4 h-4" />
                  View Details
                </a>
                <button className="flex items-center justify-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-gray-400 italic">No recommendations found for this category.</p>
        </div>
      )}

      {/* More Recommendations CTA */}
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">Want more personalized recommendations?</p>
        <button 
          onClick={() => refetchRecs()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors"
        >
          <Sparkles className="w-5 h-5 text-purple-400" />
          Generate More
        </button>
      </div>
    </div>
  );
}
