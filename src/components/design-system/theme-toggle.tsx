'use client';

import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

const PRESETS = [
  { name: 'Indigo', hex: '#7c6df2' },
  { name: 'Coral', hex: '#e06c45' },
  { name: 'Gold', hex: '#d4a017' },
  { name: 'Emerald', hex: '#34c759' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Sky', hex: '#38bdf8' },
];

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { themeMode, toggleTheme, accentColor, setAccentColor } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Light/Dark toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-md transition-colors duration-150"
        style={{
          color: 'var(--text-secondary)',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--text-muted)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
        aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Accent color picker */}
      <div className="relative">
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors duration-150"
          style={{
            background: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(var(--accent-rgb), 0.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--text-muted)';
          }}
          aria-label="Choose accent color"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          {showLabel && (
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Theme
            </span>
          )}
        </button>

        {pickerOpen && (
          <div
            className="absolute right-0 top-full mt-2 p-3 rounded-lg z-50 animate-fade-in min-w-[200px]"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  onClick={() => setAccentColor(preset.hex)}
                  className="w-6 h-6 rounded-full transition-transform duration-150"
                  style={{
                    backgroundColor: preset.hex,
                    outline: accentColor === preset.hex ? '2px solid var(--text-primary)' : 'none',
                    outlineOffset: '2px',
                  }}
                  title={preset.name}
                  aria-label={`Set accent to ${preset.name}`}
                />
              ))}
            </div>

            {/* Custom color */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                style={{ background: 'transparent' }}
                aria-label="Custom accent color"
              />
              <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {accentColor}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
