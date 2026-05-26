'use client';

import Link from 'next/link';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy',
  'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery',
  'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
  'Supernatural', 'Thriller',
];

export function GenrePills() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {GENRES.map((genre) => (
        <Link
          key={genre}
          href={`/search?genres=${encodeURIComponent(genre)}`}
          className="px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-colors hover:bg-white/10"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-secondary)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {genre}
        </Link>
      ))}
    </div>
  );
}
