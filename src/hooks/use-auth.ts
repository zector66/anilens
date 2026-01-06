'use client';

import { useEffect, useState } from 'react';
import { authManager, AuthState } from '@/lib/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => authManager.getState());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    
    // Check for OAuth callback on mount
    authManager.handleOAuthCallback();
    
    return unsubscribe;
  }, []);

  // Login with username only (view-only mode, no rankings)
  const login = async (username: string) => {
    setIsLoggingIn(true);
    try {
      await authManager.login(username);
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Login failed' }));
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Login with AniList OAuth (required for rankings)
  const loginWithAniList = () => {
    authManager.startOAuthLogin();
  };

  const logout = () => {
    authManager.logout();
  };

  // Check if user can submit scores to rankings
  const canSubmitScores = authManager.canSubmitScores();

  return {
    ...authState,
    isLoggingIn,
    login,
    loginWithAniList,
    logout,
    canSubmitScores,
  };
}
