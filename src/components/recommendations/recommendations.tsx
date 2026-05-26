'use client';

import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAnimeList, useMangaList, useFavorites, useRecommendations, RecommendationOptions } from '@/hooks/use-anilist';
import { useSettings } from '@/contexts/settings-context';
import { useMedia } from '@/contexts/media-context';
import { useModelSettings } from '@/hooks/use-model-settings';
import { TasteAnalyzer, FavoritesProfile } from '@/lib/taste-analyzer';
import { extractGenome, extractTraitProfile, predictEnjoyment, extractPredictionFeatures, predictWithLearnedWeights, MediaFeatures, EnjoymentPrediction } from '@/lib/taste-genome';
import { traitScoresToGenreAffinity, traitScoresToTagAffinity } from '@/lib/trait-to-legacy-adapter';
import { Media } from '@/types/anilist';
import { normalizeMediaList, extractMediaIds } from '@/lib/normalize-media-list';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { TodayRail } from '@/components/home/today-rail';
import { usePrefetchMedia } from '@/hooks/use-prefetch';
import { GridSkeleton } from '@/components/ui/lazy-component';
import { ModelSettingsPanel } from '@/components/settings/model-settings-panel';
import { 
  Sparkles,
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
  Flame,
  Settings,
  X
} from 'lucide-react';

interface RecommendationsProps {
  userId?: number;
}

interface ExtendedMedia extends Media {
  _matchScore?: number;
  _matchReason?: string;
  _reasons?: Array<{ type: string; text: string; weight: number }>;
  _category?: 'safe' | 'experimental' | 'hidden-gem';
}

interface ProcessedRec {
  id: number;
  title: string;
  coverImage: string;
  genres: string[];
  tags: Array<{ name: string; rank: number }>;
  format: string;
  score: number;
  popularity: number;
  reason: string;
  reasons: Array<{ type: string; text: string; weight: number }>;
  matchScore: number;
  category: 'safe' | 'experimental' | 'hidden-gem' | 'opposite';
  // Taste Genome predictions
  predictedScore?: number;
  probabilityOfLiking?: number;
  predictionConfidence?: string;
  predictionRisk?: 'SAFE' | 'MODERATE' | 'EXPERIMENTAL';
}

interface RecommendationCardProps {
  rec: ProcessedRec;
  activeType: 'ANIME' | 'MANGA';
  userId: number;
  priority?: boolean;
  /** Score the user has previously saved for this media (1-10) */
  savedRating?: number;
  /** Callback fired after the user successfully saves a rating */
  onRatingSaved?: (score: number) => void;
}

const RecommendationCard = memo(function RecommendationCard({ rec, activeType, userId, priority = false, savedRating, onRatingSaved }: RecommendationCardProps) {
  const { prefetchMedia } = usePrefetchMedia();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    prefetchMedia(rec.id);
  }, [rec.id, prefetchMedia]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  const [showRatePanel, setShowRatePanel] = useState(false);
  const [ratedScore, setRatedScore] = useState<number | null>(null);

  useEffect(() => {
    if (showRatePanel) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showRatePanel]);

  return (
    <div 
      className="group relative rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative overflow-hidden" style={{ paddingBottom: '133.33%' }}>
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
        >
          <OptimizedImage
            src={rec.coverImage}
            alt={rec.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={80}
            priority={priority}
            className="w-full h-full"
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3 z-20 transition-transform duration-200" style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg ${
            rec.category === 'safe' ? 'bg-green-500/90 text-white ring-1 ring-green-400/50' :
            rec.category === 'hidden-gem' ? 'bg-yellow-500/90 text-black ring-1 ring-yellow-400/50' :
            rec.category === 'opposite' ? 'bg-red-500/90 text-white ring-1 ring-red-400/50' :
            'bg-purple-500/90 text-white ring-1 ring-purple-400/50'
          }`}>
            {rec.category === 'safe' ? '✓ Safe Pick' : 
             rec.category === 'hidden-gem' ? '💎 Hidden Gem' : 
             rec.category === 'opposite' ? '🔄 Opposite' :
             '⚡ Experimental'}
          </span>
        </div>
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 transition-all duration-300" style={{ transform: isHovered ? 'translateY(-4px)' : 'translateY(0)' }}>
          <div className="flex items-start gap-2 mb-2">
            <h3 className="text-lg font-bold text-white line-clamp-2 flex-1 leading-tight">{rec.title}</h3>
            {rec.format && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/25 text-white backdrop-blur-sm shrink-0">
                {rec.format}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-200 mb-3 line-clamp-2 leading-relaxed">{rec.reason}</p>
          
          {rec.reasons.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {rec.reasons.slice(1, 3).map((r, i) => (
                <span 
                  key={i} 
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold backdrop-blur-sm transition-transform duration-200 hover:scale-105 ${
                    r.type === 'format' ? (r.weight > 0 ? 'bg-green-500/40 text-green-200 ring-1 ring-green-400/30' : 'bg-red-500/40 text-red-200 ring-1 ring-red-400/30') :
                    r.type === 'genre' ? 'bg-purple-500/40 text-purple-200 ring-1 ring-purple-400/30' :
                    r.type === 'tag' ? 'bg-blue-500/40 text-blue-200 ring-1 ring-blue-400/30' :
                    r.type === 'staff' ? 'bg-yellow-500/40 text-yellow-200 ring-1 ring-yellow-400/30' :
                    'bg-gray-500/40 text-gray-200 ring-1 ring-gray-400/30'
                  }`}
                >
                  {r.text.length > 30 ? r.text.substring(0, 30) + '...' : r.text}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Predicted Score - The star feature */}
            {rec.probabilityOfLiking !== undefined && (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
                rec.probabilityOfLiking >= 75 ? 'bg-green-500/30 text-green-300' :
                rec.probabilityOfLiking >= 50 ? 'bg-yellow-500/30 text-yellow-300' :
                'bg-gray-500/30 text-gray-300'
              }`}>
                <Zap className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{rec.probabilityOfLiking}% chance you&apos;ll like</span>
              </div>
            )}
            {rec.predictedScore !== undefined && (
              <div className="flex items-center gap-1 text-cyan-400">
                <span className="text-xs">Predicted:</span>
                <span className="text-sm font-bold">{rec.predictedScore}/10</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Star className="w-4 h-4 fill-current drop-shadow-lg" />
              <span className="text-sm font-bold">{rec.score}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="p-4 flex gap-2 bg-black/20 backdrop-blur-sm">
        <a 
          href={`https://anilist.co/${activeType.toLowerCase()}/${rec.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-500 hover:bg-purple-600 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]"
        >
          <Play className="w-4 h-4" />
          View Details
        </a>
        <button
          onClick={() => {
            setShowRatePanel(true);
            // Pre-fill with user's previously saved rating; otherwise predicted score
            setRatedScore(savedRating ?? Math.round(rec.predictedScore || 7));
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 text-sm font-medium ${
            savedRating != null
              ? 'bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 ring-1 ring-purple-400/40'
              : 'bg-white/10 hover:bg-purple-500/30 text-white'
          }`}
          title={savedRating != null ? `You rated this ${savedRating}/10` : 'Rate this recommendation to improve accuracy'}
        >
          <Star className="w-4 h-4" />
          {savedRating != null ? `${savedRating}/10` : 'Rate'}
        </button>
        <a
          href={`https://anilist.co/${activeType.toLowerCase()}/${rec.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all duration-200 hover:scale-105"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Rating Modal */}
      {showRatePanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRatePanel(false)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <button
              onClick={() => setShowRatePanel(false)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1 pr-8">Rate {rec.title}</h3>
            <p className="text-sm text-gray-400 mb-4">Your rating helps train your personal model</p>
            <div className="flex items-center justify-center gap-1 mb-5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                <button
                  key={score}
                  onClick={() => setRatedScore(score)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                    ratedScore === score
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-110'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="text-sm text-gray-400">Selected:</span>
              <span className="text-2xl font-bold text-purple-400">{ratedScore}</span>
              <span className="text-sm text-gray-500">/ 10</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (ratedScore == null) return;
                  try {
                    const res = await fetch('/api/taste/feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId,
                        anilistMediaId: rec.id,
                        actualScore: ratedScore,
                        mediaType: activeType,
                      })
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      console.error('[Rating Save] Failed:', data.error || 'Unknown error');
                      alert('Failed to save rating: ' + (data.error || 'Unknown error'));
                    } else {
                      console.log('[Rating Save] Success for media', rec.id, 'score:', ratedScore);
                      // Notify parent to update local rating state and retrain the model
                      onRatingSaved?.(ratedScore);
                    }
                  } catch (err) {
                    console.error('[Rating Save] Network error:', err);
                    alert('Network error saving rating');
                  }
                  setShowRatePanel(false);
                }}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
              >
                Save Rating
              </button>
              <button
                onClick={() => setShowRatePanel(false)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export function Recommendations({ userId }: RecommendationsProps) {
  const { user } = useAuth();
  const { getPreferredTitle } = useSettings();
  const { activeType, setActiveType, getSeriesTerm, getWatchReadTerm, getStudioAuthorTerm } = useMedia();
  const { settings: modelSettings, updateSettings: updateModelSettings, resetSettings: resetModelSettings } = useModelSettings();
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'safe' | 'experimental' | 'hidden-gem' | 'opposite'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [showFormatPicker, setShowFormatPicker] = useState(false);
  const [minScore, setMinScore] = useState(60);
  const [explorationLevel, setExplorationLevel] = useState(50); // 0 = comfort, 100 = full exploration
  const [anchorToFavorites, setAnchorToFavorites] = useState(true);
  const [favoritesInfluence, setFavoritesInfluence] = useState(modelSettings.favoriteInfluence);
  const [learnedWeights, setLearnedWeights] = useState<{weights:Record<string,number>;bias:number;featureNames:string[];sampleCount:number}|null>(null);
  const [modelStatus, setModelStatus] = useState<'idle'|'user'|'rule'>('rule');
  // Ratings the user has submitted via the in-app rate modal (mediaId -> score)
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});
  const loggedBatchRef = useRef<string>('');

  const effectiveUserId = userId || user?.id || 0;

  // Refresh function exposed so the rate modal can update ratings immediately after save
  const refreshUserRatings = useCallback(async () => {
    if (!effectiveUserId) return;
    try {
      const res = await fetch(`/api/taste/ratings?userId=${effectiveUserId}&mediaType=${activeType}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ratings) setUserRatings(data.ratings);
    } catch {
      // ignore
    }
  }, [effectiveUserId, activeType]);

  useEffect(() => {
    if (!effectiveUserId) return;
    // Try per-user model first
    fetch(`/api/taste/learn?userId=${effectiveUserId}&mediaType=${activeType}`, {method:'POST'})
      .then(r => { if (!r.ok) throw new Error(`Learn API ${r.status}`); return r.json(); })
      .then(d => {
        if (d.trained && d.weights) {
          setLearnedWeights({weights:d.weights,bias:d.bias,featureNames:Object.keys(d.weights),sampleCount:d.sampleCount});
          setModelStatus('user');
        } else {
          setModelStatus('rule');
        }
      }).catch(()=>{ setModelStatus('rule'); });
    // Auto-trigger global retrain if stale (fire-and-forget)
    fetch(`/api/taste/learn/global/auto?mediaType=${activeType}`).catch(()=>{});
    // Fetch existing user ratings to filter recs and pre-fill rating modal
    fetch(`/api/taste/ratings?userId=${effectiveUserId}&mediaType=${activeType}`)
      .then(r => { if (!r.ok) throw new Error(`Ratings API ${r.status}`); return r.json(); })
      .then(data => { if (data?.ratings) setUserRatings(data.ratings); })
      .catch(() => {});
  }, [effectiveUserId, activeType]);
  const { data: animeList, isLoading: isLoadingAnime, error: animeError } = useAnimeList(effectiveUserId);
  const { data: mangaList, isLoading: isLoadingManga, error: mangaError } = useMangaList(effectiveUserId);
  const { data: favorites } = useFavorites(effectiveUserId);

  const isLoadingList = activeType === 'ANIME' ? isLoadingAnime : isLoadingManga;
  const listError = activeType === 'ANIME' ? animeError : mangaError;
  const currentList = activeType === 'ANIME' ? animeList : mangaList;

  // Normalize list: flatten, dedupe, and filter to watched entries only (for taste analysis)
  const allEntries = useMemo(() => normalizeMediaList(currentList), [currentList]);

  // Also get PTW entries to exclude from recommendations
  const ptwEntries = useMemo(() => normalizeMediaList(currentList, { 
    statuses: ['PLANNING'] 
  }), [currentList]);

  // Currently-watching entries: used to highlight the user's shows in the airing schedule rail
  const currentlyWatchingIds = useMemo(() => {
    const watching = normalizeMediaList(currentList, { statuses: ['CURRENT'] });
    return watching.map(e => e.media?.id).filter((id): id is number => typeof id === 'number');
  }, [currentList]);

  const tasteProfile = useMemo(() => {
    if (allEntries.length === 0) return null;
    return TasteAnalyzer.analyzeTaste(allEntries, activeType);
  }, [allEntries, activeType]);

  const traitProfile = useMemo(() => {
    if (allEntries.length === 0) return null;
    return extractTraitProfile(allEntries);
  }, [allEntries]);

  const traitGenreAffinity = useMemo(() => (
    traitProfile ? traitScoresToGenreAffinity(traitProfile, 15) : null
  ), [traitProfile]);

  const traitTagAffinity = useMemo(() => (
    traitProfile ? traitScoresToTagAffinity(traitProfile, 20) : null
  ), [traitProfile]);

  const effectiveGenreAffinity = useMemo(() => {
    const legacy = tasteProfile?.genreAffinity ?? [];
    const trait = traitGenreAffinity ?? [];
    if (legacy.length === 0) return trait;
    if (trait.length === 0) return legacy;

    const merged = new Map<string, typeof legacy[number]>();
    for (const entry of legacy) {
      merged.set(entry.genre, { ...entry, avgScore: entry.avgScore ?? 0 });
    }
    for (const entry of trait) {
      const existing = merged.get(entry.genre);
      if (!existing) {
        merged.set(entry.genre, { ...entry, avgScore: entry.avgScore ?? 0 });
      } else {
        merged.set(entry.genre, {
          ...existing,
          affinity: Math.max(existing.affinity, entry.affinity),
          confidence: Math.max(existing.confidence ?? 0, entry.confidence ?? 0),
          count: Math.max(existing.count ?? 0, entry.count ?? 0),
        });
      }
    }
    return Array.from(merged.values()).sort((a, b) => b.affinity - a.affinity);
  }, [tasteProfile?.genreAffinity, traitGenreAffinity]);

  const effectiveTagAffinity = useMemo(() => {
    const legacy = tasteProfile?.tagAffinity ?? [];
    const trait = traitTagAffinity ?? [];
    if (legacy.length === 0) return trait;
    if (trait.length === 0) return legacy;

    type TagAffinityEntry = {
      tag: string;
      affinity: number;
      count: number;
      avgScore: number;
      avgRank: number;
      confidence?: number;
    };

    const toEntry = (entry: typeof legacy[number] | (typeof trait)[number]): TagAffinityEntry => ({
      tag: entry.tag,
      affinity: entry.affinity,
      count: entry.count,
      avgScore: entry.avgScore ?? 0,
      avgRank: 'avgRank' in entry ? entry.avgRank ?? 0 : 0,
      confidence: entry.confidence,
    });

    const merged = new Map<string, TagAffinityEntry>();
    for (const entry of legacy) {
      const normalized = toEntry(entry);
      merged.set(normalized.tag, normalized);
    }
    for (const entry of trait) {
      const normalized = toEntry(entry);
      const existing = merged.get(normalized.tag);
      if (!existing) {
        merged.set(normalized.tag, normalized);
      } else {
        merged.set(normalized.tag, {
          ...existing,
          affinity: Math.max(existing.affinity, normalized.affinity),
          confidence: Math.max(existing.confidence ?? 0, normalized.confidence ?? 0),
          count: Math.max(existing.count ?? 0, normalized.count ?? 0),
          avgScore: Math.max(existing.avgScore ?? 0, normalized.avgScore ?? 0),
          avgRank: Math.max(existing.avgRank ?? 0, normalized.avgRank ?? 0),
        });
      }
    }
    return Array.from(merged.values()).sort((a, b) => b.affinity - a.affinity);
  }, [tasteProfile?.tagAffinity, traitTagAffinity]);

  // Analyze favorites for recommendation boosting
  const favoritesProfile = useMemo<FavoritesProfile | null>(() => {
    if (!favorites) return null;
    const favList = activeType === 'ANIME' ? favorites.anime : favorites.manga;
    if (favList.length === 0) return null;
    return TasteAnalyzer.analyzeFavorites(favList, activeType);
  }, [favorites, activeType]);

  // Extract media IDs for filtering recommendations - include PTW to avoid recommending what's already queued
  // Note: user ratings via the in-app rate modal are NOT hard-filtered here; the ML model
  // naturally surfaces or suppresses them based on the rating signal (via prediction_residuals -> learned weights)
  const watchedIds = useMemo(() => {
    const watched = extractMediaIds(allEntries);
    const ptw = extractMediaIds(ptwEntries);
    ptw.forEach(id => watched.add(id));
    return watched;
  }, [allEntries, ptwEntries]);

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
      formats: selectedFormats,
      mode,
      minScore: adjustedMinScore,
      tagAffinity: effectiveTagAffinity,
      studioBias: tasteProfile?.studioBias || [],
      formatWeights: tasteProfile?.formatWeights || {},
      favoritesProfile: favoritesProfile ? {
        genreAffinity: favoritesProfile.genreAffinity,
        tagAffinity: favoritesProfile.tagAffinity,
        staffAffinity: favoritesProfile.staffAffinity,
        count: favoritesProfile.count
      } : undefined,
      anchorToFavorites,
      favoritesInfluence,
      explorationLevel, // Pass to backend for genre diversity
    };
  }, [selectedGenre, selectedFormats, activeFilter, minScore, explorationLevel, effectiveTagAffinity, tasteProfile?.studioBias, tasteProfile?.formatWeights, favoritesProfile, anchorToFavorites, favoritesInfluence]);

  const { data: recommendedMedia, isLoading: isLoadingRecs, refetch: refetchRecs, isRefetching } = useRecommendations(
    effectiveGenreAffinity,
    watchedIds,
    activeType,
    recOptions
  );

  const recMemo = useMemo(() => {
    if (!tasteProfile || !recommendedMedia) {
      return { processedRecommendations: [], predictionBatch: [] as Array<{anilistMediaId:number;predictedScore:number;features:Record<string,number>}> };
    }
    const genome = extractGenome(tasteProfile);
    const userScoreStats = {
      mean: tasteProfile.scorePatterns?.meanScore || 7,
      std: Math.sqrt(1 - (tasteProfile.scorePatterns?.consistency || 0.5)) * 2 + 0.5
    };
    const extendedMedia = recommendedMedia as ExtendedMedia[];
    const predictionBatch: Array<{anilistMediaId:number;predictedScore:number;features:Record<string,number>}> = [];
    const processedRecommendations = extendedMedia
      .map(media => {
        const coverImage = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || '';
        const mediaFeatures: MediaFeatures = {
          genres: media.genres || [],
          tags: (media.tags || []).map(t => ({ name: t.name, rank: t.rank })),
          popularity: media.popularity || 10000,
          meanScore: media.meanScore || 70,
          format: media.format || 'TV',
          seasonYear: media.seasonYear,
          studios: media.studios?.edges?.filter(e => e.isMain).map(e => e.node.name)
        };
        let prediction: EnjoymentPrediction | null = null;
        let features: Record<string, number> | null = null;
        try {
          const base = predictEnjoyment(genome, tasteProfile, mediaFeatures, userScoreStats);
          features = extractPredictionFeatures(base, userScoreStats);
          if (learnedWeights) {
            prediction = predictWithLearnedWeights(base, features, learnedWeights.weights, learnedWeights.bias, learnedWeights.featureNames, 0.6);
          } else {
            prediction = base;
          }
        } catch {
          // Prediction failed, continue without it
        }
        if (features && prediction) {
          predictionBatch.push({anilistMediaId: media.id, predictedScore: prediction.predictedScore, features});
        }
        return {
          id: media.id,
          title: getPreferredTitle(media.title),
          coverImage,
          genres: media.genres || [],
          tags: mediaFeatures.tags,
          format: media.format || '',
          score: media.meanScore || 0,
          popularity: media.popularity || 0,
          reason: media._matchReason || 'Matches your taste profile',
          reasons: media._reasons || [],
          matchScore: media._matchScore || 70,
          category: media._category || 'safe' as const,
          predictedScore: prediction?.predictedScore,
          probabilityOfLiking: prediction?.probabilityOfLiking,
          predictionConfidence: prediction?.confidenceLabel,
          predictionRisk: prediction?.riskLevel
        };
      })
      .filter(rec => rec.coverImage);
    return { processedRecommendations, predictionBatch };
  }, [tasteProfile, recommendedMedia, learnedWeights, getPreferredTitle]);

  const { processedRecommendations, predictionBatch } = recMemo;

  useEffect(() => {
    if (!effectiveUserId || predictionBatch.length === 0) return;
    const batchHash = `${effectiveUserId}-${activeType}-${predictionBatch.length}-${predictionBatch[0]?.anilistMediaId}`;
    if (loggedBatchRef.current === batchHash) return;
    loggedBatchRef.current = batchHash;
    fetch('/api/taste/log-batch', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({userId: effectiveUserId, mediaType: activeType, predictions: predictionBatch})
    }).catch(()=>{});
  }, [effectiveUserId, activeType, predictionBatch]);

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
        <p className="text-white font-medium mb-2">No {getSeriesTerm()} data found</p>
        <p className="text-gray-400 text-sm">{getWatchReadTerm(true)} some {getSeriesTerm()} to get personalized recommendations!</p>
      </div>
    );
  }

  if (!tasteProfile) return null;

  const topGenres = effectiveGenreAffinity.slice(0, 5);
  const topTags = effectiveTagAffinity.slice(0, 5);
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

      {/* Today rail: airing schedule + personalized news (anime only) */}
      {activeType === 'ANIME' && (
        <TodayRail
          userGenres={topGenres.map(g => g.genre)}
          watchingIds={currentlyWatchingIds}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Personalized Recommendations</h2>
          <p className="text-gray-400">Based on your {getSeriesTerm()} DNA and {allEntries.length} {activeType === 'ANIME' ? 'titles' : 'entries'} discovered</p>
        </div>
        <div className="flex gap-2 items-center">
          {modelStatus === 'user' && (
            <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">
              ML Active
            </span>
          )}
          <button 
            onClick={() => setShowModelSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 font-medium transition-colors"
          >
            <Settings className="w-4 h-4" />
            Model Settings
          </button>
          <button 
            onClick={() => refetchRecs()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
          >
            <Shuffle className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
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
            <p className="text-sm text-gray-400 mb-1">{getStudioAuthorTerm()}</p>
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
          {(showGenrePicker ? effectiveGenreAffinity : topGenres).map((g) => (
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

      {/* Format Picker */}
      {(tasteProfile.formatPreference.length > 0 || activeType === 'MANGA') && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-green-400" />
              Filter by Format
            </h4>
            <button
              onClick={() => setShowFormatPicker(!showFormatPicker)}
              className="text-xs text-green-400 hover:text-green-300"
            >
              {showFormatPicker ? 'Hide' : 'Show All'}
              <ChevronDown className={`w-3 h-3 inline ml-1 transition-transform ${showFormatPicker ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Show user's format preferences */}
            {(showFormatPicker ? tasteProfile.formatPreference : tasteProfile.formatPreference.slice(0, 5)).map((f: { format: string; preference: number }) => (
              <button
                key={f.format}
                onClick={() => {
                  if (selectedFormats.includes(f.format)) {
                    setSelectedFormats(selectedFormats.filter(fmt => fmt !== f.format));
                  } else {
                    setSelectedFormats([...selectedFormats, f.format]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  selectedFormats.includes(f.format)
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {f.format}
                <span className="text-xs opacity-60">({(f.preference * 100).toFixed(0)}%)</span>
              </button>
            ))}
            {/* Additional manga-specific formats when in manga mode */}
            {activeType === 'MANGA' && showFormatPicker && (
              <>
                {!tasteProfile.formatPreference.some((f: { format: string }) => f.format === 'NOVEL') && (
                  <button
                    onClick={() => {
                      if (selectedFormats.includes('NOVEL')) {
                        setSelectedFormats(selectedFormats.filter(fmt => fmt !== 'NOVEL'));
                      } else {
                        setSelectedFormats([...selectedFormats, 'NOVEL']);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                      selectedFormats.includes('NOVEL')
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-dashed border-white/20'
                    }`}
                  >
                    📖 Light Novel
                  </button>
                )}
                {!tasteProfile.formatPreference.some((f: { format: string }) => f.format === 'ONE_SHOT') && (
                  <button
                    onClick={() => {
                      if (selectedFormats.includes('ONE_SHOT')) {
                        setSelectedFormats(selectedFormats.filter(fmt => fmt !== 'ONE_SHOT'));
                      } else {
                        setSelectedFormats([...selectedFormats, 'ONE_SHOT']);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                      selectedFormats.includes('ONE_SHOT')
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-dashed border-white/20'
                    }`}
                  >
                    📄 One-Shot
                  </button>
                )}
              </>
            )}
          </div>
          {selectedFormats.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
              <Info className="w-4 h-4" />
              <span>Showing recommendations for <strong className="text-green-300">{selectedFormats.join(', ')}</strong></span>
            </div>
          )}
        </div>
      )}

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

      {/* Favorites Anchor Controls */}
      {favoritesProfile && favoritesProfile.count > 0 && (
        <div className="p-4 rounded-xl bg-linear-to-r from-yellow-500/10 via-purple-500/10 to-pink-500/10 border border-yellow-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Anchor to Favorites</span>
              <span className="text-xs text-gray-400">({favoritesProfile.count} favorites)</span>
            </div>
            <button
              onClick={() => setAnchorToFavorites(!anchorToFavorites)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                anchorToFavorites ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                anchorToFavorites ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
          
          {anchorToFavorites && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-gray-400">Influence:</span>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  value={favoritesInfluence}
                  onChange={(e) => setFavoritesInfluence(Number(e.target.value))}
                  className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <span className="text-sm font-medium text-yellow-400 w-10">{favoritesInfluence}%</span>
              </div>
              <p className="text-xs text-gray-400">
                {favoritesInfluence < 10 
                  ? 'Subtle nudge toward favorites taste' 
                  : favoritesInfluence > 20 
                    ? 'Strong preference for favorites-like content'
                    : 'Balanced favorites influence'}
              </p>
            </>
          )}
        </div>
      )}

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
        <GridSkeleton count={6} />
      ) : filteredRecs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecs.map((rec, index) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              activeType={activeType}
              userId={effectiveUserId}
              priority={index < 3}
              savedRating={userRatings[rec.id]}
              onRatingSaved={(score) => {
                // Optimistic update so the card can show new score immediately
                setUserRatings(prev => ({ ...prev, [rec.id]: score }));
                // Retrain per-user model so this rating actually shifts future predictions
                fetch(`/api/taste/learn?userId=${effectiveUserId}&mediaType=${activeType}`, { method: 'POST' })
                  .then(r => { if (!r.ok) throw new Error(`Learn API ${r.status}`); return r.json(); })
                  .then(d => {
                    if (d.trained && d.weights) {
                      setLearnedWeights({
                        weights: d.weights,
                        bias: d.bias,
                        featureNames: Object.keys(d.weights),
                        sampleCount: d.sampleCount,
                      });
                      setModelStatus('user');
                    }
                  })
                  .catch(() => {});
                // Refresh ratings from server in the background
                refreshUserRatings();
              }}
            />
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

      {/* Model Settings Modal */}
      {showModelSettings && (
        <ModelSettingsPanel
          settings={modelSettings}
          updateSettings={updateModelSettings}
          resetSettings={resetModelSettings}
          onClose={() => setShowModelSettings(false)}
        />
      )}
    </div>
  );
}
