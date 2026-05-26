interface BarProps {
  label: string;
  value: number; // 0-100
  color?: string;
  showValue?: boolean;
  valueLabel?: string;
}

export function Bar({ label, value, color, showValue = true, valueLabel }: BarProps) {
  const pct = Math.max(0, Math.min(100, value));
  const barColor = color || 'var(--accent-color)';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium truncate max-w-[70%]" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        {showValue && (
          <span className="text-xs font-mono tabular-nums shrink-0" style={{ color: 'var(--text-tertiary)' }}>
            {valueLabel || `${pct.toFixed(0)}%`}
          </span>
        )}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: barColor,
            opacity: 0.85,
          }}
        />
      </div>
    </div>
  );
}
