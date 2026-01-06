'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({ 
  content, 
  children, 
  side = 'top',
  delay = 300,
  className 
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        let x = rect.left + rect.width / 2 + scrollX;
        let y = rect.top + scrollY;

        switch (side) {
          case 'bottom':
            y = rect.bottom + scrollY + 8;
            break;
          case 'left':
            x = rect.left + scrollX - 8;
            y = rect.top + rect.height / 2 + scrollY;
            break;
          case 'right':
            x = rect.right + scrollX + 8;
            y = rect.top + rect.height / 2 + scrollY;
            break;
          default: // top
            y = rect.top + scrollY - 8;
        }

        setPosition({ x, y });
      }
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const sideClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            "fixed z-50 px-3 py-2 text-sm rounded-lg bg-gray-900 text-white border border-white/20 shadow-xl",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            sideClasses[side],
            className
          )}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-2 h-2 bg-gray-900 border-white/20 rotate-45",
              side === 'top' && "bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b",
              side === 'bottom' && "top-[-5px] left-1/2 -translate-x-1/2 border-l border-t",
              side === 'left' && "right-[-5px] top-1/2 -translate-y-1/2 border-t border-r",
              side === 'right' && "left-[-5px] top-1/2 -translate-y-1/2 border-b border-l",
            )}
          />
        </div>
      )}
    </>
  );
}

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
}

export function InfoTooltip({ content, className }: InfoTooltipProps) {
  return (
    <Tooltip content={content} className={className}>
      <button 
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-colors text-xs"
      >
        ?
      </button>
    </Tooltip>
  );
}

interface KeyboardShortcutProps {
  keys: string[];
  description: string;
}

export function KeyboardShortcut({ keys, description }: KeyboardShortcutProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-gray-400">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <React.Fragment key={i}>
            <kbd className="px-2 py-1 rounded bg-white/10 text-gray-300 font-mono text-xs border border-white/20">
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="text-gray-500">+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsHelp() {
  const shortcuts = [
    { keys: ['1', '2', '3', '4'], description: 'Select answer option' },
    { keys: ['H'], description: 'Toggle hint' },
    { keys: ['Esc'], description: 'Close modal / Go back' },
    { keys: ['Tab'], description: 'Navigate between elements' },
  ];

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
      <h4 className="text-sm font-medium text-white mb-3">Keyboard Shortcuts</h4>
      {shortcuts.map((shortcut, i) => (
        <KeyboardShortcut key={i} {...shortcut} />
      ))}
    </div>
  );
}
