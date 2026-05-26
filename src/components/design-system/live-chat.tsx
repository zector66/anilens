'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, Loader2, Trash2, ShieldAlert, Crown, ChevronDown, Sparkles, X, VolumeX, Volume2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface ChatMessage {
  id: string;
  user_id: number;
  user_name: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
  deleted_at?: string | null;
  title?: string | null;
  title_color?: string | null;
}

const PAGE_SIZE = 30;
const ROOM_ID = 'global';
const COOLDOWN_MS = 3000;

// Add your AniList user ID(s) here for the Owner badge
const OWNER_IDS: number[] = [285365];

// =====================================================================
// Title Rarity System
// =====================================================================
// common    -> gray   : default cosmetic
// uncommon  -> green  : early progression
// rare      -> blue   : mid progression
// epic      -> purple : late progression
// legendary -> gold   : top progression / OG event
// event     -> red    : staff / time-limited (reserved)
// secret    -> rainbow: hidden / cryptic unlocks (glitch shimmer)
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'event' | 'secret';

const RARITY_META: Record<Rarity, { label: string; ring: string }> = {
  common:    { label: 'Common',    ring: '#9ca3af' },
  uncommon:  { label: 'Uncommon',  ring: '#22c55e' },
  rare:      { label: 'Rare',      ring: '#3b82f6' },
  epic:      { label: 'Epic',      ring: '#a855f7' },
  legendary: { label: 'Legendary', ring: '#fbbf24' },
  event:     { label: 'Event',     ring: '#ef4444' },
  secret:    { label: 'Secret',    ring: '#f0abfc' },
};

const OG_LABEL = '💎 OG';
const OG_COLOR = '#22d3ee';

interface TitleDef {
  label: string;
  color: string;
  rarity: Rarity;
}
interface ProgressionTier extends TitleDef {
  threshold: number;
}
interface SecretTitle extends TitleDef {
  id: string;     // stable key for localStorage flags
  hint: string;   // cryptic clue shown when locked
}

const PRESET_TITLES: TitleDef[] = [
  { label: 'Critic',    color: '#fbbf24', rarity: 'common' },
  { label: 'Casual',    color: '#a78bfa', rarity: 'common' },
  { label: OG_LABEL,    color: OG_COLOR,  rarity: 'legendary' },
  { label: 'Night Owl', color: '#818cf8', rarity: 'common' },
  { label: 'Weeb',      color: '#e879f9', rarity: 'common' },
];

// Progression-based titles unlocked by lifetime chat message count.
// Counts are server-authoritative (users.chat_message_count, incremented by trigger).
const PROGRESSION_TITLES: ProgressionTier[] = [
  { label: 'New Arrival',       color: '#86efac', threshold: 10,   rarity: 'common' },
  { label: 'Regular',           color: '#7dd3fc', threshold: 100,  rarity: 'uncommon' },
  { label: 'Chat Dweller',      color: '#c4b5fd', threshold: 250,  rarity: 'rare' },
  { label: 'Terminally Online', color: '#f0abfc', threshold: 500,  rarity: 'epic' },
  { label: 'Local Legend',      color: '#fde047', threshold: 1000, rarity: 'legendary' },
];

// Hidden / discoverable titles. All client-detected for now and persisted in
// localStorage. Server-side mirroring can be added later for cross-device sync.
const SECRET_TITLES: SecretTitle[] = [
  { id: 'night_walker', label: 'Night Walker', color: '#a5b4fc', rarity: 'secret', hint: 'They say the chat looks different at 4:44...' },
  { id: 'persistent',   label: 'Persistent',   color: '#fb923c', rarity: 'secret', hint: 'Show up. Every day. For a long time.' },
  { id: 'flashbanged',  label: 'Flashbanged',  color: '#fef9c3', rarity: 'secret', hint: 'Some mistakes take a full day to undo.' },
];

const ALL_TITLE_LABELS = new Set<string>([
  ...PRESET_TITLES.map((t) => t.label),
  ...PROGRESSION_TITLES.map((t) => t.label),
  ...SECRET_TITLES.map((t) => t.label),
]);

function getRarityForLabel(label: string): Rarity | null {
  const all: TitleDef[] = [...PRESET_TITLES, ...PROGRESSION_TITLES, ...SECRET_TITLES];
  return all.find((t) => t.label === label)?.rarity ?? null;
}

// Expand this regex as needed
const SLUR_REGEX = /\b(nigger|nigga|faggot|fag|chink|kike|wetback|retard)\b/gi;

function formatTime(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function LiveChat() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [mutedUntil, setMutedUntil] = useState<string | null>(null);
  const [mutedUsers, setMutedUsers] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottom = useRef(true);
  const lastSendTime = useRef<number>(0);

  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [showOgPopup, setShowOgPopup] = useState(false);
  // Server is source of truth for OG unlock; localStorage is just a fast-render cache.
  const [ogUnlocked, setOgUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('anilens_og_unlocked') === 'true';
    }
    return false;
  });
  const [msgCount, setMsgCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('anilens_chat_msg_count') || '0', 10) || 0;
    }
    return 0;
  });
  const [unlockedTier, setUnlockedTier] = useState<ProgressionTier | null>(null);
  const [unlockedSecret, setUnlockedSecret] = useState<SecretTitle | null>(null);
  const [secretsUnlocked, setSecretsUnlocked] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const out = new Set<string>();
    for (const s of SECRET_TITLES) {
      if (localStorage.getItem(`anilens_secret_${s.id}`) === '1') out.add(s.id);
    }
    return out;
  });
  const [chatTitle, setChatTitle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('anilens_chat_title') || '';
      if (!saved || ALL_TITLE_LABELS.has(saved)) return saved;
      localStorage.removeItem('anilens_chat_title');
      localStorage.removeItem('anilens_chat_title_color');
      return '';
    }
    return '';
  });
  const [chatTitleColor, setChatTitleColor] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedTitle = localStorage.getItem('anilens_chat_title') || '';
      if (!savedTitle || ALL_TITLE_LABELS.has(savedTitle)) {
        return localStorage.getItem('anilens_chat_title_color') || '';
      }
      return '';
    }
    return '';
  });

  // Helper: mark a secret as unlocked, persist, and pop a one-time popup.
  const unlockSecret = useCallback((id: string) => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(`anilens_secret_${id}`) === '1') return;
    const def = SECRET_TITLES.find((s) => s.id === id);
    if (!def) return;
    localStorage.setItem(`anilens_secret_${id}`, '1');
    setSecretsUnlocked((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const seenKey = `anilens_secret_seen_${id}`;
    if (!localStorage.getItem(seenKey)) {
      setUnlockedSecret(def);
      localStorage.setItem(seenKey, '1');
    }
  }, []);

  const isOwner = (uid: number) => OWNER_IDS.includes(uid);

  // Check if current user is muted
  const checkMuteStatus = useCallback(async () => {
    if (!user?.id || !supabase) return;
    const { data } = await supabase
      .from('users')
      .select('chat_muted_until')
      .eq('anilist_id', user.id)
      .single();
    if (data?.chat_muted_until) {
      const until = new Date(data.chat_muted_until);
      if (until > new Date()) {
        setMutedUntil(data.chat_muted_until);
      } else {
        setMutedUntil(null);
      }
    } else {
      setMutedUntil(null);
    }
  }, [user?.id]);

  useEffect(() => {
    checkMuteStatus();
    const interval = setInterval(checkMuteStatus, 30000);
    return () => clearInterval(interval);
  }, [checkMuteStatus]);

  // Load initial messages
  const fetchMessages = useCallback(async (before?: string) => {
    if (!supabase) return;
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('room_id', ROOM_ID)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const fetched = (data as ChatMessage[] || []).reverse();
      if (before) {
        setMessages((prev) => [...fetched, ...prev]);
        setHasMore(fetched.length === PAGE_SIZE);
      } else {
        setMessages(fetched);
        setHasMore(fetched.length === PAGE_SIZE);
        shouldScrollToBottom.current = true;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('live-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${ROOM_ID}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.deleted_at) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          shouldScrollToBottom.current = true;
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${ROOM_ID}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m)).filter((m) => !m.deleted_at)
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldScrollToBottom.current && scrollRef.current) {
      const container = scrollRef.current;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      shouldScrollToBottom.current = false;
    }
  }, [messages]);

  // OG unlock state is driven by the server via /api/user/sync.
  // auth.ts dispatches 'anilens:og-status' after each successful sync.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOgStatus = (e: Event) => {
      const detail = (e as CustomEvent<{ unlocked: boolean; freshUnlock: boolean }>).detail;
      if (!detail) return;
      setOgUnlocked(detail.unlocked);
      // Only show popup the first time this device sees the unlock.
      if (detail.freshUnlock) setShowOgPopup(true);
    };

    window.addEventListener('anilens:og-status', handleOgStatus);
    return () => window.removeEventListener('anilens:og-status', handleOgStatus);
  }, []);

  // Chat progression: react to count changes from auth sync, detect newly-crossed tiers.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number; prevCount: number }>).detail;
      if (!detail) return;
      setMsgCount(detail.count);
      // Find highest tier crossed between prev and new count.
      const newlyCrossed = PROGRESSION_TITLES
        .filter((t) => detail.count >= t.threshold && detail.prevCount < t.threshold);
      if (newlyCrossed.length > 0) {
        const top = newlyCrossed[newlyCrossed.length - 1];
        const seenKey = `anilens_tier_seen_${top.threshold}`;
        if (!localStorage.getItem(seenKey)) {
          setUnlockedTier(top);
          localStorage.setItem(seenKey, '1');
        }
      }
    };

    window.addEventListener('anilens:chat-progression', handler);
    return () => window.removeEventListener('anilens:chat-progression', handler);
  }, []);

  // Auto-dismiss tier unlock popup.
  useEffect(() => {
    if (!unlockedTier) return;
    const t = setTimeout(() => setUnlockedTier(null), 6000);
    return () => clearTimeout(t);
  }, [unlockedTier]);

  // Auto-dismiss secret unlock popup.
  useEffect(() => {
    if (!unlockedSecret) return;
    const t = setTimeout(() => setUnlockedSecret(null), 7000);
    return () => clearTimeout(t);
  }, [unlockedSecret]);

  // Persistent: 100-day site visit streak. Tracked locally per device.
  // Resets if a day is missed; unlocks at 100 consecutive days.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastSeen = localStorage.getItem('anilens_last_seen_day');
    let streak = parseInt(localStorage.getItem('anilens_day_streak') || '0', 10) || 0;

    if (lastSeen !== today) {
      if (lastSeen) {
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        streak = lastSeen === yesterday ? streak + 1 : 1;
      } else {
        streak = 1;
      }
      localStorage.setItem('anilens_last_seen_day', today);
      localStorage.setItem('anilens_day_streak', String(streak));
    }

    if (streak >= 100) unlockSecret('persistent');
  }, [unlockSecret]);

  // Flashbanged: spent ~24h cumulative with the site in light mode. Marks the
  // first time we observe light mode; unlocks once 24h have passed since then.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const evaluate = () => {
      const theme = localStorage.getItem('ui-theme'); // 'dark' | 'light' | 'system'
      const isLight =
        theme === 'light' ||
        (theme === 'system' &&
          typeof window.matchMedia === 'function' &&
          !window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (!isLight) return;

      const firstAt = localStorage.getItem('anilens_light_mode_first_at');
      if (!firstAt) {
        localStorage.setItem('anilens_light_mode_first_at', String(Date.now()));
        return;
      }
      if (Date.now() - parseInt(firstAt, 10) >= 24 * 60 * 60 * 1000) {
        unlockSecret('flashbanged');
      }
    };

    evaluate();
    const handler = (e: StorageEvent) => {
      if (e.key === 'ui-theme') evaluate();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [unlockSecret]);

  // Auto-dismiss the OG popup after 6 seconds.
  useEffect(() => {
    if (!showOgPopup) return;
    const t = setTimeout(() => setShowOgPopup(false), 6000);
    return () => clearTimeout(t);
  }, [showOgPopup]);

  const containsSlur = (text: string) => SLUR_REGEX.test(text);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !user || !supabase) return;

    // Check mute status
    if (mutedUntil) {
      const until = new Date(mutedUntil);
      const remaining = Math.ceil((until.getTime() - Date.now()) / 1000);
      if (remaining > 0) {
        const mins = Math.ceil(remaining / 60);
        setWarning(`You are muted for ${mins} more minute${mins === 1 ? '' : 's'}.`);
        return;
      }
    }

    // Anti-spam cooldown
    const now = Date.now();
    const elapsed = now - lastSendTime.current;
    if (elapsed < COOLDOWN_MS) {
      setWarning(`Wait ${Math.ceil((COOLDOWN_MS - elapsed) / 1000)}s...`);
      return;
    }

    // Client-side slur guard
    if (containsSlur(trimmed)) {
      setWarning('Message contains prohibited language.');
      return;
    }

    setSending(true);
    setError(null);
    setWarning(null);
    try {
      const { error: insertError } = await supabase.from('messages').insert({
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.avatar?.medium || null,
        content: trimmed,
        room_id: ROOM_ID,
        title: chatTitle || null,
        title_color: chatTitleColor || null,
      });
      if (insertError) throw insertError;
      lastSendTime.current = Date.now();
      setInput('');
      shouldScrollToBottom.current = true;

      // Night Walker: send a message at exactly 4:44 AM local time.
      const sentAt = new Date();
      if (sentAt.getHours() === 4 && sentAt.getMinutes() === 44) {
        unlockSecret('night_walker');
      }

      // Optimistically bump the lifetime count so the user gets instant
      // unlock feedback without waiting for the next /api/user/sync round-trip.
      setMsgCount((prev) => {
        const next = prev + 1;
        if (typeof window !== 'undefined') {
          localStorage.setItem('anilens_chat_msg_count', String(next));
        }
        const crossed = PROGRESSION_TITLES.find((t) => prev < t.threshold && next >= t.threshold);
        if (crossed) {
          const seenKey = `anilens_tier_seen_${crossed.threshold}`;
          if (typeof window !== 'undefined' && !localStorage.getItem(seenKey)) {
            setUnlockedTier(crossed);
            localStorage.setItem(seenKey, '1');
          }
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!supabase || !user?.id) return;
    try {
      const { error: delError } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
        .eq('id', msgId)
        .eq('user_id', user.id);
      if (delError) throw delError;
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const handleMute = async (targetUserId: number, minutes: number) => {
    if (!supabase || !isOwner(user?.id || 0)) return;
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    try {
      const { error: updError } = await supabase
        .from('users')
        .update({ chat_muted_until: until })
        .eq('anilist_id', targetUserId);
      if (updError) throw updError;
      setMutedUsers((prev) => new Set(prev).add(targetUserId));
      setWarning(`User muted for ${minutes} minute${minutes === 1 ? '' : 's'}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mute user');
    }
  };

  const handleUnmute = async (targetUserId: number) => {
    if (!supabase || !isOwner(user?.id || 0)) return;
    try {
      const { error: updError } = await supabase
        .from('users')
        .update({ chat_muted_until: null })
        .eq('anilist_id', targetUserId);
      if (updError) throw updError;
      setMutedUsers((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
      setWarning('User unmuted.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unmute user');
    }
  };

  const isOwnMessage = (msg: ChatMessage) => user?.id === msg.user_id;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadMore = () => {
    if (messages.length === 0) return;
    const oldest = messages[0].created_at;
    fetchMessages(oldest);
  };

  return (
    <div className="flex flex-col relative" style={{ height: '640px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-1 pb-3 border-b border-white/5">
        <MessageCircle size={16} style={{ color: 'var(--accent-color)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Live Chat
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)' }}>
          {messages.length}
        </span>
      </div>

      {/* OG Unlock Popup */}
      {showOgPopup && (
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg"
          style={{
            background: 'rgba(34,211,238,0.12)',
            border: '1px solid rgba(34,211,238,0.35)',
            color: '#22d3ee',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Sparkles size={12} />
          <span className="text-[11px] font-medium whitespace-nowrap">You&apos;ve unlocked the 💎 OG title!</span>
          <button
            onClick={() => setShowOgPopup(false)}
            className="ml-1 hover:text-white/70 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Tier Unlock Popup */}
      {unlockedTier && (
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg"
          style={{
            background: `${unlockedTier.color}22`,
            border: `1px solid ${unlockedTier.color}55`,
            color: unlockedTier.color,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Sparkles size={12} />
          <span className="text-[11px] font-medium whitespace-nowrap">
            Title unlocked: {unlockedTier.label}
          </span>
          <button
            onClick={() => setUnlockedTier(null)}
            className="ml-1 hover:opacity-70 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Secret Unlock Popup */}
      {unlockedSecret && (
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg secret-glitch"
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Sparkles size={12} className="text-white" />
          <span className="text-[11px] font-medium whitespace-nowrap text-white">
            Secret unlocked: {unlockedSecret.label}
          </span>
          <button
            onClick={() => setUnlockedSecret(null)}
            className="ml-1 text-white hover:opacity-70 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-3 pr-1 space-y-3"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.12) transparent',
        }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-xs text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
            No messages yet. Be the first!
          </div>
        ) : (
          <>
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full text-[10px] py-1 text-center transition-colors hover:text-white/60"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Load older messages
              </button>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-2 group/message">
                <div className="shrink-0">
                  {msg.user_avatar ? (
                    <OptimizedImage
                      src={msg.user_avatar}
                      alt={msg.user_name}
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: 'var(--accent-color)', color: '#fff' }}
                    >
                      {msg.user_name[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {msg.user_name}
                    </span>
                    {isOwner(msg.user_id) && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded"
                        style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
                      >
                        <Crown size={9} />
                        Owner
                      </span>
                    )}
                    {msg.title && !isOwner(msg.user_id) && (() => {
                      const rarity = getRarityForLabel(msg.title);
                      const ring = rarity ? RARITY_META[rarity].ring : null;
                      const isSecret = rarity === 'secret';
                      const isOg = msg.title === OG_LABEL;
                      // Border tint follows rarity; the title's own color stays
                      // for text/background fill so each title remains recognizable.
                      const borderColor = ring || msg.title_color || 'rgba(255,255,255,0.08)';
                      return (
                        <span
                          className={`text-[9px] font-medium px-1 py-0.5 rounded ${isOg ? 'og-shimmer' : ''} ${isSecret ? 'secret-glitch' : ''}`}
                          style={{
                            background: msg.title_color ? `${msg.title_color}18` : 'rgba(255,255,255,0.06)',
                            color: msg.title_color || 'var(--text-tertiary)',
                            border: `1px solid ${borderColor}55`,
                            boxShadow: rarity === 'legendary' ? `0 0 8px ${ring}33` : undefined,
                          }}
                        >
                          {msg.title}
                        </span>
                      );
                    })()}
                    <span className="text-[10px] shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                      {formatTime(msg.created_at)}
                    </span>
                    {isOwner(user?.id || 0) && !isOwner(msg.user_id) && (
                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
                        {mutedUsers.has(msg.user_id) ? (
                          <button
                            onClick={() => handleUnmute(msg.user_id)}
                            className="p-0.5 rounded hover:bg-white/10"
                            title="Unmute user"
                          >
                            <Volume2 size={12} style={{ color: '#22c55e' }} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleMute(msg.user_id, 5)}
                              className="text-[9px] px-1 py-0.5 rounded hover:bg-white/10"
                              style={{ color: '#f59e0b' }}
                              title="Mute 5m"
                            >
                              5m
                            </button>
                            <button
                              onClick={() => handleMute(msg.user_id, 30)}
                              className="text-[9px] px-1 py-0.5 rounded hover:bg-white/10"
                              style={{ color: '#ef4444' }}
                              title="Mute 30m"
                            >
                              30m
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {isOwnMessage(msg) && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="ml-auto opacity-0 group-hover/message:opacity-100 transition-opacity p-0.5 rounded"
                        title="Delete"
                      >
                        <Trash2 size={12} style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs wrap-break-word leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      {isAuthenticated ? (
        <div className="pt-2 border-t border-white/5 relative">
          {mutedUntil && (
            <div
              className="mb-2 px-3 py-1.5 rounded-md text-[11px] font-medium flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
            >
              <VolumeX size={12} />
              You are muted. You cannot send messages right now.
            </div>
          )}
          {/* Title picker */}
          {showTitlePicker && (
            <div
              className="absolute bottom-full left-0 mb-2 p-2 rounded-lg shadow-xl z-20"
              style={{
                background: 'var(--bg-elevated, rgb(18,18,18))',
                border: '1px solid rgba(255,255,255,0.08)',
                width: '280px',
                maxHeight: '440px',
                overflowY: 'auto',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>Your Title</span>
                <button
                  onClick={() => setShowTitlePicker(false)}
                  className="text-[10px] hover:text-white/70"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Close
                </button>
              </div>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Vibes
              </div>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {PRESET_TITLES.filter((t) => t.label !== OG_LABEL || ogUnlocked).map((t) => (
                  <button
                    key={t.label}
                    onClick={() => {
                      if (chatTitle === t.label) {
                        setChatTitle('');
                        setChatTitleColor('');
                        localStorage.removeItem('anilens_chat_title');
                        localStorage.removeItem('anilens_chat_title_color');
                      } else {
                        setChatTitle(t.label);
                        setChatTitleColor(t.color);
                        localStorage.setItem('anilens_chat_title', t.label);
                        localStorage.setItem('anilens_chat_title_color', t.color);
                      }
                      setShowTitlePicker(false);
                    }}
                    className="text-[10px] px-2 py-1 rounded transition-colors hover:bg-white/10"
                    style={{
                      background: chatTitle === t.label ? `${t.color}22` : 'rgba(255,255,255,0.04)',
                      color: chatTitle === t.label ? t.color : 'var(--text-secondary)',
                      border: chatTitle === t.label ? `1px solid ${t.color}44` : '1px solid transparent',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div
                className="text-[9px] uppercase tracking-wider mb-1 flex items-center justify-between"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <span>Progression</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{msgCount.toLocaleString()} msgs</span>
              </div>
              <div className="grid grid-cols-1 gap-1 mb-2">
                {PROGRESSION_TITLES.map((t) => {
                  const unlocked = msgCount >= t.threshold;
                  const selected = chatTitle === t.label;
                  const ring = RARITY_META[t.rarity].ring;
                  return (
                    <button
                      key={t.label}
                      disabled={!unlocked}
                      onClick={() => {
                        if (!unlocked) return;
                        if (chatTitle === t.label) {
                          setChatTitle('');
                          setChatTitleColor('');
                          localStorage.removeItem('anilens_chat_title');
                          localStorage.removeItem('anilens_chat_title_color');
                        } else {
                          setChatTitle(t.label);
                          setChatTitleColor(t.color);
                          localStorage.setItem('anilens_chat_title', t.label);
                          localStorage.setItem('anilens_chat_title_color', t.color);
                        }
                        setShowTitlePicker(false);
                      }}
                      className={`text-[10px] px-2 py-1 rounded transition-colors flex items-center justify-between gap-2 ${unlocked ? 'hover:bg-white/10 cursor-pointer' : 'cursor-not-allowed'}`}
                      style={{
                        background: selected ? `${t.color}22` : 'rgba(255,255,255,0.04)',
                        color: !unlocked ? 'var(--text-tertiary)' : selected ? t.color : 'var(--text-secondary)',
                        border: selected ? `1px solid ${t.color}44` : `1px solid ${ring}33`,
                        opacity: unlocked ? 1 : 0.45,
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: ring }} />
                        {t.label}
                      </span>
                      <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                        {unlocked ? <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: ring }} /> : `${Math.min(msgCount, t.threshold)}/${t.threshold}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Secret titles: only show entries the user has unlocked, plus a
                  vague placeholder count for the rest (preserves the mystery). */}
              <div className="text-[9px] uppercase tracking-wider mb-1 flex items-center justify-between" style={{ color: 'var(--text-tertiary)' }}>
                <span>Secret</span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {secretsUnlocked.size}/{SECRET_TITLES.length} found
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1 mb-2">
                {SECRET_TITLES.map((s) => {
                  const unlocked = secretsUnlocked.has(s.id);
                  const selected = chatTitle === s.label;
                  const ring = RARITY_META.secret.ring;
                  return (
                    <button
                      key={s.id}
                      disabled={!unlocked}
                      onClick={() => {
                        if (!unlocked) return;
                        if (chatTitle === s.label) {
                          setChatTitle('');
                          setChatTitleColor('');
                          localStorage.removeItem('anilens_chat_title');
                          localStorage.removeItem('anilens_chat_title_color');
                        } else {
                          setChatTitle(s.label);
                          setChatTitleColor(s.color);
                          localStorage.setItem('anilens_chat_title', s.label);
                          localStorage.setItem('anilens_chat_title_color', s.color);
                        }
                        setShowTitlePicker(false);
                      }}
                      className={`text-[10px] px-2 py-1 rounded transition-colors flex items-center justify-between gap-2 ${unlocked ? 'hover:bg-white/10 cursor-pointer secret-glitch' : 'cursor-not-allowed'}`}
                      style={{
                        background: selected ? `${s.color}22` : 'rgba(255,255,255,0.04)',
                        color: !unlocked ? 'var(--text-tertiary)' : selected ? s.color : 'var(--text-secondary)',
                        border: selected ? `1px solid ${s.color}44` : `1px solid ${ring}22`,
                        opacity: unlocked ? 1 : 0.4,
                      }}
                    >
                      <span className="flex flex-col items-start min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: ring }} />
                          <span className="truncate">{unlocked ? s.label : '???'}</span>
                        </span>
                        {!unlocked && (
                          <span className="text-[9px] italic mt-0.5 leading-tight" style={{ color: 'var(--text-tertiary)' }}>
                            {s.hint}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              {chatTitle && (
                <button
                  onClick={() => {
                    setChatTitle('');
                    setChatTitleColor('');
                    localStorage.removeItem('anilens_chat_title');
                    localStorage.removeItem('anilens_chat_title_color');
                  }}
                  className="text-[9px] hover:text-white/70"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Clear title
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mb-1">
            {chatTitle && (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded cursor-pointer"
                style={{
                  background: chatTitleColor ? `${chatTitleColor}18` : 'rgba(255,255,255,0.06)',
                  color: chatTitleColor || 'var(--text-tertiary)',
                  border: chatTitleColor ? `1px solid ${chatTitleColor}33` : '1px solid rgba(255,255,255,0.08)',
                }}
                onClick={() => setShowTitlePicker((p) => !p)}
              >
                <Sparkles size={10} />
                {chatTitle}
                <ChevronDown size={10} />
              </span>
            )}
            {!chatTitle && (
              <button
                onClick={() => setShowTitlePicker((p) => !p)}
                className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                + Title
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something..."
              maxLength={280}
              className="flex-1 text-xs px-3 py-2 rounded-md bg-white/5 border border-white/10 outline-none transition-colors focus:border-white/20 placeholder:text-white/20"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="shrink-0 p-2 rounded-md transition-colors disabled:opacity-30"
              style={{ background: 'var(--accent-color)' }}
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {input.length}/280
            </span>
            <div className="flex items-center gap-2">
              {warning && (
                <span className="text-[10px] inline-flex items-center gap-1" style={{ color: 'var(--accent-color)' }}>
                  <ShieldAlert size={10} />
                  {warning}
                </span>
              )}
              {error && (
                <span className="text-[10px]" style={{ color: 'var(--accent-color)' }}>
                  {error}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="text-xs text-center py-3 rounded-md mt-2"
          style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-tertiary)' }}
        >
          Log in with AniList to join the chat
        </div>
      )}
    </div>
  );
}
