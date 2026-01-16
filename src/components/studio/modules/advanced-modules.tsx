'use client';

import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '' }) => (
  <div 
    className={`rounded-xl ${className}`}
    style={{
      background: 'rgba(10, 10, 15, 0.55)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
    }}
  >
    {children}
  </div>
);

// Era Timeline - Shows preference across anime eras
export function EraTimelineModule({ 
  eras,
  accentColor
}: { 
  eras: Array<{ era: string; preference: number; count: number }>;
  accentColor: string;
}) {
  const maxPreference = Math.max(...eras.map(e => e.preference));
  
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Era Preference</h3>
      <div className="flex items-end gap-1 h-20">
        {eras.map((era, i) => {
          const height = (era.preference / maxPreference) * 100;
          const isTop = era.preference === maxPreference;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full rounded-t transition-all"
                style={{ 
                  height: `${height}%`,
                  background: isTop 
                    ? `linear-gradient(180deg, ${accentColor}, ${accentColor}88)`
                    : 'rgba(255,255,255,0.1)',
                  minHeight: '4px'
                }}
              />
              <span className="text-[9px] text-gray-500 truncate w-full text-center">{era.era}</span>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// Format Distribution - TV/Movie/OVA/etc breakdown
export function FormatDistributionModule({ 
  formats,
  accentColor
}: { 
  formats: Array<{ format: string; count: number; percentage: number }>;
  accentColor: string;
}) {
  const formatIcons: Record<string, string> = {
    'TV': '📺',
    'TV_SHORT': '📱',
    'MOVIE': '🎬',
    'OVA': '💿',
    'ONA': '🌐',
    'SPECIAL': '⭐',
    'MUSIC': '🎵',
    'MANGA': '📖',
    'NOVEL': '📚',
    'ONE_SHOT': '📄',
  };
  
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Format Distribution</h3>
      <div className="flex flex-wrap gap-2">
        {formats.slice(0, 6).map((fmt, i) => (
          <div 
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ 
              background: i === 0 ? `${accentColor}22` : 'rgba(255,255,255,0.05)',
              border: i === 0 ? `1px solid ${accentColor}44` : '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <span className="text-sm">{formatIcons[fmt.format] || '📋'}</span>
            <div>
              <div className={`text-xs font-medium ${i === 0 ? 'text-white' : 'text-gray-300'}`}>
                {fmt.format.replace('_', ' ')}
              </div>
              <div className="text-[10px] text-gray-500">{fmt.percentage}%</div>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// Emotional Profile - 5-axis radar display
export function EmotionalProfileModule({ 
  profile,
  accentColor
}: { 
  profile: {
    escapism: number;
    bleakness: number;
    idealism: number;
    intensity: number;
    sentimentality: number;
  };
  accentColor: string;
}) {
  const axes = [
    { key: 'escapism', label: 'Escapism', lowLabel: 'Grounded', highLabel: 'Fantasy' },
    { key: 'bleakness', label: 'Tone', lowLabel: 'Hopeful', highLabel: 'Dark' },
    { key: 'idealism', label: 'Worldview', lowLabel: 'Cynical', highLabel: 'Idealistic' },
    { key: 'intensity', label: 'Intensity', lowLabel: 'Calm', highLabel: 'Intense' },
    { key: 'sentimentality', label: 'Emotion', lowLabel: 'Stoic', highLabel: 'Emotional' },
  ];
  
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Emotional Profile</h3>
      <div className="space-y-3">
        {axes.map((axis, i) => {
          const value = profile[axis.key as keyof typeof profile] || 0.5;
          return (
            <div key={i}>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>{axis.lowLabel}</span>
                <span className="text-gray-400 font-medium">{axis.label}</span>
                <span>{axis.highLabel}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 relative overflow-hidden">
                {/* Center marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                {/* Value indicator */}
                <div 
                  className="absolute top-0 bottom-0 w-3 rounded-full transition-all"
                  style={{ 
                    left: `calc(${value * 100}% - 6px)`,
                    background: accentColor,
                    boxShadow: `0 0 8px ${accentColor}`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// Risk Profile - Popularity bucket display
export function RiskProfileModule({ 
  riskData,
  accentColor
}: { 
  riskData: {
    preferredTier: string;
    riskTolerance: number;
    curve: Array<{ bucket: string; engagement: number }>;
  };
  accentColor: string;
}) {
  const riskLabel = riskData.riskTolerance > 0.7 ? 'Niche Hunter' 
    : riskData.riskTolerance > 0.4 ? 'Balanced Explorer' 
    : 'Mainstream Focused';
  
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Risk Profile</h3>
      <div 
        className="text-lg font-bold mb-3"
        style={{ color: accentColor }}
      >
        {riskLabel}
      </div>
      <div className="flex items-end gap-1 h-12">
        {riskData.curve.map((bucket, i) => {
          const isPreferred = bucket.bucket === riskData.preferredTier;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full rounded-t transition-all"
                style={{ 
                  height: `${bucket.engagement * 100}%`,
                  background: isPreferred ? accentColor : 'rgba(255,255,255,0.15)',
                  minHeight: '2px'
                }}
              />
              <span className="text-[8px] text-gray-500 truncate">{bucket.bucket}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-gray-400 text-center">
        Preferred: <span style={{ color: accentColor }}>{riskData.preferredTier}</span>
      </div>
    </GlassPanel>
  );
}

// Taste Shift Panel - Compare time windows
export function TasteShiftModule({ 
  shifts,
  accentColor
}: { 
  shifts: Array<{ 
    label: string; 
    direction: 'up' | 'down' | 'stable'; 
    change: number;
    type: 'genre' | 'studio' | 'tag';
  }>;
  accentColor: string;
}) {
  const getArrow = (dir: string) => dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→';
  const getColor = (dir: string) => dir === 'up' ? '#22c55e' : dir === 'down' ? '#ef4444' : '#9ca3af';
  
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Taste Shift</h3>
      <div className="space-y-2">
        {shifts.slice(0, 4).map((shift, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase">{shift.type}</span>
              <span className="text-sm text-white">{shift.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <span 
                className="text-sm font-bold"
                style={{ color: getColor(shift.direction) }}
              >
                {getArrow(shift.direction)} {Math.abs(shift.change)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// Percentile Flex Stats with comparison text
export function PercentileFlexModule({ 
  stats,
  accentColor
}: { 
  stats: Array<{ 
    label: string; 
    percentile: number; 
    displayText: string;
  }>;
  accentColor: string;
}) {
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">How You Compare</h3>
      <div className="space-y-3">
        {stats.slice(0, 3).map((stat, i) => {
          const isTop = stat.percentile >= 75;
          return (
            <div key={i} className="p-3 rounded-lg bg-white/5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-300">{stat.label}</span>
                <span 
                  className="text-sm font-bold"
                  style={{ color: isTop ? accentColor : '#9ca3af' }}
                >
                  Top {Math.round(100 - stat.percentile)}%
                </span>
              </div>
              <p className="text-xs text-gray-500">{stat.displayText}</p>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
