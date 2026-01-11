'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

export function Confetti({ active, duration = 3000 }: { active: boolean; duration?: number }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (active) {
      const colors = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
      const newPieces: ConfettiPiece[] = [];
      
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
        });
      }
      
      setPieces(newPieces);
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
        setPieces([]);
      }, duration);
    }
  }, [active, duration]);

  if (!isVisible || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function StreakFlames({ streak }: { streak: number }) {
  if (streak < 3) return null;
  
  const intensity = Math.min(streak, 10);
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: Math.min(streak, 5) }).map((_, i) => (
        <span 
          key={i} 
          className="animate-flame text-lg"
          style={{ 
            animationDelay: `${i * 0.1}s`,
            filter: `hue-rotate(${intensity * 5}deg)`,
          }}
        >
          🔥
        </span>
      ))}
      {streak >= 5 && (
        <span className="text-orange-400 font-bold text-sm ml-1">x{streak}</span>
      )}
    </div>
  );
}

export function RankUpCelebration({ 
  show, 
  fromRank, 
  toRank,
  onComplete 
}: { 
  show: boolean; 
  fromRank: string; 
  toRank: string;
  onComplete: () => void;
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="text-center animate-scale-up">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-3xl font-bold text-white mb-2">RANK UP!</h2>
        <div className="flex items-center justify-center gap-4 text-xl">
          <span className="text-gray-400">{fromRank}</span>
          <span className="text-2xl">→</span>
          <span className="text-purple-400 font-bold animate-glow">{toRank}</span>
        </div>
        <p className="text-gray-400 mt-4">Keep climbing!</p>
      </div>
      <Confetti active={show} duration={4000} />
    </div>
  );
}
