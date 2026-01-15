'use client';

import React from 'react';
import { useContentFilter } from '@/components/content-filter-provider';
import { Shield, Eye, EyeOff, Sparkles } from 'lucide-react';

/**
 * Content Filter Settings Panel
 * 
 * Allows users to control adult content filtering across the app.
 * Appears in the settings panel.
 */
export function ContentFilterPanel() {
  const { settings, updateSettings, isSafeMode } = useContentFilter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className={`w-5 h-5 ${isSafeMode ? 'text-green-400' : 'text-yellow-400'}`} />
        <div>
          <h3 className="text-lg font-semibold text-white">Content Filter</h3>
          <p className="text-sm text-gray-400">
            Control what content appears in games, recommendations, and studio cards
          </p>
        </div>
      </div>

      {/* Safe Mode Indicator */}
      <div className={`p-3 rounded-lg border ${
        isSafeMode 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-yellow-500/10 border-yellow-500/30'
      }`}>
        <div className="flex items-center gap-2">
          {isSafeMode ? (
            <>
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Safe Mode Active</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Adult Content Allowed</span>
            </>
          )}
        </div>
      </div>

      {/* Filter Options */}
      <div className="space-y-4">
        {/* Hide Adult Content */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={settings.hideAdult}
              onChange={(e) => updateSettings({ hideAdult: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-gray-600 bg-gray-800 
                       checked:bg-purple-500 checked:border-purple-500
                       focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-0
                       transition-all cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                Hide Adult (18+) Content
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                Recommended
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Filters out adult-rated titles from games, recommendations, and studio cards
            </p>
          </div>
        </label>

        {/* Hide Ecchi Content */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={settings.hideEcchi}
              onChange={(e) => updateSettings({ hideEcchi: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-gray-600 bg-gray-800 
                       checked:bg-purple-500 checked:border-purple-500
                       focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-0
                       transition-all cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
              Hide Ecchi/Suggestive Content
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Also filters titles with ecchi tags or fanservice themes
            </p>
          </div>
        </label>

        {/* Blur NSFW Covers */}
        <label className="flex items-start gap-3 cursor-pointer group opacity-50 pointer-events-none">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={settings.blurNsfwCovers}
              onChange={(e) => updateSettings({ blurNsfwCovers: e.target.checked })}
              disabled
              className="w-5 h-5 rounded border-2 border-gray-600 bg-gray-800 
                       checked:bg-purple-500 checked:border-purple-500
                       focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-0
                       transition-all cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                Blur NSFW Covers
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Show blurred covers with click-to-reveal instead of hiding completely
            </p>
          </div>
        </label>

        {/* Include in Analysis */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={settings.includeInAnalysis}
              onChange={(e) => updateSettings({ includeInAnalysis: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-gray-600 bg-gray-800 
                       checked:bg-purple-500 checked:border-purple-500
                       focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-0
                       transition-all cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                Include in Taste Analysis
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Keep adult content in your taste profile calculations for statistical accuracy
            </p>
          </div>
        </label>
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
        <p className="text-xs text-gray-300 leading-relaxed">
          <strong className="text-purple-400">Note:</strong> These settings apply globally across games, 
          recommendations, studio cards, and leaderboards. Your preferences are saved to your account 
          and sync across devices.
        </p>
      </div>
    </div>
  );
}
