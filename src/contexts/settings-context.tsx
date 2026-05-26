'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type TitleLanguage = 'romaji' | 'english' | 'native';
export type Theme = 'light' | 'dark' | 'system';
export type GridLayout = 'compact' | 'comfortable' | 'spacious';
export type ImageQuality = 'low' | 'medium' | 'high';
export type DefaultSort = 'POPULARITY_DESC' | 'SCORE_DESC' | 'TRENDING_DESC' | 'START_DATE_DESC' | 'START_DATE';
export type ResultsPerPage = '20' | '50' | '100';
export type MinimumScore = '0' | '5' | '6' | '7' | '8';
export type StatusFilter = 'all' | 'releasing' | 'finished' | 'not_yet_released';

interface SettingsContextType {
  titleLanguage: TitleLanguage;
  setTitleLanguage: (lang: TitleLanguage) => void;
  getPreferredTitle: (titles: { romaji?: string; english?: string; native?: string; userPreferred?: string }) => string;
  showSpoilers: boolean;
  setShowSpoilers: (show: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  gridLayout: GridLayout;
  setGridLayout: (layout: GridLayout) => void;
  imageQuality: ImageQuality;
  setImageQuality: (quality: ImageQuality) => void;
  adultContent: boolean;
  setAdultContent: (show: boolean) => void;
  minimumScore: MinimumScore;
  setMinimumScore: (score: MinimumScore) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  defaultSort: DefaultSort;
  setDefaultSort: (sort: DefaultSort) => void;
  resultsPerPage: ResultsPerPage;
  setResultsPerPage: (perPage: ResultsPerPage) => void;
  autoLoadRecommendations: boolean;
  setAutoLoadRecommendations: (enabled: boolean) => void;
  watchHistory: boolean;
  setWatchHistory: (enabled: boolean) => void;
  searchHistory: boolean;
  setSearchHistory: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'anilist-dashboard-settings';

interface StoredSettings {
  titleLanguage: TitleLanguage;
  showSpoilers?: boolean;
  theme?: Theme;
  gridLayout?: GridLayout;
  imageQuality?: ImageQuality;
  adultContent?: boolean;
  minimumScore?: MinimumScore;
  statusFilter?: StatusFilter;
  defaultSort?: DefaultSort;
  resultsPerPage?: ResultsPerPage;
  autoLoadRecommendations?: boolean;
  watchHistory?: boolean;
  searchHistory?: boolean;
}

// Helper to load settings from localStorage immediately
function getStoredSettings(): StoredSettings {
  if (typeof window === 'undefined') return { 
    titleLanguage: 'romaji', 
    showSpoilers: false,
    theme: 'dark',
    gridLayout: 'comfortable',
    imageQuality: 'high',
    adultContent: false,
    minimumScore: '0',
    statusFilter: 'all',
    defaultSort: 'POPULARITY_DESC',
    resultsPerPage: '50',
    autoLoadRecommendations: true,
    watchHistory: true,
    searchHistory: false
  };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { 
        titleLanguage: parsed.titleLanguage ?? 'romaji', 
        showSpoilers: parsed.showSpoilers ?? false,
        theme: parsed.theme ?? 'dark',
        gridLayout: parsed.gridLayout ?? 'comfortable',
        imageQuality: parsed.imageQuality ?? 'high',
        adultContent: parsed.adultContent ?? false,
        minimumScore: parsed.minimumScore ?? '0',
        statusFilter: parsed.statusFilter ?? 'all',
        defaultSort: parsed.defaultSort ?? 'POPULARITY_DESC',
        resultsPerPage: parsed.resultsPerPage ?? '50',
        autoLoadRecommendations: parsed.autoLoadRecommendations ?? true,
        watchHistory: parsed.watchHistory ?? true,
        searchHistory: parsed.searchHistory ?? false
      };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { 
    titleLanguage: 'romaji', 
    showSpoilers: false,
    theme: 'dark',
    gridLayout: 'comfortable',
    imageQuality: 'high',
    adultContent: false,
    minimumScore: '0',
    statusFilter: 'all',
    defaultSort: 'POPULARITY_DESC',
    resultsPerPage: '50',
    autoLoadRecommendations: true,
    watchHistory: true,
    searchHistory: false
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage IMMEDIATELY to prevent flash of defaults
  const stored = getStoredSettings();
  const [titleLanguage, setTitleLanguageState] = useState<TitleLanguage>(() => stored.titleLanguage);
  const [showSpoilers, setShowSpoilersState] = useState<boolean>(() => stored.showSpoilers ?? false);
  const [theme, setThemeState] = useState<Theme>(() => stored.theme ?? 'dark');
  const [gridLayout, setGridLayoutState] = useState<GridLayout>(() => stored.gridLayout ?? 'comfortable');
  const [imageQuality, setImageQualityState] = useState<ImageQuality>(() => stored.imageQuality ?? 'high');
  const [adultContent, setAdultContentState] = useState<boolean>(() => stored.adultContent ?? false);
  const [minimumScore, setMinimumScoreState] = useState<MinimumScore>(() => stored.minimumScore ?? '0');
  const [statusFilter, setStatusFilterState] = useState<StatusFilter>(() => stored.statusFilter ?? 'all');
  const [defaultSort, setDefaultSortState] = useState<DefaultSort>(() => stored.defaultSort ?? 'POPULARITY_DESC');
  const [resultsPerPage, setResultsPerPageState] = useState<ResultsPerPage>(() => stored.resultsPerPage ?? '50');
  const [autoLoadRecommendations, setAutoLoadRecommendationsState] = useState<boolean>(() => stored.autoLoadRecommendations ?? true);
  const [watchHistory, setWatchHistoryState] = useState<boolean>(() => stored.watchHistory ?? true);
  const [searchHistory, setSearchHistoryState] = useState<boolean>(() => stored.searchHistory ?? false);

  // Log on mount for debugging
  useEffect(() => {
    console.log('[SettingsProvider] Initialized with all settings');
  }, []);

  // Persist all settings together
  const persistSettings = useCallback((partial: Partial<StoredSettings>) => {
    try {
      const current = getStoredSettings();
      const next: StoredSettings = { ...current, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, []);

  // Save settings to localStorage when changed
  const setTitleLanguage = (lang: TitleLanguage) => {
    setTitleLanguageState(lang);
    persistSettings({ titleLanguage: lang });
  };

  const setShowSpoilers = (show: boolean) => {
    setShowSpoilersState(show);
    persistSettings({ showSpoilers: show });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    persistSettings({ theme: newTheme });
  };

  const setGridLayout = (layout: GridLayout) => {
    setGridLayoutState(layout);
    persistSettings({ gridLayout: layout });
  };

  const setImageQuality = (quality: ImageQuality) => {
    setImageQualityState(quality);
    persistSettings({ imageQuality: quality });
  };

  const setAdultContent = (show: boolean) => {
    setAdultContentState(show);
    persistSettings({ adultContent: show });
  };

  const setMinimumScore = (score: MinimumScore) => {
    setMinimumScoreState(score);
    persistSettings({ minimumScore: score });
  };

  const setStatusFilter = (filter: StatusFilter) => {
    setStatusFilterState(filter);
    persistSettings({ statusFilter: filter });
  };

  const setDefaultSort = (sort: DefaultSort) => {
    setDefaultSortState(sort);
    persistSettings({ defaultSort: sort });
  };

  const setResultsPerPage = (perPage: ResultsPerPage) => {
    setResultsPerPageState(perPage);
    persistSettings({ resultsPerPage: perPage });
  };

  const setAutoLoadRecommendations = (enabled: boolean) => {
    setAutoLoadRecommendationsState(enabled);
    persistSettings({ autoLoadRecommendations: enabled });
  };

  const setWatchHistory = (enabled: boolean) => {
    setWatchHistoryState(enabled);
    persistSettings({ watchHistory: enabled });
  };

  const setSearchHistory = (enabled: boolean) => {
    setSearchHistoryState(enabled);
    persistSettings({ searchHistory: enabled });
  };

  // Helper to get preferred title based on language setting
  const getPreferredTitle = useCallback((titles: { romaji?: string; english?: string; native?: string; userPreferred?: string }): string => {
    switch (titleLanguage) {
      case 'english':
        return titles.english || titles.romaji || titles.native || titles.userPreferred || 'Unknown';
      case 'native':
        return titles.native || titles.romaji || titles.english || titles.userPreferred || 'Unknown';
      case 'romaji':
      default:
        return titles.romaji || titles.english || titles.native || titles.userPreferred || 'Unknown';
    }
  }, [titleLanguage]);

  return (
    <SettingsContext.Provider value={{ 
      titleLanguage, 
      setTitleLanguage, 
      getPreferredTitle, 
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
      setSearchHistory
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Hook for getting preferred title - can be used without full context
export function useTitleLanguage() {
  const context = useContext(SettingsContext);
  return context?.titleLanguage || 'romaji';
}
