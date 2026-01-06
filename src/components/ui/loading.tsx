'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse rounded-lg bg-white/10",
        className
      )} 
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function MediaCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
      <Skeleton className="aspect-[2/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function MediaGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  // Pre-defined heights for deterministic rendering
  const barHeights = ['h-[85%]', 'h-[60%]', 'h-[75%]', 'h-[45%]', 'h-[90%]', 'h-[55%]', 'h-[70%]', 'h-[80%]'];
  
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="h-64 flex items-end gap-2">
        {barHeights.map((height, i) => (
          <Skeleton 
            key={i} 
            className={cn("flex-1 rounded-t-lg", height)}
          />
        ))}
      </div>
    </div>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
      <Skeleton className="h-6 w-48" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div 
      className={cn(
        "rounded-full border-purple-500 border-t-transparent animate-spin",
        sizeClasses[size],
        className
      )} 
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="p-8 rounded-2xl bg-gray-900 border border-white/10 text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-white font-medium">{message}</p>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  isLoading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  errorMessage?: string;
}

export function LoadingState({ 
  isLoading, 
  error, 
  children, 
  skeleton,
  errorMessage = 'Something went wrong'
}: LoadingStateProps) {
  if (isLoading) {
    return skeleton || (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <p className="text-white font-medium mb-2">{errorMessage}</p>
        <p className="text-gray-400 text-sm max-w-md">{error.message}</p>
      </div>
    );
  }

  return <>{children}</>;
}
