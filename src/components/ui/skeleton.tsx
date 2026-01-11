'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({ 
  className, 
  variant = 'rectangular',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClass = 'animate-pulse bg-white/10 rounded';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClass, variantClasses[variant], className)}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClass, variantClasses[variant], className)}
      style={style}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-start gap-4">
        <Skeleton variant="rectangular" width={80} height={112} className="flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" width="50%" height={16} />
          <Skeleton variant="text" width="30%" height={14} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonLeaderboard() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" width="40%" height={16} />
            <Skeleton variant="text" width="25%" height={12} />
          </div>
          <Skeleton variant="rectangular" width={60} height={24} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGameCard() {
  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={14} className="mt-1" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={100} className="mb-4" />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" height={40} className="flex-1" />
        <Skeleton variant="rectangular" height={40} className="flex-1" />
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="space-y-2">
          <Skeleton variant="text" width={150} height={24} />
          <Skeleton variant="text" width={100} height={16} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" height={80} />
        ))}
      </div>
    </div>
  );
}
