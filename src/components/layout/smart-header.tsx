'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Menu, X, LogIn, LogOut, User, Settings } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { ThemeToggle } from '@/components/design-system/theme-toggle';
import { useAuth } from '@/hooks/use-auth';

interface SmartHeaderProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
}

export function SmartHeader({ showSearch = true, onSearchClick }: SmartHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const { isAuthenticated, user, loginWithAniList, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-150 ease-out"
        style={{
          backgroundColor: scrolled
            ? isDark
              ? 'rgba(5, 5, 8, 0.95)'
              : 'rgba(245, 245, 247, 0.95)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(8px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none',
        }}
      >
        <div className="flex items-center justify-between px-4 h-14 max-w-[1400px] mx-auto">
          {/* Logo */}
          <Link
            href="/"
            className="text-[1.25rem] font-bold tracking-[-0.03em]"
            style={{ color: 'var(--text-primary)' }}
          >
            AniLens
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium transition-colors duration-150"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = 'var(--accent-color)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              Browse
            </Link>
            <Link
              href="/search"
              className="text-sm font-medium transition-colors duration-150"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = 'var(--accent-color)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              Search
            </Link>
            <Link
              href="/games"
              className="text-sm font-medium transition-colors duration-150"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = 'var(--accent-color)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              Games
            </Link>
            <Link
              href="/analytics"
              className="text-sm font-medium transition-colors duration-150"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = 'var(--accent-color)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              Analytics
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {showSearch && (
              <button
                onClick={onSearchClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors duration-150"
                style={{
                  background: 'var(--text-muted)',
                  color: 'var(--text-tertiary)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(var(--accent-rgb), 0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--text-muted)';
                }}
              >
                <Search size={16} />
                <span className="text-sm hidden sm:inline">Search anime...</span>
                <span className="text-xs hidden lg:inline px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)' }}>
                  /
                </span>
              </button>
            )}

            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="relative w-9 h-9 rounded-full overflow-hidden transition-all duration-150"
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: profileOpen ? '0 0 0 2px var(--accent-color)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-color)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <Image
                    src={user?.avatar?.medium || user?.avatar?.large || '/default-avatar.png'}
                    alt={user?.name || 'Profile'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>

                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div
                      className="absolute right-0 top-full mt-2 z-50 rounded-md py-1 min-w-[160px]"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      }}
                    >
                      <Link
                        href={`/u/${user?.name}`}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm transition-colors hover:bg-white/5"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <User size={16} style={{ color: 'var(--text-tertiary)' }} />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm transition-colors hover:bg-white/5"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <Settings size={16} style={{ color: 'var(--text-tertiary)' }} />
                        Settings
                      </Link>
                      <div className="my-1 mx-3 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm transition-colors hover:bg-white/5"
                        style={{ color: '#ef4444' }}
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => loginWithAniList()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
                style={{
                  background: 'var(--accent-color)',
                  color: '#fff',
                }}
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-1.5 rounded-md transition-colors duration-150"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden px-4 pb-4 animate-fade-in"
            style={{ backgroundColor: 'var(--bg-deepest)' }}
          >
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm font-medium py-2 px-3 rounded-md"
                style={{ color: 'var(--text-secondary)' }}
              >
                Browse
              </Link>
              <Link
                href="/search"
                className="text-sm font-medium py-2 px-3 rounded-md"
                style={{ color: 'var(--text-secondary)' }}
              >
                Search
              </Link>
              <Link
                href="/games"
                className="text-sm font-medium py-2 px-3 rounded-md"
                style={{ color: 'var(--text-secondary)' }}
              >
                Games
              </Link>
              <Link
                href="/analytics"
                className="text-sm font-medium py-2 px-3 rounded-md"
                style={{ color: 'var(--text-secondary)' }}
              >
                Analytics
              </Link>
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <ThemeToggle />
              </div>
              {isAuthenticated ? (
                <div className="pt-2 border-t flex flex-col gap-1" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="relative w-7 h-7 rounded-full overflow-hidden">
                      <Image
                        src={user?.avatar?.medium || user?.avatar?.large || '/default-avatar.png'}
                        alt={user?.name || 'Profile'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {user?.name}
                    </span>
                  </div>
                  <Link
                    href={`/u/${user?.name}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <User size={14} style={{ color: 'var(--text-tertiary)' }} /> Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Settings size={14} style={{ color: 'var(--text-tertiary)' }} /> Settings
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm"
                    style={{ color: '#ef4444' }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t px-3" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    onClick={() => loginWithAniList()}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium"
                    style={{ background: 'var(--accent-color)', color: '#fff' }}
                  >
                    <LogIn size={14} />
                    Login with AniList
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-14" />
    </>
  );
}
