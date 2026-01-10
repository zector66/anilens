'use client';

import { Suspense, lazy, ComponentType, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Default loading spinner for lazy components
 */
export function DefaultLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );
}

/**
 * Skeleton loader for cards
 */
export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-700/50 rounded-xl aspect-2/3 mb-2" />
      <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-1" />
      <div className="h-3 bg-gray-700/50 rounded w-1/2" />
    </div>
  );
}

/**
 * Grid skeleton for media grids
 */
export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Wrapper for lazy-loaded components with Suspense
 */
export function LazyComponent({ children, fallback }: LazyComponentProps) {
  return (
    <Suspense fallback={fallback || <DefaultLoader />}>
      {children}
    </Suspense>
  );
}

/**
 * Higher-order component for creating lazy-loaded components
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode
) {
  const LazyComp = lazy(importFn);
  
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={fallback || <DefaultLoader />}>
        <LazyComp {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload a lazy component before it's needed
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<unknown> }>
): void {
  importFn();
}
