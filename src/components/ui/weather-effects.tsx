'use client';

import { useEffect, useState, useMemo } from 'react';
import { WeatherCondition } from '@/lib/weather-service';

interface WeatherEffectsProps {
  condition: WeatherCondition;
  isDay: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  className?: string;
}

// Rain drop component
function RainDrop({ delay, left, duration }: { delay: number; left: number; duration: number }) {
  return (
    <div
      className="absolute w-0.5 h-4 bg-gradient-to-b from-transparent via-blue-400/60 to-blue-300/80 rounded-full animate-rain"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

// Snowflake component
function Snowflake({ delay, left, size, duration }: { delay: number; left: number; size: number; duration: number }) {
  return (
    <div
      className="absolute text-white/80 animate-snow select-none"
      style={{
        left: `${left}%`,
        fontSize: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      ❄
    </div>
  );
}

// Lightning flash
function Lightning({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 bg-white/20 animate-lightning pointer-events-none" />
  );
}

// Sun rays component
function SunRays() {
  return (
    <div className="absolute top-0 right-0 w-64 h-64 -translate-y-1/4 translate-x-1/4 pointer-events-none">
      <div className="relative w-full h-full">
        {/* Sun glow */}
        <div className="absolute inset-0 bg-gradient-radial from-yellow-300/30 via-orange-300/10 to-transparent rounded-full animate-pulse-slow" />
        {/* Sun core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-radial from-yellow-200/50 to-orange-400/20 rounded-full blur-sm" />
        {/* Rays */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-1 h-16 bg-gradient-to-b from-yellow-300/40 to-transparent origin-bottom"
            style={{
              transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Moon component
function Moon() {
  return (
    <div className="absolute top-8 right-8 pointer-events-none">
      <div className="relative">
        {/* Moon glow */}
        <div className="absolute -inset-4 bg-gradient-radial from-blue-200/20 to-transparent rounded-full blur-lg" />
        {/* Moon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 shadow-lg shadow-blue-200/20 relative overflow-hidden">
          {/* Craters */}
          <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-gray-200/50" />
          <div className="absolute top-6 left-8 w-2 h-2 rounded-full bg-gray-200/50" />
          <div className="absolute top-10 left-4 w-4 h-4 rounded-full bg-gray-200/50" />
        </div>
        {/* Stars around moon */}
        <div className="absolute -top-4 -left-8 text-white/60 text-xs animate-twinkle">✦</div>
        <div className="absolute top-0 -right-6 text-white/40 text-sm animate-twinkle" style={{ animationDelay: '0.5s' }}>✦</div>
        <div className="absolute -bottom-2 -left-4 text-white/50 text-xs animate-twinkle" style={{ animationDelay: '1s' }}>✦</div>
      </div>
    </div>
  );
}

// Cloud component
function Cloud({ top, left, scale, delay }: { top: number; left: number; scale: number; delay: number }) {
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
        <div className="w-16 h-6 bg-white/10 rounded-full backdrop-blur-sm" />
        <div className="absolute -top-3 left-3 w-10 h-10 bg-white/10 rounded-full backdrop-blur-sm" />
        <div className="absolute -top-1 left-10 w-8 h-8 bg-white/10 rounded-full backdrop-blur-sm" />
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

  // Calculate number of particles based on intensity
  const particleCount = {
    light: 20,
    medium: 40,
    heavy: 80,
  }[intensity];

  // Random lightning for thunderstorms
  useEffect(() => {
    if (condition !== 'thunderstorm') return;

    const triggerLightning = () => {
      setLightningActive(true);
      setTimeout(() => setLightningActive(false), 200);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        triggerLightning();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [condition]);

  // Generate rain drops
  const rainDrops = useMemo(() => 
    [...Array(particleCount)].map((_, i) => ({
      id: i,
      delay: Math.random() * 2,
      left: Math.random() * 100,
      duration: 0.5 + Math.random() * 0.5,
    })), [particleCount]
  );

  // Generate snowflakes
  const snowflakes = useMemo(() =>
    [...Array(particleCount)].map((_, i) => ({
      id: i,
      delay: Math.random() * 5,
      left: Math.random() * 100,
      size: 8 + Math.random() * 12,
      duration: 3 + Math.random() * 4,
    })), [particleCount]
  );

  // Generate clouds
  const clouds = useMemo(() =>
    [...Array(5)].map((_, i) => ({
      id: i,
      top: 5 + Math.random() * 20,
      left: -20 + i * 25,
      scale: 0.8 + Math.random() * 0.6,
      delay: i * 2,
    })), []
  );

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      {/* Night sky with stars */}
      {!isDay && <Stars />}

      {/* Sun or Moon */}
      {condition === 'clear' && (isDay ? <SunRays /> : <Moon />)}

      {/* Clouds */}
      {(condition === 'cloudy' || condition === 'rain' || condition === 'thunderstorm') && 
        clouds.map((cloud) => <Cloud key={cloud.id} {...cloud} />)
      }

      {/* Rain */}
      {(condition === 'rain' || condition === 'thunderstorm') &&
        rainDrops.map((drop) => <RainDrop key={drop.id} {...drop} />)
      }

      {/* Snow */}
      {condition === 'snow' &&
        snowflakes.map((flake) => <Snowflake key={flake.id} {...flake} />)
      }

      {/* Fog */}
      {condition === 'fog' && (
        <>
          <FogLayer opacity={0.3} delay={0} />
          <FogLayer opacity={0.2} delay={3} />
          <FogLayer opacity={0.25} delay={6} />
        </>
      )}

      {/* Lightning flash */}
      <Lightning active={lightningActive} />

      {/* Ambient overlay based on weather */}
      <div 
        className={`absolute inset-0 transition-colors duration-1000 ${
          condition === 'rain' || condition === 'thunderstorm'
            ? 'bg-blue-900/10'
            : condition === 'snow'
            ? 'bg-blue-100/5'
            : condition === 'fog'
            ? 'bg-gray-400/10'
            : ''
        }`}
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
