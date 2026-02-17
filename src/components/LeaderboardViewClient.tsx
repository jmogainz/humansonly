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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTest = useMemo(() => tests.find((test) => test.slug === activeSlug) ?? null, [tests, activeSlug]);

  const enabledTests = useMemo(() => tests.filter((test) => test.leaderboardEnabled), [tests]);
  const giaTests = useMemo(() => enabledTests.filter((t) => t.category === 'gia'), [enabledTests]);
  const hbTests = useMemo(() => enabledTests.filter((t) => t.category === 'human-benchmark'), [enabledTests]);

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

  const renderGroup = (label: string, groupTests: TestDefinition[]) => {
    if (groupTests.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span style={{
          fontSize: '0.65rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
        }}>
          {label}
        </span>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {groupTests.map((test) => (
            <button
              key={test.slug}
              type="button"
              onClick={() => setActiveSlug(test.slug)}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: activeSlug === test.slug ? 600 : 400,
                fontFamily: 'inherit',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: activeSlug === test.slug ? 'var(--accent)' : 'var(--border)',
                background: activeSlug === test.slug ? 'var(--accent)' : 'transparent',
                color: activeSlug === test.slug ? 'var(--accent-foreground)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 50ms ease',
              }}
            >
              {test.name.replace('GIA ', '')}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {renderGroup('GIA Modules', giaTests)}
        {renderGroup('Benchmark Tests', hbTests)}
      </div>

      {activeTest ? (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {activeTest.description}
        </p>
      ) : null}

      {loading ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <div className="skeleton" style={{ height: '1.1rem', width: '80px', borderRadius: '6px', marginBottom: '0.75rem' }} />
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton" style={{ height: '2.2rem', borderRadius: '6px' }} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {error ? <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p> : null}

      {!loading && !error ? (
        <>
          <div>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Top 100</h2>
            <LeaderboardTable entries={entries} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
              Your Neighborhood {rank ? <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>#{rank}</span> : ''}
            </h3>
            {around.length > 0 ? (
              <LeaderboardTable entries={around} />
            ) : (
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                Sign in and play this test to see your rank.
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
