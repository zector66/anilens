'use client';

import { memo, useCallback } from 'react';
import { OptimizedImage } from './optimized-image';
import { usePrefetchMedia } from '@/hooks/use-prefetch';

interface MediaCardProps {
  id: number;
  title: string;
  coverImage: string;
  score?: number;
  format?: string;
  genres?: string[];
  onClick?: () => void;
  priority?: boolean;
  showScore?: boolean;
  showGenres?: boolean;
  className?: string;
}

/**
 * Memoized media card component for optimal re-render performance
 * - Uses OptimizedImage for lazy loading
 * - Prefetches media details on hover
 * - Prevents unnecessary re-renders with React.memo
 */
function MediaCardInner({
  id,
  title,
  coverImage,
  score,
  format,
  genres = [],
  onClick,
  priority = false,
  showScore = true,
  showGenres = false,
  className = '',
}: MediaCardProps) {
  const { prefetchMediaDebounced } = usePrefetchMedia();

  const handleMouseEnter = useCallback(() => {
    prefetchMediaDebounced(id);
  }, [id, prefetchMediaDebounced]);

  return (
    <div
      className={`group relative cursor-pointer transition-transform hover:scale-105 ${className}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
    >
      {/* Cover Image */}
      <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-gray-800">
        <OptimizedImage
          src={coverImage}
          alt={title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Score Badge */}
        {showScore && score && score > 0 && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm">
            <span className={`text-sm font-bold ${
              score >= 80 ? 'text-green-400' :
              score >= 60 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {score}%
            </span>
          </div>
        )}
        
        {/* Format Badge */}
        {format && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-purple-500/80 backdrop-blur-sm">
            <span className="text-xs font-medium text-white">{format}</span>
          </div>
        )}
      </div>
      
      {/* Title */}
      <h3 className="mt-2 text-sm font-medium text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
        {title}
      </h3>
      
      {/* Genres */}
      {showGenres && genres.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="px-1.5 py-0.5 text-xs rounded bg-white/10 text-gray-400"
            >
              {genre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export const MediaCard = memo(MediaCardInner);

/**
 * Smaller variant for dense grids
 */
function MediaCardSmallInner({
  title,
  coverImage,
  onClick,
  className = '',
}: Pick<MediaCardProps, 'title' | 'coverImage' | 'onClick' | 'className'>) {
  return (
    <div
      className={`group relative cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-gray-800">
        <OptimizedImage
          src={coverImage}
          alt={title}
          fill
          sizes="(max-width: 640px) 33vw, 12vw"
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <p className="mt-1 text-xs text-gray-400 line-clamp-1">{title}</p>
    </div>
  );
}

export const MediaCardSmall = memo(MediaCardSmallInner);

/**
 * Horizontal card variant for lists
 */
function MediaCardHorizontalInner({
  id,
  title,
  coverImage,
  score,
  format,
  genres = [],
  onClick,
  className = '',
}: MediaCardProps) {
  const { prefetchMediaDebounced } = usePrefetchMedia();

  const handleMouseEnter = useCallback(() => {
    prefetchMediaDebounced(id);
  }, [id, prefetchMediaDebounced]);

  return (
    <div
      className={`group flex gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors ${className}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
    >
      <div className="relative w-16 aspect-2/3 rounded-lg overflow-hidden shrink-0">
        <OptimizedImage
          src={coverImage}
          alt={title}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {format && (
            <span className="text-xs text-gray-400">{format}</span>
          )}
          {score && score > 0 && (
            <span className={`text-xs font-medium ${
              score >= 80 ? 'text-green-400' :
              score >= 60 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {score}%
            </span>
          )}
        </div>
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-1.5 py-0.5 text-xs rounded bg-white/10 text-gray-500"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const MediaCardHorizontal = memo(MediaCardHorizontalInner);
