'use client';

import { useMemo } from 'react';
import { TasteProfile } from '@/types/anilist';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  Sparkles,
  Copy,
  Share2,
  TrendingUp,
  Zap,
  Heart,
  Brain,
  Flame,
  Shield,
  Compass,
} from 'lucide-react';

interface EmotionalProfileChartProps {
  emotionalProfile: TasteProfile['emotionalProfile'];
}

export function EmotionalProfileChart({ emotionalProfile }: EmotionalProfileChartProps) {
  const data = useMemo(() => [
    { axis: 'Escapism', value: emotionalProfile.escapism * 100, fullMark: 100 },
    { axis: 'Intensity', value: emotionalProfile.intensity * 100, fullMark: 100 },
    { axis: 'Bleakness', value: emotionalProfile.bleakness * 100, fullMark: 100 },
    { axis: 'Sentimentality', value: emotionalProfile.sentimentality * 100, fullMark: 100 },
    { axis: 'Idealism', value: emotionalProfile.idealism * 100, fullMark: 100 },
  ], [emotionalProfile]);

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-pink-400" />
        <h3 className="text-lg font-semibold text-white">Emotional Profile</h3>
      </div>
      <p className="text-sm text-gray-400 mb-4">How you experience stories emotionally</p>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis 
              dataKey="axis" 
              tick={{ fill: '#9ca3af', fontSize: 11 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            <Radar
              name="Emotional"
              dataKey="value"
              stroke="#ec4899"
              fill="#ec4899"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <EmotionalAxisLabel 
          value={emotionalProfile.escapism}
          lowLabel="Grounded"
          highLabel="Fantasy"
        />
        <EmotionalAxisLabel 
          value={emotionalProfile.bleakness}
          lowLabel="Wholesome"
          highLabel="Dark"
        />
        <EmotionalAxisLabel 
          value={emotionalProfile.idealism}
          lowLabel="Cynical"
          highLabel="Hopeful"
        />
        <EmotionalAxisLabel 
          value={emotionalProfile.intensity}
          lowLabel="Calm"
          highLabel="Intense"
        />
      </div>
    </div>
  );
}

function EmotionalAxisLabel({ value, lowLabel, highLabel }: {
  value: number;
  lowLabel: string;
  highLabel: string;
}) {
  const percentage = Math.round(value * 100);
  return (
    <div className="text-xs">
      <div className="flex justify-between text-gray-500 mb-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-center text-gray-400 mt-1">{percentage}%</div>
    </div>
  );
}

interface StructuralPreferencesProps {
  structuralPreferences: TasteProfile['structuralPreferences'];
}

export function StructuralPreferencesChart({ structuralPreferences }: StructuralPreferencesProps) {
  const axes = [
    {
      key: 'episodicVsSerial',
      label: 'Story Structure',
      leftLabel: 'Episodic',
      rightLabel: 'Serialized',
      value: structuralPreferences.episodicVsSerial,
      icon: Brain,
    },
    {
      key: 'pacingPreference',
      label: 'Pacing',
      leftLabel: 'Slow Burn',
      rightLabel: 'Fast Paced',
      value: structuralPreferences.pacingPreference,
      icon: Zap,
    },
    {
      key: 'plotVsCharacter',
      label: 'Focus',
      leftLabel: 'Character',
      rightLabel: 'Plot',
      value: structuralPreferences.plotVsCharacter,
      icon: Compass,
    },
    {
      key: 'complexityPreference',
      label: 'Complexity',
      leftLabel: 'Accessible',
      rightLabel: 'Complex',
      value: structuralPreferences.complexityPreference,
      icon: Flame,
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Structural Preferences</h3>
      </div>
      <p className="text-sm text-gray-400 mb-6">How you like stories constructed</p>

      <div className="space-y-6">
        {axes.map((axis) => (
          <div key={axis.key}>
            <div className="flex items-center gap-2 mb-2">
              <axis.icon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-white">{axis.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20 text-right">{axis.leftLabel}</span>
              <div className="flex-1 relative">
                <div className="h-2 bg-white/10 rounded-full">
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 border-2 border-white"
                    style={{ left: `calc(${axis.value * 100}% - 8px)` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500 w-20">{axis.rightLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RiskProfileChartProps {
  riskProfile: TasteProfile['riskProfile'];
}

export function RiskProfileChart({ riskProfile }: RiskProfileChartProps) {
  const data = riskProfile.curve.map(bucket => ({
    name: bucket.bucket,
    engagement: Math.round(bucket.engagement * 100),
    completion: Math.round(bucket.completionRate * 100),
    score: bucket.avgScore.toFixed(1),
  }));

  const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b'];

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Risk Tolerance</h3>
        </div>
        <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
          Prefers: {riskProfile.preferredTier}
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-4">Engagement by popularity tier</p>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              formatter={(value) => [`${value}%`, 'Engagement']}
            />
            <Bar dataKey="engagement" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-white/5">
        <div className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-yellow-400" />
          <span className="text-gray-300">
            Risk Tolerance: <strong className="text-white">{Math.round(riskProfile.riskTolerance * 100)}%</strong>
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {riskProfile.riskTolerance > 0.6 
            ? "You actively seek obscure titles others haven't discovered."
            : riskProfile.riskTolerance < 0.3
            ? "You prefer proven, popular titles with community validation."
            : "You balance between popular picks and hidden discoveries."}
        </p>
      </div>
    </div>
  );
}

interface ContradictionsCardProps {
  contradictions: TasteProfile['contradictions'];
}

export function ContradictionsCard({ contradictions }: ContradictionsCardProps) {
  if (contradictions.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Taste Contradictions</h3>
        </div>
        <div className="text-center py-8">
          <Sparkles className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-gray-400">No contradictions detected</p>
          <p className="text-xs text-gray-500 mt-1">Your taste is remarkably consistent!</p>
        </div>
      </div>
    );
  }

  const severityColors = {
    MILD: 'border-yellow-500/30 bg-yellow-500/10',
    MODERATE: 'border-orange-500/30 bg-orange-500/10',
    STRONG: 'border-red-500/30 bg-red-500/10',
  };

  const severityIcons = {
    MILD: '🤔',
    MODERATE: '😅',
    STRONG: '💀',
  };

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Taste Contradictions</h3>
        <span className="ml-auto text-xs text-gray-500">{contradictions.length} detected</span>
      </div>
      <p className="text-sm text-gray-400 mb-4">Inconsistencies between what you say and what you do</p>

      <div className="space-y-3">
        {contradictions.map((c) => (
          <div 
            key={c.id} 
            className={`p-4 rounded-xl border ${severityColors[c.severity]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{severityIcons[c.severity]}</span>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">{c.description}</p>
                <p className="text-xs text-gray-400 mt-1">{c.evidence}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TasteFingerprintProps {
  fingerprint: TasteProfile['fingerprint'];
  userName?: string;
}

export function TasteFingerprintCard({ fingerprint }: TasteFingerprintProps) {
  const copyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint.code);
  };

  const archetypeEmojis: Record<string, string> = {
    'The Escapist': '🌌',
    'The Analyst': '🧠',
    'The Romantic': '💕',
    'The Thrill-Seeker': '⚡',
    'The Connoisseur': '🎭',
    'The Idealist': '✨',
    'The Realist': '🎯',
    'The Casual': '☕',
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Taste Fingerprint</h3>
        </div>
        <button 
          onClick={copyFingerprint}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Copy fingerprint"
        >
          <Copy className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="text-center py-4">
        <div className="inline-block px-6 py-3 rounded-xl bg-black/30 border border-white/10 font-mono text-xl text-white tracking-wider">
          {fingerprint.code}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-3 rounded-xl bg-white/5">
          <p className="text-xs text-gray-500 mb-1">Primary Archetype</p>
          <div className="flex items-center gap-2">
            <span className="text-xl">{archetypeEmojis[fingerprint.primaryArchetype] || '🎬'}</span>
            <span className="text-sm font-medium text-white">{fingerprint.primaryArchetype}</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <p className="text-xs text-gray-500 mb-1">Secondary Archetype</p>
          <div className="flex items-center gap-2">
            <span className="text-xl">{archetypeEmojis[fingerprint.secondaryArchetype] || '🎬'}</span>
            <span className="text-sm font-medium text-white">{fingerprint.secondaryArchetype}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-white/5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Uniqueness Score</span>
          <span className="text-sm font-bold text-white">{Math.round(fingerprint.uniquenessScore * 100)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            style={{ width: `${fingerprint.uniquenessScore * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {fingerprint.uniquenessScore > 0.7 
            ? "Your taste is highly distinctive - you're a true original!"
            : fingerprint.uniquenessScore > 0.4
            ? "A unique blend of common and rare preferences."
            : "You share taste patterns with many others."}
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors">
          <Share2 className="w-4 h-4" />
          Share Profile
        </button>
      </div>
    </div>
  );
}

interface ConfidenceIndicatorProps {
  label: string;
  confidence: number;
}

export function ConfidenceIndicator({ label, confidence }: ConfidenceIndicatorProps) {
  const confidenceLevel = confidence > 0.8 ? 'High' : confidence > 0.5 ? 'Medium' : 'Low';
  const confidenceColor = confidence > 0.8 ? 'text-green-400' : confidence > 0.5 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500">{label}:</span>
      <span className={confidenceColor}>{confidenceLevel}</span>
      <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${
            confidence > 0.8 ? 'bg-green-400' : confidence > 0.5 ? 'bg-yellow-400' : 'bg-red-400'
          }`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
    </div>
  );
}
