'use client';

import { useState, useMemo } from 'react';
import { useAnimeList } from '@/hooks/use-anilist';
import { TasteAnalyzer } from '@/lib/taste-analyzer';
import { 
  Brain, 
  Sparkles, 
  Target,
  Flame,
  Clock,
  Eye,
  Zap,
  Heart,
  Skull,
  Trophy,
  Star,
  TrendingUp,
  Share2
} from 'lucide-react';

interface PersonalityTestProps {
  userId?: number;
}

interface PersonalityType {
  name: string;
  emoji: string;
  description: string;
  traits: string[];
  color: string;
  icon: typeof Brain;
}

const PERSONALITY_TYPES: Record<string, PersonalityType> = {
  completionist: {
    name: "The Completionist",
    emoji: "🏆",
    description: "You finish what you start. Dropping an anime is simply not in your vocabulary.",
    traits: ["Dedicated", "Patient", "Thorough", "Committed"],
    color: "from-green-500 to-emerald-600",
    icon: Trophy
  },
  seasonalTourist: {
    name: "The Seasonal Tourist",
    emoji: "🌸",
    description: "You ride the waves of each anime season, always watching what's hot and trending.",
    traits: ["Trendy", "Social", "Up-to-date", "Community-driven"],
    color: "from-pink-500 to-rose-600",
    icon: Clock
  },
  cultHunter: {
    name: "The Cult Hunter",
    emoji: "🔮",
    description: "You seek hidden gems and classics that others overlook. Underground is your domain.",
    traits: ["Adventurous", "Independent", "Analytical", "Curious"],
    color: "from-purple-500 to-violet-600",
    icon: Eye
  },
  artSnob: {
    name: "The Art Snob",
    emoji: "🎨",
    description: "Visual excellence is your priority. Bad animation is an instant deal-breaker.",
    traits: ["Aesthetic", "Critical", "Refined", "Visual-oriented"],
    color: "from-blue-500 to-cyan-600",
    icon: Sparkles
  },
  emotionalMasochist: {
    name: "The Emotional Masochist",
    emoji: "💔",
    description: "You seek the shows that will destroy you emotionally. Pain is entertainment.",
    traits: ["Empathetic", "Intense", "Deep", "Emotional"],
    color: "from-red-500 to-orange-600",
    icon: Heart
  },
  nostalgiaAddict: {
    name: "The Nostalgia Addict",
    emoji: "🕰️",
    description: "You believe they don't make them like they used to. Your heart belongs to the classics of yesteryear.",
    traits: ["Sentimental", "Classic-focused", "Critical", "Loyal"],
    color: "from-amber-700 to-orange-800",
    icon: Clock
  },
  mainstreamMaxxer: {
    name: "The Mainstream Maxxer",
    emoji: "🚀",
    description: "If everyone is talking about it, you're watching it. You love the blockbusters and cultural phenomena.",
    traits: ["Social", "Mainstream", "Enthusiastic", "Connected"],
    color: "from-blue-400 to-indigo-600",
    icon: TrendingUp
  },
  chaosAgent: {
    name: "The Chaos Agent",
    emoji: "⚡",
    description: "Your taste is unpredictable and wild. You embrace the weird and wonderful.",
    traits: ["Unpredictable", "Open-minded", "Eclectic", "Bold"],
    color: "from-yellow-500 to-amber-600",
    icon: Zap
  }
};

export function PersonalityTest({ userId }: PersonalityTestProps) {
  const { data: animeList, isLoading, error } = useAnimeList(userId || 0);
  const [showDetails, setShowDetails] = useState(false);

  // Only include watched entries (exclude Planning, Paused, Dropped)
  const allEntries = useMemo(() => {
    if (!animeList?.lists) return [];
    const validStatuses = ['COMPLETED', 'CURRENT', 'REPEATING'];
    return animeList.lists
      .flatMap(list => list.entries)
      .filter(entry => validStatuses.includes(entry.status || ''));
  }, [animeList]);

  const analysis = useMemo(() => {
    if (allEntries.length === 0) return null;
    const tasteProfile = TasteAnalyzer.analyzeTaste(allEntries);
    
    // Determine primary personality type based on highest trait
    const traits = tasteProfile.personalityTraits;
    const traitScores = [
      { type: 'completionist', score: traits.completionist },
      { type: 'seasonalTourist', score: traits.seasonalTourist },
      { type: 'cultHunter', score: traits.cultHunter },
      { type: 'nostalgiaAddict', score: traits.nostalgiaAddict },
      { type: 'mainstreamMaxxer', score: traits.mainstreamMaxxer },
      { type: 'artSnob', score: traits.artSnob },
      { type: 'emotionalMasochist', score: traits.emotionalDamageIndex },
      { type: 'chaosAgent', score: traits.chaosLevel },
    ];
    
    const sortedTraits = traitScores.sort((a, b) => b.score - a.score);
    const primaryType = sortedTraits[0].type;
    const secondaryType = sortedTraits[1].type;
    
    return {
      tasteProfile,
      primaryType,
      secondaryType,
      traitScores: sortedTraits,
      totalAnime: allEntries.length
    };
  }, [allEntries]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-400">Analyzing your anime personality...</p>
      </div>
    );
  }

  if (error || !animeList) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
          <Skull className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-white font-medium mb-2">Failed to analyze personality</p>
        <p className="text-gray-400 text-sm">Please try refreshing the page</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-purple-400" />
        </div>
        <p className="text-white font-medium mb-2">Not enough data</p>
        <p className="text-gray-400 text-sm">Watch more anime to discover your personality!</p>
      </div>
    );
  }

  const primaryPersonality = PERSONALITY_TYPES[analysis.primaryType];
  const secondaryPersonality = PERSONALITY_TYPES[analysis.secondaryType];
  const PrimaryIcon = primaryPersonality.icon;

  return (
    <div className="space-y-8">
      {/* Hero Personality Card */}
      <div className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${primaryPersonality.color} p-8 md:p-12`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm font-medium mb-2">Your Anime Personality</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {primaryPersonality.emoji} {primaryPersonality.name}
              </h1>
              <p className="text-white/80 text-lg max-w-xl">
                {primaryPersonality.description}
              </p>
            </div>
            <div className="hidden md:flex w-20 h-20 rounded-2xl bg-white/20 items-center justify-center">
              <PrimaryIcon className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {primaryPersonality.traits.map((trait, i) => (
              <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
                {trait}
              </span>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              <Share2 className="w-5 h-5" />
              Share Result
            </button>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
            >
              <TrendingUp className="w-5 h-5" />
              {showDetails ? 'Hide Details' : 'View Full Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Type */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Secondary Personality</h3>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${secondaryPersonality.color} flex items-center justify-center`}>
            <secondaryPersonality.icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">{secondaryPersonality.emoji} {secondaryPersonality.name}</p>
            <p className="text-gray-400 text-sm">{secondaryPersonality.description}</p>
          </div>
        </div>
      </div>

      {/* Trait Breakdown */}
      {showDetails && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Trait Breakdown</h3>
          <div className="grid gap-4">
            {analysis.traitScores.map((trait) => {
              const personality = PERSONALITY_TYPES[trait.type];
              const TraitIcon = personality.icon;
              return (
                <div key={trait.type} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${personality.color} flex items-center justify-center`}>
                      <TraitIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white font-medium">{personality.name}</p>
                        <p className="text-white font-bold">{trait.score.toFixed(1)}</p>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-linear-to-r ${personality.color} rounded-full transition-all duration-500`}
                          style={{ width: `${trait.score * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fun Stats */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Fun Facts About You</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                <Target className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-white font-medium">Completion Rate</p>
                  <p className="text-gray-400 text-sm">
                    {(analysis.tasteProfile.behavioralMetrics.completionRate * 100).toFixed(0)}% of anime finished
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                <Flame className="w-6 h-6 text-orange-400" />
                <div>
                  <p className="text-white font-medium">Emotional Damage</p>
                  <p className="text-gray-400 text-sm">
                    {analysis.tasteProfile.personalityTraits.emotionalDamageIndex > 7 
                      ? "You love suffering" 
                      : analysis.tasteProfile.personalityTraits.emotionalDamageIndex > 4
                      ? "Moderate pain tolerance"
                      : "Prefers happy endings"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                <Star className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-white font-medium">Rating Style</p>
                  <p className="text-gray-400 text-sm">
                    {analysis.tasteProfile.scorePatterns.meanScore > 7.5 
                      ? "Generous rater" 
                      : analysis.tasteProfile.scorePatterns.meanScore > 6
                      ? "Fair critic"
                      : "Harsh judge"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                <Zap className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-white font-medium">Chaos Level</p>
                  <p className="text-gray-400 text-sm">
                    {analysis.tasteProfile.personalityTraits.chaosLevel > 7 
                      ? "Pure chaos energy" 
                      : analysis.tasteProfile.personalityTraits.chaosLevel > 4
                      ? "Balanced variety"
                      : "Structured taste"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Based on Stats */}
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">
          Based on analysis of {analysis.totalAnime} anime in your list
        </p>
      </div>
    </div>
  );
}
