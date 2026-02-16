'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { AroundMeResponse, LeaderboardResponse } from '@/lib/api/types';
import type { TestDefinition } from '@/lib/tests/types';
import LeaderboardTable from './LeaderboardTable';

type LeaderboardViewClientProps = {
  tests: TestDefinition[];
  initialSlug?: string;
};

export default function LeaderboardViewClient({ tests, initialSlug }: LeaderboardViewClientProps) {
  const firstSlug = initialSlug ?? tests.find((test) => test.leaderboardEnabled)?.slug ?? tests[0]?.slug;
  const [activeSlug, setActiveSlug] = useState(firstSlug);
  const [entries, setEntries] = useState<LeaderboardResponse['entries']>([]);
  const [around, setAround] = useState<AroundMeResponse['entries']>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTest = useMemo(() => tests.find((test) => test.slug === activeSlug) ?? null, [tests, activeSlug]);

  useEffect(() => {
    let mounted = true;
    if (!activeSlug) return;

    setLoading(true);
    setError(null);

    Promise.all([
      apiGet<LeaderboardResponse>(`/api/leaderboard/top?testSlug=${encodeURIComponent(activeSlug)}&limit=100`),
      apiGet<AroundMeResponse>(`/api/leaderboard/around?testSlug=${encodeURIComponent(activeSlug)}`).catch(() => ({
        testSlug: activeSlug,
        rank: 0,
        entries: [],
      })),
    ])
      .then(([top, aroundMe]) => {
        if (!mounted) return;
        setEntries(top.entries);
        setAround(aroundMe.entries);
        setRank(aroundMe.rank || null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeSlug]);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {tests.filter((test) => test.leaderboardEnabled).map((test) => (
          <button
            key={test.slug}
            type="button"
            className={activeSlug === test.slug ? 'button' : 'button buttonGhost'}
            onClick={() => setActiveSlug(test.slug)}
          >
            {test.name}
          </button>
        ))}
      </div>

      {activeTest ? (
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          {activeTest.description}
        </p>
      ) : null}

      {loading ? <p>Loading leaderboard...</p> : null}
      {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}

      {!loading && !error ? (
        <>
          <div>
            <h2>Top 100</h2>
            <LeaderboardTable entries={entries} />
          </div>
          <div>
            <h3>Around Me {rank ? `(Rank #${rank})` : ''}</h3>
            {around.length > 0 ? <LeaderboardTable entries={around} /> : <p style={{ color: 'var(--text-muted)' }}>Sign in and play this test to see your neighborhood rank.</p>}
          </div>
        </>
      ) : null}
    </div>
  );
}
