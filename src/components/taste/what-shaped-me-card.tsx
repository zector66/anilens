'use client';

import { useState } from 'react';
import { History, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { calculateWhatShapedMe, type MediaImpact } from '@/lib/what-shaped-me';
import { useExplainabilityDrawer } from './explainability-drawer';
import type { TraitProfile } from '@/lib/trait-scoring-engine';
import type { MediaListEntry } from '@/types/anilist';

interface WhatShapedMeCardProps {
  traitProfile: TraitProfile;
  entries: MediaListEntry[];
  type: 'ANIME' | 'MANGA';
}

export function WhatShapedMeCard({ traitProfile, entries, type }: WhatShapedMeCardProps) {
  const [showAll, setShowAll] = useState(false);
  const { openDrawer, DrawerComponent } = useExplainabilityDrawer();
  
  // Calculate what shaped me
  const impacts = calculateWhatShapedMe(traitProfile, 10);
  
  // Match impacts with entry data for images
  const impactsWithData = impacts.map(impact => {
    const entry = entries.find(e => e.media?.id === impact.mediaId);
    return {
      ...impact,
      coverImage: entry?.media?.coverImage?.large,
      format: entry?.media?.format,
    };
  });
  
  const displayCount = showAll ? 10 : 5;
  
  if (impacts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">What Shaped You</h3>
        </div>
        <div className="text-center py-8 text-gray-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Not enough data to identify influential titles</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">What Shaped You</h3>
          </div>
          <div className="text-xs text-gray-500">
            {impacts.length} influential {type.toLowerCase()}
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mb-4">
          These titles had the biggest impact on your taste profile, weighted by trait importance and rarity.
        </p>
        
        <div className="space-y-3">
          {impactsWithData.slice(0, displayCount).map((impact, i) => (
            <button
              key={impact.mediaId || i}
              onClick={() => {
                openDrawer({
                  title: impact.title || 'Unknown',
                  description: impact.summary,
                  topContributors: impact.topTraits.map(t => ({
                    title: impact.title,
                    mediaId: impact.mediaId,
                    contribution: t.rawContribution,
                    rawContribution: t.rawContribution,
                    shareOfTrait: t.shareOfTrait,
                    tagsUsed: [],
                  })),
                });
              }}
              className="w-full flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              {/* Rank Badge */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                impact.impactLevel === 'defining' ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white' :
                impact.impactLevel === 'very_high' ? 'bg-purple-500/30 text-purple-300' :
                impact.impactLevel === 'high' ? 'bg-cyan-500/30 text-cyan-300' :
                'bg-white/10 text-gray-400'
              }`}>
                {i + 1}
              </div>
              
              {/* Cover Image */}
              <div className="w-12 h-16 rounded-md overflow-hidden shrink-0 bg-white/10">
                {impact.coverImage && (
                  <OptimizedImage
                    src={impact.coverImage}
                    alt={impact.title || 'Unknown'}
                    width={48}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-medium text-white truncate">{impact.title || 'Unknown'}</h5>
                
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-xs text-cyan-400 font-medium">
                    {impact.summary}
                  </div>
                  {impact.impactLevel === 'defining' && (
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  )}
                </div>
                
                {/* Top Shaped Traits */}
                {impact.topTraits.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {impact.topTraits.slice(0, 3).map((trait) => (
                      <span 
                        key={trait.traitId}
                        className="text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded"
                      >
                        {trait.traitName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Impact Level Badge */}
              <div className="shrink-0">
                <div className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                  impact.impactLevel === 'defining' ? 'bg-yellow-500/20 text-yellow-400' :
                  impact.impactLevel === 'very_high' ? 'bg-purple-500/20 text-purple-300' :
                  impact.impactLevel === 'high' ? 'bg-cyan-500/20 text-cyan-300' :
                  impact.impactLevel === 'notable' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-white/10 text-gray-400'
                }`}>
                  {impact.impactLevel === 'defining' ? 'Defining' :
                   impact.impactLevel === 'very_high' ? 'Very High' :
                   impact.impactLevel === 'high' ? 'High' :
                   impact.impactLevel === 'notable' ? 'Notable' :
                   'Moderate'}
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {impacts.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            {showAll ? (
              <><ChevronUp className="w-4 h-4" /> Show Less</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> Show All {impacts.length}</>
            )}
          </button>
        )}
      </div>
      
      <DrawerComponent />
    </>
  );
}
