'use client';

import { useEffect, useState, useMemo } from 'react';
import { WeatherCondition } from '@/lib/weather-service';

interface WeatherEffectsProps {
  condition: WeatherCondition;
  isDay: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  className?: string;
}

// Enhanced Rain drop with varied sizes and speeds
function RainDrop({ delay, left, duration, height, opacity }: { 
  delay: number; left: number; duration: number; height: number; opacity: number 
}) {
  return (
    <div
      className="absolute animate-rain"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        width: '1px',
        height: `${height}px`,
        background: `linear-gradient(to bottom, transparent, rgba(147, 197, 253, ${opacity}), rgba(96, 165, 250, ${opacity * 1.2}))`,
        borderRadius: '2px',
        filter: 'blur(0.5px)',
      }}
    />
  );
}

// Rain splash effect at bottom
function RainSplash({ left, delay }: { left: number; delay: number }) {
  return (
    <div
      className="absolute bottom-0 animate-splash pointer-events-none"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="relative">
        <div className="w-1 h-1 bg-blue-300/40 rounded-full" />
        <div className="absolute -left-1 -top-1 w-0.5 h-0.5 bg-blue-300/30 rounded-full animate-splash-particle" />
        <div className="absolute left-1 -top-1 w-0.5 h-0.5 bg-blue-300/30 rounded-full animate-splash-particle" style={{ animationDelay: '0.05s' }} />
      </div>
    </div>
  );
}

// Enhanced Snowflake with multiple styles
function Snowflake({ delay, left, size, duration, type, wobble }: { 
  delay: number; left: number; size: number; duration: number; type: number; wobble: number 
}) {
  const snowflakeChars = ['❄', '❅', '❆', '✦', '✧', '•'];
  return (
    <div
      className="absolute animate-snow select-none"
      style={{
        left: `${left}%`,
        fontSize: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        opacity: 0.6 + Math.random() * 0.4,
        filter: size > 14 ? 'blur(0.5px)' : 'none',
        ['--wobble' as string]: `${wobble}px`,
      }}
    >
      {snowflakeChars[type % snowflakeChars.length]}
    </div>
  );
}

// Lightning flash with multiple flickers
function Lightning({ active, intensity }: { active: boolean; intensity: number }) {
  if (!active) return null;
  return (
    <>
      <div 
        className="absolute inset-0 pointer-events-none animate-lightning-flash"
        style={{ 
          background: `radial-gradient(ellipse at ${30 + Math.random() * 40}% ${10 + Math.random() * 30}%, rgba(255,255,255,${0.3 * intensity}), transparent 60%)` 
        }}
      />
      {/* Lightning bolt */}
      <svg 
        className="absolute pointer-events-none animate-lightning-bolt"
        style={{ 
          top: '5%', 
          left: `${20 + Math.random() * 60}%`,
          opacity: intensity,
        }}
        width="40" 
        height="120" 
        viewBox="0 0 40 120"
      >
        <path
          d="M20 0 L25 40 L35 42 L18 70 L25 72 L10 120 L15 75 L8 73 L22 45 L12 43 Z"
          fill="rgba(255, 255, 200, 0.9)"
          filter="drop-shadow(0 0 10px rgba(255,255,200,0.8))"
        />
      </svg>
    </>
  );
}

// Enhanced Sun with lens flare and god rays
function SunRays() {
  return (
    <div className="absolute top-4 right-12 pointer-events-none">
      <div className="relative w-48 h-48">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-gradient-radial from-yellow-200/40 via-orange-200/20 to-transparent rounded-full animate-pulse-slow blur-xl" />
        
        {/* God rays */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 origin-center animate-ray-rotate"
            style={{
              width: '2px',
              height: '200px',
              background: 'linear-gradient(to bottom, rgba(255,220,100,0.4), transparent)',
              transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
        
        {/* Middle glow */}
        <div className="absolute inset-4 bg-gradient-radial from-yellow-100/60 via-orange-200/30 to-transparent rounded-full" />
        
        {/* Sun core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16">
          <div className="w-full h-full rounded-full bg-gradient-radial from-yellow-100 via-yellow-200 to-orange-300 shadow-lg shadow-yellow-500/50 animate-pulse-slow" />
          <div className="absolute inset-1 rounded-full bg-gradient-radial from-white/80 to-transparent" />
        </div>
        
        {/* Lens flares */}
        <div className="absolute top-[70%] left-[30%] w-6 h-6 bg-gradient-radial from-cyan-400/30 to-transparent rounded-full blur-sm animate-flare" />
        <div className="absolute top-[80%] left-[40%] w-3 h-3 bg-gradient-radial from-purple-400/20 to-transparent rounded-full blur-sm animate-flare" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-[90%] left-[50%] w-8 h-8 bg-gradient-radial from-orange-300/20 to-transparent rounded-full blur-md animate-flare" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
}

// Enhanced Moon with detailed surface and glow - positioned to be fully visible
function Moon() {
  return (
    <div className="absolute top-16 right-16 pointer-events-none">
      <div className="relative">
        {/* Outer atmospheric glow */}
        <div className="absolute -inset-12 bg-gradient-radial from-blue-100/15 via-blue-200/5 to-transparent rounded-full blur-2xl animate-pulse-slow" />
        
        {/* Inner glow */}
        <div className="absolute -inset-6 bg-gradient-radial from-blue-100/20 to-transparent rounded-full blur-lg" />
        
        {/* Moon body */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 shadow-2xl shadow-blue-200/30 relative overflow-hidden">
          {/* Surface texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-300/20 to-gray-500/30 rounded-full" />
          
          {/* Craters with depth */}
          <div className="absolute top-2 left-4 w-4 h-4 rounded-full bg-gradient-to-br from-gray-300/60 to-gray-400/80 shadow-inner" />
          <div className="absolute top-3 left-5 w-2 h-2 rounded-full bg-gray-200/40" />
          
          <div className="absolute top-8 left-12 w-3 h-3 rounded-full bg-gradient-to-br from-gray-300/50 to-gray-400/70 shadow-inner" />
          
          <div className="absolute top-12 left-3 w-5 h-5 rounded-full bg-gradient-to-br from-gray-300/60 to-gray-400/80 shadow-inner" />
          <div className="absolute top-13 left-4 w-2 h-2 rounded-full bg-gray-200/30" />
          
          <div className="absolute top-6 left-8 w-2 h-2 rounded-full bg-gray-400/40" />
          <div className="absolute top-15 left-10 w-3 h-3 rounded-full bg-gray-300/50" />
          
          {/* Highlight */}
          <div className="absolute top-1 left-2 w-6 h-6 bg-gradient-radial from-white/40 to-transparent rounded-full blur-sm" />
        </div>
        
        {/* Orbiting stars/sparkles */}
        <div className="absolute -top-6 -left-10 text-white/70 text-sm animate-twinkle">✦</div>
        <div className="absolute top-2 -right-10 text-white/50 text-base animate-twinkle" style={{ animationDelay: '0.7s' }}>✧</div>
        <div className="absolute -bottom-4 -left-8 text-white/60 text-xs animate-twinkle" style={{ animationDelay: '1.4s' }}>✦</div>
        <div className="absolute bottom-0 -right-8 text-white/40 text-sm animate-twinkle" style={{ animationDelay: '2.1s' }}>✦</div>
        <div className="absolute top-10 -left-12 text-white/30 text-xs animate-twinkle" style={{ animationDelay: '0.3s' }}>✧</div>
      </div>
    </div>
  );
}

// High-quality shooting star component with glow and realistic trail
function ShootingStar({ delay, startX, startY, speed, length }: { 
  delay: number; startX: number; startY: number; speed: number; length: number 
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: `${startY}%`,
        left: `${startX}%`,
        animation: `shooting-star ${speed}s ease-out infinite`,
        animationDelay: `${delay}s`,
        transform: 'rotate(35deg)',
      }}
    >
      {/* Main shooting star container */}
      <div className="relative" style={{ width: `${length}px`, height: '3px' }}>
        {/* Outer glow trail */}
        <div 
          className="absolute inset-0 rounded-full blur-sm"
          style={{
            background: `linear-gradient(to right, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(200,220,255,0.3) 60%, rgba(255,255,255,0.8) 95%, white 100%)`,
            height: '6px',
            top: '-1.5px',
          }}
        />
        
        {/* Core trail */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(to right, transparent 0%, transparent 10%, rgba(255,255,255,0.2) 30%, rgba(200,230,255,0.6) 70%, rgba(255,255,255,0.95) 95%, white 100%)`,
          }}
        />
        
        {/* Bright head */}
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"
          style={{
            boxShadow: '0 0 4px 2px rgba(255,255,255,0.8), 0 0 8px 4px rgba(200,220,255,0.5), 0 0 16px 6px rgba(150,180,255,0.3)',
          }}
        />
        
        {/* Sparkle at head */}
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 animate-pulse"
          style={{
            background: 'radial-gradient(circle, white 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}

// Aurora Borealis effect for clear nights
function Aurora() {
  return (
    <div className="absolute top-0 left-0 w-full h-1/2 pointer-events-none overflow-hidden opacity-30">
      <div className="absolute inset-0 animate-aurora-wave">
        <div 
          className="absolute top-0 left-1/4 w-1/2 h-full"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.2), rgba(45, 212, 191, 0.15), transparent)',
            filter: 'blur(40px)',
            transform: 'skewX(-15deg)',
          }}
        />
        <div 
          className="absolute top-0 left-1/3 w-1/3 h-full animate-aurora-shimmer"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.15), transparent)',
            filter: 'blur(50px)',
            transform: 'skewX(10deg)',
          }}
        />
        <div 
          className="absolute top-0 right-1/4 w-1/4 h-3/4 animate-aurora-shimmer"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(34, 211, 238, 0.2), rgba(6, 182, 212, 0.1), transparent)',
            filter: 'blur(45px)',
            animationDelay: '2s',
          }}
        />
      </div>
    </div>
  );
}

// Enhanced Cloud component with more detail
function Cloud({ top, left, scale, delay, isDark }: { top: number; left: number; scale: number; delay: number; isDark?: boolean }) {
  const cloudOpacity = isDark ? 0.08 : 0.12;
  return (
    <div
      className="absolute animate-float-cloud pointer-events-none"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        transform: `scale(${scale})`,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="relative">
        <div className="w-20 h-8 rounded-full backdrop-blur-sm" style={{ backgroundColor: `rgba(255,255,255,${cloudOpacity})` }} />
        <div className="absolute -top-4 left-4 w-12 h-12 rounded-full backdrop-blur-sm" style={{ backgroundColor: `rgba(255,255,255,${cloudOpacity * 0.9})` }} />
        <div className="absolute -top-2 left-12 w-10 h-10 rounded-full backdrop-blur-sm" style={{ backgroundColor: `rgba(255,255,255,${cloudOpacity * 0.8})` }} />
        <div className="absolute -top-1 left-20 w-8 h-8 rounded-full backdrop-blur-sm" style={{ backgroundColor: `rgba(255,255,255,${cloudOpacity * 0.7})` }} />
      </div>
    </div>
  );
}

// Fog layer
function FogLayer({ opacity, delay }: { opacity: number; delay: number }) {
  return (
    <div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/20 to-transparent animate-fog pointer-events-none"
      style={{
        opacity,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

// Stars background for night
function Stars() {
  const stars = useMemo(() => 
    [...Array(50)].map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
    })), []
  );

  return (
    <>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle pointer-events-none"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </>
  );
}

export function WeatherEffects({ condition, isDay, intensity = 'medium', className = '' }: WeatherEffectsProps) {
  const [lightningActive, setLightningActive] = useState(false);
  const [lightningIntensity, setLightningIntensity] = useState(1);

  // Calculate number of particles based on intensity
  const particleCount = {
    light: 30,
    medium: 60,
    heavy: 120,
  }[intensity];

  // Random lightning for thunderstorms
  useEffect(() => {
    if (condition !== 'thunderstorm') return;

    const triggerLightning = () => {
      setLightningIntensity(0.5 + Math.random() * 0.5);
      setLightningActive(true);
      setTimeout(() => setLightningActive(false), 150 + Math.random() * 100);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        triggerLightning();
        // Double flash effect
        if (Math.random() > 0.5) {
          setTimeout(triggerLightning, 100);
        }
      }
    }, 2000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [condition]);

  // Generate enhanced rain drops with varied properties
  const rainDrops = useMemo(() => 
    [...Array(particleCount)].map((_, i) => ({
      id: i,
      delay: Math.random() * 2,
      left: Math.random() * 100,
      duration: 0.4 + Math.random() * 0.4,
      height: 12 + Math.random() * 20,
      opacity: 0.4 + Math.random() * 0.4,
    })), [particleCount]
  );

  // Generate rain splashes
  const rainSplashes = useMemo(() =>
    [...Array(Math.floor(particleCount / 3))].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
    })), [particleCount]
  );

  // Generate enhanced snowflakes with varied properties
  const snowflakes = useMemo(() =>
    [...Array(particleCount)].map((_, i) => ({
      id: i,
      delay: Math.random() * 8,
      left: Math.random() * 100,
      size: 6 + Math.random() * 16,
      duration: 4 + Math.random() * 6,
      type: Math.floor(Math.random() * 6),
      wobble: 10 + Math.random() * 30,
    })), [particleCount]
  );

  // Generate shooting stars for night with varied properties
  const shootingStars = useMemo(() =>
    [...Array(8)].map((_, i) => ({
      id: i,
      delay: i * 3 + Math.random() * 5,
      startX: 5 + Math.random() * 70,
      startY: 2 + Math.random() * 30,
      speed: 1.5 + Math.random() * 1.5, // 1.5-3 seconds
      length: 60 + Math.random() * 80, // 60-140px trail length
    })), []
  );

  // Generate clouds with more variety
  const clouds = useMemo(() =>
    [...Array(7)].map((_, i) => ({
      id: i,
      top: 3 + Math.random() * 25,
      left: -30 + i * 20,
      scale: 0.6 + Math.random() * 0.8,
      delay: i * 3,
    })), []
  );

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      {/* Night sky with stars and aurora */}
      {!isDay && (
        <>
          <Stars />
          {/* Aurora for clear nights */}
          {condition === 'clear' && <Aurora />}
          {/* Shooting stars */}
          {condition === 'clear' && shootingStars.map((star) => (
            <ShootingStar key={star.id} {...star} />
          ))}
        </>
      )}

      {/* Sun or Moon */}
      {condition === 'clear' && (isDay ? <SunRays /> : <Moon />)}
      
      {/* Moon also shows for cloudy nights */}
      {!isDay && condition !== 'clear' && condition !== 'thunderstorm' && <Moon />}

      {/* Clouds */}
      {(condition === 'cloudy' || condition === 'rain' || condition === 'thunderstorm') && 
        clouds.map((cloud) => <Cloud key={cloud.id} {...cloud} isDark={!isDay} />)
      }

      {/* Rain with splashes */}
      {(condition === 'rain' || condition === 'thunderstorm') && (
        <>
          {rainDrops.map((drop) => <RainDrop key={drop.id} {...drop} />)}
          {rainSplashes.map((splash) => <RainSplash key={splash.id} {...splash} />)}
        </>
      )}

      {/* Snow */}
      {condition === 'snow' &&
        snowflakes.map((flake) => <Snowflake key={flake.id} {...flake} />)
      }

      {/* Fog with multiple layers */}
      {condition === 'fog' && (
        <>
          <FogLayer opacity={0.35} delay={0} />
          <FogLayer opacity={0.25} delay={4} />
          <FogLayer opacity={0.3} delay={8} />
          <FogLayer opacity={0.2} delay={12} />
        </>
      )}

      {/* Lightning flash with intensity */}
      <Lightning active={lightningActive} intensity={lightningIntensity} />

      {/* Ambient overlay based on weather */}
      <div 
        className={`absolute inset-0 transition-colors duration-1000 ${
          condition === 'rain' 
            ? 'bg-blue-900/10'
            : condition === 'thunderstorm'
            ? 'bg-purple-900/15'
            : condition === 'snow'
            ? 'bg-blue-100/5'
            : condition === 'fog'
            ? 'bg-gray-400/15'
            : condition === 'cloudy'
            ? 'bg-gray-600/5'
            : ''
        }`}
      />
      
      {/* Vignette effect for atmosphere */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.2) 100%)',
        }}
      />
    </div>
  );
}

// Widget to show current weather
export function WeatherWidget({ 
  condition, 
  temperature, 
  description, 
  icon,
  isDay,
  className = '' 
}: { 
  condition: WeatherCondition;
  temperature: number;
  description: string;
  icon: string;
  isDay: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-sm ${className}`}>
      <span className="text-lg">{icon}</span>
      <span className="text-white font-medium">{temperature}°C</span>
      <span className="text-gray-400 hidden sm:inline">· {description}</span>
    </div>
  );
}
