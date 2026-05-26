import { anilistClient } from './anilist-client';
import { AniListUser } from '@/types/anilist';
import { logger } from './logger';

export interface AuthState {
  isAuthenticated: boolean;
  isOAuthAuthenticated: boolean; // True only if logged in via OAuth (can submit scores)
  user: AniListUser | null;
  username: string | null;
  loading: boolean;
  error: string | null;
  accessToken: string | null;
}

// AniList OAuth configuration (uses implicit grant flow)
const ANILIST_AUTH_URL = 'https://anilist.co/api/v2/oauth/authorize';

export class AuthManager {
  private static instance: AuthManager;
  private user: AniListUser | null = null;
  private username: string | null = null;
  private loading: boolean = false;
  private accessToken: string | null = null;
  private isOAuth: boolean = false;
  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      // Check for OAuth token first
      this.accessToken = localStorage.getItem('anilist_access_token');
      if (this.accessToken) {
        this.isOAuth = true;
        this.loadAuthenticatedUser();
      } else {
        // Fall back to username-only mode (view only, no rankings)
        this.username = localStorage.getItem('anilist_username');
        if (this.username) {
          this.loadUserByUsername(this.username);
        }
      }
    }
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  getState(): AuthState {
    return {
      isAuthenticated: !!this.user,
      isOAuthAuthenticated: this.isOAuth && !!this.accessToken,
      user: this.user,
      username: this.username,
      loading: this.loading,
      error: null,
      accessToken: this.accessToken,
    };
  }

  // Start OAuth flow - redirect to AniList (authorization code grant)
  startOAuthLogin(): void {
    const clientId = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID;
    if (!clientId) {
      logger.error('[AuthManager] Missing NEXT_PUBLIC_ANILIST_CLIENT_ID');
      return;
    }

    // Build redirect URI: always use /auth/callback for consistency
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : process.env.NEXT_PUBLIC_ANILIST_REDIRECT_URI || 'http://localhost:3000/auth/callback';

    const authUrl = `${ANILIST_AUTH_URL}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

    logger.info('[AuthManager] Starting OAuth flow:', authUrl);

    if (typeof window !== 'undefined') {
      window.location.href = authUrl;
    }
  }

  // Handle OAuth callback (code in URL query param)
  async handleOAuthCallback(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      logger.error('[AuthManager] OAuth error:', error, params.get('error_description'));
      return false;
    }

    if (!code) return false;

    // Build redirect URI for token exchange
    const redirectUri = `${window.location.origin}/auth/callback`;

    // Exchange code for token server-side
    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      });

      const data = await response.json();

      if (!response.ok || !data.accessToken) {
        logger.error('[AuthManager] Token exchange failed:', data.message || data.error);
        throw new Error(data.message || data.error || 'Token exchange failed');
      }

      // Clear the code from URL
      window.history.replaceState(null, '', window.location.pathname);

      // Store token and load user
      this.accessToken = data.accessToken;
      this.isOAuth = true;
      localStorage.setItem('anilist_access_token', data.accessToken);

      await this.loadAuthenticatedUser();
      return true;
    } catch (err) {
      logger.error('[AuthManager] OAuth callback failed:', err);
      return false;
    }
  }

  // Load user using OAuth token
  private async loadAuthenticatedUser(): Promise<void> {
    if (!this.accessToken) return;

    this.loading = true;
    this.notifyListeners();

    try {
      // Proxy through our server because AniList GraphQL blocks browser CORS.
      const response = await fetch('/api/anilist/viewer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      if (data.success && data.user) {
        this.user = data.user;
        this.username = this.user!.name;
        this.isOAuth = true;
        localStorage.setItem('anilist_username', this.username!);
        logger.info(`[AuthManager] OAuth user loaded: ${this.user!.name} (${this.user!.id})`);
        
        // Sync with AniLens profile system
        this.syncAniLensProfile();
      } else {
        throw new Error('Failed to get authenticated user');
      }
    } catch (error) {
      logger.error('[AuthManager] OAuth auth failed:', error);
      this.logoutOAuth();
    } finally {
      this.loading = false;
      this.notifyListeners();
    }
  }

  // Load user by username (view-only mode, no rankings)
  async loadUserByUsername(username: string): Promise<void> {
    if (!username) return;
    
    this.loading = true;
    this.notifyListeners();

    try {
      logger.info(`[AuthManager] Loading user (view-only): ${username}`);
      this.user = await anilistClient.getUserByUsername(username);
      this.username = username;
      this.isOAuth = false; // Not authenticated via OAuth
      if (typeof window !== 'undefined') {
        localStorage.setItem('anilist_username', username);
      }
      logger.info(`[AuthManager] User loaded (view-only): ${this.user.name} (${this.user.id})`);
    } catch (error) {
      logger.error('[AuthManager] Failed to load user:', error);
      this.logout();
      throw error;
    } finally {
      this.loading = false;
      this.notifyListeners();
    }
  }

  async login(username: string): Promise<void> {
    await this.loadUserByUsername(username);
  }

  // Full logout (clears OAuth token)
  logoutOAuth(): void {
    this.user = null;
    this.username = null;
    this.accessToken = null;
    this.isOAuth = false;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('anilist_username');
      localStorage.removeItem('anilist_access_token');
    }
    
    this.notifyListeners();
  }

  // Switch to view-only mode (keeps viewing but clears OAuth)
  logout(): void {
    this.user = null;
    this.username = null;
    this.accessToken = null;
    this.isOAuth = false;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('anilist_username');
      localStorage.removeItem('anilist_access_token');
    }
    
    this.notifyListeners();
  }

  getUser(): AniListUser | null {
    return this.user;
  }

  getUsername(): string | null {
    return this.username;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }

  // Check if user can submit scores (OAuth authenticated)
  canSubmitScores(): boolean {
    return this.isOAuth && !!this.accessToken && !!this.user;
  }

  // Sync user profile with AniLens database
  private async syncAniLensProfile(): Promise<void> {
    if (!this.user) return;

    try {
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anilistId: this.user.id,
          username: this.user.name,
          avatarUrl: this.user.avatar?.large || this.user.avatar?.medium,
          bannerUrl: this.user.bannerImage,
          totalAnime: this.user.statistics?.anime?.count || 0,
          totalManga: this.user.statistics?.manga?.count || 0,
        }),
      });

      if (response.ok) {
        logger.info(`[AuthManager] AniLens profile synced for ${this.user.name}`);
        try {
          const data = await response.json();
          if (typeof window !== 'undefined' && data?.success) {
            const wasUnlocked = localStorage.getItem('anilens_og_unlocked') === 'true';
            const isUnlocked = !!data.og_unlocked;
            if (isUnlocked) {
              localStorage.setItem('anilens_og_unlocked', 'true');
              if (data.og_unlocked_at) {
                localStorage.setItem('anilens_og_unlocked_at', data.og_unlocked_at);
              }
            } else {
              localStorage.removeItem('anilens_og_unlocked');
              localStorage.removeItem('anilens_og_unlocked_at');
            }
            // Notify any listening components (e.g. LiveChat) about the change.
            // `freshUnlock` = true only the very first time we see it unlocked on this device.
            window.dispatchEvent(new CustomEvent('anilens:og-status', {
              detail: { unlocked: isUnlocked, freshUnlock: isUnlocked && !wasUnlocked },
            }));

            // Chat progression: tell listeners the user's lifetime message count.
            const count = typeof data.chat_message_count === 'number' ? data.chat_message_count : 0;
            const prevCount = parseInt(localStorage.getItem('anilens_chat_msg_count') || '0', 10) || 0;
            localStorage.setItem('anilens_chat_msg_count', String(count));
            window.dispatchEvent(new CustomEvent('anilens:chat-progression', {
              detail: { count, prevCount },
            }));
          }
        } catch {
          // Non-blocking; profile sync response is best-effort.
        }
      } else {
        logger.warn('[AuthManager] Failed to sync AniLens profile');
      }
    } catch (error) {
      // Non-blocking - profile sync failure shouldn't break auth
      logger.warn('[AuthManager] AniLens profile sync error:', error);
    }
  }
}

export const authManager = AuthManager.getInstance();
