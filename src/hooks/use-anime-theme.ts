'use client';

import { useState, useEffect } from 'react';
import { getThemeProvider, ThemeMetadata } from '@/lib/theme-provider';

// Track recently played themes to avoid repetition
const RECENT_THEMES_KEY = 'recent-played-themes';
const MAX_RECENT_THEMES = 30;

function getRecentThemeIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_THEMES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentThemeId(themeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentThemeIds();
    const updated = [themeId, ...recent.filter(id => id !== themeId)].slice(0, MAX_RECENT_THEMES);
    localStorage.setItem(RECENT_THEMES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

interface UseAnimeThemeResult {
  theme: ThemeMetadata | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAnimeTheme(anilistId: number | undefined): UseAnimeThemeResult {
  const [theme, setTheme] = useState<ThemeMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (!anilistId) {
      setTheme(null);
      setError(null);
      return;
    }

    let cancelled = false;
    
    async function fetchTheme() {
      setIsLoading(true);
      setError(null);
      
      try {
        const provider = getThemeProvider();
        const result = await provider.getThemesByAniListId(anilistId!);
        
        if (cancelled) return;
        
        if (result.success && result.themes.length > 0) {
          // Get recently played theme IDs to avoid repetition
          const recentIds = new Set(getRecentThemeIds());
          
          // Filter to OPs first, then all themes
          const opThemes = result.themes.filter(t => t.type === 'OP');
          const edThemes = result.themes.filter(t => t.type === 'ED');
          const allThemes = [...opThemes, ...edThemes];
          
          // Try to find a theme that hasn't been played recently
          let availableThemes = allThemes.filter(t => !recentIds.has(t.id));
          
          // If all themes were recently played, use all of them
          if (availableThemes.length === 0) {
            availableThemes = allThemes;
          }
          
          // Truly random selection using crypto if available
          let randomIndex: number;
          if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            randomIndex = array[0] % availableThemes.length;
          } else {
            randomIndex = Math.floor(Math.random() * availableThemes.length);
          }
          
          const selectedTheme = availableThemes[randomIndex];
          
          // Save this theme as recently played
          saveRecentThemeId(selectedTheme.id);
          
          setTheme(selectedTheme);
        } else {
          setError(result.error || 'No theme found');
          setTheme(null);
        }
      } catch {
        if (cancelled) return;
        setError('Failed to fetch theme');
        setTheme(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchTheme();
    
    return () => {
      cancelled = true;
    };
  }, [anilistId, fetchKey]);

  const refetch = () => setFetchKey(k => k + 1);

  return { theme, isLoading, error, refetch };
}

// Batch fetch themes for multiple anime IDs
export function useAnimeThemes(anilistIds: number[]): {
  themes: Map<number, ThemeMetadata>;
  isLoading: boolean;
  errors: Map<number, string>;
} {
  const [themes, setThemes] = useState<Map<number, ThemeMetadata>>(new Map());
  const [errors, setErrors] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (anilistIds.length === 0) {
      setThemes(new Map());
      setErrors(new Map());
      return;
    }

    let cancelled = false;
    
    async function fetchThemes() {
      setIsLoading(true);
      const provider = getThemeProvider();
      const newThemes = new Map<number, ThemeMetadata>();
      const newErrors = new Map<number, string>();

      // Fetch in batches to respect rate limits
      for (const id of anilistIds) {
        if (cancelled) break;
        
        try {
          const result = await provider.getThemesByAniListId(id);
          
          if (result.success && result.themes.length > 0) {
            const opThemes = result.themes.filter(t => t.type === 'OP');
            const selectedTheme = opThemes.length > 0 
              ? opThemes[0]
              : result.themes[0];
            newThemes.set(id, selectedTheme);
          } else {
            newErrors.set(id, result.error || 'No theme found');
          }
        } catch {
          newErrors.set(id, 'Failed to fetch');
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!cancelled) {
        setThemes(newThemes);
        setErrors(newErrors);
        setIsLoading(false);
      }
    }

    fetchThemes();
    
    return () => {
      cancelled = true;
    };
  }, [anilistIds.join(',')]);

  return { themes, isLoading, errors };
}
