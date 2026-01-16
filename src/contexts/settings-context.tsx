'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type TitleLanguage = 'romaji' | 'english' | 'native';

interface SettingsContextType {
  titleLanguage: TitleLanguage;
  setTitleLanguage: (lang: TitleLanguage) => void;
  getPreferredTitle: (titles: { romaji?: string; english?: string; native?: string; userPreferred?: string }) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'anilist-dashboard-settings';

interface StoredSettings {
  titleLanguage: TitleLanguage;
}

// Helper to load settings from localStorage immediately
function getStoredSettings(): StoredSettings {
  if (typeof window === 'undefined') return { titleLanguage: 'romaji' };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { titleLanguage: 'romaji' };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage IMMEDIATELY to prevent flash of defaults
  const [titleLanguage, setTitleLanguageState] = useState<TitleLanguage>(() => 
    getStoredSettings().titleLanguage
  );

  // Log on mount for debugging
  useEffect(() => {
    console.log('[SettingsProvider] Initialized with titleLanguage:', titleLanguage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save settings to localStorage when changed
  const setTitleLanguage = (lang: TitleLanguage) => {
    setTitleLanguageState(lang);
    try {
      const settings: StoredSettings = { titleLanguage: lang };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
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
    <SettingsContext.Provider value={{ titleLanguage, setTitleLanguage, getPreferredTitle }}>
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
