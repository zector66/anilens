'use client';

import { useState } from 'react';
import { 
  Brain, 
  Heart, 
  Shield, 
  Flame,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  Play,
  Tag,
  Target,
  BarChart2
} from 'lucide-react';
import type { TraitProfile, TraitScore } from '@/lib/trait-scoring-engine';
import { TraitExplainabilityDrawer } from './trait-explainability-drawer';
import { getRarityColor, getRarityLabel } from '@/lib/trait-distinctiveness';
import { generateTraitExplanation, type TraitExplanation } from '@/lib/explainability-engine';

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

interface EnhancedTraitDisplayProps {
  profile: TraitProfile;
}

// Confidence badge component
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const level = confidence >= 0.7 ? 'high' : confidence >= 0.4 ? 'medium' : 'low';
  const colors = {
    high: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[level]}`}>
      {Math.round(confidence * 100)}%
    </span>
  );
}

// Hover tooltip component with enhanced explainability
function TraitTooltip({ trait, explanation, children }: { 
  trait: TraitScore; 
  explanation?: TraitExplanation | null;
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
        <div className="absolute z-50 w-80 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl -top-2 left-full ml-2">
          {/* Header with confidence */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-white font-semibold">{trait.name}</h4>
              {explanation && (
                <ConfidenceBadge confidence={explanation.confidence.score} />
              )}
            </div>
            {explanation?.headline && (
              <p className="text-purple-300 text-sm mb-1">{explanation.headline}</p>
            )}
            {trait.description && (
              <p className="text-gray-400 text-xs">{trait.description}</p>
            )}
          </div>
          
          {/* Confidence interval */}
          {explanation && (
            <div className="mb-3 p-2 rounded bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-gray-400">Confidence Range</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{explanation.confidence.lowerBound}</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full relative">
                  <div 
                    className="absolute h-full bg-purple-500/30 rounded-full"
                    style={{ 
                      left: `${explanation.confidence.lowerBound}%`, 
                      width: `${explanation.confidence.upperBound - explanation.confidence.lowerBound}%` 
                    }}
                  />
                  <div 
                    className="absolute h-full w-1 bg-purple-400 rounded-full"
                    style={{ left: `${trait.normalizedScore}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{explanation.confidence.upperBound}</span>
              </div>
            </div>
          )}
          
          {/* Top Contributors */}
          {trait.topContributors && trait.topContributors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                <Play className="w-3 h-3" />
                TOP CONTRIBUTORS
              </div>
              {trait.topContributors.slice(0, 3).map((contributor, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <a 
                    href={`https://anilist.co/anime/${contributor.mediaId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 transition-colors truncate max-w-[180px]"
                  >
                    {contributor.title}
                  </a>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.round((contributor.shareOfTrait || 0) * 100)}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs w-8 text-right">
                      {Math.round((contributor.shareOfTrait || 0) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Stability indicator */}
          {explanation?.contributionBreakdown && (
            <div className="mt-3 p-2 rounded bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-gray-300 capitalize">
                  {explanation.contributionBreakdown.stability.level} score
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {explanation.contributionBreakdown.stability.description}
              </p>
            </div>
          )}
          
          {/* Contributing Tags */}
          {trait.contributingTags && trait.contributingTags.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                <Tag className="w-3 h-3" />
                TOP TAGS
              </div>
              <div className="flex flex-wrap gap-1">
                {trait.contributingTags.slice(0, 6).map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-0.5 bg-gray-800 text-gray-300 text-[10px] rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Click hint */}
          <p className="text-[10px] text-gray-600 mt-3 text-center">
            Click for detailed explanation
          </p>
        </div>
      )}
    </div>
  );
}

export function EnhancedTraitDisplay({ profile }: EnhancedTraitDisplayProps) {
  const [selectedTrait, setSelectedTrait] = useState<TraitScore | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('');
  
  // Generate explanations for traits (cached per trait)
  const getExplanation = (trait: TraitScore): TraitExplanation => {
    return generateTraitExplanation(trait, profile.totalMediaCount);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  return (
    <div className="space-y-6">
      {/* Profile Warnings */}
      {profile.profileMeta.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium text-sm">Profile Notes</span>
          </div>
          <ul className="space-y-1">
            {profile.profileMeta.warnings.map((warning, i) => (
              <li key={i} className="text-yellow-200/80 text-sm">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Signature Traits - What Makes You Unique */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <button 
          onClick={() => toggleSection('signature')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold">Your Signature Traits</h3>
              <p className="text-gray-400 text-sm">What makes your taste unique</p>
            </div>
          </div>
          {expandedSection === 'signature' ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSection === 'signature' && (
          <div className="space-y-2">
            {profile.topSignatureTraits.slice(0, 10).map((trait) => (
              <TraitTooltip key={trait.traitId} trait={trait} explanation={getExplanation(trait)}>
                <div 
                  className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedTrait(trait);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{trait.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-purple-400 font-bold text-sm">
                          {Math.round(trait.signatureScore || 0)}
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
                      <span className="text-white text-xs font-medium">{trait.normalizedScore}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${Math.min(trait.normalizedScore, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Affinity indicator */}
                {trait.affinityDelta !== undefined && Math.abs(trait.affinityDelta) > 15 && (
                  <div className="mt-2 flex items-center gap-2">
                    <TrendingUp className={`w-3 h-3 ${trait.affinityDelta > 0 ? 'text-green-400' : 'text-red-400'}`} />
                    <span className={`text-xs ${trait.affinityDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trait.affinityDelta > 0 ? 'You love this' : 'You tolerate this'}
                    </span>
                  </div>
                )}
                </div>
              </TraitTooltip>
            ))}
          </div>
        )}
      </div>

      {/* Core Identity Traits */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
        <button 
          onClick={() => toggleSection('identity')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold">Core Identity</h3>
              <p className="text-gray-400 text-sm">Your anime DNA</p>
            </div>
          </div>
          {expandedSection === 'identity' ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSection === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.channels.identity
              .filter(t => t.role !== 'warning')
              .slice(0, 12)
              .map((trait) => (
                <TraitTooltip key={trait.traitId} trait={trait} explanation={getExplanation(trait)}>
                  <div 
                    className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedTrait(trait);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">{trait.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                            style={{ width: `${trait.normalizedScore}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs w-8 text-right">{trait.normalizedScore}</span>
                      </div>
                    </div>
                  </div>
                </TraitTooltip>
              ))}
          </div>
        )}
      </div>

      {/* Vibe Profile */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20">
        <button 
          onClick={() => toggleSection('vibe')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-400" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold">Vibe Profile</h3>
              <p className="text-gray-400 text-sm">How it feels</p>
            </div>
          </div>
          {expandedSection === 'vibe' ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSection === 'vibe' && (
          <div className="grid grid-cols-2 gap-3">
            {profile.channels.vibe.slice(0, 8).map((trait) => (
              <TraitTooltip key={trait.traitId} trait={trait} explanation={getExplanation(trait)}>
                <div 
                  className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedTrait(trait);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{trait.name}</span>
                    <span className="text-pink-400 text-sm font-bold">{trait.normalizedScore}</span>
                  </div>
                </div>
              </TraitTooltip>
            ))}
          </div>
        )}
      </div>

      {/* Content Profile - Warning Traits Separated */}
      {profile.warningTraits.length > 0 && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
          <button 
            onClick={() => toggleSection('warnings')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Content Profile</h3>
                <p className="text-gray-400 text-sm">Content warnings & intensity</p>
              </div>
            </div>
            {expandedSection === 'warnings' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'warnings' && (
            <div className="space-y-3">
              {profile.warningTraits.slice(0, 6).map((trait) => (
                <TraitTooltip key={trait.traitId} trait={trait} explanation={getExplanation(trait)}>
                  <div 
                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedTrait(trait);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{trait.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-400 font-bold">{trait.normalizedScore}</span>
                        <Info className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                    
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        style={{ width: `${trait.normalizedScore}%` }}
                      />
                    </div>
                    
                    {trait.topContributors && trait.topContributors.length > 0 && (
                      <p className="text-gray-500 text-xs mt-2">
                        Click to see which shows contribute to this
                      </p>
                    )}
                  </div>
                </TraitTooltip>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Affinity Insights */}
      {profile.affinityInsights.length > 0 && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <button 
            onClick={() => toggleSection('affinity')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Preference Insights</h3>
                <p className="text-gray-400 text-sm">What you love vs what you watch</p>
              </div>
            </div>
            {expandedSection === 'affinity' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'affinity' && (
            <div className="space-y-3">
              {profile.affinityInsights.slice(0, 5).map((insight) => (
                <div 
                  key={insight.traitId}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{insight.traitName}</span>
                    <span className={`text-sm font-bold ${
                      insight.delta > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {insight.delta > 0 ? '+' : ''}{Math.round(insight.delta)}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{insight.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explainability Drawer */}
      <TraitExplainabilityDrawer 
        trait={selectedTrait}
        onClose={() => setSelectedTrait(null)}
      />
    </div>
  );
}
