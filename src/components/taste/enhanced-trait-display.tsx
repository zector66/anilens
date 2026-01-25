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
  ChevronUp
} from 'lucide-react';
import type { TraitProfile, TraitScore } from '@/lib/trait-scoring-engine';
import { TraitExplainabilityDrawer } from './trait-explainability-drawer';
import { getRarityColor, getRarityLabel } from '@/lib/trait-distinctiveness';

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

export function EnhancedTraitDisplay({ profile }: EnhancedTraitDisplayProps) {
  const [selectedTrait, setSelectedTrait] = useState<TraitScore | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('signature');

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
              <div 
                key={trait.traitId} 
                className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setSelectedTrait(trait)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{trait.name}</span>
                    {trait.rarity && (
                      <span className={`px-2 py-0.5 rounded text-xs ${getRarityColor(trait.rarity)}`}>
                        {getRarityLabel(trait.rarity)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-purple-400 font-bold text-sm">
                      {Math.round(trait.signatureScore || 0)}
                    </span>
                    <Info className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${Math.min(trait.normalizedScore, 100)}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-xs w-8 text-right">{trait.normalizedScore}</span>
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
                <div 
                  key={trait.traitId}
                  className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => setSelectedTrait(trait)}
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
              <div 
                key={trait.traitId}
                className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setSelectedTrait(trait)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{trait.name}</span>
                  <span className="text-pink-400 text-sm font-bold">{trait.normalizedScore}</span>
                </div>
              </div>
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
                <div 
                  key={trait.traitId}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => setSelectedTrait(trait)}
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
