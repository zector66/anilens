'use client';

import { ReactNode, useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContentRowProps {
  children: ReactNode;
}

export function ContentRow({ children }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  const scrollBy = (amount: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(checkScroll, 300);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative group">
      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto -mx-4 px-4 snap-x snap-mandatory scroll-pl-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-600)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: 'rgba(5,5,8,0.8)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scrollBy(600)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: 'rgba(5,5,8,0.8)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <ChevronRight size={20} style={{ color: 'var(--text-primary)' }} />
        </button>
      )}
    </div>
  );
}
