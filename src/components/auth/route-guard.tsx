'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface RouteGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ['/login', '/signup'];

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, token, isLoading, isAuthenticated, isOnboarded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // 1. Unauthenticated users trying to access protected route -> /login
    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    // 2. Authenticated user with incomplete onboarding trying to access homepage or workspace -> /onboarding
    if (isAuthenticated && !isOnboarded && (pathname === '/' || pathname.startsWith('/workspace'))) {
      router.replace('/onboarding');
      return;
    }

    // 3. Authenticated user with completed onboarding visiting /login, /signup, or /onboarding -> /
    if (isAuthenticated && isOnboarded && (isPublicRoute || pathname === '/onboarding')) {
      router.replace('/' );
      return;
    }

    // 4. Authenticated user with incomplete onboarding visiting /login or /signup -> /onboarding
    if (isAuthenticated && !isOnboarded && isPublicRoute) {
      router.replace('/onboarding');
      return;
    }
  }, [isLoading, isAuthenticated, isOnboarded, pathname, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-stone-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white font-serif font-semibold text-lg shadow-sm animate-pulse">
            S
          </div>
          <p className="text-xs uppercase tracking-widest text-stone-500 font-mono">
            Soli Legal Intelligence
          </p>
        </div>
      </div>
    );
  }

  // If unauthenticated on protected page, don't flash content before redirect
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  // If incomplete onboarding on homepage/workspace, don't flash content before redirect
  if (isAuthenticated && !isOnboarded && (pathname === '/' || pathname.startsWith('/workspace'))) {
    return null;
  }

  return <>{children}</>;
}
