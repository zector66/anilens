'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { proxyImage } from '@/lib/image-proxy';

interface HeroBackdropProps {
  images: string[];
  children: React.ReactNode;
}

const GAP = 8;
const ROWS = 4;
const MIN_UNIQUE = 16;

const ROW_CONFIGS = [
  { translateZ: -30, scale: 0.9, opacity: 0.22, speed: 6, direction: -1 }, // top:    R→L
  { translateZ: 10,  scale: 1.0, opacity: 0.42, speed: 6, direction:  1 }, // 2nd:    L→R
  { translateZ: 10,  scale: 1.0, opacity: 0.42, speed: 6, direction: -1 }, // 3rd:    R→L
  { translateZ: -30, scale: 0.9, opacity: 0.22, speed: 6, direction:  1 }, // bottom: L→R
];

export function HeroBackdrop({ images, children }: HeroBackdropProps) {
  const rowData = useMemo(() => {
    if (images.length === 0) {
      return Array.from({ length: ROWS }, () => ({ images: [] as string[], uniqueCount: 0 }));
    }

    const imgCount = images.length;
    const perRow = Math.floor(imgCount / ROWS);
    const rows: { images: string[]; uniqueCount: number }[] = [];

    if (perRow >= MIN_UNIQUE / 2) {
      // Enough images: each row gets a DISJOINT chunk
      for (let r = 0; r < ROWS; r++) {
        const start = r * perRow;
        const unique: string[] = [];
        for (let i = 0; i < perRow; i++) {
          unique.push(proxyImage(images[start + i]));
        }
        if (r % 2 === 0) unique.reverse();
        // Duplicate ENTIRE sequence for seamless loop regardless of viewport width
        rows.push({ images: [...unique, ...unique], uniqueCount: perRow });
      }
    } else {
      // Not enough for disjoint: each row gets staggered offset to minimize visible duplicates
      const uniquePerRow = Math.max(MIN_UNIQUE, perRow * 2, imgCount * 2);

      for (let r = 0; r < ROWS; r++) {
        const unique: string[] = [];
        // Use a different starting offset for each row to spread duplicates
        const offset = Math.floor((imgCount / ROWS) * r);

        for (let i = 0; i < uniquePerRow; i++) {
          // Cycle through images with row-specific offset
          const imgIndex = (offset + i) % imgCount;
          unique.push(proxyImage(images[imgIndex]));
        }

        if (r % 2 === 0) unique.reverse();
        rows.push({ images: [...unique, ...unique], uniqueCount: uniquePerRow });
      }
    }

    return rows;
  }, [images]);

  return (
    <section className="relative overflow-hidden py-8">
      {/* Infinite Marquee Rows */}
      <div
        className="absolute inset-0 flex flex-col justify-center gap-2"
        style={{ perspective: '800px' }}
      >
        {rowData.map((row, rowIdx) => (
          <MarqueeRow
            key={rowIdx}
            images={row.images}
            uniqueCount={row.uniqueCount}
            speedPxPerSec={ROW_CONFIGS[rowIdx].speed}
            direction={ROW_CONFIGS[rowIdx].direction}
            depth={{
              translateZ: ROW_CONFIGS[rowIdx].translateZ,
              scale: ROW_CONFIGS[rowIdx].scale,
              opacity: ROW_CONFIGS[rowIdx].opacity,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 45%, transparent 0%, transparent 25%, var(--bg-deepest) 65%),
            linear-gradient(to right, var(--bg-deepest) 0%, transparent 28%, transparent 72%, var(--bg-deepest) 100%)
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function MarqueeRow({
  images,
  uniqueCount,
  speedPxPerSec,
  direction,
  depth,
}: {
  images: string[];
  uniqueCount: number;
  speedPxPerSec: number;
  direction: number;
  depth: { translateZ: number; scale: number; opacity: number };
}) {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || images.length === 0) return;

    let raf = 0;
    let offset = 0;
    let loopWidth = 0;
    let isRunning = false;

    const getLoopWidth = () => {
      const firstChild = strip.firstElementChild as HTMLElement | null;
      if (!firstChild) return 0;
      const slotWidth = firstChild.offsetWidth + GAP;
      return uniqueCount * slotWidth;
    };

    const clampOffset = (lw: number) => {
      if (direction === -1) {
        while (offset <= -lw) offset += lw;
        while (offset > 0) offset -= lw;
      } else {
        while (offset >= 0) offset -= lw;
        while (offset < -lw) offset += lw;
      }
    };

    const startAnimation = () => {
      if (isRunning) return;
      const width = getLoopWidth();
      if (width === 0) return;

      loopWidth = width;
      isRunning = true;
      offset = direction === -1 ? 0 : -loopWidth;
      strip.style.transform = `translateX(${offset}px)`;

      const animate = () => {
        offset += speedPxPerSec * direction * 0.016;
        clampOffset(loopWidth);
        strip.style.transform = `translateX(${offset}px)`;
        raf = requestAnimationFrame(animate);
      };

      raf = requestAnimationFrame(animate);
    };

    const ro = new ResizeObserver(() => {
      const width = getLoopWidth();
      if (width > 0 && width !== loopWidth) {
        if (!isRunning) {
          loopWidth = width;
          startAnimation();
        } else {
          // Scale offset proportionally so the animation doesn't jump
          if (loopWidth > 0) {
            offset = (offset / loopWidth) * width;
          }
          loopWidth = width;
          clampOffset(loopWidth);
        }
      }
    });
    ro.observe(strip);

    const timeout = setTimeout(startAnimation, 100);

    return () => {
      ro.disconnect();
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [speedPxPerSec, direction, images.length, uniqueCount]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        transform: `translateZ(${depth.translateZ}px) scale(${depth.scale})`,
        opacity: depth.opacity,
      }}
    >
      <div
        ref={stripRef}
        className="flex"
        style={{ gap: `${GAP}px`, width: 'max-content', willChange: 'transform' }}
      >
        {images.map((src, i) => (
          <Poster key={`${src}-${i}`} src={src} />
        ))}
      </div>
    </div>
  );
}

function Poster({ src }: { src: string }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width: 'clamp(64px, 11vw, 120px)',
        aspectRatio: '2 / 3',
        borderRadius: 'clamp(3px, 0.6vw, 8px)',
      }}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="120px"
        className="object-cover"
        loading="eager"
        unoptimized
      />
    </div>
  );
}
