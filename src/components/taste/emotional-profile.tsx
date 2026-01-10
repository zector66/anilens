'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAnimeList, useMangaList, useFavorites } from '@/hooks/use-anilist';
import { useMedia } from '@/contexts/media-context';
import { EmotionalAnalyzer, EmotionalProfile as EmotionalProfileType, PrimaryEmotion } from '@/lib/emotional-analyzer';
import { normalizeMediaList } from '@/lib/normalize-media-list';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Heart,
  Smile,
  Shield,
  AlertTriangle,
  Sparkles,
  Frown,
  ThumbsDown,
  ThumbsUp,
  Flame,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Eye,
  Star,
  Blend,
  MessageSquare,
  Check,
} from 'lucide-react';

// Emotion icons and colors
const EMOTION_CONFIG: Record<PrimaryEmotion, { icon: typeof Heart; color: string; bgColor: string }> = {
  joy: { icon: Smile, color: '#fbbf24', bgColor: 'bg-yellow-500/20' },
  trust: { icon: Shield, color: '#34d399', bgColor: 'bg-emerald-500/20' },
  fear: { icon: AlertTriangle, color: '#a78bfa', bgColor: 'bg-violet-500/20' },
  surprise: { icon: Sparkles, color: '#60a5fa', bgColor: 'bg-blue-500/20' },
  sadness: { icon: Frown, color: '#94a3b8', bgColor: 'bg-slate-500/20' },
  disgust: { icon: ThumbsDown, color: '#f472b6', bgColor: 'bg-pink-500/20' },
  anger: { icon: Flame, color: '#f87171', bgColor: 'bg-red-500/20' },
  anticipation: { icon: Zap, color: '#fb923c', bgColor: 'bg-orange-500/20' },
};

const MODE_ICONS = {
  consumption: Eye,
  love: Heart,
  blend: Blend,
};

interface EmotionalProfileProps {
  userId?: number;
}

// Feedback types
type EmotionFeedback = 'accurate' | 'too_high' | 'too_low' | null;
type OverallFeedback = 'accurate' | 'somewhat' | 'inaccurate' | null;

interface FeedbackState {
  emotions: Partial<Record<PrimaryEmotion, EmotionFeedback>>;
  overall: OverallFeedback;
  submittedAt?: string;
}

const FEEDBACK_STORAGE_KEY = 'anilens_emotional_feedback';

function loadFeedback(userId: number, mediaType: string): FeedbackState {
  if (typeof window === 'undefined') return { emotions: {}, overall: null };
  try {
    const stored = localStorage.getItem(`${FEEDBACK_STORAGE_KEY}_${userId}_${mediaType}`);
    return stored ? JSON.parse(stored) : { emotions: {}, overall: null };
  } catch {
    return { emotions: {}, overall: null };
  }
}

function saveFeedback(userId: number, mediaType: string, feedback: FeedbackState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `${FEEDBACK_STORAGE_KEY}_${userId}_${mediaType}`,
      JSON.stringify({ ...feedback, submittedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage full or unavailable
  }
}

export function EmotionalProfile({ userId }: EmotionalProfileProps) {
  const { user } = useAuth();
  const { activeType } = useMedia();
  const [mode, setMode] = useState<'consumption' | 'love' | 'blend'>('blend');
  const [blendRatio, setBlendRatio] = useState(0.6);
  const [expandedEmotion, setExpandedEmotion] = useState<PrimaryEmotion | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const effectiveUserId = userId || user?.id || 0;
  const { data: animeList, isLoading: isLoadingAnime } = useAnimeList(effectiveUserId);
  const { data: mangaList, isLoading: isLoadingManga } = useMangaList(effectiveUserId);
  const { data: favorites } = useFavorites(effectiveUserId);

  const isLoading = activeType === 'ANIME' ? isLoadingAnime : isLoadingManga;
  const currentList = activeType === 'ANIME' ? animeList : mangaList;

  // Normalize entries
  const entries = useMemo(() => normalizeMediaList(currentList), [currentList]);

  // Get favorite IDs
  const favoriteIds = useMemo(() => {
    if (!favorites) return new Set<number>();
    const favList = activeType === 'ANIME' ? favorites.anime : favorites.manga;
    return new Set(favList.map(m => m.id));
  }, [favorites, activeType]);

  // Analyze emotional profile
  const profile = useMemo<EmotionalProfileType | null>(() => {
    if (entries.length === 0) return null;
    return EmotionalAnalyzer.analyze(entries, { mode, blendRatio, favoriteIds });
  }, [entries, mode, blendRatio, favoriteIds]);

  // Feedback state - initialize from localStorage
  const [feedback, setFeedback] = useState<FeedbackState>(() => 
    loadFeedback(effectiveUserId, activeType)
  );

  // Reset feedback when user or media type changes
  useEffect(() => {
    const stored = loadFeedback(effectiveUserId, activeType);
    setFeedback(stored);
    setFeedbackSubmitted(!!stored.submittedAt);
  }, [effectiveUserId, activeType]);

  // Handle emotion feedback
  const handleEmotionFeedback = useCallback((emotion: PrimaryEmotion, value: EmotionFeedback) => {
    setFeedback(prev => {
      const updated = {
        ...prev,
        emotions: { ...prev.emotions, [emotion]: value }
      };
      saveFeedback(effectiveUserId, activeType, updated);
      return updated;
    });
  }, [effectiveUserId, activeType]);

  // Handle overall feedback
  const handleOverallFeedback = useCallback((value: OverallFeedback) => {
    setFeedback(prev => {
      const updated = { ...prev, overall: value };
      saveFeedback(effectiveUserId, activeType, updated);
      setFeedbackSubmitted(true);
      return updated;
    });
  }, [effectiveUserId, activeType]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (!profile) return [];
    return profile.emotions.map(e => ({
      emotion: e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1),
      value: Math.round(e.score * 100),
      fullMark: 100,
    }));
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-400">Analyzing emotional patterns...</p>
      </div>
    );
  }

  if (!profile || entries.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
        <p className="text-gray-400">
          We need some {activeType === 'ANIME' ? 'anime' : 'manga'} entries to analyze your emotional preferences.
        </p>
      </div>
    );
  }

  const dominantConfig = EMOTION_CONFIG[profile.dominant];
  const DominantIcon = dominantConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Emotional Profile</h2>
          <p className="text-gray-400 text-sm">
            The emotions you tend to seek in {activeType === 'ANIME' ? 'anime' : 'manga'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          {(['consumption', 'love', 'blend'] as const).map((m) => {
            const Icon = MODE_ICONS[m];
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline capitalize">{m}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Blend Ratio Slider (only for blend mode) */}
      {mode === 'blend' && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Consumption</span>
            <span className="text-sm text-gray-400">Love</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={blendRatio * 100}
            onChange={(e) => setBlendRatio(parseInt(e.target.value) / 100)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <p className="text-center text-xs text-gray-500 mt-2">
            {Math.round((1 - blendRatio) * 100)}% what you watch • {Math.round(blendRatio * 100)}% what you love
          </p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Emotion Wheel</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis 
                  dataKey="emotion" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                />
                <Radar
                  name="Emotional Profile"
                  dataKey="value"
                  stroke="#a855f7"
                  fill="#a855f7"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dominant Emotions */}
        <div className="space-y-4">
          {/* Dominant Card */}
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              backgroundColor: `${dominantConfig.color}10`,
              borderColor: `${dominantConfig.color}30`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${dominantConfig.color}20` }}
              >
                <DominantIcon className="w-6 h-6" style={{ color: dominantConfig.color }} />
              </div>
              <div>
                <p className="text-sm text-gray-400">You primarily seek</p>
                <h3 className="text-xl font-bold text-white">
                  {profile.emotions[0].label}
                </h3>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              {getEmotionDescription(profile.dominant)}
            </p>
          </div>

          {/* Secondary Emotion */}
          {profile.secondary !== profile.dominant && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">With undertones of</p>
              <div className="flex items-center gap-2">
                {(() => {
                  const SecondaryIcon = EMOTION_CONFIG[profile.secondary].icon;
                  return (
                    <SecondaryIcon 
                      className="w-5 h-5" 
                      style={{ color: EMOTION_CONFIG[profile.secondary].color }} 
                    />
                  );
                })()}
                <span className="text-white font-medium">
                  {profile.emotions[1]?.label || profile.secondary}
                </span>
              </div>
            </div>
          )}

          {/* Top Dyad */}
          {profile.dyads[0] && profile.dyads[0].score > 0.3 && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <p className="text-sm text-gray-400 mb-1">Your emotional blend</p>
              <h4 className="text-lg font-semibold text-white mb-1">
                {profile.dyads[0].name}
              </h4>
              <p className="text-sm text-gray-300">
                {profile.dyads[0].description}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Diversity</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(profile.diversity * 100)}%
              </p>
              <p className="text-xs text-gray-500">
                {profile.diversity > 0.7 ? 'Wide range' : profile.diversity > 0.4 ? 'Balanced' : 'Focused'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Confidence</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(profile.confidence * 100)}%
              </p>
              <p className="text-xs text-gray-500">
                Based on {profile.entriesAnalyzed} entries
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emotion Breakdown */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Breakdown</h3>
        <div className="space-y-3">
          {profile.emotions.map((emotion) => {
            const config = EMOTION_CONFIG[emotion.emotion];
            const Icon = config.icon;
            const isExpanded = expandedEmotion === emotion.emotion;

            return (
              <div key={emotion.emotion}>
                <button
                  onClick={() => setExpandedEmotion(isExpanded ? null : emotion.emotion)}
                  className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white">{emotion.label}</span>
                        <span className="text-sm text-gray-400">
                          {Math.round(emotion.score * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${emotion.score * 100}%`,
                            backgroundColor: config.color,
                          }}
                        />
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-2 ml-14 p-4 rounded-xl bg-black/20 border border-white/5">
                    {emotion.topTags.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <Info className="w-3 h-3" /> Top contributing tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {emotion.topTags.map(({ tag }) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs rounded-md bg-white/10 text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {emotion.topTitles.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <Star className="w-3 h-3" /> Top contributing titles
                        </p>
                        <div className="space-y-1">
                          {emotion.topTitles.map(({ title }) => (
                            <p key={title} className="text-sm text-gray-300 truncate">
                              {title}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Per-emotion feedback */}
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Does this feel accurate?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEmotionFeedback(emotion.emotion, 'too_low'); }}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            feedback.emotions[emotion.emotion] === 'too_low'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <ChevronDown className="w-3 h-3" /> Too Low
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEmotionFeedback(emotion.emotion, 'accurate'); }}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            feedback.emotions[emotion.emotion] === 'accurate'
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" /> Accurate
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEmotionFeedback(emotion.emotion, 'too_high'); }}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            feedback.emotions[emotion.emotion] === 'too_high'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <ChevronUp className="w-3 h-3" /> Too High
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Feedback Panel */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Does this profile feel accurate?
            </h3>
            <p className="text-sm text-gray-400">
              Your feedback helps us improve the emotional analysis
            </p>
          </div>
          
          {feedbackSubmitted && feedback.overall ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm">Thanks for your feedback!</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleOverallFeedback('accurate')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  feedback.overall === 'accurate'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Accurate
              </button>
              <button
                onClick={() => handleOverallFeedback('somewhat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  feedback.overall === 'somewhat'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                Somewhat
              </button>
              <button
                onClick={() => handleOverallFeedback('inaccurate')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  feedback.overall === 'inaccurate'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                Not Really
              </button>
            </div>
          )}
        </div>

        {/* Show feedback summary if user has provided per-emotion feedback */}
        {Object.keys(feedback.emotions).length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 mb-2">Your emotion feedback:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(feedback.emotions).map(([emotion, value]) => (
                <span 
                  key={emotion}
                  className={`px-2 py-1 text-xs rounded-md ${
                    value === 'accurate' ? 'bg-green-500/20 text-green-300' :
                    value === 'too_high' ? 'bg-orange-500/20 text-orange-300' :
                    value === 'too_low' ? 'bg-orange-500/20 text-orange-300' :
                    'bg-white/10 text-gray-400'
                  }`}
                >
                  {emotion}: {value === 'accurate' ? '✓' : value === 'too_high' ? '↑' : '↓'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <p className="text-sm text-blue-300">
          <Info className="w-4 h-4 inline mr-2" />
          This profile represents the emotional experiences you tend to enjoy in {activeType === 'ANIME' ? 'anime' : 'manga'}, 
          based on the tags and genres of titles you&apos;ve engaged with. It&apos;s not a psychological assessment.
        </p>
      </div>
    </div>
  );
}

function getEmotionDescription(emotion: PrimaryEmotion): string {
  const descriptions: Record<PrimaryEmotion, string> = {
    joy: 'You gravitate toward stories that uplift, comfort, and make you feel good. Comedy, slice of life, and feel-good narratives resonate with you.',
    trust: 'You value stories about connection, loyalty, and belonging. Romance, found family, and friendship-driven narratives speak to you.',
    fear: 'You enjoy the thrill of tension and suspense. Horror, psychological, and survival stories give you the adrenaline rush you seek.',
    surprise: 'You love being caught off guard. Mysteries, plot twists, and unconventional narratives keep you engaged.',
    sadness: 'You seek catharsis and emotional depth. Tragedy, drama, and bittersweet stories help you process and feel deeply.',
    disgust: 'You appreciate darker, grittier content that challenges comfort zones. You don\'t shy away from morally complex or disturbing themes.',
    anger: 'You enjoy intensity and conflict. Action, revenge, and competitive stories fuel your engagement.',
    anticipation: 'You love the excitement of what\'s coming next. Adventure, sports, and hype-driven narratives keep you on the edge of your seat.',
  };
  return descriptions[emotion];
}
