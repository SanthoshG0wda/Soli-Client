'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  authApi,
  onboardingApi,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  LoginInput,
  SignupInput,
} from '@/lib/api';
import { OnboardingUpdatePayload, User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (data: LoginInput) => Promise<void>;
  signup: (data: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  completeOnboarding: (data: OnboardingUpdatePayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const activeUser = await onboardingApi.getUserWithProfile();
      setUser(activeUser);
      return activeUser;
    } catch {
      // Token may be invalid or expired
      removeStoredToken();
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  // Initialize auth state on client mount
  useEffect(() => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    setToken(existingToken);
    refreshUser().finally(() => {
      setIsLoading(false);
    });
  }, [refreshUser]);

  const login = async (data: LoginInput): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      setStoredToken(response.access_token);
      setToken(response.access_token);
      
      // Fetch full profile with onboarding status
      const userWithProfile = await onboardingApi.getUserWithProfile();
      setUser(userWithProfile);

      if (userWithProfile.onboarding?.completed) {
        router.push('/');
      } else {
        router.push('/onboarding');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupInput): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authApi.signup(data);
      setStoredToken(response.access_token);
      setToken(response.access_token);

      const userWithProfile = await onboardingApi.getUserWithProfile();
      setUser(userWithProfile);

      // New users always go to onboarding
      router.push('/onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await authApi.logout().catch(() => {});
      }
    } finally {
      removeStoredToken();
      setToken(null);
      setUser(null);
      router.push('/login');
    }
  };

  const completeOnboarding = async (data: OnboardingUpdatePayload): Promise<void> => {
    setIsLoading(true);
    try {
      const profile = await onboardingApi.updateOnboarding(data);
      if (user) {
        setUser({
          ...user,
          onboarding: profile,
        });
      }
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = Boolean(token && user);
  const isOnboarded = Boolean(user?.onboarding?.completed);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isOnboarded,
        login,
        signup,
        logout,
        refreshUser,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
