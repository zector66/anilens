'use client';

import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact' | 'card';
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  variant = 'default',
  className 
}: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10", className)}>
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white">{title}</p>
          <p className="text-sm text-gray-400 truncate">{description}</p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors shrink-0"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn("p-6 rounded-2xl bg-white/5 border border-white/10 text-center", className)}>
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-4 max-w-sm mx-auto">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-purple-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-8 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface NoDataProps {
  type: 'anime' | 'manga' | 'games' | 'recommendations' | 'stats';
  onAction?: () => void;
}

export function NoData({ type, onAction }: NoDataProps) {
  const configs = {
    anime: {
      title: 'No Anime Data',
      description: 'Start watching anime and add them to your AniList to see your stats and play games!',
      actionLabel: 'Visit AniList',
    },
    manga: {
      title: 'No Manga Data',
      description: 'Start reading manga and add them to your AniList to see your stats!',
      actionLabel: 'Visit AniList',
    },
    games: {
      title: 'No Games Available',
      description: 'You need to have anime or manga in your list to play personalized games.',
      actionLabel: 'Add to List',
    },
    recommendations: {
      title: 'No Recommendations Yet',
      description: 'Watch more anime to get personalized recommendations based on your taste!',
      actionLabel: 'Explore',
    },
    stats: {
      title: 'No Stats Available',
      description: 'Connect your AniList account to see your personalized statistics.',
      actionLabel: 'Connect',
    },
  };

  const config = configs[type];

  return (
    <EmptyState
      icon={Inbox}
      title={config.title}
      description={config.description}
      action={onAction ? { label: config.actionLabel, onClick: onAction } : undefined}
    />
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message = 'An unexpected error occurred. Please try again.',
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center mb-6">
        <span className="text-4xl">⚠️</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-8 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

interface SuccessMessageProps {
  title: string;
  message?: string;
  onDismiss?: () => void;
}

export function SuccessMessage({ title, message, onDismiss }: SuccessMessageProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-green-500/20 border border-green-500/30 backdrop-blur-xl">
        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
          <span className="text-xl">✓</span>
        </div>
        <div>
          <p className="font-medium text-green-400">{title}</p>
          {message && <p className="text-sm text-green-300/70">{message}</p>}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-white/10 transition-colors text-green-400"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface InfoBannerProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  variant?: 'info' | 'warning' | 'tip';
  onDismiss?: () => void;
}

export function InfoBanner({ 
  icon: Icon, 
  title, 
  message, 
  variant = 'info',
  onDismiss 
}: InfoBannerProps) {
  const variantStyles = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    tip: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={cn("flex items-start gap-4 p-4 rounded-xl border", variantStyles[variant])}>
      {Icon && (
        <div className="shrink-0 mt-0.5">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-sm opacity-80 mt-1">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
}
