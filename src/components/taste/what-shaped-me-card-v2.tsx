import { useState } from 'react';
import { History, ChevronDown, ChevronUp, Sparkles, Brain, Heart, User } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { calculateWhatShapedMeV2, getShapingModeDescription, formatShapingExplanation } from '@/lib/what-shaped-me-v2';
import { useExplainabilityDrawer } from './explainability-drawer';
import type { MediaListEntry } from '@/types/anilist';

interface WhatShapedMeCardV2Props {
  entries: MediaListEntry[];
  type: 'ANIME' | 'MANGA';
}

export function WhatShapedMeCardV2({ entries, type }: WhatShapedMeCardV2Props) {
  const [showAll, setShowAll] = useState(false);
  const [mode, setMode] = useState<'profile' | 'preference' | 'identity'>('profile');
  const { openDrawer, DrawerComponent } = useExplainabilityDrawer();
  
  // Calculate what shaped me using the new system
  const impacts = calculateWhatShapedMeV2(entries, mode, 10);
  
  // Match impacts with entry data for images
  const impactsWithData = impacts.map(impact => {
    const entry = entries.find(e => e.media?.id === impact.mediaId);
    return {
      ...impact,
      entry,
      coverImage: entry?.media?.coverImage?.large || entry?.media?.coverImage?.medium
    };
  });

  const displayImpacts = showAll ? impactsWithData : impactsWithData.slice(0, 5);

  const getModeIcon = (mode: 'profile' | 'preference' | 'identity') => {
    switch (mode) {
      case 'profile': return <Brain className="w-4 h-4" />;
      case 'preference': return <Heart className="w-4 h-4" />;
      case 'identity': return <User className="w-4 h-4" />;
    }
  };

  const getModeColor = (mode: 'profile' | 'preference' | 'identity') => {
    switch (mode) {
      case 'profile': return 'text-blue-400';
      case 'preference': return 'text-pink-400';
      case 'identity': return 'text-purple-400';
    }
  };

  if (impacts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">What Shaped You</h3>
        </div>
        <div className="text-center py-8 text-gray-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No shaping data available</p>
          <p className="text-sm mt-1">Complete more {type.toLowerCase()} to see your influences</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-white/10 p-6">
        {/* Header with mode selector */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">What Shaped You</h3>
          </div>
          <div className="text-xs text-gray-500">
            {impacts.length} influential {type.toLowerCase()}
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-800/50 rounded-lg">
          {(['profile', 'preference', 'identity'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {getModeIcon(m)}
              <span className="capitalize">{m}</span>
            </button>
          ))}
        </div>

        {/* Mode description */}
        <div className="mb-4 p-3 bg-gray-800/30 rounded-lg">
          <p className="text-sm text-gray-300">{getShapingModeDescription(mode)}</p>
        </div>

        {/* Shaping impacts */}
        <div className="space-y-3">
          {displayImpacts.map((impact, index) => (
            <div
              key={impact.mediaId || index}
              className="flex items-center gap-4 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors cursor-pointer"
              onClick={() => openDrawer({
                title: impact.title || 'Unknown',
                description: formatShapingExplanation(impact),
                topContributors: [{
                  title: impact.title || 'Unknown',
                  mediaId: impact.mediaId,
                  contribution: impact.score,
                  shareOfTrait: impact.score,
                  rawContribution: impact.score,
                  tagsUsed: []
                }]
              })}
            >
              {/* Cover image */}
              {impact.coverImage ? (
                <div className="relative w-12 h-16 flex-shrink-0">
                  <OptimizedImage
                    src={impact.coverImage}
                    alt={impact.title}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ) : (
                <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">
                  <History className="w-5 h-5 text-gray-500" />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-white truncate">
                    {impact.title}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${getModeColor(mode)} bg-gray-700/50`}>
                    {Math.round(impact.score * 100)}%
                  </span>
                </div>
                
                {/* Component breakdown */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  {impact.components.ablationImpact > 0.1 && (
                    <span className="text-blue-300">
                      Impact: {Math.round(impact.components.ablationImpact * 100)}%
                    </span>
                  )}
                  {impact.components.preferenceLift > 0.3 && (
                    <span className="text-pink-300">
                      Love: {Math.round(impact.components.preferenceLift * 100)}%
                    </span>
                  )}
                  {impact.components.coreAlignment > 0.3 && (
                    <span className="text-purple-300">
                      Core: {Math.round(impact.components.coreAlignment * 100)}%
                    </span>
                  )}
                  {impact.components.rewatchBoost > 1.1 && (
                    <span className="text-green-300">
                      Rewatch: {Math.round((impact.components.rewatchBoost - 1) * 100)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Rank */}
              <div className="text-right">
                <div className="text-lg font-bold text-white">#{index + 1}</div>
                <div className="text-xs text-gray-400 capitalize">{mode}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more/less */}
        {impacts.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {impacts.length - 5} more
              </>
            )}
          </button>
        )}

        {/* Footer note */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              This uses counterfactual analysis to measure how much each {type.toLowerCase()} 
              shaped your unique taste profile. Try different modes to see various perspectives!
            </p>
          </div>
        </div>
      </div>

      {DrawerComponent}
    </>
  );
}
