'use client';

import { useState } from 'react';
import { useEnhancedGenome } from '@/hooks/use-enhanced-genome';
import { detectAllContradictions } from '@/lib/derived-traits';
import { 
  Brain, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  Heart,
  Shield,
  Flame
} from 'lucide-react';

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

const PERSONALITY_COLORS: Record<string, string> = {
  'Stable Taste': 'from-green-500 to-emerald-500',
  'Dual Range': 'from-blue-500 to-purple-500',
  'Chaotic Palette': 'from-orange-500 to-pink-500',
  'Contradiction Engine': 'from-red-500 to-purple-500',
};

export function TraitInsightsCard() {
  const { genome, loading } = useEnhancedGenome();
  const [expandedSection, setExpandedSection] = useState<string | null>('types');

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-full" />
          <div className="h-4 bg-white/10 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!genome?.traitProfile) {
    return null;
  }

  const { traitProfile, derivedIndices, tasteTypes, topTraitsByChannel } = genome;
  
  // Get contradictions with personality label
  const contradictionResult = detectAllContradictions(traitProfile, derivedIndices || []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-4">
      {/* Profile Warnings */}
      {traitProfile.profileMeta.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium text-sm">Profile Notes</span>
          </div>
          <ul className="space-y-1">
            {traitProfile.profileMeta.warnings.map((warning, i) => (
              <li key={i} className="text-yellow-200/80 text-sm">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Contradiction Personality */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PERSONALITY_COLORS[contradictionResult.personalityLabel] || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{contradictionResult.personalityLabel}</h3>
              <p className="text-gray-400 text-sm">Contradiction Heat: {contradictionResult.contradictionHeat}/100</p>
            </div>
          </div>
        </div>
        
        {contradictionResult.contradictions.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Detected Contradictions</p>
            {contradictionResult.contradictions.slice(0, 3).map((c, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-white text-sm">{c.description}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {c.trait1} ({c.score1}) vs {c.trait2} ({c.score2})
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Taste Types with Drivers */}
      {tasteTypes && tasteTypes.length > 0 && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <button 
            onClick={() => toggleSection('types')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">You Have a Type</h3>
                <p className="text-gray-400 text-sm">{tasteTypes.length} detected pattern{tasteTypes.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            {expandedSection === 'types' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'types' && (
            <div className="space-y-3">
              {tasteTypes.slice(0, 5).map((type) => (
                <div key={type.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{type.name}</h4>
                    <span className="text-purple-400 font-bold">{type.matchScore}%</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{type.description}</p>
                  
                  {/* Driver Attribution */}
                  {type.drivers && type.drivers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-gray-500 text-xs mb-2">Driven by:</p>
                      <div className="flex flex-wrap gap-2">
                        {type.drivers.map((driver, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs"
                          >
                            {driver.traitName} ({driver.score})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Traits by Channel */}
      {topTraitsByChannel && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
          <button 
            onClick={() => toggleSection('traits')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Trait DNA</h3>
                <p className="text-gray-400 text-sm">Your core taste signals</p>
              </div>
            </div>
            {expandedSection === 'traits' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'traits' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(topTraitsByChannel) as Array<keyof typeof topTraitsByChannel>).map((channel) => {
                const traits = topTraitsByChannel[channel];
                const Icon = CHANNEL_ICONS[channel];
                const colorClass = CHANNEL_COLORS[channel];
                
                return (
                  <div key={channel} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-white font-medium capitalize">{channel}</h4>
                    </div>
                    <div className="space-y-2">
                      {traits.slice(0, 3).map((trait) => (
                        <div key={trait.traitId} className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">{trait.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
                                style={{ width: `${trait.normalizedScore}%` }}
                              />
                            </div>
                            <span className="text-gray-400 text-xs w-8 text-right">{trait.normalizedScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Top Derived Indices */}
      {derivedIndices && derivedIndices.length > 0 && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <button 
            onClick={() => toggleSection('indices')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Taste Dimensions</h3>
                <p className="text-gray-400 text-sm">Computed taste indices</p>
              </div>
            </div>
            {expandedSection === 'indices' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'indices' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {derivedIndices.slice(0, 8).map((index) => (
                <div key={index.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">{index.name}</span>
                    <span className="text-cyan-400 font-bold">{index.score}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${index.score}%` }}
                    />
                  </div>
                  {index.topContributors && index.topContributors.length > 0 && (
                    <p className="text-gray-500 text-xs mt-1">
                      Top: {index.topContributors.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
