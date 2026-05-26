
export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        Decoding your taste profile...
      </p>
    </div>
  );
}

export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border p-5 animate-pulse"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="w-32 h-4 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="w-20 h-3 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  <div className="w-10 h-3 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
