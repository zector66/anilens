'use client';

import { useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sparkles, 
  AlertCircle, 
  Users, 
  Target,
  Brain,
  Heart,
  Shield,
  Flame,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import type { TraitScore } from '@/lib/trait-scoring-engine';
import type { PercentileResult } from '@/lib/trait-percentiles';
import type { UltimateAccuracyProfileV2 } from '@/lib/ultimate-accuracy-v2';
import { getRarityLabel, getRarityColor, formatFrequency } from '@/lib/trait-distinctiveness';

interface UltimateTraitExplainabilityDrawerProps {
  trait: TraitScore | null;
  percentile?: PercentileResult | null;
  accuracyProfile?: UltimateAccuracyProfileV2 | null;
  onClose: () => void;
}

const CHANNEL_ICONS = {
  identity: Brain,
  vibe: Heart,
  structure: Shield,
  intensity: Flame,
};

const CHANNEL_COLORS = {
  identity: 'from-purple-500 to-indigo-500',
  vibe: 'from-pink-500 to-rose-500',
  structure: 'from-blue-500 to-cyan-500',
  intensity: 'from-orange-500 to-red-500',
};

/**
 * Get confidence level display
 */
function getConfidenceLevel(confidence: number): {
  level: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  color: string;
  icon: typeof CheckCircle;
  label: string;
  description: string;
} {
  if (confidence >= 0.9) {
    return {
      level: 'very-high',
      color: 'text-green-400',
      icon: CheckCircle,
      label: 'Very High Confidence',
      description: 'Strong signal with large sample size'
    };
  }
  if (confidence >= 0.7) {
    return {
      level: 'high',
      color: 'text-emerald-400',
      icon: CheckCircle,
      label: 'High Confidence',
      description: 'Good signal with moderate sample size'
    };
  }
  if (confidence >= 0.5) {
    return {
      level: 'medium',
      color: 'text-yellow-400',
      icon: AlertTriangle,
      label: 'Medium Confidence',
      description: 'Moderate signal, interpret with caution'
    };
  }
  if (confidence >= 0.3) {
    return {
      level: 'low',
      color: 'text-orange-400',
      icon: AlertTriangle,
      label: 'Low Confidence',
      description: 'Weak signal, may not be reliable'
    };
  }
  return {
    level: 'very-low',
    color: 'text-red-400',
    icon: AlertTriangle,
    label: 'Very Low Confidence',
    description: 'Very weak signal, interpret carefully'
  };
}

/**
 * Get affinity insight icon and color
 */
function getAffinityDisplay(delta: number | undefined): {
  icon: typeof TrendingUp;
  color: string;
  label: string;
  intensity: 'strong' | 'moderate' | 'weak' | 'neutral';
} {
  if (delta === undefined) {
    return {
      icon: Minus,
      color: 'text-gray-400',
      label: 'No rating data',
      intensity: 'neutral'
    };
  }
  
  if (delta > 20) {
    return {
      icon: TrendingUp,
      color: 'text-green-400',
      label: 'You LOVE this',
      intensity: 'strong'
    };
  }
  
  if (delta > 10) {
    return {
      icon: TrendingUp,
      color: 'text-emerald-400',
      label: 'Strong preference',
      intensity: 'moderate'
    };
  }
  
  if (delta < -20) {
    return {
      icon: TrendingDown,
      color: 'text-red-400',
      label: 'You tolerate this',
      intensity: 'strong'
    };
  }
  
  if (delta < -10) {
    return {
      icon: TrendingDown,
      color: 'text-orange-400',
      label: 'Guilty pleasure?',
      intensity: 'moderate'
    };
  }
  
  return {
    icon: Minus,
    color: 'text-gray-400',
    label: 'Neutral',
    intensity: 'weak'
  };
}

export function UltimateTraitExplainabilityDrawer({ 
  trait, 
  percentile,
  accuracyProfile,
  onClose 
}: UltimateTraitExplainabilityDrawerProps) {
  // Lock body scroll when drawer opens
  useEffect(() => {
    if (trait) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [trait]);

  if (!trait) return null;

  const contributors = trait.topContributors || [];
  const affinityDisplay = getAffinityDisplay(trait.affinityDelta);
  const AffinityIcon = affinityDisplay.icon;
  const ChannelIcon = CHANNEL_ICONS[trait.channel as keyof typeof CHANNEL_ICONS] || Brain;
  const confidenceLevel = getConfidenceLevel(trait.confidence || 0.5);
  const ConfidenceIcon = confidenceLevel.icon;

  // Get population context
  const populationContext = percentile ? {
    percentile: percentile.percentile,
    rarity: percentile.rarity,
    description: percentile.description
  } : null;

  // Get accuracy context
  const accuracyContext = accuracyProfile ? {
    overallConfidence: accuracyProfile.confidence.overall,
    sampleSize: accuracyProfile.confidence.sampleSize,
    ratingSignalStrength: accuracyProfile.confidence.ratingSignalStrength,
    coverageCompleteness: accuracyProfile.confidence.coverageCompleteness,
    traitDiversity: accuracyProfile.confidence.traitDiversity,
    dataQuality: accuracyProfile.dataQuality
  } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center h-dvh touch-none">
      {/* Backdrop - prevents touch events passing through to page */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-3xl max-h-[85dvh] bg-linear-to-br from-gray-900 to-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`sticky top-0 z-10 bg-linear-to-r ${CHANNEL_COLORS[trait.channel as keyof typeof CHANNEL_COLORS] || 'from-purple-500/10 to-blue-500/10'} border-b border-white/10 p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <ChannelIcon className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">{trait.name}</h2>
                {trait.rarity && (
                  <span className={`px-3 py-1 rounded-md text-xs font-medium ${getRarityColor(trait.rarity)} bg-white/10`}>
                    {getRarityLabel(trait.rarity)}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm capitalize">{trait.category} • {trait.channel}</p>
              {trait.description && (
                <p className="text-gray-300 text-sm mt-2">{trait.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
          {/* SPECIAL: Warning Trait Explainer for Intensity Channel */}
          {trait.channel === 'intensity' && (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <h3 className="text-orange-300 font-semibold">Content Warning Trait</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-orange-200">
                  <strong>Important:</strong> This trait shows <em>content presence</em>, not preference.
                </p>
                <p className="text-gray-400">
                  A high score here means you&apos;ve watched shows containing &quot;{trait.name}&quot; content. 
                  It does NOT mean you seek it out or prefer it.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-black/20">
                  <p className="text-gray-500 text-xs mb-2">Why you&apos;re seeing this:</p>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>• <strong>{contributors.length || trait.contributingTags?.length || 0} titles</strong> in your list triggered this trait</li>
                    <li>• These shows had tags like: {trait.contributingTags?.slice(0, 3).join(', ') || 'various content tags'}</li>
                    <li>• This is exposure data, not a preference signal</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Ultimate Accuracy Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* For warning traits, show different metrics */}
            {trait.channel === 'intensity' ? (
              <>
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-orange-300 text-xs mb-1">Titles with Content</p>
                  <p className="text-white text-2xl font-bold">
                    {contributors.length || trait.contributingTags?.length || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-gray-400 text-xs mb-1">Exposure Level</p>
                  <p className="text-white text-2xl font-bold">{Math.round(trait.rawScore || 0)}</p>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs mb-1">Your Score</p>
                <p className="text-white text-2xl font-bold">{trait.normalizedScore}</p>
              </div>
            )}
            
            {trait.signatureScore !== undefined && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-purple-300 text-xs mb-1">Signature</p>
                <p className="text-white text-2xl font-bold">{Math.round(trait.signatureScore)}</p>
              </div>
            )}
            
            {populationContext && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-300 text-xs mb-1">Population</p>
                <p className="text-white text-2xl font-bold">{populationContext.percentile}%</p>
              </div>
            )}
            
            <div className={`p-4 rounded-xl bg-white/5 border border-white/10`}>
              <p className={`${confidenceLevel.color} text-xs mb-1`}>Confidence</p>
              <p className="text-white text-2xl font-bold">{Math.round((trait.confidence || 0.5) * 100)}%</p>
            </div>
          </div>

          {/* Population Context */}
          {populationContext && (
            <div className="p-4 rounded-xl bg-linear-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Population Context</h3>
              </div>
              <p className="text-gray-400 text-sm mb-2">
                Your score is <strong className="text-blue-300">{populationContext.description}</strong>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs">Percentile Rank</p>
                  <p className="text-white font-bold">{populationContext.percentile}th</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Rarity Tier</p>
                  <p className="text-white font-bold capitalize">{populationContext.rarity}</p>
                </div>
              </div>
              {populationContext.percentile >= 75 && (
                <p className="text-blue-300 text-xs mt-2">
                  ✨ This trait makes your taste unique!
                </p>
              )}
            </div>
          )}

          {/* Affinity Insight */}
          {trait.affinityDelta !== undefined && (
            <div className={`p-4 rounded-xl bg-white/5 border border-white/10`}>
              <div className="flex items-center gap-3 mb-2">
                <AffinityIcon className={`w-5 h-5 ${affinityDisplay.color}`} />
                <h3 className="text-white font-semibold">{affinityDisplay.label}</h3>
              </div>
              <p className="text-gray-400 text-sm">
                {trait.affinityDelta > 10 && (
                  <>You rate {trait.name} content <strong className="text-green-400">+{Math.round(trait.affinityDelta)}%</strong> higher than your average. You genuinely love this trait!</>
                )}
                {trait.affinityDelta >= -10 && trait.affinityDelta <= 10 && (
                  <>Your ratings for {trait.name} content align with your overall average. Neutral preference.</>
                )}
                {trait.affinityDelta < -10 && (
                  <>You rate {trait.name} content <strong className="text-red-400">{Math.round(trait.affinityDelta)}%</strong> lower than your average. You watch it but don&apos;t rate it highly.</>
                )}
              </p>
              {affinityDisplay.intensity === 'strong' && (
                <p className="text-gray-500 text-xs mt-2">
                  This is a strong preference signal that significantly influences your recommendations.
                </p>
              )}
            </div>
          )}

          {/* Ultimate Accuracy Confidence */}
          {accuracyContext && (
            <div className="p-4 rounded-xl bg-linear-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Ultimate Accuracy Analysis</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div>
                  <p className="text-gray-500 text-xs">Sample Size</p>
                  <p className="text-white font-bold">{accuracyContext.sampleSize}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Rating Signal</p>
                  <p className="text-white font-bold">{Math.round(accuracyContext.ratingSignalStrength * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Coverage</p>
                  <p className="text-white font-bold">{Math.round(accuracyContext.coverageCompleteness * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Diversity</p>
                  <p className="text-white font-bold">{Math.round(accuracyContext.traitDiversity * 100)}%</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <ConfidenceIcon className={`w-4 h-4 ${confidenceLevel.color}`} />
                <span className={`text-sm font-medium ${confidenceLevel.color}`}>
                  {confidenceLevel.label}
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {confidenceLevel.description}
              </p>
            </div>
          )}

          {/* Distinctiveness */}
          {trait.globalFrequency !== undefined && (
            <div className="p-4 rounded-xl bg-linear-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Distinctiveness</h3>
              </div>
              <p className="text-gray-400 text-sm mb-2">
                This trait appears in <strong className="text-purple-300">{formatFrequency(trait.globalFrequency)}</strong>
              </p>
              {trait.globalFrequency < 0.2 && (
                <p className="text-purple-300 text-xs">
                  ✨ This is a rare trait that makes your taste unique!
                </p>
              )}
            </div>
          )}

          {/* Top Contributing Shows */}
          {contributors.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">Top Contributing Shows</h3>
              <div className="space-y-3">
                {contributors.slice(0, 8).map((contributor, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {contributor.mediaId ? (
                          <a 
                            href={`https://anilist.co/anime/${contributor.mediaId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white font-medium hover:text-purple-300 transition-colors cursor-pointer"
                          >
                            {contributor.title || 'Unknown Title'}
                          </a>
                        ) : (
                          <p className="text-white font-medium">{contributor.title || 'Unknown Title'}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          Contributes {Math.round((contributor.shareOfTrait || 0) * 100)}% of this trait
                        </p>
                      </div>
                      <span className="text-purple-400 font-bold text-sm">
                        +{Math.round(contributor.rawContribution)}
                      </span>
                    </div>
                    
                    {contributor.tagsUsed && contributor.tagsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {contributor.tagsUsed.slice(0, 5).map((tag, j) => (
                          <span 
                            key={j}
                            className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contributing Tags */}
          {trait.contributingTags && trait.contributingTags.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">
                Contributing Tags ({trait.contributingTags.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {trait.contributingTags.slice(0, 25).map((tag, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gray-400" />
              <h3 className="text-white font-semibold">Technical Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Trait ID</p>
                <p className="text-white font-mono text-xs">{trait.traitId}</p>
              </div>
              <div>
                <p className="text-gray-500">Channel</p>
                <p className="text-white capitalize">{trait.channel}</p>
              </div>
              <div>
                <p className="text-gray-500">Category</p>
                <p className="text-white capitalize">{trait.category}</p>
              </div>
              <div>
                <p className="text-gray-500">Raw Score</p>
                <p className="text-white">{trait.rawScore?.toFixed(2) || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
