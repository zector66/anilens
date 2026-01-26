'use client';

import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useUI } from '@/contexts/ui-context';

const shortcuts = [
  { category: 'Games', items: [
    { keys: ['1', '2', '3', '4'], description: 'Select answer option' },
    { keys: ['H'], description: 'Toggle hint' },
    { keys: ['Space'], description: 'Next question (after answer)' },
    { keys: ['Esc'], description: 'Exit game' },
  ]},
  { category: 'Navigation', items: [
    { keys: ['←', '→'], description: 'Switch tabs' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
  ]},
  { category: 'Settings', items: [
    { keys: ['M'], description: 'Toggle sound' },
    { keys: ['D'], description: 'Toggle theme (Dark/System)' },
  ]},
];

export function KeyboardShortcutsModal() {
  const { showShortcuts, setShowShortcuts, theme, setTheme, soundEnabled, setSoundEnabled } = useUI();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      
      if (e.key === 'Escape' && showShortcuts) {
        setShowShortcuts(false);
      }

      if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
        setSoundEnabled(!soundEnabled);
      }

      if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey) {
        setTheme(theme === 'dark' ? 'system' : 'dark');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, setShowShortcuts, theme, setTheme, soundEnabled, setSoundEnabled]);

  if (!showShortcuts) return null;

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={() => setShowShortcuts(false)}
    >
      <div 
        className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button 
            onClick={() => setShowShortcuts(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {shortcuts.map(category => (
            <div key={category.category}>
              <h3 className="text-sm font-medium text-gray-400 mb-3">{category.category}</h3>
              <div className="space-y-2">
                {category.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-gray-300">{item.description}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key, j) => (
                        <kbd 
                          key={j}
                          className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-white border border-white/20"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-sm text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">?</kbd> anytime to show this
          </p>
        </div>
      </div>
    </div>
  );
}
