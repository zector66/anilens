'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  X, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  Palette,
  Zap,
  Monitor,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Languages,
  CloudRain,
  CloudSnow,
  CloudSun,
  Cloud,
  CloudLightning,
  CloudFog,
  Sparkles,
  RefreshCw,
  MapPin,
  Loader2
} from 'lucide-react';
import { KeyboardShortcutsHelp } from '@/components/ui/tooltip';
import { useSettings as useGlobalSettings, TitleLanguage } from '@/contexts/settings-context';
import { useUI } from '@/contexts/ui-context';
import { WeatherCondition, getTemperatureDisplay } from '@/lib/weather-service';

interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  animations: boolean;
  soundEffects: boolean;
  notifications: boolean;
  reducedMotion: boolean;
  compactMode: boolean;
  showHints: boolean;
  autoPlayGames: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  animations: true,
  soundEffects: true,
  notifications: true,
  reducedMotion: false,
  compactMode: false,
  showHints: true,
  autoPlayGames: false,
};

const STORAGE_KEY = 'anilist_user_settings';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        } catch {
          setSettings(DEFAULT_SETTINGS);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      }
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }
  };

  return { settings, updateSetting, resetSettings, isLoaded };
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { titleLanguage, setTitleLanguage } = useGlobalSettings();
  const { 
    accentColor, 
    setAccentColor, 
    weatherEnabled, 
    setWeatherEnabled, 
    weatherData, 
    weatherLoading, 
    refreshWeather,
    weatherIntensity,
    setWeatherIntensity,
    weatherOverride,
    setWeatherOverride,
    temperatureUnit,
    setTemperatureUnit,
    theme,
    setTheme
  } = useUI();
  const [activeTab, setActiveTab] = useState<'general' | 'display' | 'effects' | 'shortcuts'>('general');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-gray-900 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <p className="text-sm text-gray-400">Customize your experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-white/10 overflow-x-auto">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'display', label: 'Display', icon: Monitor },
            { id: 'effects', label: 'Effects', icon: Sparkles },
            { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Sound Effects */}
              <SettingToggle
                icon={settings.soundEffects ? Volume2 : VolumeX}
                label="Sound Effects"
                description="Play sounds during games and interactions"
                enabled={settings.soundEffects}
                onChange={(v) => updateSetting('soundEffects', v)}
              />

              {/* Notifications */}
              <SettingToggle
                icon={settings.notifications ? Bell : BellOff}
                label="Notifications"
                description="Get notified about daily challenges and updates"
                enabled={settings.notifications}
                onChange={(v) => updateSetting('notifications', v)}
              />

              {/* Show Hints */}
              <SettingToggle
                icon={settings.showHints ? Eye : EyeOff}
                label="Show Hints"
                description="Display helpful hints and tooltips"
                enabled={settings.showHints}
                onChange={(v) => updateSetting('showHints', v)}
              />

              {/* Auto-play Games */}
              <SettingToggle
                icon={Zap}
                label="Auto-advance Questions"
                description="Automatically go to next question after answering"
                enabled={settings.autoPlayGames}
                onChange={(v) => updateSetting('autoPlayGames', v)}
              />
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              {/* Title Language */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-purple-400" />
                  <label className="text-sm font-medium text-white">Title Language</label>
                </div>
                <p className="text-xs text-gray-400">Choose how anime/manga titles are displayed throughout the site</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'romaji', label: 'Romaji', example: 'Shingeki no Kyojin' },
                    { id: 'english', label: 'English', example: 'Attack on Titan' },
                    { id: 'native', label: 'Japanese', example: '進撃の巨人' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setTitleLanguage(lang.id as TitleLanguage)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors ${
                        titleLanguage === lang.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <span className={`text-sm font-medium ${titleLanguage === lang.id ? 'text-white' : 'text-gray-400'}`}>
                        {lang.label}
                      </span>
                      <span className={`text-xs ${titleLanguage === lang.id ? 'text-purple-300' : 'text-gray-500'}`}>
                        {lang.example}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'system', label: 'System', icon: Monitor },
                  ].map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => setTheme(themeOption.id as 'dark' | 'light' | 'system')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                        theme === themeOption.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <themeOption.icon className={`w-6 h-6 ${theme === themeOption.id ? 'text-purple-400' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${theme === themeOption.id ? 'text-white' : 'text-gray-400'}`}>
                        {themeOption.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Animations */}
              <SettingToggle
                icon={Zap}
                label="Animations"
                description="Enable smooth animations and transitions"
                enabled={settings.animations}
                onChange={(v) => updateSetting('animations', v)}
              />

              {/* Reduced Motion */}
              <SettingToggle
                icon={Eye}
                label="Reduced Motion"
                description="Minimize motion for accessibility"
                enabled={settings.reducedMotion}
                onChange={(v) => updateSetting('reducedMotion', v)}
              />

              {/* Compact Mode */}
              <SettingToggle
                icon={Palette}
                label="Compact Mode"
                description="Use smaller spacing and elements"
                enabled={settings.compactMode}
                onChange={(v) => updateSetting('compactMode', v)}
              />
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="space-y-6">
              {/* Accent Color */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <label className="text-sm font-medium text-white">Accent Color</label>
                </div>
                <p className="text-xs text-gray-400">Choose your preferred accent color for buttons and highlights</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'purple', color: '#a855f7', label: 'Purple' },
                    { id: 'blue', color: '#3b82f6', label: 'Blue' },
                    { id: 'green', color: '#10b981', label: 'Green' },
                    { id: 'pink', color: '#ec4899', label: 'Pink' },
                    { id: 'orange', color: '#f59e0b', label: 'Orange' },
                    { id: 'red', color: '#ef4444', label: 'Red' },
                    { id: 'cyan', color: '#06b6d4', label: 'Cyan' },
                    { id: 'indigo', color: '#6366f1', label: 'Indigo' },
                  ].map((accent) => (
                    <button
                      key={accent.id}
                      onClick={() => setAccentColor(accent.id as typeof accentColor)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        accentColor === accent.id
                          ? 'border-white/40 scale-105'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div 
                        className="w-8 h-8 rounded-full shadow-lg"
                        style={{ backgroundColor: accent.color, boxShadow: `0 4px 14px ${accent.color}40` }}
                      />
                      <span className={`text-xs font-medium ${accentColor === accent.id ? 'text-white' : 'text-gray-400'}`}>
                        {accent.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weather Effects */}
              <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${weatherEnabled ? 'bg-blue-500/20' : 'bg-white/10'}`}>
                      <CloudSun className={`w-5 h-5 ${weatherEnabled ? 'text-blue-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-white">Weather Effects</p>
                      <p className="text-sm text-gray-400">Animated weather based on your location</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWeatherEnabled(!weatherEnabled)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      weatherEnabled ? 'bg-blue-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                        weatherEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {weatherEnabled && (
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    {/* Current Weather */}
                    {weatherData && !weatherOverride && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-white flex items-center gap-2">
                              <span className="text-lg">{weatherData.icon}</span>
                              {weatherData.description} · {getTemperatureDisplay(weatherData.temperature, temperatureUnit)}
                            </p>
                            <p className="text-xs text-gray-500">{weatherData.isDay ? 'Daytime' : 'Nighttime'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => refreshWeather()}
                          disabled={weatherLoading}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          {weatherLoading ? (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Weather Override */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Override Weather (for preview)</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: null, label: 'Auto', icon: MapPin },
                          { id: 'clear', label: 'Clear', icon: CloudSun },
                          { id: 'cloudy', label: 'Cloudy', icon: Cloud },
                          { id: 'rain', label: 'Rain', icon: CloudRain },
                          { id: 'snow', label: 'Snow', icon: CloudSnow },
                          { id: 'thunderstorm', label: 'Storm', icon: CloudLightning },
                          { id: 'fog', label: 'Fog', icon: CloudFog },
                        ].map((weather) => (
                          <button
                            key={weather.id || 'auto'}
                            onClick={() => setWeatherOverride(weather.id as WeatherCondition | null)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                              weatherOverride === weather.id
                                ? 'bg-blue-500/20 border border-blue-500/50'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <weather.icon className={`w-4 h-4 ${weatherOverride === weather.id ? 'text-blue-400' : 'text-gray-400'}`} />
                            <span className={`text-xs ${weatherOverride === weather.id ? 'text-blue-300' : 'text-gray-500'}`}>
                              {weather.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Temperature Unit */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Temperature Unit</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTemperatureUnit('celsius')}
                          className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                            temperatureUnit === 'celsius'
                              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400'
                          }`}
                        >
                          Celsius (°C)
                        </button>
                        <button
                          onClick={() => setTemperatureUnit('fahrenheit')}
                          className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                            temperatureUnit === 'fahrenheit'
                              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400'
                          }`}
                        >
                          Fahrenheit (°F)
                        </button>
                      </div>
                    </div>

                    {/* Intensity */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Effect Intensity</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'light', label: 'Light' },
                          { id: 'medium', label: 'Medium' },
                          { id: 'heavy', label: 'Heavy' },
                        ].map((intensity) => (
                          <button
                            key={intensity.id}
                            onClick={() => setWeatherIntensity(intensity.id as typeof weatherIntensity)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              weatherIntensity === intensity.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {intensity.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Info about weather */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-300">
                  🌤️ <strong>Weather Effects</strong> use your device&apos;s location to show real-time animated weather on the site background. No location data is stored.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <KeyboardShortcutsHelp />
              
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-300">
                  💡 <strong>Pro tip:</strong> Use keyboard shortcuts to quickly navigate and play games more efficiently!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface SettingToggleProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function SettingToggle({ icon: Icon, label, description, enabled, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enabled ? 'bg-purple-500/20' : 'bg-white/10'}`}>
          <Icon className={`w-5 h-5 ${enabled ? 'text-purple-400' : 'text-gray-500'}`} />
        </div>
        <div>
          <p className="font-medium text-white">{label}</p>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          enabled ? 'bg-purple-500' : 'bg-white/20'
        }`}
      >
        <div
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5 text-gray-400 hover:text-white" />
      </button>
      <SettingsPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
