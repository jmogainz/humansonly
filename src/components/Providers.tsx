'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import GuestScoreClaimer from './GuestScoreClaimer';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={60 * 60} refetchOnWindowFocus refetchWhenOffline={false}>
      <GuestScoreClaimer />
      {children}
    </SessionProvider>
  );
}
