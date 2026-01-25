'use client';

import { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Sparkles, AlertCircle } from 'lucide-react';
import type { TraitScore } from '@/lib/trait-scoring-engine';
import { getRarityLabel, getRarityColor, formatFrequency } from '@/lib/trait-distinctiveness';

interface TraitExplainabilityDrawerProps {
  trait: TraitScore | null;
  onClose: () => void;
}

/**
 * Calculate Gini coefficient for contribution distribution
 * Measures inequality: 0 = perfectly equal, 1 = one item has everything
 */
function calculateGini(contributions: number[]): number {
  if (contributions.length === 0) return 0;
  
  const sorted = [...contributions].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  
  if (sum === 0) return 0;
  
  let gini = 0;
  for (let i = 0; i < n; i++) {
    gini += (2 * (i + 1) - n - 1) * sorted[i];
  }
  
  return gini / (n * sum);
}

/**
 * Determine contribution pattern based on Gini coefficient
 */
function getContributionPattern(gini: number): {
  label: 'spike-driven' | 'background-high';
  description: string;
  color: string;
} {
  if (gini > 0.6) {
    return {
      label: 'spike-driven',
      description: 'A few shows dominate this trait',
      color: 'text-orange-400',
    };
  }
  return {
    label: 'background-high',
    description: 'Evenly distributed across your library',
    color: 'text-blue-400',
  };
}

/**
 * Get affinity insight icon and color
 */
function getAffinityDisplay(delta: number | undefined): {
  icon: typeof TrendingUp;
  color: string;
  label: string;
} {
  if (delta === undefined) {
    return {
      icon: Minus,
      color: 'text-gray-400',
      label: 'No rating data',
    };
  }
  
  if (delta > 20) {
    return {
      icon: TrendingUp,
      color: 'text-green-400',
      label: 'You LOVE this',
    };
  }
  
  if (delta > 10) {
    return {
      icon: TrendingUp,
      color: 'text-emerald-400',
      label: 'Strong preference',
    };
  }
  
  if (delta < -20) {
    return {
      icon: TrendingDown,
      color: 'text-red-400',
      label: 'You tolerate this',
    };
  }
  
  if (delta < -10) {
    return {
      icon: TrendingDown,
      color: 'text-orange-400',
      label: 'Guilty pleasure?',
    };
  }
  
  return {
    icon: Minus,
    color: 'text-gray-400',
    label: 'Neutral',
  };
}

export function TraitExplainabilityDrawer({ trait, onClose }: TraitExplainabilityDrawerProps) {
  // Scroll to top when drawer opens
  useEffect(() => {
    if (trait) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [trait]);

  if (!trait) return null;

  const contributors = trait.topContributors || [];
  const contributions = contributors.map(c => c.rawContribution);
  const gini = calculateGini(contributions);
  const pattern = getContributionPattern(gini);
  const affinityDisplay = getAffinityDisplay(trait.affinityDelta);
  const AffinityIcon = affinityDisplay.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-white/10 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{trait.name}</h2>
                {trait.rarity && (
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRarityColor(trait.rarity)} bg-white/5`}>
                    {getRarityLabel(trait.rarity)}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm capitalize">{trait.category} • {trait.channel}</p>
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
          {/* Scores Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-gray-400 text-xs mb-1">Strength</p>
              <p className="text-white text-2xl font-bold">{trait.normalizedScore}</p>
            </div>
            
            {trait.signatureScore !== undefined && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-purple-300 text-xs mb-1">Signature</p>
                <p className="text-white text-2xl font-bold">{Math.round(trait.signatureScore)}</p>
              </div>
            )}
            
            {trait.exposureScore !== undefined && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-300 text-xs mb-1">Exposure</p>
                <p className="text-white text-2xl font-bold">{trait.exposureScore}</p>
              </div>
            )}
            
            {trait.enjoymentScore !== undefined && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-green-300 text-xs mb-1">Enjoyment</p>
                <p className="text-white text-2xl font-bold">{trait.enjoymentScore}</p>
              </div>
            )}
          </div>

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
                  <>You rate {trait.name} content <strong className="text-red-400">{Math.round(trait.affinityDelta)}%</strong> lower than your average. You watch it but don't rate it highly.</>
                )}
              </p>
            </div>
          )}

          {/* Distinctiveness */}
          {trait.globalFrequency !== undefined && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
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

          {/* Contribution Pattern */}
          {contributors.length > 0 && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className={`w-5 h-5 ${pattern.color}`} />
                <div>
                  <h3 className="text-white font-semibold capitalize">{pattern.label.replace('-', ' ')}</h3>
                  <p className="text-gray-400 text-xs">{pattern.description}</p>
                </div>
              </div>
              
              {pattern.label === 'spike-driven' && (
                <p className="text-gray-400 text-sm">
                  Top {Math.min(2, contributors.length)} shows contribute <strong className="text-orange-300">
                    {Math.round((contributors.slice(0, 2).reduce((sum, c) => sum + (c.shareOfTrait || 0), 0)) * 100)}%
                  </strong> of this trait's score.
                </p>
              )}
            </div>
          )}

          {/* Top Contributing Shows */}
          {contributors.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">Top Contributing Shows</h3>
              <div className="space-y-3">
                {contributors.slice(0, 5).map((contributor, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-white font-medium">{contributor.title || 'Unknown Title'}</p>
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
                {trait.contributingTags.slice(0, 20).map((tag, i) => (
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

          {/* Confidence */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold">Confidence</h3>
              <span className="text-gray-400 text-sm">{Math.round(trait.confidence * 100)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                style={{ width: `${trait.confidence * 100}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Based on sample size and consistency across your library
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
