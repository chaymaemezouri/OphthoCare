'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/api';

function sessionUserToUser(u: {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
}): User {
  return {
    id: u.id,
    email: u.email ?? '',
    firstName: u.firstName ?? undefined,
    lastName: u.lastName ?? undefined,
    role: (u.role ?? undefined) as User['role'],
    isActive: true,
    twoFactorEnabled: false,
    twoFactorSmsEnabled: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const useAuth = () => {
  const { data: session, status } = useSession();
  const { setUser, setToken, logout: clearStore } = useAuthStore();

  const user = session?.user
    ? sessionUserToUser(session.user as Parameters<typeof sessionUserToUser>[0])
    : undefined;
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser(sessionUserToUser(session.user as Parameters<typeof sessionUserToUser>[0]));
      const s = session as { accessToken?: string };
      setToken(s.accessToken ?? null);
    } else if (status === 'unauthenticated') {
      clearStore();
    }
  }, [session, status, setUser, setToken, clearStore]);

  const logout = useCallback(async () => {
    await authApi.logout();
    clearStore();
    await signOut({ callbackUrl: '/' });
  }, [clearStore]);

  return {
    user,
    isLoading,
    isAuthenticated,
    status,
    logout,
  };
};

/** Appeler au niveau racine d’un composant client (pas dans un callback). Redirige vers la page de connexion si la session est absente. */
export function useRequireAuth(redirectTo: string = '/login') {
  const { status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);
}
