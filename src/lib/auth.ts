import { anilistClient } from './anilist-client';
import { AniListUser } from '@/types/anilist';

export interface AuthState {
  isAuthenticated: boolean;
  user: AniListUser | null;
  username: string | null;
  loading: boolean;
  error: string | null;
}

export class AuthManager {
  private static instance: AuthManager;
  private user: AniListUser | null = null;
  private username: string | null = null;
  private loading: boolean = false;
  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.username = localStorage.getItem('anilist_username');
      if (this.username) {
        this.loadUserByUsername(this.username);
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
      user: this.user,
      username: this.username,
      loading: this.loading,
      error: null,
    };
  }

  async loadUserByUsername(username: string): Promise<void> {
    if (!username) return;
    
    this.loading = true;
    this.notifyListeners();

    try {
      console.log(`[AuthManager] Loading user: ${username}`);
      this.user = await anilistClient.getUserByUsername(username);
      this.username = username;
      if (typeof window !== 'undefined') {
        localStorage.setItem('anilist_username', username);
      }
      console.log(`[AuthManager] User loaded successfully: ${this.user.name} (${this.user.id})`);
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

  logout(): void {
    this.user = null;
    this.username = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('anilist_username');
    }
    
    this.notifyListeners();
  }

  getUser(): AniListUser | null {
    return this.user;
  }

  getUsername(): string | null {
    return this.username;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }
}

export const authManager = AuthManager.getInstance();
