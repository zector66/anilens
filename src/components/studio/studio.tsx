'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAnimeList, useMangaList } from '@/hooks/use-anilist';
import { normalizeMediaList } from '@/lib/normalize-media-list';
import { TasteAnalyzer } from '@/lib/taste-analyzer';
import { buildStudioPosterProfile, filterByTimeWindow, filterByStatus, filterByFormat } from '@/lib/studio-profile-builder';
import { StudioPoster } from './studio-poster';
import { StudioPosterSettings, DEFAULT_POSTER_SETTINGS, TimeWindow, PosterStylePreset } from '@/types/studio';
import { 
  Download, 
  Share2, 
  Settings, 
  RefreshCw,
  Clock,
  Filter,
  Palette,
  Check,
  Sparkles
} from 'lucide-react';
import { toPng } from 'html-to-image';

type MediaMode = 'ANIME' | 'MANGA';

const ACCENT_COLORS = [
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
];

const TIME_WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: 'ALL_TIME', label: 'All Time' },
  { value: '12M', label: 'Last 12 Months' },
  { value: '90D', label: 'Last 90 Days' },
];

const STYLE_PRESETS: { value: PosterStylePreset; label: string }[] = [
  { value: 'clean-dark', label: 'Clean Dark' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'neon', label: 'Neon' },
];

export function Studio() {
  const { user } = useAuth();
  const posterRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<MediaMode>('ANIME');
  const [settings, setSettings] = useState<StudioPosterSettings>(DEFAULT_POSTER_SETTINGS);
  const [isExporting, setIsExporting] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const { data: animeList, isLoading: animeLoading } = useAnimeList(user?.id || 0);
  const { data: mangaList, isLoading: mangaLoading } = useMangaList(user?.id || 0);
  
  const isLoading = mode === 'ANIME' ? animeLoading : mangaLoading;
  const currentList = mode === 'ANIME' ? animeList : mangaList;
  
  const allEntries = useMemo(() => normalizeMediaList(currentList, {
    statuses: ['COMPLETED', 'CURRENT', 'REPEATING', 'PAUSED', 'DROPPED', 'PLANNING'],
  }), [currentList]);
  
  const filteredEntries = useMemo(() => {
    let entries = filterByTimeWindow(allEntries, settings.timeWindow);
    entries = filterByStatus(entries, settings.statuses);
    entries = filterByFormat(entries, settings.excludeFormats);
    return entries;
  }, [allEntries, settings]);
  
  const tasteProfile = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    return TasteAnalyzer.analyzeTaste(filteredEntries, mode);
  }, [filteredEntries, mode]);
  
  const posterProfile = useMemo(() => {
    if (!tasteProfile || !user) return null;
    
    // Get accurate stats from user's AniList statistics when available
    const userStats = mode === 'ANIME' 
      ? (user as any).statistics?.anime
      : (user as any).statistics?.manga;
    
    return buildStudioPosterProfile(
      tasteProfile,
      {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        bannerImage: (user as any).bannerImage,
        statistics: userStats,
      },
      filteredEntries,
      mode,
      settings
    );
  }, [tasteProfile, user, filteredEntries, mode, settings]);
  
  const handleExport = useCallback(async () => {
    if (!posterRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: settings.theme.mode === 'dark' ? '#0a0a0f' : '#f3f4f6',
      });
      
      const link = document.createElement('a');
      link.download = `${user?.name || 'anilens'}-taste-poster.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [settings.theme.mode, user?.name]);
  
  const handleShare = useCallback(() => {
    const shareText = `Check out my ${mode.toLowerCase()} taste profile on AniLens! 🎬\n\n${posterProfile?.summaryLine || ''}\n\nhttps://anilens.vercel.app`;
    navigator.clipboard.writeText(shareText);
    alert('Share text copied to clipboard!');
  }, [mode, posterProfile?.summaryLine]);
  
  const updateSettings = useCallback((updates: Partial<StudioPosterSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateTheme = useCallback((updates: Partial<StudioPosterSettings['theme']>) => {
    setSettings(prev => ({
      ...prev,
      theme: { ...prev.theme, ...updates }
    }));
  }, []);
  
  const toggleStatus = useCallback((status: string) => {
    setSettings(prev => {
      const statuses = prev.statuses as string[];
      const newStatuses = statuses.includes(status)
        ? statuses.filter(s => s !== status)
        : [...statuses, status];
      return { ...prev, statuses: newStatuses as typeof prev.statuses };
    });
  }, []);
  
  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign in to use Studio</h2>
          <p className="text-gray-400">Create beautiful, shareable taste posters</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Loading your data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Controls Panel */}
      <div className={`lg:w-80 flex-shrink-0 ${showControls ? '' : 'hidden lg:block'}`}>
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden sticky top-4">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Studio Builder
            </h2>
            <p className="text-sm text-gray-400 mt-1">Customize your taste poster</p>
          </div>
          
          {/* Mode Toggle */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('ANIME')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'ANIME'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Anime
              </button>
              <button
                onClick={() => setMode('MANGA')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'MANGA'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Manga
              </button>
            </div>
          </div>
          
          {/* Settings Sections */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* Time Window */}
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Time Window
              </h3>
              <div className="space-y-2">
                {TIME_WINDOWS.map(tw => (
                  <label key={tw.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="timeWindow"
                      checked={settings.timeWindow === tw.value}
                      onChange={() => updateSettings({ timeWindow: tw.value })}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      settings.timeWindow === tw.value
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-600'
                    }`}>
                      {settings.timeWindow === tw.value && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    <span className="text-gray-300 text-sm">{tw.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                Include Status
              </h3>
              <div className="space-y-2">
                {['COMPLETED', 'CURRENT', 'REPEATING', 'PAUSED', 'DROPPED'].map(status => (
                  <label key={status} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(settings.statuses as string[]).includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                      (settings.statuses as string[]).includes(status)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-600'
                    }`}>
                      {(settings.statuses as string[]).includes(status) && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    <span className="text-gray-300 text-sm capitalize">{status.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Theme */}
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-gray-400" />
                Theme
              </h3>
              
              {/* Dark/Light Mode */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateTheme({ mode: 'dark' })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      settings.theme.mode === 'dark'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => updateTheme({ mode: 'light' })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      settings.theme.mode === 'light'
                        ? 'bg-gray-200 text-gray-900'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Light
                  </button>
                </div>
              </div>
              
              {/* Accent Color */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Accent</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => updateTheme({ accent: color.value })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        settings.theme.accent === color.value
                          ? 'border-white scale-110'
                          : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              
              {/* Style Preset */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Style</label>
                <div className="flex gap-2">
                  {STYLE_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => updateTheme({ stylePreset: preset.value })}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs ${
                        settings.theme.stylePreset === preset.value
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                          : 'bg-gray-800 text-gray-400 border border-transparent'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-4 space-y-2">
            <button
              onClick={handleExport}
              disabled={isExporting || !posterProfile}
              className="w-full px-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export PNG
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              disabled={!posterProfile}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Copy Share Text
            </button>
          </div>
        </div>
      </div>
      
      {/* Preview Panel */}
      <div className="flex-1 flex flex-col items-center overflow-hidden">
        <div className="mb-4 flex items-center justify-between w-full px-4">
          <h3 className="text-sm font-medium text-gray-400">
            Live Preview • {filteredEntries.length} titles • 1600×900
          </h3>
          <button
            onClick={() => setShowControls(!showControls)}
            className="lg:hidden text-gray-400 hover:text-white p-2"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        {posterProfile ? (
          <div className="relative w-full flex-1 flex items-start justify-center overflow-auto p-4">
            {/* Scaled preview container */}
            <div 
              className="origin-top-left"
              style={{ 
                transform: 'scale(0.55)',
                transformOrigin: 'top center',
              }}
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <StudioPoster ref={posterRef} profile={posterProfile} />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 text-center mx-4">
            <p className="text-gray-400">
              {filteredEntries.length === 0
                ? 'No entries match your current filters'
                : 'Loading preview...'}
            </p>
          </div>
        )}
        
        {/* Tips */}
        <div className="py-4 px-4 text-center border-t border-gray-800/50 w-full mt-auto">
          <p className="text-xs text-gray-500">
            Poster exports at full 1600×900 resolution (2x for high-DPI displays)
          </p>
        </div>
      </div>
    </div>
  );
}

export default Studio;
