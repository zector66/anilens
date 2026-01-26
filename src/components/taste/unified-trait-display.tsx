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
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useTaste, TasteResult } from '@/lib/taste';
import { UltimateTraitExplainabilityDrawer } from './ultimate-trait-explainability-drawer';

// Helper function to get polarity label and color
function getPolarityInfo(trait: any, activeProfile: 'preference' | 'exposure' | 'signature') {
  // For preference profile, classify based on preference score
  if (activeProfile === 'preference' && trait.preferenceScore !== undefined) {
    if (trait.preferenceScore > 0.6) {
      return { label: 'Loved', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    } else if (trait.preferenceScore < 0.3) {
      return { label: 'Tolerated', color: 'text-orange-400', bgColor: 'bg-orange-500/20' };
    }
  }
  
  // For signature profile, classify based on uniqueness
  if (activeProfile === 'signature' && trait.rarity !== undefined) {
    if (trait.rarity < 0.2) {
      return { label: 'Unique', color: 'text-purple-400', bgColor: 'bg-purple-500/20' };
    } else if (trait.rarity < 0.4) {
      return { label: 'Rare', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' };
    }
  }
  
  // For exposure profile or neutral preference, show as neutral
  return { label: 'Present', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
}

// Channel configuration
const CHANNEL_CONFIG = {
  core: {
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-500/20',
    label: 'Core Identity'
  },
  modifier: {
    icon: Heart,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-500/20',
    label: 'Preference Modifiers'
  },
  warning: {
    icon: Shield,
    color: 'from-yellow-500 to-orange-600',
    bgColor: 'bg-yellow-500/20',
    label: 'Content Warnings'
  },
  intensity: {
    icon: Flame,
    color: 'from-red-500 to-orange-600',
    bgColor: 'bg-red-500/20',
    label: 'Intensity Indicators'
  }
};

interface UnifiedTraitDisplayProps {
  userId?: number;
  mediaType?: 'ANIME' | 'MANGA';
  initialView?: 'preference' | 'exposure' | 'signature';
}

export function UnifiedTraitDisplay({ 
  userId = 0, 
  mediaType = 'ANIME',
  initialView = 'preference' 
}: UnifiedTraitDisplayProps) {
  const [activeProfile, setActiveProfile] = useState<'preference' | 'exposure' | 'signature'>(initialView);
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set(['core']));
  const [selectedTrait, setSelectedTrait] = useState<any>(null);
  const [showExplainability, setShowExplainability] = useState(false);

  // THE ONE AND ONLY taste hook
  const { taste, loading, error, topTraits, traitSummary, confidence, sampleSize, warnings } = useTaste({
    userId,
    mediaType,
    includeViews: true,
    includeLegacy: false // We don't need legacy anymore
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-gray-400">Analyzing taste...</span>
      </div>
    );
  }

  if (error || !taste) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-400">Failed to load taste analysis</p>
        <p className="text-gray-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  // Get the current view data
  const currentView = taste.views[activeProfile];
  const traitsByChannel = currentView.topTraits.reduce((acc, trait) => {
    if (!acc[trait.channel]) acc[trait.channel] = [];
    acc[trait.channel].push(trait);
    return acc;
  }, {} as Record<string, typeof currentView.topTraits>);

  const toggleChannel = (channel: string) => {
    const newExpanded = new Set(expandedChannels);
    if (newExpanded.has(channel)) {
      newExpanded.delete(channel);
    } else {
      newExpanded.add(channel);
    }
    setExpandedChannels(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Profile Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-white">Taste Analysis</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">{sampleSize || 0} titles</span>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-gray-300">{confidence ? `${Math.round(confidence * 100)}%` : 'Low'} confidence</span>
          </div>
        </div>
        
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-lg">
          <button
            onClick={() => setActiveProfile('preference')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeProfile === 'preference' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Preference
          </button>
          <button
            onClick={() => setActiveProfile('exposure')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeProfile === 'exposure' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Exposure
          </button>
          <button
            onClick={() => setActiveProfile('signature')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeProfile === 'signature' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Signature
          </button>
        </div>
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <Info className="w-5 h-5 text-yellow-400" />
          <div className="flex-1">
            <p className="text-yellow-400 text-sm font-medium">Analysis Notes</p>
            <p className="text-yellow-200/70 text-xs mt-1">{warnings.join(', ')}</p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="p-4 bg-linear-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-white/10">
        <p className="text-white font-medium">{traitSummary || 'Analyzing your taste patterns...'}</p>
      </div>

      {/* Traits by Channel */}
      <div className="space-y-4">
        {Object.entries(CHANNEL_CONFIG).map(([channel, config]) => {
          const channelTraits = traitsByChannel[channel] || [];
          if (channelTraits.length === 0) return null;

          const isExpanded = expandedChannels.has(channel);
          const Icon = config.icon;

          return (
            <div key={channel} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleChannel(channel)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-5 h-5 ${config.color.split(' ')[0]}`} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">{config.label}</h4>
                    <p className="text-gray-400 text-sm">{channelTraits.length} traits</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {channelTraits.map((trait, index) => {
                    const polarity = getPolarityInfo(trait, activeProfile);
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer group"
                        onClick={() => {
                          setSelectedTrait(trait);
                          setShowExplainability(true);
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${polarity.bgColor} ${polarity.color}`}>
                            {polarity.label}
                          </div>
                          <span className="text-white font-medium">{trait.trait}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-white">
                              {activeProfile === 'preference' ? 'Preference' : 
                               activeProfile === 'exposure' ? 'Exposure' : 'Uniqueness'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {activeProfile === 'signature' ? `${Math.round((1 - trait.rarity) * 100)}% unique` :
                               `${Math.round(trait.score * 100)}%`}
                            </div>
                          </div>
                          
                          {trait.populationPercentile && (
                            <div className="text-right">
                              <div className="text-xs text-gray-400">Population</div>
                              <div className="text-sm font-medium text-blue-400">
                                {trait.populationPercentile < 50 ? 'Bottom' : 'Top'} {Math.min(99, 100 - trait.populationPercentile)}%
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* What Shaped Me */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">What Shaped You</h3>
        </div>
        
        <div className="space-y-3">
          {taste.shapedBy.topShapers.slice(0, 5).map((shaper, index) => (
            <div key={shaper.mediaId} className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{shaper.mediaTitle}</span>
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{shaper.explanation}</p>
                  
                  {/* Top shaped traits */}
                  <div className="flex flex-wrap gap-1">
                    {shaper.shapedTraits.slice(0, 3).map(trait => (
                      <span 
                        key={trait.trait}
                        className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300"
                      >
                        {trait.trait}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-400">Influence</div>
                  <div className="text-lg font-bold text-orange-400">
                    {Math.round(shaper.impactScore * 100)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Shaping Axes */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {Object.entries({
            identity: { icon: Brain, label: 'Identity', color: 'text-purple-400' },
            emotional: { icon: Heart, label: 'Emotional', color: 'text-pink-400' },
            cerebral: { icon: Target, label: 'Cerebral', color: 'text-blue-400' },
            edge: { icon: AlertTriangle, label: 'Edge', color: 'text-red-400' }
          }).map(([axis, config]) => {
            const titles = taste.shapedBy.shapingAxes[axis as keyof typeof taste.shapedBy.shapingAxes];
            if (titles.length === 0) return null;
            
            const Icon = config.icon;
            return (
              <div key={axis} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="text-sm font-medium text-white">{config.label}</span>
                </div>
                <div className="text-xs text-gray-300">
                  {titles[0]?.mediaTitle}
                  {titles.length > 1 && ` +${titles.length - 1}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explainability Drawer */}
      {showExplainability && (
        <UltimateTraitExplainabilityDrawer
          trait={selectedTrait}
          onClose={() => setShowExplainability(false)}
        />
      )}
    </div>
  );
}
