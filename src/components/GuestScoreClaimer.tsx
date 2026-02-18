'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { apiPost } from '@/lib/api';
import { getStoredGuestId } from '@/lib/guestId';

export default function GuestScoreClaimer() {
  const { data: session, status } = useSession();
  const inFlightKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const userId = session?.user?.id;
    if (!userId) return;

    const guestId = getStoredGuestId();
    if (!guestId) return;

    const requestKey = `${userId}:${guestId}`;
    if (inFlightKeyRef.current === requestKey) return;

    let cancelled = false;
    inFlightKeyRef.current = requestKey;

    void apiPost<{ guestId: string }, { claimed: number }>('/api/profile', { guestId })
      .catch(() => {
        // Best effort: score submission also attempts guest claim.
      })
      .finally(() => {
        if (!cancelled && inFlightKeyRef.current === requestKey) {
          inFlightKeyRef.current = null;
        }
      });

    return () => {
      cancelled = true;
      if (inFlightKeyRef.current === requestKey) {
        inFlightKeyRef.current = null;
      }
    };
  }, [session?.user?.id, status]);

  return null;
}
