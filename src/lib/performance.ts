/**
 * Performance utilities for optimizing rendering and data loading
 */

/**
 * Debounce function for expensive operations
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for rate-limiting
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request idle callback with fallback
 */
export function requestIdleCallbackPolyfill(
  callback: () => void,
  options?: { timeout?: number }
): void {
  if (typeof window === 'undefined') {
    callback();
    return;
  }
  
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, options?.timeout || 1);
  }
}

/**
 * Batch multiple state updates using requestAnimationFrame
 */
export function batchUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

/**
 * Memoize expensive function results
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

/**
 * Chunk array for batch processing
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Process array in chunks with idle time between
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T) => R,
  chunkSize = 50,
  delayMs = 0
): Promise<R[]> {
  const results: R[] = [];
  const chunks = chunkArray(items, chunkSize);
  
  for (const chunk of chunks) {
    results.push(...chunk.map(processor));
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Shallow comparison for React.memo
 */
export function shallowEqual<T extends Record<string, unknown>>(
  objA: T,
  objB: T
): boolean {
  if (objA === objB) return true;
  if (!objA || !objB) return false;
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }
  
  return true;
}

/**
 * Deep comparison for complex objects (use sparingly)
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => 
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }
  
  return false;
}

/**
 * Performance measurement utility
 */
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  
  start(label: string): void {
    this.marks.set(label, performance.now());
  }
  
  end(label: string): number {
    const start = this.marks.get(label);
    if (!start) return 0;
    const duration = performance.now() - start;
    this.marks.delete(label);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
    }
    return duration;
  }
  
  measure<T>(label: string, fn: () => T): T {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }
  
  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

export const perfTracker = new PerformanceTracker();

/**
 * Intersection Observer hook configuration
 */
export const defaultIntersectionOptions: IntersectionObserverInit = {
  root: null,
  rootMargin: '100px',
  threshold: 0,
};

/**
 * Create optimized scroll handler using requestAnimationFrame
 */
export function createScrollHandler(callback: () => void): () => void {
  let ticking = false;
  
  return () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
}
