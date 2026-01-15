'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
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
  Sparkles,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Image,
  X,
  CheckCircle2
} from 'lucide-react';
import { toPng } from 'html-to-image';

type MediaMode = 'ANIME' | 'MANGA';
type AspectRatio = 'wide' | 'post' | 'story' | 'square';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ACCENT_COLORS = [
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#f97316', label: 'Orange' },
  { value: '#a855f7', label: 'Violet' },
];

const TIME_WINDOWS: { value: TimeWindow; label: string; desc: string }[] = [
  { value: 'ALL_TIME', label: 'All Time', desc: 'Your complete history' },
  { value: '12M', label: 'Last 12 Months', desc: 'Recent taste evolution' },
  { value: '90D', label: 'Last 90 Days', desc: 'Current season focus' },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string; width: number; height: number; desc: string }[] = [
  { value: 'wide', label: '16:9', width: 1600, height: 900, desc: 'Banner' },
  { value: 'post', label: '4:5', width: 1080, height: 1350, desc: 'Post' },
  { value: 'story', label: '9:16', width: 1080, height: 1920, desc: 'Story' },
  { value: 'square', label: '1:1', width: 1080, height: 1080, desc: 'Square' },
];

const ZOOM_LEVELS = [0.25, 0.35, 0.5, 0.65, 0.8, 1.0];

const STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed', color: '#22c55e' },
  { value: 'CURRENT', label: 'Watching', color: '#3b82f6' },
  { value: 'REPEATING', label: 'Rewatching', color: '#a855f7' },
  { value: 'PAUSED', label: 'Paused', color: '#f59e0b' },
  { value: 'DROPPED', label: 'Dropped', color: '#ef4444' },
];

function CollapsibleSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  icon: React.ComponentType<{ className?: string }>; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-gray-800/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  const bgColor = toast.type === 'success' ? 'bg-green-500/20 border-green-500/50' 
    : toast.type === 'error' ? 'bg-red-500/20 border-red-500/50' 
    : 'bg-blue-500/20 border-blue-500/50';
  
  const iconColor = toast.type === 'success' ? 'text-green-400' 
    : toast.type === 'error' ? 'text-red-400' 
    : 'text-blue-400';
  
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bgColor} animate-in slide-in-from-top-2 duration-200`}>
      <CheckCircle2 className={`w-5 h-5 ${iconColor}`} />
      <span className="text-sm text-white flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

const STORAGE_KEY = 'anilens-studio-settings';

export function Studio() {
  const { user } = useAuth();
  const posterRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  // Load saved settings from localStorage
  const loadSavedSettings = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);
  
  const savedSettings = loadSavedSettings();
  
  const [mode, setMode] = useState<MediaMode>(savedSettings?.mode || 'ANIME');
  const [settings, setSettings] = useState<StudioPosterSettings>(savedSettings?.settings || DEFAULT_POSTER_SETTINGS);
  const [isExporting, setIsExporting] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(savedSettings?.aspectRatio || 'wide');
  const [zoomIndex, setZoomIndex] = useState(savedSettings?.zoomIndex || 2);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: animeList, isLoading: animeLoading } = useAnimeList(user?.id || 0);
  const { data: mangaList, isLoading: mangaLoading } = useMangaList(user?.id || 0);
  
  const isLoading = mode === 'ANIME' ? animeLoading : mangaLoading;
  const currentList = mode === 'ANIME' ? animeList : mangaList;
  const currentAspect = ASPECT_RATIOS.find(a => a.value === aspectRatio) || ASPECT_RATIOS[0];
  const zoom = ZOOM_LEVELS[zoomIndex];
  
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
  
  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const handleExport = useCallback(async () => {
    if (!posterRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#050508',
      });
      
      const link = document.createElement('a');
      link.download = `${user?.name || 'anilens'}-${mode.toLowerCase()}-poster-${aspectRatio}.png`;
      link.href = dataUrl;
      link.click();
      addToast('Poster exported successfully!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      addToast('Export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [user?.name, mode, aspectRatio, addToast]);
  
  const handleCopyShareText = useCallback(async () => {
    const shareText = `Check out my ${mode.toLowerCase()} taste profile on AniLens! 🎬\n\n"${posterProfile?.summaryLine || ''}"\n\n🔗 https://anilens.vercel.app`;
    try {
      await navigator.clipboard.writeText(shareText);
      addToast('Share text copied to clipboard!', 'success');
    } catch {
      addToast('Failed to copy text', 'error');
    }
  }, [mode, posterProfile?.summaryLine, addToast]);
  
  const handleCopyImageToClipboard = useCallback(async () => {
    if (!posterRef.current) return;
    
    try {
      const dataUrl = await toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#050508',
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      addToast('Image copied to clipboard!', 'success');
    } catch {
      addToast('Failed to copy image. Try downloading instead.', 'error');
    }
  }, [addToast]);
  
  const updateSettings = useCallback((updates: Partial<StudioPosterSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateTheme = useCallback((updates: Partial<StudioPosterSettings['theme']>) => {
    setIsTransitioning(true);
    setSettings(prev => ({
      ...prev,
      theme: { ...prev.theme, ...updates }
    }));
    setTimeout(() => setIsTransitioning(false), 150);
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
  
  const handleZoomIn = useCallback(() => {
    setZoomIndex((prev: number) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setZoomIndex((prev: number) => Math.max(prev - 1, 0));
  }, []);
  
  const handleFitToView = useCallback(() => {
    if (!previewContainerRef.current) return;
    const containerWidth = previewContainerRef.current.clientWidth - 48;
    const idealZoom = containerWidth / currentAspect.width;
    const closestIndex = ZOOM_LEVELS.reduce((prev, curr, i) => 
      Math.abs(curr - idealZoom) < Math.abs(ZOOM_LEVELS[prev] - idealZoom) ? i : prev, 0);
    setZoomIndex(closestIndex);
  }, [currentAspect.width]);
  
  // Save settings to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode,
        settings,
        aspectRatio,
        zoomIndex,
      }));
    } catch {
      // Ignore localStorage errors
    }
  }, [mode, settings, aspectRatio, zoomIndex]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Cmd/Ctrl + E to export
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        if (posterProfile && !isExporting) handleExport();
      }
      
      // Cmd/Ctrl + K to copy share text
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (posterProfile) handleCopyShareText();
      }
      
      // + or = to zoom in
      if ((e.key === '+' || e.key === '=') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleZoomIn();
      }
      
      // - to zoom out
      if (e.key === '-' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleZoomOut();
      }
      
      // 0 to fit to view
      if (e.key === '0' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleFitToView();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posterProfile, isExporting, handleExport, handleCopyShareText, handleZoomIn, handleZoomOut, handleFitToView]);
  
  useEffect(() => {
    handleFitToView();
  }, [aspectRatio, handleFitToView]);
  
  // Show generating state briefly when profile changes
  useEffect(() => {
    if (posterProfile) {
      setIsGenerating(true);
      const timer = setTimeout(() => setIsGenerating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [posterProfile]);
  
  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">AniLens Studio</h2>
          <p className="text-gray-400 mb-6">Create beautiful, shareable taste posters that showcase your anime and manga journey.</p>
          <div className="text-sm text-gray-500">Sign in to get started</div>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-400">Loading your {mode.toLowerCase()} data...</p>
          <p className="text-xs text-gray-600 mt-2">This may take a moment for large lists</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
        {toasts.map(toast => (
          <ToastNotification key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
      
      {/* Controls Panel */}
      <div className={`lg:w-80 xl:w-96 flex-shrink-0 border-r border-gray-800/50 bg-gray-900/30 ${showControls ? '' : 'hidden lg:block'}`}>
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800/50 bg-gray-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Studio</h2>
                  <p className="text-xs text-gray-500">{filteredEntries.length} titles selected</p>
                </div>
              </div>
              <button
                onClick={() => setShowControls(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="p-4 border-b border-gray-800/50">
            <div className="flex gap-1 p-1 bg-gray-800/50 rounded-xl">
              <button
                onClick={() => setMode('ANIME')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === 'ANIME'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Anime
              </button>
              <button
                onClick={() => setMode('MANGA')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === 'MANGA'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Manga
              </button>
            </div>
          </div>
          
          {/* Scrollable Settings */}
          <div className="flex-1 overflow-y-auto">
            {/* Aspect Ratio */}
            <CollapsibleSection title="Aspect Ratio" icon={Image} defaultOpen={true}>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
                      aspectRatio === ratio.value
                        ? 'bg-purple-500/20 ring-1 ring-purple-500/50'
                        : 'bg-gray-800/50 hover:bg-gray-700/50'
                    }`}
                  >
                    <div 
                      className={`mb-1 rounded border ${aspectRatio === ratio.value ? 'border-purple-400 bg-purple-400/20' : 'border-gray-600 bg-gray-700'}`}
                      style={{
                        width: ratio.value === 'story' ? 12 : ratio.value === 'square' ? 20 : ratio.value === 'post' ? 16 : 24,
                        height: ratio.value === 'story' ? 20 : ratio.value === 'square' ? 20 : ratio.value === 'post' ? 20 : 14,
                      }}
                    />
                    <span className={`text-xs font-medium ${aspectRatio === ratio.value ? 'text-purple-400' : 'text-gray-400'}`}>
                      {ratio.desc}
                    </span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>
            
            {/* Time Window */}
            <CollapsibleSection title="Time Window" icon={Clock} defaultOpen={true}>
              <div className="space-y-1">
                {TIME_WINDOWS.map(tw => (
                  <button
                    key={tw.value}
                    onClick={() => updateSettings({ timeWindow: tw.value })}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      settings.timeWindow === tw.value
                        ? 'bg-purple-500/20 ring-1 ring-purple-500/50'
                        : 'bg-gray-800/30 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className={`text-sm font-medium ${settings.timeWindow === tw.value ? 'text-white' : 'text-gray-300'}`}>
                        {tw.label}
                      </div>
                      <div className="text-xs text-gray-500">{tw.desc}</div>
                    </div>
                    {settings.timeWindow === tw.value && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </button>
                ))}
              </div>
            </CollapsibleSection>
            
            {/* Status Filter */}
            <CollapsibleSection title="Include Status" icon={Filter} defaultOpen={false}>
              <div className="space-y-1">
                {STATUS_OPTIONS.map(status => {
                  const isSelected = (settings.statuses as string[]).includes(status.value);
                  return (
                    <button
                      key={status.value}
                      onClick={() => toggleStatus(status.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                        isSelected ? 'bg-gray-800/50' : 'bg-gray-800/20 hover:bg-gray-800/40'
                      }`}
                    >
                      <div 
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className={`text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {status.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleSection>
            
            {/* Theme */}
            <CollapsibleSection title="Theme" icon={Palette} defaultOpen={true}>
              <div className="space-y-4">
                {/* Accent Color */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Accent Color</label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => updateTheme({ accent: color.value })}
                        className={`w-8 h-8 rounded-full transition-all duration-200 ${
                          settings.theme.accent === color.value
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
          
          {/* Actions */}
          <div className="p-4 border-t border-gray-800/50 bg-gray-900/50 space-y-2">
            <button
              onClick={handleExport}
              disabled={isExporting || !posterProfile}
              className="w-full px-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
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
            <div className="flex gap-2">
              <button
                onClick={handleCopyImageToClipboard}
                disabled={!posterProfile}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Image
              </button>
              <button
                onClick={handleCopyShareText}
                disabled={!posterProfile}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Text
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview Panel */}
      <div className="flex-1 flex flex-col bg-[#030306]" ref={previewContainerRef}>
        {/* Preview Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50 bg-gray-900/30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowControls(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-medium text-white">Live Preview</h3>
              <p className="text-xs text-gray-500">{currentAspect.width} × {currentAspect.height}</p>
            </div>
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500 mr-2">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">⌘E</kbd>
              <span>Export</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                disabled={zoomIndex === 0}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded transition-colors"
                title="Zoom out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400 w-12 text-center font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded transition-colors"
                title="Zoom in (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-700 mx-1" />
              <button
                onClick={handleFitToView}
                className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
                title="Fit to view (0)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Preview Canvas */}
        <div className="flex-1 overflow-auto p-6">
          {posterProfile ? (
            <div className="flex items-start justify-center min-h-full">
              {isGenerating ? (
                <div 
                  className="rounded-2xl overflow-hidden bg-gray-900/50 animate-pulse"
                  style={{ 
                    width: currentAspect.width * zoom,
                    height: currentAspect.height * zoom,
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-gray-600 animate-spin" />
                  </div>
                </div>
              ) : (
                <div 
                  className={`transition-all duration-200 ${isTransitioning ? 'opacity-80' : 'opacity-100'}`}
                  style={{ 
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                  }}
                >
                  <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                    <div ref={posterRef}>
                      <StudioPoster 
                        profile={{
                          ...posterProfile,
                          settings: {
                            ...posterProfile.settings,
                            theme: settings.theme,
                          }
                        }}
                        width={currentAspect.width}
                        height={currentAspect.height}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Image className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 mb-2">No preview available</p>
                <p className="text-xs text-gray-600">
                  {filteredEntries.length === 0
                    ? 'No entries match your current filters. Try adjusting the status or time window settings.'
                    : 'Loading preview...'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Preview Footer */}
        <div className="px-4 py-3 border-t border-gray-800/50 bg-gray-900/30">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Exports at {currentAspect.width * 2} × {currentAspect.height * 2}px (2x)</span>
            <span>{mode} • {settings.timeWindow === 'ALL_TIME' ? 'All Time' : settings.timeWindow === '12M' ? 'Last 12 Months' : 'Last 90 Days'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Studio;
