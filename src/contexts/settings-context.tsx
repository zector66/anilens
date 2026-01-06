'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [titleLanguage, setTitleLanguageState] = useState<TitleLanguage>('romaji');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings: StoredSettings = JSON.parse(stored);
        if (settings.titleLanguage) {
          setTitleLanguageState(settings.titleLanguage);
        }
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    setIsHydrated(true);
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
  const getPreferredTitle = (titles: { romaji?: string; english?: string; native?: string; userPreferred?: string }): string => {
    switch (titleLanguage) {
      case 'english':
        return titles.english || titles.romaji || titles.native || titles.userPreferred || 'Unknown';
      case 'native':
        return titles.native || titles.romaji || titles.english || titles.userPreferred || 'Unknown';
      case 'romaji':
      default:
        return titles.romaji || titles.english || titles.native || titles.userPreferred || 'Unknown';
    }
  };

  // Prevent hydration mismatch
  if (!isHydrated) {
    return <>{children}</>;
  }

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
