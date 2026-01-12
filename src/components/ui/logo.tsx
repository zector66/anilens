'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', lens: 'w-4 h-4' },
    md: { icon: 'w-10 h-10', text: 'text-xl', lens: 'w-5 h-5' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', lens: 'w-7 h-7' },
    xl: { icon: 'w-20 h-20', text: 'text-4xl', lens: 'w-10 h-10' },
  };

  const s = sizes[size];

  return (
    <div className={cn('flex items-center gap-3 cursor-pointer', className)} onClick={() => window.location.href = '/'}>
      {/* Logo Icon - A stylized lens/eye with anime sparkle */}
      <div className={cn(
        'relative rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30',
        s.icon
      )}>
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 blur-sm opacity-50" />
        
        {/* Inner lens design */}
        <div className="relative">
          {/* Main lens circle */}
          <div className={cn(
            'rounded-full bg-gradient-to-br from-white/90 to-white/60 flex items-center justify-center',
            s.lens
          )}>
            {/* Pupil with gradient */}
            <div className="w-2/3 h-2/3 rounded-full bg-gradient-to-br from-violet-600 to-purple-800 relative overflow-hidden">
              {/* Reflection highlight */}
              <div className="absolute top-0.5 left-0.5 w-1/3 h-1/3 rounded-full bg-white/80" />
            </div>
          </div>
          
          {/* Sparkle accents */}
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-purple-200 rounded-full animate-pulse delay-300" />
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-black tracking-tight bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent',
            s.text
          )}>
            AniLens
          </span>
          {size === 'lg' || size === 'xl' ? (
            <span className="text-xs text-purple-300/70 font-medium tracking-wider uppercase">
              Discover Your Taste
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Animated version for hero sections
export function AnimatedLogo({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-32 h-32 rounded-full border border-purple-500/20 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute w-24 h-24 rounded-full border border-violet-500/30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute w-16 h-16 rounded-full border border-indigo-500/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
      </div>
      
      {/* Main logo */}
      <div className="relative z-10">
        <Logo size="xl" showText={false} />
      </div>
    </div>
  );
}
