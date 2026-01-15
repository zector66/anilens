'use client';

import { ReactNode, useEffect, useState } from 'react';

interface AnimatedGridProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function AnimatedGrid({ children, className = '', staggerDelay = 50 }: AnimatedGridProps) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    // Stagger the animation
    children.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleItems(prev => new Set(prev).add(index));
      }, index * staggerDelay);
      timers.push(timer);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [children, staggerDelay]);

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={`transition-all duration-500 ${
            visibleItems.has(index)
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: `${index * 20}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
