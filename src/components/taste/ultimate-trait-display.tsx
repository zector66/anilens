'use client';

import { useState } from 'react';
import { 
  Brain, 
  Heart, 
  Shield, 
  Flame,
  Sparkles,
  Users,
  Target,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import type { TraitProfile, TraitScore } from '@/lib/trait-scoring-engine';
import type { PercentileResult } from '@/lib/trait-percentiles';
import type { UltimateAccuracyProfileV2 } from '@/lib/ultimate-accuracy-v2';
import { UltimateTraitExplainabilityDrawer } from './ultimate-trait-explainability-drawer';
import { getRarityColor, getRarityLabel } from '@/lib/trait-distinctiveness';

// Helper function to get rarity color for percentile rarity tiers
function getPercentileRarityColor(rarity: string): string {
  switch (rarity) {
    case 'uncommon': return 'text-blue-400';
    case 'notable': return 'text-purple-400';
    case 'rare': return 'text-purple-400';
    case 'exceptional': return 'text-pink-400';
    default: return 'text-gray-400';
  }
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

interface UltimateTraitDisplayProps {
  profile: TraitProfile;
  percentiles?: PercentileResult[];
  accuracyProfile?: UltimateAccuracyProfileV2;
  showUltimateAccuracy?: boolean;
}

// Hover tooltip component
function TraitTooltip({ trait, percentile, children }: { 
  trait: TraitScore; 
  percentile?: PercentileResult | null; 
  children: React.ReactNode 
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-10 w-64 p-3 bg-gray-900 border border-white/10 rounded-lg shadow-xl -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-medium">{trait.name}</span>
            {trait.rarity && (
              <span className={`px-2 py-0.5 rounded text-xs ${getRarityColor(trait.rarity)} bg-white/10`}>
                {getRarityLabel(trait.rarity)}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-xs mb-2">{trait.category} • {trait.channel}</p>
          {trait.description && (
            <p className="text-gray-300 text-xs">{trait.description}</p>
          )}
          {percentile && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-blue-300 text-xs">
                {percentile.description}
              </p>
            </div>
          )}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UltimateTraitDisplay({ 
  profile, 
  percentiles = [],
  accuracyProfile,
  showUltimateAccuracy = false 
}: UltimateTraitDisplayProps) {
  const [selectedTrait, setSelectedTrait] = useState<TraitScore | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('signature');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const getTraitPercentile = (traitId: string): PercentileResult | null => {
    return percentiles.find(p => p.traitId === traitId) || null;
  };

  const getTraitWithPercentile = (trait: TraitScore) => {
    const percentile = getTraitPercentile(trait.traitId);
    return { trait, percentile };
  };

  return (
    <div className="space-y-6">
      {/* Ultimate Accuracy Header */}
      {showUltimateAccuracy && accuracyProfile && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-semibold">Ultimate Accuracy Analysis</h3>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Overall Confidence</p>
              <p className="text-white font-bold">{Math.round(accuracyProfile.confidence.overall * 100)}%</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Sample Size</p>
              <p className="text-white font-bold">{accuracyProfile.confidence.sampleSize}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Rating Signal</p>
              <p className="text-white font-bold">{Math.round(accuracyProfile.confidence.ratingSignalStrength * 100)}%</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Coverage</p>
              <p className="text-white font-bold">{Math.round(accuracyProfile.confidence.coverageCompleteness * 100)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Signature Traits Section */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <button
          onClick={() => toggleSection('signature')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Signature Traits</h3>
            <span className="text-gray-400 text-sm">What makes you unique</span>
          </div>
          {expandedSection === 'signature' ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSection === 'signature' && (
          <div className="p-4 space-y-2">
            {profile.topSignatureTraits.slice(0, 8).map((trait) => {
              const { trait: traitData, percentile } = getTraitWithPercentile(trait);
              return (
                <TraitTooltip key={traitData.traitId} trait={traitData} percentile={percentile}>
                  <div 
                    className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedTrait(traitData);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{traitData.name}</span>
                        {percentile && percentile.percentile >= 75 && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs">
                            {percentile.percentile}th percentile
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-purple-400 font-bold text-sm">
                            {Math.round(traitData.signatureScore || 0)}
                          </div>
                          <div className="text-gray-500 text-[10px]">signature</div>
                        </div>
                        <Info className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-500 text-[10px]">Your Strength</span>
                          <span className="text-white text-xs font-medium">{traitData.normalizedScore}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            style={{ width: `${Math.min(traitData.normalizedScore, 100)}%` }}
                          />
                        </div>
                      </div>
                      {percentile && (
                        <div className="w-16 text-right">
                          <div className="text-gray-500 text-[10px]">Population</div>
                          <div className="text-blue-400 text-xs font-bold">{percentile.percentile}%</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Affinity indicator */}
                    {traitData.affinityDelta !== undefined && Math.abs(traitData.affinityDelta) > 15 && (
                      <div className="mt-2 flex items-center gap-1">
                        <TrendingUp className={`w-3 h-3 ${traitData.affinityDelta > 0 ? 'text-green-400' : 'text-red-400'}`} />
                        <span className={`text-xs ${traitData.affinityDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {traitData.affinityDelta > 0 ? '+' : ''}{Math.round(traitData.affinityDelta)}% vs average
                        </span>
                      </div>
                    )}
                  </div>
                </TraitTooltip>
              );
            })}
          </div>
        )}
      </div>

      {/* Channel Breakdown */}
      {Object.entries(profile.channels).map(([channel, traits]) => {
        const ChannelIcon = CHANNEL_ICONS[channel as keyof typeof CHANNEL_ICONS];
        const channelColor = CHANNEL_COLORS[channel as keyof typeof CHANNEL_COLORS];
        
        return (
          <div key={channel} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection(channel)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChannelIcon className="w-5 h-5 text-white" />
                <h3 className="text-white font-semibold capitalize">{channel}</h3>
                <span className="text-gray-400 text-sm">{traits.length} traits</span>
              </div>
              {expandedSection === channel ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === channel && (
              <div className="p-4 space-y-2">
                {traits.slice(0, 6).map((trait: TraitScore) => {
                  const { trait: traitData, percentile } = getTraitWithPercentile(trait);
                  return (
                    <TraitTooltip key={traitData.traitId} trait={traitData} percentile={percentile}>
                      <div 
                        className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedTrait(traitData);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{traitData.name}</span>
                            {percentile && percentile.rarity !== 'common' && (
                              <span className={`px-2 py-0.5 rounded text-xs ${getPercentileRarityColor(percentile.rarity)} bg-white/10`}>
                                {percentile.rarity}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-bold">{traitData.normalizedScore}</span>
                            <Info className="w-4 h-4 text-gray-500" />
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-linear-to-r ${channelColor} rounded-full`}
                              style={{ width: `${Math.min(traitData.normalizedScore, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </TraitTooltip>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Population Context Summary */}
      {percentiles.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Population Context</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-500 text-xs">Exceptional Traits</p>
              <p className="text-white font-bold">
                {percentiles.filter(p => p.percentile >= 90).length}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Rare Traits</p>
              <p className="text-white font-bold">
                {percentiles.filter(p => p.percentile >= 75).length}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Average Percentile</p>
              <p className="text-white font-bold">
                {Math.round(percentiles.reduce((sum, p) => sum + p.percentile, 0) / percentiles.length)}%
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Most Unique</p>
              <p className="text-white font-bold text-sm">
                {percentiles.reduce((max, p) => p.percentile > max.percentile ? p : max)?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ultimate Trait Explainability Drawer */}
      <UltimateTraitExplainabilityDrawer 
        trait={selectedTrait}
        percentile={selectedTrait ? getTraitPercentile(selectedTrait.traitId) : null}
        accuracyProfile={accuracyProfile}
        onClose={() => setSelectedTrait(null)}
      />
    </div>
  );
}
