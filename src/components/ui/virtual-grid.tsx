'use client';

import { useRef, useState, useEffect, useCallback, memo, ReactNode } from 'react';

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  itemWidth: number;
  gap?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
}

/**
 * High-performance virtualized grid component
 * Only renders items visible in the viewport + overscan buffer
 */
function VirtualGridInner<T>({
  items,
  renderItem,
  itemHeight,
  itemWidth,
  gap = 16,
  overscan = 3,
  className = '',
  emptyMessage = 'No items to display',
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [columns, setColumns] = useState(4);

  // Calculate columns based on container width
  const updateColumns = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const cols = Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
    setColumns(cols);
  }, [itemWidth, gap]);

  // Update visible range based on scroll position
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollTop = window.scrollY - container.offsetTop;
    const viewportHeight = window.innerHeight;
    
    const rowHeight = itemHeight + gap;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan;
    
    const start = startRow * columns;
    const end = Math.min(items.length, endRow * columns);
    
    setVisibleRange({ start, end });
  }, [columns, itemHeight, gap, overscan, items.length]);

  // Handle resize
  useEffect(() => {
    updateColumns();
    const handleResize = () => {
      updateColumns();
      updateVisibleRange();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateColumns, updateVisibleRange]);

  // Handle scroll
  useEffect(() => {
    updateVisibleRange();
    const handleScroll = () => {
      requestAnimationFrame(updateVisibleRange);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [updateVisibleRange]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * (itemHeight + gap) - gap;

  // Calculate position for each visible item
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  
  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height: totalHeight }}
    >
      {visibleItems.map((item, idx) => {
        const actualIndex = visibleRange.start + idx;
        const row = Math.floor(actualIndex / columns);
        const col = actualIndex % columns;
        const top = row * (itemHeight + gap);
        const left = col * (itemWidth + gap);

        return (
          <div
            key={actualIndex}
            className="absolute transition-opacity duration-150"
            style={{
              top,
              left,
              width: itemWidth,
              height: itemHeight,
            }}
          >
            {renderItem(item, actualIndex)}
          </div>
        );
      })}
    </div>
  );
}

export const VirtualGrid = memo(VirtualGridInner) as typeof VirtualGridInner;

/**
 * Simpler virtualized list for vertical scrolling
 */
interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  overscan?: number;
  className?: string;
}

function VirtualListInner<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 5,
  className = '',
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollTop = window.scrollY - container.offsetTop;
    const viewportHeight = window.innerHeight;
    
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan);
    
    setVisibleRange({ start, end });
  }, [itemHeight, overscan, items.length]);

  useEffect(() => {
    updateVisibleRange();
    const handleScroll = () => requestAnimationFrame(updateVisibleRange);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [updateVisibleRange]);

  const totalHeight = items.length * itemHeight;
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height: totalHeight }}
    >
      {visibleItems.map((item, idx) => {
        const actualIndex = visibleRange.start + idx;
        return (
          <div
            key={actualIndex}
            className="absolute left-0 right-0"
            style={{
              top: actualIndex * itemHeight,
              height: itemHeight,
            }}
          >
            {renderItem(item, actualIndex)}
          </div>
        );
      })}
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;
