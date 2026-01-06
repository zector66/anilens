import { anilistClient } from './anilist-client';
import { AniListUser } from '@/types/anilist';

export interface AuthState {
  isAuthenticated: boolean;
  isOAuthAuthenticated: boolean; // True only if logged in via OAuth (can submit scores)
  user: AniListUser | null;
  username: string | null;
  loading: boolean;
  error: string | null;
  accessToken: string | null;
}

// AniList OAuth configuration
const ANILIST_AUTH_URL = 'https://anilist.co/api/v2/oauth/authorize';
const ANILIST_TOKEN_URL = 'https://anilist.co/api/v2/oauth/token';

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

  // Start OAuth flow - redirect to AniList
  startOAuthLogin(): void {
    const clientId = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID;
    if (!clientId) {
      console.error('[AuthManager] Missing NEXT_PUBLIC_ANILIST_CLIENT_ID');
      return;
    }

    const redirectUri = typeof window !== 'undefined' 
      ? `${window.location.origin}/`
      : '';

    const authUrl = `${ANILIST_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token`;
    
    if (typeof window !== 'undefined') {
      window.location.href = authUrl;
    }
  }

  // Handle OAuth callback (token in URL fragment)
  async handleOAuthCallback(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return false;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');

    if (!accessToken) return false;

    // Clear the hash from URL
    window.history.replaceState(null, '', window.location.pathname);

    // Store token and load user
    this.accessToken = accessToken;
    this.isOAuth = true;
    localStorage.setItem('anilist_access_token', accessToken);
    
    await this.loadAuthenticatedUser();
    return true;
  }

  // Load user using OAuth token
  private async loadAuthenticatedUser(): Promise<void> {
    if (!this.accessToken) return;

    this.loading = true;
    this.notifyListeners();

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          query: `
            query {
              Viewer {
                id
                name
                avatar {
                  large
                  medium
                }
                bannerImage
                statistics {
                  anime {
                    count
                    meanScore
                    minutesWatched
                    episodesWatched
                  }
                  manga {
                    count
                    meanScore
                    chaptersRead
                    volumesRead
                  }
                }
              }
            }
          `,
        }),
      });

      const data = await response.json();
      
      if (data.data?.Viewer) {
        this.user = data.data.Viewer;
        this.username = this.user!.name;
        this.isOAuth = true;
        localStorage.setItem('anilist_username', this.username!);
        console.log(`[AuthManager] OAuth user loaded: ${this.user!.name} (${this.user!.id})`);
      } else {
        throw new Error('Failed to get authenticated user');
      }
    } catch (error) {
      console.error('[AuthManager] OAuth auth failed:', error);
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
      console.log(`[AuthManager] Loading user (view-only): ${username}`);
      this.user = await anilistClient.getUserByUsername(username);
      this.username = username;
      this.isOAuth = false; // Not authenticated via OAuth
      if (typeof window !== 'undefined') {
        localStorage.setItem('anilist_username', username);
      }
      console.log(`[AuthManager] User loaded (view-only): ${this.user.name} (${this.user.id})`);
    } catch (error) {
      console.error('[AuthManager] Failed to load user:', error);
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
}

export const authManager = AuthManager.getInstance();
