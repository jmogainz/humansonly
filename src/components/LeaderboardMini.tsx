'use client';

import { useEffect, useState } from 'react';
import type { LeaderboardResponse } from '@/lib/api/types';
import { apiGet } from '@/lib/api';
import LeaderboardTable from './LeaderboardTable';

type LeaderboardMiniProps = {
  testSlug: string;
};

export default function LeaderboardMini({ testSlug }: LeaderboardMiniProps) {
  const [entries, setEntries] = useState<LeaderboardResponse['entries']>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    apiGet<LeaderboardResponse>(`/api/leaderboard/top?testSlug=${encodeURIComponent(testSlug)}&limit=5`)
      .then((response) => {
        if (!mounted) return;
        setEntries(response.entries);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      });

    return () => {
      mounted = false;
    };
  }, [testSlug]);

  if (error) {
    return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  }

  return <LeaderboardTable entries={entries} />;
}
