'use client';

import { useState } from 'react';
import { ModelSettings } from '@/types/model-settings';
import { 
  Settings, 
  X, 
  CheckCircle2, 
  Circle,
  Film,
  Clock,
  Star,
  Shield,
  Sliders,
  RotateCcw
} from 'lucide-react';

interface ModelSettingsPanelProps {
  settings: ModelSettings;
  updateSettings: (updates: Partial<ModelSettings>) => void;
  resetSettings: () => void;
  onClose: () => void;
}

export function ModelSettingsPanel({ settings, updateSettings, resetSettings, onClose }: ModelSettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<'status' | 'format' | 'rating' | 'time' | 'content' | 'recs'>('status');

  const sections = [
    { id: 'status' as const, label: 'List Status', icon: CheckCircle2 },
    { id: 'format' as const, label: 'Formats', icon: Film },
    { id: 'rating' as const, label: 'Ratings', icon: Star },
    { id: 'time' as const, label: 'Time Window', icon: Clock },
    { id: 'content' as const, label: 'Content', icon: Shield },
    { id: 'recs' as const, label: 'Recommendations', icon: Sliders },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a24] rounded-2xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Model Settings</h2>
              <p className="text-sm text-gray-400">Control what counts in your taste profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-white/10 p-4 space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'status' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Which list statuses to include?</h3>
                  <p className="text-sm text-gray-400 mb-4">Only entries with these statuses will count toward your taste profile</p>
                </div>
                <div className="space-y-2">
                  <ToggleOption
                    label="Completed"
                    description="Finished watching/reading"
                    checked={settings.includeCompleted}
                    onChange={(checked) => updateSettings({ includeCompleted: checked })}
                  />
                  <ToggleOption
                    label="Currently Watching/Reading"
                    description="In progress"
                    checked={settings.includeWatching}
                    onChange={(checked) => updateSettings({ includeWatching: checked })}
                  />
                  <ToggleOption
                    label="Paused"
                    description="On hold"
                    checked={settings.includePaused}
                    onChange={(checked) => updateSettings({ includePaused: checked })}
                  />
                  <ToggleOption
                    label="Planning"
                    description="Want to watch/read"
                    checked={settings.includePlanning}
                    onChange={(checked) => updateSettings({ includePlanning: checked })}
                  />
                  <ToggleOption
                    label="Dropped"
                    description="Discontinued"
                    checked={settings.includeDropped}
                    onChange={(checked) => updateSettings({ includeDropped: checked })}
                  />
                </div>
              </div>
            )}

            {activeSection === 'format' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Exclude formats</h3>
                  <p className="text-sm text-gray-400 mb-4">These formats won't count in your taste profile or recommendations</p>
                </div>
                <div className="space-y-2">
                  <ToggleOption
                    label="Movies"
                    description="Feature-length films"
                    checked={settings.excludeMovies}
                    onChange={(checked) => updateSettings({ excludeMovies: checked })}
                  />
                  <ToggleOption
                    label="Shorts"
                    description="Short episodes (< 15 min)"
                    checked={settings.excludeShorts}
                    onChange={(checked) => updateSettings({ excludeShorts: checked })}
                  />
                  <ToggleOption
                    label="OVA"
                    description="Original Video Animation"
                    checked={settings.excludeOVA}
                    onChange={(checked) => updateSettings({ excludeOVA: checked })}
                  />
                  <ToggleOption
                    label="ONA"
                    description="Original Net Animation"
                    checked={settings.excludeONA}
                    onChange={(checked) => updateSettings({ excludeONA: checked })}
                  />
                  <ToggleOption
                    label="Specials"
                    description="Special episodes"
                    checked={settings.excludeSpecials}
                    onChange={(checked) => updateSettings({ excludeSpecials: checked })}
                  />
                  <ToggleOption
                    label="Music Videos"
                    description="Music-focused content"
                    checked={settings.excludeMusic}
                    onChange={(checked) => updateSettings({ excludeMusic: checked })}
                  />
                </div>
              </div>
            )}

            {activeSection === 'rating' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Rating filters</h3>
                  <p className="text-sm text-gray-400 mb-4">Control which ratings to include</p>
                </div>
                <div className="space-y-4">
                  <ToggleOption
                    label="Include unrated entries"
                    description="Entries you haven't scored yet"
                    checked={settings.includeUnrated}
                    onChange={(checked) => updateSettings({ includeUnrated: checked })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Minimum rating: {settings.minRating === 0 ? 'Any' : settings.minRating}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={settings.minRating}
                      onChange={(e) => updateSettings({ minRating: parseInt(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Any</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'time' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Time window</h3>
                  <p className="text-sm text-gray-400 mb-4">Only count entries from this time period</p>
                </div>
                <div className="space-y-2">
                  <RadioOption
                    label="All time"
                    description="Everything you've ever watched/read"
                    checked={settings.timeWindow === 'all-time'}
                    onChange={() => updateSettings({ timeWindow: 'all-time' })}
                  />
                  <RadioOption
                    label="Last year"
                    description="Only entries from the past 12 months"
                    checked={settings.timeWindow === 'last-year'}
                    onChange={() => updateSettings({ timeWindow: 'last-year' })}
                  />
                  <RadioOption
                    label="Last 2 years"
                    description="Recent entries only"
                    checked={settings.timeWindow === 'last-2-years'}
                    onChange={() => updateSettings({ timeWindow: 'last-2-years' })}
                  />
                  <RadioOption
                    label="Last 5 years"
                    description="Modern era focus"
                    checked={settings.timeWindow === 'last-5-years'}
                    onChange={() => updateSettings({ timeWindow: 'last-5-years' })}
                  />
                </div>
              </div>
            )}

            {activeSection === 'content' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Content filters</h3>
                  <p className="text-sm text-gray-400 mb-4">Control what types of content to include</p>
                </div>
                <div className="space-y-2">
                  <ToggleOption
                    label="Include mature content"
                    description="Adult/NSFW content (18+)"
                    checked={settings.includeMature}
                    onChange={(checked) => updateSettings({ includeMature: checked })}
                  />
                </div>
              </div>
            )}

            {activeSection === 'recs' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Recommendation preferences</h3>
                  <p className="text-sm text-gray-400 mb-4">Fine-tune how recommendations work</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Diversity</label>
                    <div className="space-y-2">
                      <RadioOption
                        label="Safe"
                        description="Stick close to what you know you like"
                        checked={settings.recommendationDiversity === 'safe'}
                        onChange={() => updateSettings({ recommendationDiversity: 'safe' })}
                      />
                      <RadioOption
                        label="Balanced"
                        description="Mix of familiar and new"
                        checked={settings.recommendationDiversity === 'balanced'}
                        onChange={() => updateSettings({ recommendationDiversity: 'balanced' })}
                      />
                      <RadioOption
                        label="Adventurous"
                        description="Explore beyond your comfort zone"
                        checked={settings.recommendationDiversity === 'adventurous'}
                        onChange={() => updateSettings({ recommendationDiversity: 'adventurous' })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Favorites influence: {settings.favoriteInfluence}%
                    </label>
                    <p className="text-xs text-gray-400 mb-2">How much to weight your favorites in recommendations</p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={settings.favoriteInfluence}
                      onChange={(e) => updateSettings({ favoriteInfluence: parseInt(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Ignore</span>
                      <span>Heavily weight</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={resetSettings}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to defaults
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleOption({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
    >
      <div className="mt-0.5">
        {checked ? (
          <CheckCircle2 className="w-5 h-5 text-purple-400" />
        ) : (
          <Circle className="w-5 h-5 text-gray-600" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
    </button>
  );
}

function RadioOption({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
    >
      <div className="mt-0.5">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          checked ? 'border-purple-400' : 'border-gray-600'
        }`}>
          {checked && <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />}
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
    </button>
  );
}
