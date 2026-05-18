'use client';

import { useState } from 'react';
import { User, Sparkles, Layers, Zap, HelpCircle, ChevronRight } from 'lucide-react';
import type { TraitScore, TraitProfile } from '@/lib/trait-scoring-engine';
import { useExplainabilityDrawer } from './explainability-drawer';

interface TraitStackProps {
  traitProfile: TraitProfile;
  onTraitClick?: (trait: TraitScore) => void;
}

const CHANNEL_CONFIG = {
  identity: {
    label: 'Core DNA',
    description: 'Who you are as a viewer',
    icon: User,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-500/20',
  },
  vibe: {
    label: 'Mood Modifiers',
    description: 'The feelings you seek',
    icon: Sparkles,
    gradient: 'from-cyan-500 to-blue-500',
    bgGradient: 'from-cyan-500/10 to-blue-500/10',
    borderColor: 'border-cyan-500/20',
  },
  structure: {
    label: 'Mechanics',
    description: 'How stories should be told',
    icon: Layers,
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-500/10 to-emerald-500/10',
    borderColor: 'border-green-500/20',
  },
  intensity: {
    label: 'Red Lines',
    description: 'Your intensity preferences',
    icon: Zap,
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-500/10 to-red-500/10',
    borderColor: 'border-orange-500/20',
  },
};

type ChannelKey = keyof typeof CHANNEL_CONFIG;

export function TraitStack({ traitProfile, onTraitClick }: TraitStackProps) {
  const [expandedChannel, setExpandedChannel] = useState<ChannelKey | null>(null);
  const { openForTrait, DrawerComponent } = useExplainabilityDrawer();

  const handleTraitClick = (trait: TraitScore) => {
    if (onTraitClick) {
      onTraitClick(trait);
    } else {
      openForTrait(trait);
    }
  };

  const channels = ['identity', 'vibe', 'structure', 'intensity'] as const;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Trait Stack</h3>
        <p className="text-xs text-gray-500">Tap any trait for details</p>
      </div>

      {channels.map((channelKey) => {
        const config = CHANNEL_CONFIG[channelKey];
        const traits = traitProfile.channels[channelKey]
          .filter(t => t.normalizedScore > 20)
          .sort((a, b) => b.normalizedScore - a.normalizedScore)
          .slice(0, 5);

        if (traits.length === 0) return null;

        const Icon = config.icon;
        const isExpanded = expandedChannel === channelKey;

        return (
          <div
            key={channelKey}
            className={`rounded-xl bg-linear-to-br ${config.bgGradient} border ${config.borderColor} overflow-hidden transition-all duration-300`}
          >
            {/* Channel Header */}
            <button
              onClick={() => setExpandedChannel(isExpanded ? null : channelKey)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-linear-to-br ${config.gradient}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">{config.label}</p>
                  <p className="text-xs text-gray-400">{config.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {traits.slice(0, 3).map((trait, i) => (
                    <div
                      key={trait.traitId}
                      className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900"
                      title={trait.name}
                    >
                      {trait.normalizedScore}
                    </div>
                  ))}
                </div>
                <ChevronRight 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} 
                />
              </div>
            </button>

            {/* Expanded Traits */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {traits.map((trait) => (
                  <button
                    key={trait.traitId}
                    onClick={() => handleTraitClick(trait)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-white truncate">{trait.name}</span>
                      {trait.affinityDelta !== undefined && trait.affinityDelta > 15 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          ♥ loves
                        </span>
                      )}
                      {trait.affinityDelta !== undefined && trait.affinityDelta < -15 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                          tolerates
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-linear-to-r ${config.gradient} rounded-full`}
                          style={{ width: `${trait.normalizedScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-white w-8 text-right">
                        {trait.normalizedScore}
                      </span>
                      <HelpCircle className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <DrawerComponent />
    </div>
  );
}

/**
 * Generate a one-sentence taste summary from trait profile
 * Example: "You like character-driven psychological stories, prefer cozy vibes, and secretly crave tension spikes."
 */
export function generateTasteSummary(traitProfile: TraitProfile): string {
  const getTopTrait = (channel: TraitScore[]): TraitScore | undefined => {
    return channel
      .filter(t => t.normalizedScore > 30)
      .sort((a, b) => b.normalizedScore - a.normalizedScore)[0];
  };

  const topIdentity = getTopTrait(traitProfile.channels.identity);
  const topVibe = getTopTrait(traitProfile.channels.vibe);
  const topStructure = getTopTrait(traitProfile.channels.structure);
  const topIntensity = getTopTrait(traitProfile.channels.intensity);

  const parts: string[] = [];

  // Identity part
  if (topIdentity) {
    parts.push(`You're drawn to ${topIdentity.name.toLowerCase()} content`);
  }

  // Vibe part
  if (topVibe) {
    parts.push(`prefer ${topVibe.name.toLowerCase()} vibes`);
  }

  // Structure or Intensity part (pick the more interesting one)
  if (topIntensity && topIntensity.normalizedScore > 50) {
    parts.push(`and have a high tolerance for ${topIntensity.name.toLowerCase()}`);
  } else if (topStructure) {
    parts.push(`and enjoy ${topStructure.name.toLowerCase()} storytelling`);
  }

  if (parts.length === 0) {
    return "Your taste profile is still developing. Watch more to see your patterns emerge!";
  }

  // Join with proper grammar
  if (parts.length === 1) {
    return parts[0] + '.';
  } else if (parts.length === 2) {
    return parts[0] + ' and ' + parts[1] + '.';
  } else {
    return parts[0] + ', ' + parts[1] + ', ' + parts[2] + '.';
  }
}

/**
 * One-sentence taste summary component
 */
export function TasteSummary({ traitProfile }: { traitProfile: TraitProfile }) {
  const summary = generateTasteSummary(traitProfile);

  return (
    <div className="p-4 rounded-xl bg-linear-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-white/10">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Your Taste in One Sentence</p>
      <p className="text-white font-medium">{summary}</p>
    </div>
  );
}
