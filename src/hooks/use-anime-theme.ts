'use client';

import { useState, useEffect } from 'react';
import { getThemeProvider, ThemeMetadata } from '@/lib/theme-provider';

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
          // Pick a random OP/ED theme
          const opThemes = result.themes.filter(t => t.type === 'OP');
          const selectedTheme = opThemes.length > 0 
            ? opThemes[Math.floor(Math.random() * opThemes.length)]
            : result.themes[Math.floor(Math.random() * result.themes.length)];
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
