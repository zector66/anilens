/**
 * Unified AniList Session Manager
 * 
 * Provides a single source of truth for AniList authentication and API calls.
 * Automatically injects the access token when available.
 * 
 * Usage:
 *   import { anilistSession } from '@/lib/anilist-session';
 *   
 *   // Check if user can submit scores (OAuth authenticated)
 *   if (anilistSession.canSubmitScores()) { ... }
 *   
 *   // Get the authenticated client
 *   const client = anilistSession.getClient();
 */

import { anilistClient, AniListClient } from './anilist-client';
import { authManager } from './auth';
import { logger } from './logger';

class AniListSession {
  private static instance: AniListSession;
  private tokenSynced = false;

  private constructor() {
    // Sync token on initialization
    this.syncToken();
    
    // Subscribe to auth changes to keep token in sync
    authManager.subscribe((state) => {
      if (state.accessToken) {
        this.setToken(state.accessToken);
      } else {
        this.clearToken();
      }
    });
  }

  static getInstance(): AniListSession {
    if (!AniListSession.instance) {
      AniListSession.instance = new AniListSession();
    }
    return AniListSession.instance;
  }

  /**
   * Sync token from localStorage on initialization
   */
  private syncToken(): void {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('anilist_access_token');
    if (token) {
      this.setToken(token);
    }
  }

  /**
   * Set the access token on the AniList client
   */
  private setToken(token: string): void {
    if (this.tokenSynced) return;
    anilistClient.setAccessToken(token);
    this.tokenSynced = true;
    logger.debug('[AniListSession] Token synced to client');
  }

  /**
   * Clear the token (on logout)
   */
  private clearToken(): void {
    this.tokenSynced = false;
    // Note: anilistClient doesn't have a clearToken method, 
    // but it will be recreated on next login
  }

  /**
   * Get the AniList client (with token if available)
   */
  getClient(): AniListClient {
    return anilistClient;
  }

  /**
   * Check if the user is authenticated via OAuth (can submit scores)
   */
  canSubmitScores(): boolean {
    const state = authManager.getState();
    return state.isOAuthAuthenticated;
  }

  /**
   * Check if the user is authenticated (view-only or OAuth)
   */
  isAuthenticated(): boolean {
    const state = authManager.getState();
    return state.isAuthenticated;
  }

  /**
   * Get the current user ID
   */
  getUserId(): number | null {
    const state = authManager.getState();
    return state.user?.id ?? null;
  }

  /**
   * Get the current username
   */
  getUsername(): string | null {
    const state = authManager.getState();
    return state.username;
  }

  /**
   * Get the current access token (if OAuth authenticated)
   */
  getAccessToken(): string | null {
    const state = authManager.getState();
    return state.accessToken;
  }
}

export const anilistSession = AniListSession.getInstance();
