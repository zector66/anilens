'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';

type SearchScope = 'anime' | 'manga' | 'users';

interface Suggestion {
  id: number;
  title: string;
  image?: string;
  subtitle?: string;
}

interface SearchBarProps {
  onSearch?: (query: string, scope: SearchScope) => void;
  showScopes?: boolean;
  defaultScope?: SearchScope;
}

const SCOPES: { key: SearchScope; label: string }[] = [
  { key: 'anime', label: 'Anime' },
  { key: 'manga', label: 'Manga' },
  { key: 'users', label: 'Users' },
];

export function SearchBar({
  onSearch,
  showScopes = false,
  defaultScope = 'anime',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>(defaultScope);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q: string, s: SearchScope) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search/${s}?q=${encodeURIComponent(q.trim())}&limit=5`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const results = (data.results || []).slice(0, 5).map((r: Record<string, unknown>) => ({
        id: r.id as number,
        title: (r.title as string) || (r.name as string) || 'Unknown',
        image: (r.image as string) || (r.avatar as string) || ((r.coverImage as Record<string, string>)?.medium) || '',
        subtitle: (r.genres as string[])?.slice(0, 2).join(', ') || (r.format as string) || '',
      }));
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim().length >= 2) {
        fetchSuggestions(query, scope);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, scope, fetchSuggestions]);

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.title);
    setShowDropdown(false);
    onSearch?.(suggestion.title, scope);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (query.trim() && onSearch) {
      onSearch(query.trim(), scope);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const scopeLabel = scope.charAt(0).toUpperCase() + scope.slice(1);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full relative">
      {showScopes && (
        <div className="flex items-center gap-1 mb-3">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setScope(s.key);
                setQuery('');
                setSuggestions([]);
                setShowDropdown(false);
                inputRef.current?.focus();
              }}
              className="px-3 py-1 text-xs font-medium rounded-full transition-colors duration-150"
              style={{
                background: scope === s.key ? 'var(--accent-color)' : 'var(--text-muted)',
                color: scope === s.key ? '#fff' : 'var(--text-tertiary)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <Search size={18} style={{ color: 'var(--text-tertiary)' }} className="shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={`Search ${scopeLabel.toLowerCase()}...`}
          className="flex-1 min-w-0 text-sm outline-none bg-transparent"
          style={{ color: 'var(--text-primary)' }}
        />
        {isLoading && (
          <Loader2 size={16} className="animate-spin shrink-0" style={{ color: 'var(--text-tertiary)' }} />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 py-1 overflow-hidden"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-100"
              style={{
                background: i === activeIndex ? 'rgba(255,255,255,0.04)' : 'transparent',
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {s.image && (
                <img
                  src={s.image}
                  alt=""
                  className="w-8 h-10 object-cover rounded-sm shrink-0"
                  loading="lazy"
                />
              )}
              <div className="min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {s.title}
                </p>
                {s.subtitle && (
                  <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                    {s.subtitle}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
