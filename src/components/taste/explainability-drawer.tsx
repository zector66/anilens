'use client';

import { useState } from 'react';
import { X, HelpCircle, Film, Tag, AlertTriangle } from 'lucide-react';
import type { TraitScore, TraitContributor } from '@/lib/trait-scoring-engine';

interface ExplainabilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  score?: number;
  confidence?: number;
  topContributors?: TraitContributor[];
  contributingTags?: string[];
  exposureScore?: number;
  enjoymentScore?: number;
  affinityDelta?: number;
  description?: string;
  warnings?: string[];
}

export function ExplainabilityDrawer({
  isOpen,
  onClose,
  title,
  score,
  confidence,
  topContributors,
  contributingTags,
  exposureScore,
  enjoymentScore,
  affinityDelta,
  description,
  warnings,
}: ExplainabilityDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Why &ldquo;{title}&rdquo;?</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Score & Confidence */}
          {(score !== undefined || confidence !== undefined) && (
            <div className="flex gap-4">
              {score !== undefined && (
                <div className="flex-1 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-purple-400 uppercase tracking-wide">Score</p>
                  <p className="text-2xl font-bold text-white">{score}</p>
                </div>
              )}
              {confidence !== undefined && (
                <div className="flex-1 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-blue-400 uppercase tracking-wide">Confidence</p>
                  <p className="text-2xl font-bold text-white">{(confidence * 100).toFixed(0)}%</p>
                </div>
              )}
            </div>
          )}
          
          {/* Exposure vs Enjoyment */}
          {exposureScore !== undefined && enjoymentScore !== undefined && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-green-500/10 border border-white/10">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Exposure vs Enjoyment</p>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-400">{exposureScore}</p>
                  <p className="text-xs text-gray-500">Exposure</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${affinityDelta && affinityDelta > 0 ? 'text-green-400' : affinityDelta && affinityDelta < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {affinityDelta !== undefined ? (affinityDelta > 0 ? '+' : '') + affinityDelta : '—'}
                  </p>
                  <p className="text-xs text-gray-500">Delta</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">{enjoymentScore}</p>
                  <p className="text-xs text-gray-500">Enjoyment</p>
                </div>
              </div>
              {affinityDelta !== undefined && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {affinityDelta > 15 ? '💎 You love this when it appears!' : 
                   affinityDelta < -15 ? '🤷 You watch this but rate it lower' : 
                   'Balanced consumption and enjoyment'}
                </p>
              )}
            </div>
          )}
          
          {/* Description */}
          {description && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-300">{description}</p>
            </div>
          )}
          
          {/* Top Contributing Titles */}
          {topContributors && topContributors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Film className="w-4 h-4 text-pink-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wide">Top Contributing Titles</p>
              </div>
              <div className="space-y-2">
                {topContributors.slice(0, 5).map((contributor, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-gray-500 w-4">{i + 1}.</span>
                      <span className="text-sm text-white truncate">{contributor.title || 'Unknown'}</span>
                    </div>
                    <div className="flex flex-col items-end ml-2">
                      <span className="text-sm text-purple-400 font-bold">
                        {Math.round((contributor.shareOfTrait || 0) * 100)}%
                      </span>
                      <span className="text-xs text-gray-500">
                        of trait
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Contributing Tags */}
          {contributingTags && contributingTags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wide">Contributing Tags</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {contributingTags.slice(0, 10).map((tag, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  >
                    {tag}
                  </span>
                ))}
                {contributingTags.length > 10 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-gray-500">
                    +{contributingTags.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <p className="text-xs text-yellow-400 uppercase tracking-wide">Data Notes</p>
              </div>
              <ul className="space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i} className="text-xs text-yellow-300/80">• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <p className="text-xs text-gray-500 text-center">
            Scores are computed from your AniList data using trait-weighted analysis
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage explainability drawer state
 */
export function useExplainabilityDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<Omit<ExplainabilityDrawerProps, 'isOpen' | 'onClose'> | null>(null);
  
  const openDrawer = (props: Omit<ExplainabilityDrawerProps, 'isOpen' | 'onClose'>) => {
    setData(props);
    setIsOpen(true);
  };
  
  const closeDrawer = () => {
    setIsOpen(false);
    setData(null);
  };
  
  const openForTrait = (trait: TraitScore) => {
    openDrawer({
      title: trait.name,
      score: trait.normalizedScore,
      confidence: trait.confidence,
      topContributors: trait.topContributors,
      contributingTags: trait.contributingTags,
      exposureScore: trait.exposureScore,
      enjoymentScore: trait.enjoymentScore,
      affinityDelta: trait.affinityDelta,
    });
  };
  
  return {
    isOpen,
    data,
    openDrawer,
    closeDrawer,
    openForTrait,
    DrawerComponent: () => data ? (
      <ExplainabilityDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        {...data}
      />
    ) : null,
  };
}
