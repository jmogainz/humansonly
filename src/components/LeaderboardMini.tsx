'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { LeaderboardResponse } from '@/lib/api/types';
import { apiGet } from '@/lib/api';
import LeaderboardTable from './LeaderboardTable';

type LeaderboardMiniProps = {
  testSlug: string;
};

export default function LeaderboardMini({ testSlug }: LeaderboardMiniProps) {
  const [entries, setEntries] = useState<LeaderboardResponse['entries']>([]);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status: sessionStatus } = useSession();
  const isGuest = sessionStatus !== 'loading' && !session?.user;

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

  return (
    <>
      <LeaderboardTable entries={entries} />
      {isGuest && (
        <p style={{ margin: '0.6rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => document.dispatchEvent(new CustomEvent('humansonly:open-menu'))}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            Sign in
          </button>
          {' '}to compete for a spot on the leaderboard
        </p>
      )}
    </>
  );
}
