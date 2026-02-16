'use client';

import { useMemo } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

export function useAuth() {
  const { data, status } = useSession();

  return useMemo(
    () => ({
      session: data,
      user: data?.user ?? null,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      signIn,
      signOut,
    }),
    [data, status]
  );
}
