'use client';

import { useEffect, useState } from 'react';
import { authManager, AuthState } from '@/lib/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => authManager.getState());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    return unsubscribe;
  }, []);

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

  const logout = () => {
    authManager.logout();
  };

  return {
    ...authState,
    isLoggingIn,
    login,
    logout,
  };
}
