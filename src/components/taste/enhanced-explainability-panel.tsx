'use client';

import { useState } from 'react';
import { 
  Info, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Minus,
  BarChart2,
  Sparkles,
  Target,
  Lightbulb,
  HelpCircle
} from 'lucide-react';
import type { 
  TraitExplanation, 
  ProfileExplanation, 
  ConfidenceMetrics,
  ContributionBreakdown,
  TraitDataQuality 
} from '@/lib/explainability-engine';

// ============================================================================
// CONFIDENCE INDICATOR
// ============================================================================

interface ConfidenceIndicatorProps {
  confidence: ConfidenceMetrics;
  compact?: boolean;
}

export function ConfidenceIndicator({ confidence, compact = false }: ConfidenceIndicatorProps) {
  const levelColors = {
    very_high: 'text-green-400 bg-green-500/20',
    high: 'text-blue-400 bg-blue-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low: 'text-red-400 bg-red-500/20',
  };

  const levelLabels = {
    very_high: 'Very High',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  if (compact) {
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColors[confidence.level]}`}>
        {Math.round(confidence.score * 100)}%
      </span>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Confidence</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColors[confidence.level]}`}>
          {levelLabels[confidence.level]}
        </span>
      </div>
      
      {/* Confidence bar with interval */}
      <div className="relative h-6 bg-white/10 rounded-full overflow-hidden mb-2">
        {/* Confidence interval range */}
        <div 
          className="absolute h-full bg-purple-500/30"
          style={{ 
            left: `${confidence.lowerBound}%`, 
            width: `${confidence.upperBound - confidence.lowerBound}%` 
          }}
        />
        {/* Point estimate marker */}
        <div 
          className="absolute h-full w-1 bg-purple-400"
          style={{ left: `${confidence.score * 100}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-400">{confidence.statement}</p>
      
      {/* Factor breakdown */}
      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
        {Object.entries(confidence.factors).map(([key, value]) => (
          <div key={key} className="p-1">
            <div className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
            <div className="text-sm font-medium text-white">{Math.round(value * 100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CONTRIBUTION BREAKDOWN
// ============================================================================

interface ContributionBreakdownProps {
  breakdown: ContributionBreakdown;
}

export function ContributionBreakdownCard({ breakdown }: ContributionBreakdownProps) {
  const [expanded, setExpanded] = useState(false);
  
  const distributionColors = {
    concentrated: 'text-orange-400 bg-orange-500/20',
    balanced: 'text-green-400 bg-green-500/20',
    spread: 'text-blue-400 bg-blue-500/20',
  };
  
  const stabilityIcons = {
    fragile: AlertTriangle,
    moderate: Minus,
    stable: CheckCircle,
    robust: Sparkles,
  };
  
  const StabilityIcon = stabilityIcons[breakdown.stability.level];

  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Contribution Breakdown</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${distributionColors[breakdown.distribution.type]}`}>
            {breakdown.distribution.type}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Distribution stats */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Gini: {breakdown.distribution.giniCoefficient}</span>
            <span>Top 3: {breakdown.distribution.top3Share}%</span>
          </div>
          
          {/* Stability indicator */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <StabilityIcon className={`w-4 h-4 ${
              breakdown.stability.level === 'fragile' ? 'text-orange-400' :
              breakdown.stability.level === 'moderate' ? 'text-yellow-400' :
              'text-green-400'
            }`} />
            <span className="text-xs text-gray-300">{breakdown.stability.description}</span>
          </div>
          
          {/* Top contributors */}
          <div className="space-y-2">
            {breakdown.topContributors.slice(0, 5).map((contributor, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs text-gray-500 w-4">{i + 1}.</span>
                  {contributor.mediaId ? (
                    <a 
                      href={`https://anilist.co/anime/${contributor.mediaId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white truncate hover:text-purple-300 transition-colors"
                    >
                      {contributor.title}
                    </a>
                  ) : (
                    <span className="text-sm text-white truncate">{contributor.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Contribution bar */}
                  <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${contributor.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-purple-400 font-medium w-8 text-right">
                    {contributor.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DATA QUALITY INDICATOR
// ============================================================================

interface DataQualityIndicatorProps {
  quality: TraitDataQuality;
  compact?: boolean;
}

export function DataQualityIndicator({ quality, compact = false }: DataQualityIndicatorProps) {
  const levelColors = {
    excellent: 'text-green-400 bg-green-500/20 border-green-500/30',
    good: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    fair: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    poor: 'text-red-400 bg-red-500/20 border-red-500/30',
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${levelColors[quality.level]}`}>
        {quality.level === 'excellent' || quality.level === 'good' ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
        <span className="capitalize">{quality.level}</span>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${levelColors[quality.level]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span className="text-sm font-medium">Data Quality</span>
        </div>
        <span className="text-lg font-bold">{quality.score}</span>
      </div>
      
      {/* Quality factors */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {Object.entries(quality.factors).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="text-white">{Math.round(value * 100)}%</span>
          </div>
        ))}
      </div>
      
      {/* Warnings */}
      {quality.warnings.length > 0 && (
        <div className="space-y-1 mb-2">
          {quality.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-yellow-300">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Recommendations */}
      {quality.recommendations.length > 0 && (
        <div className="space-y-1">
          {quality.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-blue-300">
              <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TRAIT EXPLANATION CARD
// ============================================================================

interface TraitExplanationCardProps {
  explanation: TraitExplanation;
}

export function TraitExplanationCard({ explanation }: TraitExplanationCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'quality'>('overview');

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-purple-500/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{explanation.traitName}</h3>
            <p className="text-sm text-purple-300 mt-1">{explanation.headline}</p>
          </div>
          <ConfidenceIndicator confidence={explanation.confidence} compact />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['overview', 'breakdown', 'quality'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">{explanation.explanation}</p>
            
            {/* Counterfactual insight */}
            {explanation.counterfactual && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium text-orange-300">What If?</span>
                </div>
                <p className="text-sm text-gray-300">{explanation.counterfactual.scenario}</p>
                <p className="text-sm text-orange-300 mt-1">{explanation.counterfactual.effect}</p>
              </div>
            )}
            
            <ConfidenceIndicator confidence={explanation.confidence} />
          </div>
        )}
        
        {activeTab === 'breakdown' && (
          <ContributionBreakdownCard breakdown={explanation.contributionBreakdown} />
        )}
        
        {activeTab === 'quality' && (
          <DataQualityIndicator quality={explanation.dataQuality} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PROFILE SUMMARY CARD
// ============================================================================

interface ProfileSummaryCardProps {
  summary: ProfileExplanation['summary'];
  dataQuality: ProfileExplanation['overallDataQuality'];
}

export function ProfileSummaryCard({ summary, dataQuality }: ProfileSummaryCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
      {/* Main headline */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">{summary.headline}</h2>
          <p className="text-sm text-gray-400 mt-1">{summary.confidenceLevel}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-gray-400">Uniqueness</div>
            <div className="text-lg font-bold text-purple-400">{summary.uniquenessScore}</div>
          </div>
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
      </div>
      
      {/* Core identity traits */}
      <div className="flex flex-wrap gap-2 mb-4">
        {summary.coreIdentity.map((trait, i) => (
          <span 
            key={i}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              trait.isSignature 
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' 
                : 'bg-white/10 text-gray-300'
            }`}
          >
            {trait.isSignature && <Sparkles className="w-3 h-3 inline mr-1" />}
            {trait.trait}
            <span className="text-xs ml-1 opacity-70">{Math.round(trait.strength)}</span>
          </span>
        ))}
      </div>
      
      {/* Data quality summary */}
      <button 
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <Info className="w-4 h-4" />
        <span>Based on {dataQuality.totalShows} shows ({dataQuality.ratedShows} rated)</span>
        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {showDetails && (
        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Completeness</span>
              <div className="h-2 bg-white/10 rounded-full mt-1">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${dataQuality.breakdown.completeness * 100}%` }}
                />
              </div>
            </div>
            <div>
              <span className="text-gray-400">Consistency</span>
              <div className="h-2 bg-white/10 rounded-full mt-1">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${dataQuality.breakdown.consistency * 100}%` }}
                />
              </div>
            </div>
            <div>
              <span className="text-gray-400">Recency</span>
              <div className="h-2 bg-white/10 rounded-full mt-1">
                <div 
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${dataQuality.breakdown.recency * 100}%` }}
                />
              </div>
            </div>
            <div>
              <span className="text-gray-400">Diversity</span>
              <div className="h-2 bg-white/10 rounded-full mt-1">
                <div 
                  className="h-full bg-pink-500 rounded-full"
                  style={{ width: `${dataQuality.breakdown.diversity * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {dataQuality.recommendations.length > 0 && (
            <div className="mt-3 space-y-1">
              {dataQuality.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-blue-300">
                  <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// INSIGHTS PANEL
// ============================================================================

interface InsightsPanelProps {
  insights: ProfileExplanation['insights'];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) return null;

  const insightIcons = {
    strength: Sparkles,
    growth: TrendingUp,
    contrast: AlertTriangle,
    hidden_gem: Target,
    warning: AlertTriangle,
  };

  const insightColors = {
    strength: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    growth: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    contrast: 'from-orange-500/20 to-yellow-500/20 border-orange-500/30',
    hidden_gem: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    warning: 'from-red-500/20 to-orange-500/20 border-red-500/30',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" />
        Key Insights
      </h3>
      
      {insights.map((insight, i) => {
        const Icon = insightIcons[insight.type];
        return (
          <div 
            key={i}
            className={`p-3 rounded-lg bg-gradient-to-r border ${insightColors[insight.type]}`}
          >
            <div className="flex items-start gap-2">
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-white">{insight.title}</h4>
                <p className="text-xs text-gray-300 mt-1">{insight.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
