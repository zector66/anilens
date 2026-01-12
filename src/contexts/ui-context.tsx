'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { WeatherData, getWeather, WeatherCondition } from '@/lib/weather-service';

type Theme = 'dark' | 'light' | 'system';
type AccentColor = 'purple' | 'blue' | 'green' | 'pink' | 'orange' | 'red' | 'cyan' | 'indigo';

interface UIContextType {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'dark' | 'light';
  
  // Accent Color
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  
  // Animations
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  
  // Sound
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playSound: (sound: 'correct' | 'wrong' | 'tick' | 'victory' | 'rankup') => void;
  
  // Keyboard shortcuts modal
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
  
  // Weather theming
  weatherEnabled: boolean;
  setWeatherEnabled: (enabled: boolean) => void;
  weatherData: WeatherData | null;
  weatherLoading: boolean;
  refreshWeather: () => Promise<void>;
  
  // Weather effects intensity
  weatherIntensity: 'light' | 'medium' | 'heavy';
  setWeatherIntensity: (intensity: 'light' | 'medium' | 'heavy') => void;
  
  // Manual weather override (for testing/preference)
  weatherOverride: WeatherCondition | null;
  setWeatherOverride: (condition: WeatherCondition | null) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

const ACCENT_COLORS: Record<AccentColor, string> = {
  purple: '#a855f7',
  blue: '#3b82f6',
  green: '#10b981',
  pink: '#ec4899',
  orange: '#f59e0b',
  red: '#ef4444',
  cyan: '#06b6d4',
  indigo: '#6366f1',
};

export function UIProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [accentColor, setAccentColorState] = useState<AccentColor>('purple');
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light'>('dark');
  
  // Weather state
  const [weatherEnabled, setWeatherEnabledState] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherIntensity, setWeatherIntensityState] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [weatherOverride, setWeatherOverrideState] = useState<WeatherCondition | null>(null);

  // Fetch weather data
  const refreshWeather = useCallback(async () => {
    if (!weatherEnabled) return;
    
    setWeatherLoading(true);
    try {
      const data = await getWeather();
      setWeatherData(data);
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    } finally {
      setWeatherLoading(false);
    }
  }, [weatherEnabled]);

  // Load preferences from localStorage and apply immediately
  useEffect(() => {
    const root = document.documentElement;
    
    const savedTheme = localStorage.getItem('ui-theme') as Theme | null;
    const savedAccent = localStorage.getItem('ui-accent') as AccentColor | null;
    const savedMotion = localStorage.getItem('ui-reduced-motion');
    const savedSound = localStorage.getItem('ui-sound');
    const savedWeather = localStorage.getItem('ui-weather-enabled');
    const savedWeatherIntensity = localStorage.getItem('ui-weather-intensity') as 'light' | 'medium' | 'heavy' | null;
    const savedWeatherOverride = localStorage.getItem('ui-weather-override') as WeatherCondition | null;

    if (savedTheme) setThemeState(savedTheme);
    if (savedAccent) {
      setAccentColorState(savedAccent);
      // Apply accent color immediately on load
      root.style.setProperty('--accent-color', ACCENT_COLORS[savedAccent]);
      root.setAttribute('data-accent', savedAccent);
    }
    if (savedMotion) setReducedMotionState(savedMotion === 'true');
    if (savedSound !== null) setSoundEnabledState(savedSound !== 'false');
    if (savedWeather === 'true') setWeatherEnabledState(true);
    if (savedWeatherIntensity) setWeatherIntensityState(savedWeatherIntensity);
    if (savedWeatherOverride) setWeatherOverrideState(savedWeatherOverride);

    // Check system preference for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotionState(true);
    }
  }, []);

  // Handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setEffectiveTheme(systemPrefersDark ? 'dark' : 'light');
      root.classList.toggle('dark', systemPrefersDark);
    } else {
      setEffectiveTheme(theme);
      root.classList.toggle('dark', theme === 'dark');
    }
    
    localStorage.setItem('ui-theme', theme);
  }, [theme]);

  // Handle accent color changes
  useEffect(() => {
    const root = document.documentElement;
    // Set both the CSS variable and the data attribute for CSS selectors
    root.style.setProperty('--accent-color', ACCENT_COLORS[accentColor]);
    root.setAttribute('data-accent', accentColor);
    localStorage.setItem('ui-accent', accentColor);
  }, [accentColor]);

  // Handle reduced motion
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    localStorage.setItem('ui-reduced-motion', String(reducedMotion));
  }, [reducedMotion]);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('ui-sound', String(soundEnabled));
  }, [soundEnabled]);

  // Handle weather enabled changes
  useEffect(() => {
    localStorage.setItem('ui-weather-enabled', String(weatherEnabled));
    if (weatherEnabled && !weatherData) {
      refreshWeather();
    }
  }, [weatherEnabled, weatherData, refreshWeather]);

  // Save weather intensity
  useEffect(() => {
    localStorage.setItem('ui-weather-intensity', weatherIntensity);
  }, [weatherIntensity]);

  // Save weather override
  useEffect(() => {
    if (weatherOverride) {
      localStorage.setItem('ui-weather-override', weatherOverride);
    } else {
      localStorage.removeItem('ui-weather-override');
    }
  }, [weatherOverride]);

  // Refresh weather periodically (every 30 minutes)
  useEffect(() => {
    if (!weatherEnabled) return;
    
    const interval = setInterval(() => {
      refreshWeather();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [weatherEnabled, refreshWeather]);

  // Sound player
  const playSound = useCallback((sound: 'correct' | 'wrong' | 'tick' | 'victory' | 'rankup') => {
    if (!soundEnabled) return;
    
    // Create audio context for web audio
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different sounds for different events
      switch (sound) {
        case 'correct':
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'wrong':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'tick':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.05);
          break;
        case 'victory':
          const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
          notes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);
            osc.start(audioContext.currentTime + i * 0.15);
            osc.stop(audioContext.currentTime + i * 0.15 + 0.3);
          });
          break;
        case 'rankup':
          const rankNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4 to G5
          rankNotes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1);
            gain.gain.setValueAtTime(0.25, audioContext.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.4);
            osc.start(audioContext.currentTime + i * 0.1);
            osc.stop(audioContext.currentTime + i * 0.1 + 0.4);
          });
          break;
      }
    } catch {
      // Audio not supported
    }
  }, [soundEnabled]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const setAccentColor = useCallback((c: AccentColor) => setAccentColorState(c), []);
  const setReducedMotion = useCallback((r: boolean) => setReducedMotionState(r), []);
  const setSoundEnabled = useCallback((s: boolean) => setSoundEnabledState(s), []);
  const setWeatherEnabled = useCallback((w: boolean) => setWeatherEnabledState(w), []);
  const setWeatherIntensity = useCallback((i: 'light' | 'medium' | 'heavy') => setWeatherIntensityState(i), []);
  const setWeatherOverride = useCallback((c: WeatherCondition | null) => setWeatherOverrideState(c), []);

  return (
    <UIContext.Provider value={{
      theme,
      setTheme,
      effectiveTheme,
      accentColor,
      setAccentColor,
      reducedMotion,
      setReducedMotion,
      soundEnabled,
      setSoundEnabled,
      playSound,
      showShortcuts,
      setShowShortcuts,
      weatherEnabled,
      setWeatherEnabled,
      weatherData,
      weatherLoading,
      refreshWeather,
      weatherIntensity,
      setWeatherIntensity,
      weatherOverride,
      setWeatherOverride,
    }}>
      {children}
    </UIContext.Provider>
  );
}
