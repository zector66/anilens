'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Pencil, ExternalLink, Check, X } from 'lucide-react';
import { proxyImage } from '@/lib/image-proxy';
import { useAuth } from '@/hooks/use-auth';

interface AnimeCardProps {
  id: number;
  title: string;
  imageUrl: string;
  score?: number;
  format?: string;
  episodes?: number;
  year?: number;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: 'CURRENT', label: 'Watching', color: '#3b82f6' },
  { value: 'COMPLETED', label: 'Completed', color: '#22c55e' },
  { value: 'PLANNING', label: 'Plan to Watch', color: '#a855f7' },
  { value: 'PAUSED', label: 'Paused', color: '#f59e0b' },
  { value: 'DROPPED', label: 'Dropped', color: '#ef4444' },
  { value: 'REPEATING', label: 'Rewatching', color: '#06b6d4' },
];

function MetaPill({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  if (!href) {
    return (
      <span className="cursor-default">{children}</span>
    );
  }
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="hover:underline"
      style={{ color: 'var(--text-tertiary)' }}
    >
      {children}
    </Link>
  );
}

export function EditPanel({
  mediaId,
  title,
  totalEps,
  onClose,
}: {
  mediaId: number;
  title: string;
  totalEps?: number;
  onClose: () => void;
}) {
  const { accessToken, user } = useAuth();
  const [status, setStatus] = useState<string>('CURRENT');
  const [score, setScore] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [repeat, setRepeat] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [startedAt, setStartedAt] = useState<string>('');
  const [completedAt, setCompletedAt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  // Fetch existing list entry on mount
  useEffect(() => {
    async function fetchEntry() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/anilist/list-entry?mediaId=${mediaId}&userId=${user.id}`);
        if (!res.ok) throw new Error(`ListEntry API ${res.status}`);
        const data = await res.json();
        if (data.success && data.entry) {
          const e = data.entry;
          if (e.status) setStatus(e.status);
          if (e.score > 0) setScore(e.score);
          if (e.progress > 0) setProgress(e.progress);
          if (e.repeat > 0) setRepeat(e.repeat);
          if (e.notes) setNotes(e.notes);
          if (e.startedAt?.year) {
            const m = String(e.startedAt.month || 1).padStart(2, '0');
            const d = String(e.startedAt.day || 1).padStart(2, '0');
            setStartedAt(`${e.startedAt.year}-${m}-${d}`);
          }
          if (e.completedAt?.year) {
            const m = String(e.completedAt.month || 1).padStart(2, '0');
            const d = String(e.completedAt.day || 1).padStart(2, '0');
            setCompletedAt(`${e.completedAt.year}-${m}-${d}`);
          }
        }
      } catch {
        // silently fail — user can still input manually
      } finally {
        setLoading(false);
      }
    }
    fetchEntry();
  }, [mediaId, user?.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = useCallback(async () => {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/anilist/save-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          mediaId,
          status: status || undefined,
          score: score > 0 ? score : undefined,
          progress: progress > 0 ? progress : undefined,
          repeat: repeat > 0 ? repeat : undefined,
          notes: notes.trim() || undefined,
          startedAt: startedAt || undefined,
          completedAt: completedAt || undefined,
        }),
      });
      if (!response.ok) throw new Error(`SaveEntry API ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setSaved(true);
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => onClose(), 700);
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }, [accessToken, mediaId, status, score, progress, repeat, notes, startedAt, completedAt, onClose]);

  const statusMeta = STATUS_OPTIONS.find((s) => s.value === status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-elevated, #121212)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-sm font-semibold truncate pr-3" style={{ color: 'var(--text-primary)' }}>
            {title}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
          >
            <X size={14} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg" style={{ background: 'var(--bg-elevated, #121212)' }}>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          )}
          {/* Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Status
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full appearance-none px-3 py-2 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: statusMeta ? statusMeta.color : 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }} />
                </svg>
              </div>
            </div>
          </div>

          {/* Eps Progress & Score */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Eps Progress {totalEps ? `/ ${totalEps}` : ''}
              </label>
              <input
                type="number"
                min={0}
                max={totalEps || 9999}
                value={progress || ''}
                onChange={(e) => setProgress(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Score (0–10)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={score || ''}
                onChange={(e) => setScore(Number(e.target.value))}
                placeholder="—"
                className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                End Date
              </label>
              <input
                type="date"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  colorScheme: 'dark',
                }}
              />
            </div>
          </div>

          {/* Rewatches */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Total Rewatches
            </label>
            <input
              type="number"
              min={0}
              value={repeat || ''}
              onChange={(e) => setRepeat(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Personal notes..."
              className="w-full px-3 py-2 rounded-lg text-xs resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            style={{
              background: saved ? '#22c55e' : 'var(--accent-color)',
              color: '#fff',
            }}
          >
            {saved ? <Check size={13} /> : saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link
            href={`https://anilist.co/anime/${mediaId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-tertiary)' }}
            title="Open on AniList"
          >
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AnimeCard({ id, title, imageUrl, score, format, episodes, year, className }: AnimeCardProps) {
  const { isOAuthAuthenticated } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={className ?? 'shrink-0 snap-start w-[140px] sm:w-[160px] md:w-[180px]'}>
      {/* Poster */}
      <div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={`/anime/${id}`} className="block">
          <div
            className="relative w-full aspect-2/3 overflow-hidden img-placeholder"
            style={{
              borderRadius: '10px',
              boxShadow: isHovered
                ? '0 12px 32px 2px rgba(var(--accent-rgb), 0.22)'
                : '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.35s ease',
              transform: isHovered ? 'scale(1.03) translateY(-6px)' : 'scale(1) translateY(0)',
            }}
          >
            <Image
              src={proxyImage(imageUrl)}
              alt={title}
              fill
              sizes="(max-width: 640px) 140px, (max-width: 768px) 160px, 180px"
              className="object-cover transition-all duration-300"
              style={{
                filter: isHovered ? 'blur(2px) brightness(0.6)' : 'blur(0) brightness(1)',
              }}
              loading="lazy"
              unoptimized
            />

            {/* Hover overlay with title tooltip */}
            <div
              className="absolute inset-0 flex flex-col justify-end p-3"
              style={{
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.25s ease',
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
              }}
            >
              <h3
                className="text-sm font-semibold leading-tight line-clamp-2"
                style={{ color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                {title}
              </h3>
              {score !== undefined && score > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Star size={10} fill="currentColor" style={{ color: 'var(--accent-color)' }} />
                  <span className="text-[11px] font-medium" style={{ color: 'var(--accent-color)' }}>
                    {Math.round(score)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Edit List button — top right, appears on hover */}
        {isOAuthAuthenticated && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEdit((prev) => !prev);
            }}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
            title="Edit List Entry"
          >
            <Pencil size={12} style={{ color: '#fff' }} />
          </button>
        )}

        {/* Edit panel */}
        {showEdit && (
          <EditPanel mediaId={id} title={title} totalEps={episodes} onClose={() => setShowEdit(false)} />
        )}
      </div>

      {/* Info */}
      <div className="mt-2 space-y-0.5">
        <Link href={`/anime/${id}`}>
          <h3
            className="text-sm font-medium leading-tight truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h3>
        </Link>
        <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          {format && (
            <>
              <MetaPill href={format ? `/search?format=${encodeURIComponent(format)}` : undefined}>
                {format}
              </MetaPill>
            </>
          )}
          {year && (
            <>
              {format && <span className="opacity-40">·</span>}
              <MetaPill href={`/search?year=${year}`}>
                {year}
              </MetaPill>
            </>
          )}
          {episodes !== undefined && episodes > 0 && (
            <>
              {(format || year) && <span className="opacity-40">·</span>}
              <MetaPill>{episodes}</MetaPill>
            </>
          )}
          {score !== undefined && score > 0 && (
            <>
              {(format || year || episodes) && <span className="opacity-40">·</span>}
              <span className="inline-flex items-center gap-0.5" style={{ color: 'var(--accent-color)' }}>
                <Star size={10} fill="currentColor" />
                {Math.round(score)}%
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
