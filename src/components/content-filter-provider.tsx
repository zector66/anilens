'use client';

/**
 * Content Filter Provider
 * 
 * Global context for adult content filtering.
 * Syncs with localStorage immediately, Supabase when user is logged in.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ContentFilterSettings,
  DEFAULT_CONTENT_FILTER,
  getContentFilterFromStorage,
  saveContentFilterToStorage,
  loadContentFilterFromSupabase,
  saveContentFilterToSupabase,
} from '@/lib/content-filter';

interface ContentFilterContextType {
  settings: ContentFilterSettings;
  updateSettings: (updates: Partial<ContentFilterSettings>) => void;
  toggleAdultFilter: () => void;
  toggleEcchiFilter: () => void;
  toggleBlurMode: () => void;
  isLoading: boolean;
  isSafeMode: boolean; // Quick check: hideAdult is ON
}

const ContentFilterContext = createContext<ContentFilterContextType | null>(null);

export function useContentFilter() {
  const context = useContext(ContentFilterContext);
  if (!context) {
    throw new Error('useContentFilter must be used within ContentFilterProvider');
  }
  return context;
}

// Safe hook that returns defaults if outside provider
export function useContentFilterSafe(): ContentFilterContextType {
  const context = useContext(ContentFilterContext);
  if (!context) {
    return {
      settings: DEFAULT_CONTENT_FILTER,
      updateSettings: () => {},
      toggleAdultFilter: () => {},
      toggleEcchiFilter: () => {},
      toggleBlurMode: () => {},
      isLoading: false,
      isSafeMode: true,
    };
  }
  return context;
}

interface ContentFilterProviderProps {
  children: React.ReactNode;
  userId?: number | null;
}

export function ContentFilterProvider({ children, userId }: ContentFilterProviderProps) {
  const [settings, setSettings] = useState<ContentFilterSettings>(DEFAULT_CONTENT_FILTER);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      
      // First, load from localStorage (immediate)
      const localSettings = getContentFilterFromStorage();
      setSettings(localSettings);
      setIsInitialized(true);
      
      // Then, try to load from Supabase if user is logged in
      if (userId && userId > 0) {
        const supabaseSettings = await loadContentFilterFromSupabase(userId);
        if (supabaseSettings) {
          setSettings(supabaseSettings);
          // Sync to localStorage
          saveContentFilterToStorage(supabaseSettings);
        }
      }
      
      setIsLoading(false);
    };
    
    loadSettings();
  }, [userId]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<ContentFilterSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      
      // Save to localStorage immediately
      saveContentFilterToStorage(newSettings);
      
      // Save to Supabase asynchronously (if logged in)
      if (userId && userId > 0) {
        saveContentFilterToSupabase(userId, newSettings).catch(err => {
          console.error('[ContentFilter] Failed to sync to Supabase:', err);
        });
      }
      
      return newSettings;
    });
  }, [userId]);

  // Quick toggles
  const toggleAdultFilter = useCallback(() => {
    updateSettings({ hideAdult: !settings.hideAdult });
  }, [settings.hideAdult, updateSettings]);

  const toggleEcchiFilter = useCallback(() => {
    updateSettings({ hideEcchi: !settings.hideEcchi });
  }, [settings.hideEcchi, updateSettings]);

  const toggleBlurMode = useCallback(() => {
    updateSettings({ blurNsfwCovers: !settings.blurNsfwCovers });
  }, [settings.blurNsfwCovers, updateSettings]);

  const value: ContentFilterContextType = {
    settings,
    updateSettings,
    toggleAdultFilter,
    toggleEcchiFilter,
    toggleBlurMode,
    isLoading: isLoading && !isInitialized,
    isSafeMode: settings.hideAdult,
  };

  return (
    <ContentFilterContext.Provider value={value}>
      {children}
    </ContentFilterContext.Provider>
  );
}
