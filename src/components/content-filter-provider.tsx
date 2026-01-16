'use client';

/**
 * Content Filter Provider
 * 
 * Global context for adult content filtering.
 * Syncs with localStorage immediately, Supabase when user is logged in.
 * 
 * IMPORTANT: This provider uses authManager directly to get userId,
 * so it's self-sufficient and doesn't need props from parent.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  ContentFilterSettings,
  DEFAULT_CONTENT_FILTER,
  getContentFilterFromStorage,
  saveContentFilterToStorage,
  loadContentFilterFromSupabase,
  saveContentFilterToSupabase,
} from '@/lib/content-filter';
import { authManager } from '@/lib/auth';

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
}

export function ContentFilterProvider({ children }: ContentFilterProviderProps) {
  // Load localStorage IMMEDIATELY before any state initialization
  const initialSettings = useRef<ContentFilterSettings | null>(null);
  if (typeof window !== 'undefined' && initialSettings.current === null) {
    initialSettings.current = getContentFilterFromStorage();
  }
  
  const [settings, setSettings] = useState<ContentFilterSettings>(
    initialSettings.current || DEFAULT_CONTENT_FILTER
  );
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const hasLoadedFromStorage = useRef(false);
  const hasLoadedFromSupabase = useRef(false);

  // Subscribe to auth changes to get userId
  useEffect(() => {
    const unsubscribe = authManager.subscribe((authState) => {
      const newUserId = authState.user?.id || null;
      setUserId(newUserId);
    });
    return unsubscribe;
  }, []);

  // Load settings from localStorage on mount (only once)
  useEffect(() => {
    if (hasLoadedFromStorage.current) return;
    hasLoadedFromStorage.current = true;
    
    const localSettings = getContentFilterFromStorage();
    console.log('[ContentFilter] Loaded from localStorage:', localSettings);
    setSettings(localSettings);
  }, []);

  // Load from Supabase when userId becomes available
  useEffect(() => {
    if (!userId || userId <= 0 || hasLoadedFromSupabase.current) return;
    
    const loadFromSupabase = async () => {
      setIsLoading(true);
      try {
        const supabaseSettings = await loadContentFilterFromSupabase(userId);
        if (supabaseSettings) {
          console.log('[ContentFilter] Loaded from Supabase:', supabaseSettings);
          setSettings(supabaseSettings);
          // Sync to localStorage
          saveContentFilterToStorage(supabaseSettings);
          hasLoadedFromSupabase.current = true;
        }
      } catch (err) {
        console.error('[ContentFilter] Failed to load from Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFromSupabase();
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
    isLoading,
    isSafeMode: settings.hideAdult,
  };

  return (
    <ContentFilterContext.Provider value={value}>
      {children}
    </ContentFilterContext.Provider>
  );
}
