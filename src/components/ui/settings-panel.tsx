'use client';

import { useState } from 'react';
import { Settings, Sun, Moon, Monitor, Volume2, VolumeX, Sparkles, Keyboard } from 'lucide-react';
import { useUI } from '@/contexts/ui-context';
import { ContentFilterPanel } from './content-filter-panel';

const accentColors = [
  { id: 'purple', color: '#a855f7', name: 'Purple' },
  { id: 'blue', color: '#3b82f6', name: 'Blue' },
  { id: 'green', color: '#10b981', name: 'Green' },
  { id: 'pink', color: '#ec4899', name: 'Pink' },
  { id: 'orange', color: '#f59e0b', name: 'Orange' },
  { id: 'red', color: '#ef4444', name: 'Red' },
] as const;

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    theme, 
    setTheme, 
    accentColor, 
    setAccentColor, 
    reducedMotion, 
    setReducedMotion,
    soundEnabled,
    setSoundEnabled,
    setShowShortcuts,
  } = useUI();

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all shadow-lg"
        aria-label="Settings"
      >
        <Settings className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-20 left-4 z-50 w-72 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Appearance
            </h3>

            {/* Theme Toggle */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Theme</label>
              <div className="flex gap-2">
                {[
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Monitor, label: 'System' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id as 'dark' | 'system')}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      theme === id 
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Accent Color</label>
              <div className="flex gap-2">
                {accentColors.map(({ id, color }) => (
                  <button
                    key={id}
                    onClick={() => setAccentColor(id)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      accentColor === id ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={id}
                  />
                ))}
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="mb-4">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  soundEnabled 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                <span className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  Sound Effects
                </span>
                <span className="text-xs">{soundEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="mb-4">
              <button
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  reducedMotion 
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' 
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                <span>Reduced Motion</span>
                <span className="text-xs">{reducedMotion ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Keyboard Shortcuts */}
            <button
              onClick={() => {
                setIsOpen(false);
                setShowShortcuts(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-lg border bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 transition-all mb-4"
            >
              <span className="flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Keyboard Shortcuts
              </span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">?</kbd>
            </button>

            {/* Divider */}
            <div className="border-t border-white/10 my-4" />

            {/* Content Filter Section */}
            <ContentFilterPanel />
          </div>
        </>
      )}
    </>
  );
}
