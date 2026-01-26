import { TraitProfile } from '../../trait-scoring-engine';
import { ImpactAnalysis } from '../../impact-scoring';

// Re-export types for convenience
export type DerivedIndices = {
  contradictions: any[];
  indices: Record<string, any>;
  types: Record<string, any>;
  behavioralMetrics?: any;
  emotionalDamage?: any;
  chaosLevel?: any;
  emotionalProfile?: Record<string, number>;
  tasteClusters: string[];
  diversityIndex?: number;
};

export type ShapedByResult = {
  topShapers: Array<{
    mediaId: number;
    mediaTitle: string;
    impactScore: number;
    reason: string;
    shapedTraits: Array<{ trait: string; contribution: number; importance: number }>;
    explanation: string;
  }>;
  totalImpact: number;
  confidence: number;
  shapingAxes: {
    identity: Array<ShapedByResult['topShapers'][0]>;
    emotional: Array<ShapedByResult['topShapers'][0]>;
    cerebral: Array<ShapedByResult['topShapers'][0]>;
    edge: Array<ShapedByResult['topShapers'][0]>;
  };
};

export interface TraitView {
  topTraits: Array<{
    trait: string;
    score: number;
    channel: string;
    strength: 'weak' | 'moderate' | 'strong' | 'intense';
    exposure: number;
    rarity: number;
    populationPercentile?: number;
  }>;
  summary: string;
  confidence: number;
}

export interface TasteResult {
  // Meta information
  meta: {
    userId: number;
    mediaType: 'ANIME' | 'MANGA';
    computedAt: Date;
    version: string;
    sampleSize: number;
    warnings: string[];
  };

  // Core engine outputs
  traits: TraitProfile;              // 4 channels (core, modifier, warning, intensity)
  derived: DerivedIndices;           // contradictions, indices, types
  shapedBy: ShapedByResult;          // what shaped me analysis

  // Optional views
  views: {
    exposure: TraitView;             // What you consume a lot
    preference: TraitView;           // What you actually like relative to baseline
    signature: TraitView;            // What uniquely defines you vs population
  };

  // Compatibility layer
  legacy?: {
    personalityTraits: {
      completionist: number;
      seasonalTourist: number;
      cultHunter: number;
      nostalgiaAddict: number;
      mainstreamMaxxer: number;
      avantGarde: number;
      emotionalDamageIndex: number;
      chaosLevel: number;
      genreDiversity: number;
    };
    behavioralMetrics: {
      completionRate: number;
      dropRate: number;
      meanDropProgress: number;
      bingeIndex: number;
      mainstreamIndex: number;
      nicheIndex: number;
      experimentalIndex: number;
    };
    emotionalProfile: Record<string, number>;
    tasteClusters: string[];
    powerRankings: Array<{ title: string; score: number; reason: string }>;
  };
}

export interface ComputeTasteOptions {
  includeViews?: boolean;
  includeLegacy?: boolean;
  forceRecompute?: boolean;
  debugMode?: boolean;
}
