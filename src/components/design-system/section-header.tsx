import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
}

export function SectionHeader({ title, subtitle, href }: SectionHeaderProps) {
  return (
    <div className="mb-4 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-lg font-semibold tracking-[-0.01em]"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-sm font-medium transition-colors duration-150 group shrink-0"
            style={{ color: 'var(--accent-color)' }}
          >
            <span>See all</span>
            <ChevronRight
              size={16}
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>
    </div>
  );
}
