import { useState, useEffect, useCallback } from 'react';
import { ModelSettings, DEFAULT_MODEL_SETTINGS, STORAGE_KEY } from '@/types/model-settings';

export function useModelSettings() {
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_MODEL_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ModelSettings>;
        // Merge with defaults to handle new settings added in updates
        setSettings({ ...DEFAULT_MODEL_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('[ModelSettings] Failed to load settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return; // Don't save on initial load
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('[ModelSettings] Failed to save settings:', error);
    }
  }, [settings, isLoaded]);

  const updateSettings = useCallback((updates: Partial<ModelSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_MODEL_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoaded,
  };
}
