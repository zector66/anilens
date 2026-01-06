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
  Languages
} from 'lucide-react';
import { KeyboardShortcutsHelp } from '@/components/ui/tooltip';
import { useSettings as useGlobalSettings, TitleLanguage } from '@/contexts/settings-context';

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
  const [activeTab, setActiveTab] = useState<'general' | 'display' | 'shortcuts'>('general');

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
        <div className="flex gap-2 p-4 border-b border-white/10">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'display', label: 'Display', icon: Monitor },
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
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => updateSetting('theme', theme.id as UserSettings['theme'])}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                        settings.theme === theme.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <theme.icon className={`w-6 h-6 ${settings.theme === theme.id ? 'text-purple-400' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${settings.theme === theme.id ? 'text-white' : 'text-gray-400'}`}>
                        {theme.label}
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
