'use client';

import { useState } from 'react';
import { 
  Trophy, 
  Shuffle, 
  Star, 
  Users, 
  TrendingUp, 
  Zap,
  Filter,
  Settings,
  Sliders,
  Shield
} from 'lucide-react';

export type SeedingMode = 'random' | 'user-ratings' | 'global-score' | 'popularity' | 'hybrid';
export type FormatFilter = 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL';
export type StatusFilter = 'COMPLETED' | 'DROPPED' | 'PLANNING' | 'CURRENT' | 'PAUSED' | 'REPEATING';

interface BracketConfigProps {
  onConfigChange?: (config: BracketConfiguration) => void;
}

export interface BracketConfiguration {
  seedingMode: SeedingMode;
  formatFilters: FormatFilter[];
  statusFilters: StatusFilter[];
  noSequels: boolean;
  highConfidenceOnly: boolean;
  excludeAdult: boolean;
  difficultyLevel: number; // 0 = Safe Picks, 100 = Chaos Mode
  tournamentName: string;
  bracketSize: 16 | 32 | 64;
}

const DEFAULT_CONFIG: BracketConfiguration = {
  seedingMode: 'hybrid',
  formatFilters: ['TV', 'MOVIE'],
  statusFilters: ['COMPLETED'],
  noSequels: false,
  highConfidenceOnly: false,
  excludeAdult: true,
  difficultyLevel: 30,
  tournamentName: 'My Anime Showdown',
  bracketSize: 16,
};

const SEEDING_MODES = [
  {
    id: 'random' as SeedingMode,
    name: 'Random',
    description: 'Pure chaos - completely random seeding',
    icon: Shuffle,
    color: 'text-red-400',
  },
  {
    id: 'user-ratings' as SeedingMode,
    name: 'Your Ratings',
    description: 'Based on your personal scores and preferences',
    icon: Star,
    color: 'text-purple-400',
  },
  {
    id: 'global-score' as SeedingMode,
    name: 'Global Score',
    description: 'Community ratings and consensus',
    icon: Users,
    color: 'text-blue-400',
  },
  {
    id: 'popularity' as SeedingMode,
    name: 'Popularity',
    description: 'Mainstream appeal and viewer count',
    icon: TrendingUp,
    color: 'text-green-400',
  },
  {
    id: 'hybrid' as SeedingMode,
    name: 'Hybrid (Recommended)',
    description: '55% your ratings + 25% global + 20% popularity',
    icon: Zap,
    color: 'text-yellow-400',
  },
];

const FORMAT_OPTIONS: { id: FormatFilter; label: string; description: string }[] = [
  { id: 'TV', label: 'TV Series', description: 'Full television series' },
  { id: 'MOVIE', label: 'Movies', description: 'Feature films' },
  { id: 'OVA', label: 'OVA', description: 'Original video animations' },
  { id: 'ONA', label: 'ONA', description: 'Original net animations' },
  { id: 'SPECIAL', label: 'Specials', description: 'Special episodes' },
];

const STATUS_OPTIONS: { id: StatusFilter; label: string; description: string }[] = [
  { id: 'COMPLETED', label: 'Completed', description: 'Finished watching' },
  { id: 'DROPPED', label: 'Dropped', description: 'Stopped watching' },
  { id: 'PLANNING', label: 'Planning', description: 'Plan to watch' },
  { id: 'CURRENT', label: 'Current', description: 'Currently watching' },
  { id: 'PAUSED', label: 'Paused', description: 'On hold' },
  { id: 'REPEATING', label: 'Repeating', description: 'Re-watching' },
];

export function BracketConfig({ onConfigChange }: BracketConfigProps) {
  const [config, setConfig] = useState<BracketConfiguration>(DEFAULT_CONFIG);

  const updateConfig = (updates: Partial<BracketConfiguration>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const toggleFormatFilter = (format: FormatFilter) => {
    const newFilters = config.formatFilters.includes(format)
      ? config.formatFilters.filter(f => f !== format)
      : [...config.formatFilters, format];
    updateConfig({ formatFilters: newFilters });
  };

  const toggleStatusFilter = (status: StatusFilter) => {
    const newFilters = config.statusFilters.includes(status)
      ? config.statusFilters.filter(s => s !== status)
      : [...config.statusFilters, status];
    updateConfig({ statusFilters: newFilters });
  };

  return (
    <div className="space-y-6">
      {/* Tournament Name */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <label className="block text-sm font-medium text-white mb-2">
          Tournament Name
        </label>
        <input
          type="text"
          value={config.tournamentName}
          onChange={(e) => updateConfig({ tournamentName: e.target.value })}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter tournament name..."
        />
      </div>

      {/* Bracket Size */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <label className="block text-sm font-medium text-white mb-3">
          Bracket Size
        </label>
        <div className="flex gap-2">
          {([16, 32, 64] as const).map(size => (
            <button
              key={size}
              onClick={() => updateConfig({ bracketSize: size })}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                config.bracketSize === size
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Seeding Mode */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <label className="block text-sm font-medium text-white mb-3">
          Seeding Mode
        </label>
        <div className="space-y-2">
          {SEEDING_MODES.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => updateConfig({ seedingMode: mode.id })}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  config.seedingMode === mode.id
                    ? 'bg-purple-500/20 border border-purple-500/50'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-5 h-5 ${mode.color}`} />
                <div className="text-left">
                  <div className={`font-medium ${
                    config.seedingMode === mode.id ? 'text-white' : 'text-gray-300'
                  }`}>
                    {mode.name}
                  </div>
                  <div className="text-xs text-gray-400">{mode.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format Filters */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-purple-400" />
          <label className="text-sm font-medium text-white">Format Filters</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map(format => (
            <button
              key={format.id}
              onClick={() => toggleFormatFilter(format.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                config.formatFilters.includes(format.id)
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
              title={format.description}
            >
              {format.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-purple-400" />
          <label className="text-sm font-medium text-white">Status Filters</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(status => (
            <button
              key={status.id}
              onClick={() => toggleStatusFilter(status.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                config.statusFilters.includes(status.id)
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
              title={status.description}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-purple-400" />
          <label className="text-sm font-medium text-white">Advanced Options</label>
        </div>
        
        <div className="space-y-3">
          {/* No Sequels */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.noSequels}
              onChange={(e) => updateConfig({ noSequels: e.target.checked })}
              className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
            />
            <span className="text-sm text-gray-300">
              &ldquo;No sequels/spin-offs&rdquo; - Prevents Season 1 vs Season 2 matchups
            </span>
          </label>

          {/* High Confidence Only */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.highConfidenceOnly}
              onChange={(e) => updateConfig({ highConfidenceOnly: e.target.checked })}
              className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
            />
            <span className="text-sm text-gray-300">
              &ldquo;Only high confidence titles&rdquo; - Rated or sufficient episodes watched
            </span>
          </label>

          {/* Exclude Adult */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.excludeAdult}
              onChange={(e) => updateConfig({ excludeAdult: e.target.checked })}
              className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
            />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">
                &ldquo;Exclude adult content&rdquo;
              </span>
            </div>
          </label>

          {/* Difficulty Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">Difficulty Level</label>
              <span className="text-sm font-medium text-purple-400">
                {config.difficultyLevel <= 30 ? 'Safe Picks' : 
                 config.difficultyLevel <= 70 ? 'Balanced' : 'Chaos Mode'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.difficultyLevel}
              onChange={(e) => updateConfig({ difficultyLevel: parseInt(e.target.value) })}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Safe</span>
              <span>Balanced</span>
              <span>Chaos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
