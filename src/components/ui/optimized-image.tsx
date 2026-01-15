'use client';

import { useState, useRef, useEffect, memo } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onClick?: () => void;
  eager?: boolean; // Disable lazy loading for game contexts
}

// Generate a tiny placeholder color based on image URL hash
function generatePlaceholderColor(src: string): string {
  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    hash = src.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 20%, 15%)`;
}

// Generate blur placeholder SVG
function generateBlurSVG(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 12"><rect fill="${color}" width="8" height="12"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Optimized image component with:
 * - Lazy loading via IntersectionObserver
 * - Generated blur placeholders
 * - Smooth fade-in transitions
 * - Memory-efficient loading
 */
function OptimizedImageInner({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onClick,
  eager = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority || eager);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading (disabled for eager loading)
  useEffect(() => {
    if (priority || isInView || eager) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView, eager]);

  const handleLoad = () => {
    console.log('[OptimizedImage] Image loaded successfully:', src);
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    console.error('[OptimizedImage] Image failed to load:', src);
    setHasError(true);
  };

  const placeholderColor = generatePlaceholderColor(src);
  const generatedBlurURL = blurDataURL || generateBlurSVG(placeholderColor);

  // Fallback for errored images
  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={`bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center border border-white/10 ${className}`}
        style={!fill ? { width, height } : undefined}
        onClick={onClick}
      >
        <div className="text-center p-2">
          <svg className="w-8 h-8 mx-auto text-gray-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-500 text-xs block">No Image</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={!fill ? { width, height } : undefined}
      onClick={onClick}
    >
      {/* Placeholder background */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundColor: placeholderColor }}
      />

      {/* Actual image - only render when in view */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          sizes={sizes}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={generatedBlurURL}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority || eager ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
}

export const OptimizedImage = memo(OptimizedImageInner);

/**
 * Preload critical images
 */
export function preloadImage(src: string): void {
  if (typeof window === 'undefined') return;
  const img = new window.Image();
  img.src = src;
}

/**
 * Preload multiple images
 */
export function preloadImages(srcs: string[]): void {
  srcs.forEach(preloadImage);
}
