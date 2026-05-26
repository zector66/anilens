'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSettings } from './settings-context';

const ACCENT_STORAGE_KEY = 'anilens-accent';
const THEME_STORAGE_KEY = 'anilens-theme';
const DEFAULT_ACCENT = '#7c6df2';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  accentColor: string;
  setAccentColor: (color: string) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function applyAccent(color: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--accent-color', color);
  document.documentElement.style.setProperty('--accent-rgb', hexToRgb(color));
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  if (mode === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
}

function getStoredAccent(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  try {
    const stored = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (stored && /^#[0-9A-Fa-f]{6}$/.test(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return DEFAULT_ACCENT;
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // ignore
  }
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useSettings();
  const [accentColor, setAccentColorState] = useState<string>(() => getStoredAccent());
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    // Use settings theme if available, otherwise fall back to localStorage
    const settingsTheme = theme === 'light' || theme === 'dark' ? theme : null;
    return settingsTheme || getStoredTheme();
  });
  const [mounted, setMounted] = useState(false);

  // Sync theme from settings-context when it changes
  useEffect(() => {
    if (theme === 'light' || theme === 'dark') {
      setThemeModeState(theme);
      applyTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    // Apply loaded values to document
    applyAccent(accentColor);
    applyTheme(themeMode);
    // Mount flag to prevent hydration mismatch in theme-dependent renders
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAccentColor = useCallback((color: string) => {
    const validColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : DEFAULT_ACCENT;
    setAccentColorState(validColor);
    applyAccent(validColor);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, validColor);
    } catch {
      // ignore
    }
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    applyTheme(mode);
    // Also update settings-context for persistence
    setTheme(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, [setTheme]);

  const toggleTheme = useCallback(() => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  }, [themeMode, setThemeMode]);

  // Prevent flash of wrong theme on initial render
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          accentColor: DEFAULT_ACCENT,
          setAccentColor: () => {},
          themeMode: 'dark',
          setThemeMode: () => {},
          toggleTheme: () => {},
          isDark: true,
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        accentColor,
        setAccentColor,
        themeMode,
        setThemeMode,
        toggleTheme,
        isDark: themeMode === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
