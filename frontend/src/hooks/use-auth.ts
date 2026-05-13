'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { User } from '@/types';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user as (User & { accessToken?: string }) | undefined;
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  const requireAuth = (redirectTo: string = '/login') => {
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo);
      }
    }, [isLoading, isAuthenticated]);
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    status,
    requireAuth,
  };
};
