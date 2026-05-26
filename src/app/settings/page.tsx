'use client';

import { useState } from 'react';
import { SmartHeader } from '@/components/layout/smart-header';
import { useSettings } from '@/contexts/settings-context';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Monitor, 
  Filter, 
  Search, 
  Database, 
  ChevronRight,
  Sun
} from 'lucide-react';
import type { 
  Theme, 
  GridLayout, 
  ImageQuality, 
  DefaultSort, 
  ResultsPerPage, 
  MinimumScore, 
  StatusFilter 
} from '@/contexts/settings-context';

type TabKey = 'display' | 'content' | 'search' | 'privacy';


function SettingsLayout({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deepest)' }}>
      <SmartHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Customize your AniLens experience
          </p>
        </div>
        {children}
      </main>
    </div>
  );
}

function SettingToggle({
  icon,
  label,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-md" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-3">
        <div style={{ color: 'var(--text-secondary)' }}>
          {icon}
        </div>
        <div>
          <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            {label}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {description}
          </div>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'opacity-100' : 'opacity-50'
        }`}
        style={{ backgroundColor: enabled ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)' }}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function SettingSelect<T extends string>({
  icon,
  label,
  description,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-md" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-3">
        <div style={{ color: 'var(--text-secondary)' }}>
          {icon}
        </div>
        <div>
          <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            {label}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {description}
          </div>
        </div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="px-3 py-1.5 rounded-md text-sm font-medium outline-none cursor-pointer"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('display');
  const {
    titleLanguage,
    setTitleLanguage,
    showSpoilers,
    setShowSpoilers,
    theme,
    setTheme,
    gridLayout,
    setGridLayout,
    imageQuality,
    setImageQuality,
    adultContent,
    setAdultContent,
    minimumScore,
    setMinimumScore,
    statusFilter,
    setStatusFilter,
    defaultSort,
    setDefaultSort,
    resultsPerPage,
    setResultsPerPage,
    autoLoadRecommendations,
    setAutoLoadRecommendations,
    watchHistory,
    setWatchHistory,
    searchHistory,
    setSearchHistory,
  } = useSettings();

  const tabs = [
    { key: 'display' as const, label: 'Display', icon: <Monitor size={18} /> },
    { key: 'content' as const, label: 'Content', icon: <Filter size={18} /> },
    { key: 'search' as const, label: 'Search', icon: <Search size={18} /> },
    { key: 'privacy' as const, label: 'Privacy', icon: <Database size={18} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'display':
        return (
          <div className="space-y-4">
            <SettingSelect
              icon={<Settings size={18} />}
              label="Title Language"
              description="Choose your preferred title language for anime"
              value={titleLanguage}
              options={[
                { value: 'romaji' as const, label: 'Romaji' },
                { value: 'english' as const, label: 'English' },
                { value: 'native' as const, label: 'Native' },
              ]}
              onChange={setTitleLanguage}
            />
            <SettingSelect<Theme>
              icon={<Sun size={18} />}
              label="Theme"
              description="Choose your preferred color theme"
              value={theme}
              options={[
                { value: 'light' as const, label: 'Light' },
                { value: 'dark' as const, label: 'Dark' },
                { value: 'system' as const, label: 'System' },
              ]}
              onChange={setTheme}
            />
            <SettingSelect<GridLayout>
              icon={<Monitor size={18} />}
              label="Grid Layout"
              description="Adjust the spacing and size of anime cards"
              value={gridLayout}
              options={[
                { value: 'compact' as const, label: 'Compact' },
                { value: 'comfortable' as const, label: 'Comfortable' },
                { value: 'spacious' as const, label: 'Spacious' },
              ]}
              onChange={setGridLayout}
            />
            <SettingSelect<ImageQuality>
              icon={<Monitor size={18} />}
              label="Image Quality"
              description="Choose image quality for bandwidth control"
              value={imageQuality}
              options={[
                { value: 'low' as const, label: 'Low' },
                { value: 'medium' as const, label: 'Medium' },
                { value: 'high' as const, label: 'High' },
              ]}
              onChange={setImageQuality}
            />
            <SettingToggle
              icon={showSpoilers ? <Eye size={18} /> : <EyeOff size={18} />}
              label="Show Spoiler Tags"
              description="Display tags flagged as spoilers on anime/manga detail pages"
              enabled={showSpoilers}
              onChange={setShowSpoilers}
            />
          </div>
        );

      case 'content':
        return (
          <div className="space-y-4">
            <SettingToggle
              icon={<Eye size={18} />}
              label="Adult Content"
              description="Show 18+ anime and manga in search results"
              enabled={adultContent}
              onChange={setAdultContent}
            />
            <SettingSelect<MinimumScore>
              icon={<Filter size={18} />}
              label="Minimum Score"
              description="Hide anime below this rating"
              value={minimumScore}
              options={[
                { value: '0' as const, label: 'No minimum' },
                { value: '5' as const, label: '5+ stars' },
                { value: '6' as const, label: '6+ stars' },
                { value: '7' as const, label: '7+ stars' },
                { value: '8' as const, label: '8+ stars' },
              ]}
              onChange={setMinimumScore}
            />
            <SettingSelect<StatusFilter>
              icon={<Monitor size={18} />}
              label="Status Filter"
              description="Prefer anime with specific release status"
              value={statusFilter}
              options={[
                { value: 'all' as const, label: 'All status' },
                { value: 'releasing' as const, label: 'Currently releasing' },
                { value: 'finished' as const, label: 'Finished' },
                { value: 'not_yet_released' as const, label: 'Not yet released' },
              ]}
              onChange={setStatusFilter}
            />
          </div>
        );

      case 'search':
        return (
          <div className="space-y-4">
            <SettingSelect<DefaultSort>
              icon={<Search size={18} />}
              label="Default Sort"
              description="Default sorting for search results"
              value={defaultSort}
              options={[
                { value: 'POPULARITY_DESC' as const, label: 'Popularity' },
                { value: 'SCORE_DESC' as const, label: 'Score' },
                { value: 'TRENDING_DESC' as const, label: 'Trending' },
                { value: 'START_DATE_DESC' as const, label: 'Newest' },
                { value: 'START_DATE' as const, label: 'Oldest' },
              ]}
              onChange={setDefaultSort}
            />
            <SettingSelect<ResultsPerPage>
              icon={<Monitor size={18} />}
              label="Results Per Page"
              description="Number of search results to show per page"
              value={resultsPerPage}
              options={[
                { value: '20' as const, label: '20 results' },
                { value: '50' as const, label: '50 results' },
                { value: '100' as const, label: '100 results' },
              ]}
              onChange={setResultsPerPage}
            />
            <SettingToggle
              icon={<Search size={18} />}
              label="Auto-load Recommendations"
              description="Automatically load similar anime on detail pages"
              enabled={autoLoadRecommendations}
              onChange={setAutoLoadRecommendations}
            />
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <SettingToggle
              icon={<Database size={18} />}
              label="Watch History"
              description="Keep track of anime you've viewed"
              enabled={watchHistory}
              onChange={setWatchHistory}
            />
            <SettingToggle
              icon={<Search size={18} />}
              label="Search History"
              description="Save your recent searches"
              enabled={searchHistory}
              onChange={setSearchHistory}
            />
            <div className="p-4 rounded-md" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Database size={18} style={{ color: 'var(--text-secondary)' }} />
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      Clear Cache
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Clear all cached data and images
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Clear all cached data
                    if (typeof window !== 'undefined') {
                      // Clear React Query cache
                      const queryClient = (window as { __REACT_QUERY_CLIENT__?: { clear: () => void } }).__REACT_QUERY_CLIENT__;
                      if (queryClient) {
                        queryClient.clear();
                      }

                      // Clear taste analyzer cache
                      import('@/lib/taste-analyzer-cache').then(({ tasteAnalyzerCache }) => {
                        tasteAnalyzerCache.clear();
                      }).catch(() => {
                        // Ignore if module not available
                      });

                      // Clear localStorage cache keys (except settings)
                      const keysToKeep = ['anilist-dashboard-settings', 'anilens-accent', 'anilens-theme'];
                      Object.keys(localStorage).forEach(key => {
                        if (!keysToKeep.includes(key)) {
                          localStorage.removeItem(key);
                        }
                      });

                      // Reload page to clear all memory caches
                      window.location.reload();
                    }
                  }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
                  style={{ background: 'var(--accent-color)', color: '#fff' }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SettingsLayout title="Settings">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  background: activeTab === tab.key ? 'var(--accent-color)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-primary)',
                }}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.key && (
                  <ChevronRight size={16} className="ml-auto" />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {tabs.find(t => t.key === activeTab)?.label}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {activeTab === 'display' && 'Customize how content is displayed'}
              {activeTab === 'content' && 'Control what content you see'}
              {activeTab === 'search' && 'Configure search and discovery preferences'}
              {activeTab === 'privacy' && 'Manage your data and privacy'}
            </p>
          </div>

          {renderTabContent()}
        </div>
      </div>
    </SettingsLayout>
  );
}
