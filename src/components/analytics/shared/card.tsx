import { ReactNode } from 'react';
import { Info } from 'lucide-react';

interface CardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  info?: string;
}

export function Card({ title, subtitle, icon, children, className = '', info }: CardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{
        background: 'var(--bg-elevated, rgba(255,255,255,0.03))',
        borderColor: 'var(--border-color, rgba(255,255,255,0.06))',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(var(--accent-rgb, 124, 109, 242), 0.1)' }}
            >
              <span style={{ color: 'var(--accent-color)' }}>{icon}</span>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {info && (
          <div className="group relative">
            <Info size={14} style={{ color: 'var(--text-tertiary)' }} className="cursor-help" />
            <div
              className="absolute right-0 top-6 w-56 p-3 rounded-xl text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10"
              style={{
                background: 'var(--bg-surface, #1a1a24)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              {info}
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
