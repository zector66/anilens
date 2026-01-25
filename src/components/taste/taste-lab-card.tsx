'use client';

import React, { useMemo, useState } from 'react';
import { 
  Dna, Brain, Sparkles, AlertTriangle, History, 
  ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  Zap, Heart, Star
} from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { 
  TasteContradiction, 
  extractGenome,
  detectContradictions,
} from '@/lib/taste-genome';
import { TasteProfile, MediaListEntry } from '@/types/anilist';
import { calculateWhatShapedMe, type MediaImpact } from '@/lib/what-shaped-me';
import { useEnhancedGenome } from '@/hooks/use-enhanced-genome';
import { useExplainabilityDrawer } from './explainability-drawer';

interface TasteLabCardProps {
  profile: TasteProfile;
  entries: MediaListEntry[];
  userStats: { mean: number; std: number };
  type: 'ANIME' | 'MANGA';
}

export function TasteLabCard({ profile, entries, userStats, type }: TasteLabCardProps) {
  const [activeTab, setActiveTab] = useState<'contradictions' | 'influencers' | 'genome'>('contradictions');
  const [showAll, setShowAll] = useState(false);
  const { openDrawer, DrawerComponent } = useExplainabilityDrawer();
  
  // Extract genome and analyze
  const genome = useMemo(() => extractGenome(profile), [profile]);
  
  // Get enhanced genome with entries from profile
  const { genome: enhancedGenome } = useEnhancedGenome(entries);
  
  const contradictions = useMemo(() => 
    detectContradictions(entries, genome, profile, userStats),
    [entries, genome, profile, userStats]
  );
  
  // Use new trait system for influencers if available
  const influencers = useMemo(() => {
    if (enhancedGenome?.traitProfile) {
      return calculateWhatShapedMe(enhancedGenome.traitProfile, 10);
    }
    return [];
  }, [enhancedGenome]);

  // Categorize contradictions with CLEAN 3-bucket classification
  const onBrandFavorites = contradictions.filter(c => c.contradictionType === 'ON_BRAND_FAVORITE');
  const genreExceptions = contradictions.filter(c => c.contradictionType === 'GENRE_EXCEPTION');
  const trueWildcards = contradictions.filter(c => c.contradictionType === 'TRUE_WILDCARD');
  const personalExceptions = contradictions.filter(c => c.contradictionType === 'PERSONAL_EXCEPTION');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
          <Dna className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            AniLens Lab
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">BETA</span>
          </h3>
          <p className="text-xs text-gray-400">Taste science • Predictions • Anomalies</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
        <button
          onClick={() => setActiveTab('contradictions')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            activeTab === 'contradictions' 
              ? 'bg-purple-500/20 text-purple-300' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Contradictions
            {contradictions.length > 0 && (
              <span className="text-[10px] bg-purple-500/30 px-1.5 py-0.5 rounded-full">
                {contradictions.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('influencers')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            activeTab === 'influencers' 
              ? 'bg-cyan-500/20 text-cyan-300' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <History className="w-4 h-4" />
            What Shaped You
          </span>
        </button>
        <button
          onClick={() => setActiveTab('genome')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            activeTab === 'genome' 
              ? 'bg-green-500/20 text-green-300' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Dna className="w-4 h-4" />
            Genome
          </span>
        </button>
      </div>

      {/* Contradictions Tab */}
      {activeTab === 'contradictions' && (
        <div className="space-y-4">
          {contradictions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No significant contradictions detected</p>
              <p className="text-xs text-gray-500 mt-1">Your taste is remarkably consistent!</p>
            </div>
          ) : (
            <>
              {/* On-Brand Favorites - Exactly your taste */}
              {onBrandFavorites.length > 0 && (
                <ContradictionSection
                  title="On-Brand Favorites"
                  subtitle="Exactly your taste"
                  icon={<Star className="w-4 h-4 text-purple-400" />}
                  items={showAll ? onBrandFavorites : onBrandFavorites.slice(0, 3)}
                  color="purple"
                />
              )}

              {/* Genre Exceptions - You beat your stereotype */}
              {genreExceptions.length > 0 && (
                <ContradictionSection
                  title="Genre Exceptions"
                  subtitle="Shows you loved despite one major mismatch"
                  icon={<Sparkles className="w-4 h-4 text-yellow-400" />}
                  items={showAll ? genreExceptions : genreExceptions.slice(0, 3)}
                  color="yellow"
                />
              )}

              {/* True Wildcards - Makes no sense (in a cool way) */}
              {trueWildcards.length > 0 && (
                <ContradictionSection
                  title="True Wildcards"
                  subtitle="Low profile match but you loved it anyway"
                  icon={<Heart className="w-4 h-4 text-pink-400" />}
                  items={showAll ? trueWildcards : trueWildcards.slice(0, 3)}
                  color="pink"
                />
              )}

              {/* Personal Exceptions - Didn't click */}
              {personalExceptions.length > 0 && (
                <ContradictionSection
                  title="Personal Exceptions"
                  subtitle="Matched your profile, but something didn't click"
                  icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
                  items={showAll ? personalExceptions : personalExceptions.slice(0, 3)}
                  color="orange"
                />
              )}

              {contradictions.length > 3 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  {showAll ? (
                    <><ChevronUp className="w-4 h-4" /> Show Less</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Show All {contradictions.length}</>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Influencers Tab */}
      {activeTab === 'influencers' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 mb-3">
            These {type === 'ANIME' ? 'anime' : 'manga'} shaped your current taste the most
          </p>
          
          {influencers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Not enough data to identify influencers</p>
            </div>
          ) : (
            influencers.slice(0, showAll ? 10 : 5).map((impact: MediaImpact, i: number) => {
              const entry = entries.find(e => e.media?.id === impact.mediaId);
              return (
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
                    {entry?.media?.coverImage?.large && (
                      <OptimizedImage
                        src={entry.media.coverImage.large}
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
              );
            })
          )}

          {influencers.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              {showAll ? (
                <><ChevronUp className="w-4 h-4" /> Show Less</>
              ) : (
                <><ChevronDown className="w-4 h-4" /> Show All {influencers.length}</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Genome Tab */}
      {activeTab === 'genome' && (
        <div className="space-y-4">
          {/* Genome Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="text-2xl font-bold text-green-400">
                {Math.round(genome.entropy * 100)}%
              </div>
              <div className="text-xs text-gray-400">Diversity</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {Math.round(genome.uniquenessScore * 100)}%
              </div>
              <div className="text-xs text-gray-400">Uniqueness</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {genome.vector.length}
              </div>
              <div className="text-xs text-gray-400">Dimensions</div>
            </div>
          </div>

          {/* Dominant Traits */}
          <div className="p-4 rounded-lg bg-white/5">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Dominant Traits
            </h4>
            <div className="flex flex-wrap gap-2">
              {genome.dominantTraits.map((trait, i) => (
                <span 
                  key={trait}
                  className={`px-3 py-1 rounded-full text-sm ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-300' :
                    i === 1 ? 'bg-purple-500/20 text-purple-300' :
                    'bg-cyan-500/20 text-cyan-300'
                  }`}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* Genome Visualization */}
          <div className="p-4 rounded-lg bg-white/5">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Dna className="w-4 h-4 text-green-400" />
              Genome Vector
            </h4>
            <div className="grid grid-cols-10 gap-1">
              {genome.vector.slice(0, 50).map((value, i) => (
                <div
                  key={i}
                  className="h-8 rounded-sm transition-all hover:scale-110"
                  style={{
                    backgroundColor: `rgba(${
                      value > 0.7 ? '168, 85, 247' : 
                      value > 0.4 ? '59, 130, 246' : 
                      '107, 114, 128'
                    }, ${0.2 + value * 0.8})`,
                  }}
                  title={`${genome.dimensions[i]?.name}: ${(value * 100).toFixed(0)}%`}
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center">
              Hover over cells to see dimension values
            </p>
          </div>

          {/* Top Dimensions */}
          <div className="p-4 rounded-lg bg-white/5">
            <h4 className="text-sm font-semibold text-white mb-3">Top Defining Dimensions</h4>
            <div className="space-y-2">
              {[...genome.dimensions]
                .sort((a, b) => b.contribution - a.contribution)
                .slice(0, 5)
                .map((dim) => (
                  <div key={dim.name} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-400 truncate">{dim.name}</div>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-linear-to-r from-purple-500 to-cyan-500"
                        style={{ width: `${dim.value * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 w-12 text-right">
                      {(dim.value * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      <DrawerComponent />
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ContradictionSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: TasteContradiction[];
  color: 'pink' | 'yellow' | 'orange' | 'purple';
}

function ContradictionSection({ title, subtitle, icon, items, color }: ContradictionSectionProps) {
  if (items.length === 0) return null;

  const colorClasses = {
    pink: 'from-pink-500/10 to-pink-500/5 border-pink-500/20',
    yellow: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20',
    orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/20',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
  };

  return (
    <div className={`p-4 rounded-xl bg-linear-to-br ${colorClasses[color]} border`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <p className="text-xs text-gray-400 mb-3">{subtitle}</p>
      
      <div className="space-y-3">
        {items.map((contradiction) => (
          <ContradictionRow key={contradiction.mediaId} contradiction={contradiction} />
        ))}
      </div>
    </div>
  );
}

function ContradictionRow({ contradiction }: { contradiction: TasteContradiction }) {
  const isPositive = contradiction.residual > 0;

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
      {/* Cover Image */}
      <div className="w-12 h-16 rounded-md overflow-hidden shrink-0 bg-white/10">
        {contradiction.coverImage && (
          <OptimizedImage
            src={contradiction.coverImage}
            alt={contradiction.title}
            width={48}
            height={64}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-medium text-white truncate">{contradiction.title}</h5>
        
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">You:</span>
            <span className="text-sm font-bold text-white">{contradiction.actualScore}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Expected:</span>
            <span className="text-sm text-gray-300">{contradiction.expectedScore.toFixed(1)}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{contradiction.residual.toFixed(1)}
          </div>
        </div>

        {/* Fix 5: "You loved it because..." + "Despite..." */}
        <div className="mt-2 text-xs space-y-0.5">
          {contradiction.lovedBecause.length > 0 && (
            <div className="text-green-400/80">
              <span className="text-gray-500">Loved: </span>
              {contradiction.lovedBecause.slice(0, 2).map(f => `${f.factor} (${f.affinity}%)`).join(', ')}
            </div>
          )}
          {contradiction.despite.length > 0 && (
            <div className="text-orange-400/80">
              <span className="text-gray-500">Despite: </span>
              {contradiction.despite.map(f => `${f.factor} (${f.affinity}%)`).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default TasteLabCard;
