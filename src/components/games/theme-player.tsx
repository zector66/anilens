'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
import { ThemeMetadata } from '@/lib/theme-provider';

interface ThemePlayerProps {
  theme: ThemeMetadata | null;
  autoPlay?: boolean;
  showTitle?: boolean;
  onEnded?: () => void;
  onError?: () => void;
  className?: string;
}

export function ThemePlayer({ 
  theme, 
  autoPlay = false, 
  showTitle = false,
  onEnded,
  onError,
  className = ''
}: ThemePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Reset state when theme changes
  useEffect(() => {
    setIsPlaying(false);
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setDuration(0);
  }, [theme?.id]);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (autoPlay) {
        videoRef.current.play().catch(() => {
          // Autoplay blocked, user needs to interact
          setIsPlaying(false);
        });
      }
    }
  }, [autoPlay]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load theme audio');
    onError?.();
  }, [onError]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setProgress(videoRef.current.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onEnded?.();
  }, [onEnded]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setError('Playback failed');
      });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const seek = useCallback((time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setProgress(time);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!theme) {
    return (
      <div className={`p-6 rounded-2xl bg-white/5 border border-white/10 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">No theme available</p>
        </div>
      </div>
    );
  }

  // Use audio URL if available, otherwise video URL
  const mediaUrl = theme.audioUrl || theme.videoUrl;

  return (
    <div className={`p-6 rounded-2xl bg-white/5 border border-white/10 ${className}`}>
      {/* Hidden video/audio element - streams directly from AnimeThemes mirrors */}
      <video
        ref={videoRef}
        src={mediaUrl}
        onLoadedData={handleLoadedData}
        onError={handleError}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
        preload="auto"
      />

      {/* Visualizer Background */}
      <div className="relative mb-6">
        <div className="h-32 rounded-xl bg-linear-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 overflow-hidden flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          ) : error ? (
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : (
            <div className="flex items-end justify-center gap-1 h-20">
              {/* Audio visualizer bars */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-t transition-all duration-150 ${
                    isPlaying ? 'bg-purple-400' : 'bg-purple-400/40'
                  }`}
                  style={{
                    height: isPlaying 
                      ? `${20 + Math.sin((progress * 4) + (i * 0.5)) * 30 + ((i * 7) % 20)}px`
                      : '20px',
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Theme Type Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            theme.type === 'OP' 
              ? 'bg-blue-500/30 text-blue-300' 
              : 'bg-pink-500/30 text-pink-300'
          }`}>
            {theme.type}{theme.sequence > 1 ? theme.sequence : ''}
          </span>
        </div>
      </div>

      {/* Song Info */}
      {showTitle && (
        <div className="mb-4 text-center">
          <h4 className="text-lg font-bold text-white truncate">{theme.songTitle}</h4>
          <p className="text-sm text-gray-400 truncate">{theme.artistName}</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div 
          className="h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            seek(percent * duration);
          }}
        >
          <div 
            className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full transition-all"
            style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={toggleMute}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-gray-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-gray-400" />
          )}
        </button>

        <button
          onClick={togglePlay}
          disabled={isLoading || !!error}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isLoading || error
              ? 'bg-white/10 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600 hover:scale-105'
          }`}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-1" />
          )}
        </button>

        <div className="w-9" /> {/* Spacer for symmetry */}
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-gray-500 mt-4">
        🎵 Listen and guess which series this is from!
      </p>
    </div>
  );
}

// Detect if we're on mobile (for autoplay restrictions)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

// Compact version for game questions
export function ThemePlayerCompact({ 
  theme, 
  autoPlay = true,
  showSongInfo = false,
  onError,
  onPlay,
  onLoadFail,
}: { 
  theme: ThemeMetadata | null;
  autoPlay?: boolean;
  showSongInfo?: boolean;
  onError?: () => void;
  onPlay?: () => void;
  onLoadFail?: () => void; // Called when audio fails to load (for skip without penalty)
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const hasCalledOnPlay = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setIsPlaying(false);
    setNeedsUserGesture(false);
    setLoadTimeout(false);
    hasCalledOnPlay.current = false;

    // Set a load timeout for mobile - if audio doesn't load in 8s, skip
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    loadTimeoutRef.current = setTimeout(() => {
      if (isLoading && !isPlaying) {
        setLoadTimeout(true);
        onLoadFail?.();
      }
    }, 8000);

    // Cleanup: pause video on unmount
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [theme?.id]);

  // Clear timeout when audio starts playing
  useEffect(() => {
    if (isPlaying && loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, [isPlaying]);

  // Pause when autoPlay becomes false (e.g. when answer is shown)
  useEffect(() => {
    if (!autoPlay && videoRef.current && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [autoPlay, isPlaying]);

  // Handle user tap to start audio (mobile)
  const handleTapToStart = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.play().then(() => {
      setNeedsUserGesture(false);
    }).catch((err) => {
      console.error('Playback failed after tap:', err);
      setError(true);
    });
  }, []);

  if (!theme) {
    return (
      <div className="h-24 rounded-xl bg-white/5 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading theme...</p>
      </div>
    );
  }

  // Show load timeout message
  if (loadTimeout) {
    return (
      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-orange-400" />
          </div>
          <div className="text-left">
            <p className="text-orange-300 font-medium">Audio Unavailable</p>
            <p className="text-orange-400/70 text-sm">Skipping without penalty...</p>
          </div>
        </div>
      </div>
    );
  }

  const mediaUrl = theme.audioUrl || theme.videoUrl;

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={mediaUrl}
        playsInline
        onLoadedData={() => {
          setIsLoading(false);
          if (autoPlay && videoRef.current) {
            videoRef.current.play().catch(() => {
              // Autoplay blocked - show tap to start on mobile
              if (isMobile) {
                setNeedsUserGesture(true);
              }
              setIsPlaying(false);
            });
          }
        }}
        onError={() => {
          setError(true);
          setIsLoading(false);
          onError?.();
        }}
        onPlay={() => {
          setIsPlaying(true);
          setNeedsUserGesture(false);
          if (!hasCalledOnPlay.current) {
            hasCalledOnPlay.current = true;
            onPlay?.();
          }
        }}
        onPause={() => setIsPlaying(false)}
        className="hidden"
        preload="auto"
      />

      {/* Mobile: Tap to Start Overlay */}
      {needsUserGesture && (
        <button
          onClick={handleTapToStart}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-purple-900/90 rounded-xl border-2 border-purple-500 animate-pulse"
        >
          <Play className="w-10 h-10 text-white mb-2" />
          <span className="text-white font-semibold">Tap to Start Audio</span>
          <span className="text-purple-300 text-xs mt-1">Timer starts when audio plays</span>
        </button>
      )}

      <div className="p-4 rounded-xl bg-linear-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 border border-white/10">
        <div className="flex items-center gap-4">
          {/* Play button */}
          <button
            onClick={() => {
              if (!videoRef.current) return;
              if (isPlaying) {
                videoRef.current.pause();
              } else {
                videoRef.current.play();
              }
            }}
            disabled={isLoading || error}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isLoading || error ? 'bg-white/10' : 'bg-purple-500 hover:bg-purple-600'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : error ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>

          {/* Song info or Visualizer */}
          <div className="flex-1 min-w-0">
            {showSongInfo && theme.songTitle ? (
              <div className="text-left">
                <p className="text-white font-medium truncate">{theme.songTitle}</p>
                {theme.artistName && (
                  <p className="text-gray-400 text-sm truncate">{theme.artistName}</p>
                )}
              </div>
            ) : (
              <div className="flex items-end gap-0.5 h-10">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all duration-100 ${
                      error ? 'bg-red-400/40' : isPlaying ? 'bg-purple-400' : 'bg-purple-400/40'
                    }`}
                    style={{
                      height: isPlaying && !error
                        ? `${10 + ((i * 13 + 7) % 30)}px`
                        : '10px'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Type badge */}
          <span className={`px-2 py-1 rounded text-xs font-bold shrink-0 ${
            theme.type === 'OP' ? 'bg-blue-500/30 text-blue-300' : 'bg-pink-500/30 text-pink-300'
          }`}>
            {theme.type}{theme.sequence > 1 ? theme.sequence : ''}
          </span>
        </div>

        {error && (
          <p className="text-xs text-red-400 mt-2 text-center">
            Theme unavailable - make your best guess!
          </p>
        )}
      </div>
    </div>
  );
}
