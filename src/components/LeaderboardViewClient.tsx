'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { apiGet } from '@/lib/api';
import type { AroundMeResponse, LeaderboardResponse } from '@/lib/api/types';
import type { TestDefinition } from '@/lib/tests/types';
import LeaderboardTable from './LeaderboardTable';
import { Spinner } from './Spinner';

type LeaderboardViewClientProps = {
  tests: TestDefinition[];
  initialSlug?: string;
};

export default function LeaderboardViewClient({ tests, initialSlug }: LeaderboardViewClientProps) {
  const { data: session, status: sessionStatus } = useSession();
  const isGuest = sessionStatus !== 'loading' && !session?.user;
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const firstSlug = initialSlug ?? tests.find((test) => test.leaderboardEnabled)?.slug ?? tests[0]?.slug;
  const [activeSlug, setActiveSlug] = useState(firstSlug);
  const [entries, setEntries] = useState<LeaderboardResponse['entries']>([]);
  const [around, setAround] = useState<AroundMeResponse['entries']>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [aroundLoaded, setAroundLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topCacheRef = useRef<Record<string, LeaderboardResponse['entries']>>({});
  const aroundCacheRef = useRef<Record<string, { entries: AroundMeResponse['entries']; rank: number | null }>>({});

  const activeTest = useMemo(() => tests.find((test) => test.slug === activeSlug) ?? null, [tests, activeSlug]);

  const enabledTests = useMemo(() => tests.filter((test) => test.leaderboardEnabled), [tests]);
  const giaTests = useMemo(() => enabledTests.filter((t) => t.category === 'gia'), [enabledTests]);
  const hbTests = useMemo(() => enabledTests.filter((t) => t.category === 'human-benchmark'), [enabledTests]);

  useEffect(() => {
    let mounted = true;
    if (!activeSlug) return;

    setLoading(true);
    setError(null);
    const cachedTop = topCacheRef.current[activeSlug];
    if (cachedTop) {
      setEntries(cachedTop);
      setHasLoaded(true);
    }

    const cachedAround = aroundCacheRef.current[activeSlug];
    if (cachedAround) {
      setAround(cachedAround.entries);
      setRank(cachedAround.rank);
      setAroundLoaded(true);
    } else {
      setAround([]);
      setRank(null);
      setAroundLoaded(false);
    }

    let topDone = false;
    let aroundDone = false;
    const finishIfReady = () => {
      if (!mounted) return;
      if (topDone && aroundDone) {
        setLoading(false);
        setHasLoaded(true);
      }
    };

    apiGet<LeaderboardResponse>(`/api/leaderboard/top?testSlug=${encodeURIComponent(activeSlug)}&limit=100`)
      .then((top) => {
        if (!mounted) return;
        topCacheRef.current[activeSlug] = top.entries;
        setEntries(top.entries);
        setHasLoaded(true);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      })
      .finally(() => {
        topDone = true;
        finishIfReady();
      });

    if (isGuest) {
      setAroundLoaded(true);
      aroundDone = true;
      finishIfReady();
    } else {
      apiGet<AroundMeResponse>(`/api/leaderboard/around?testSlug=${encodeURIComponent(activeSlug)}`)
        .then((aroundMe) => {
          if (!mounted) return;
          const nextRank = aroundMe.rank || null;
          aroundCacheRef.current[activeSlug] = { entries: aroundMe.entries, rank: nextRank };
          setAround(aroundMe.entries);
          setRank(nextRank);
          setAroundLoaded(true);
        })
        .catch(() => {
          if (!mounted) return;
          aroundCacheRef.current[activeSlug] = { entries: [], rank: null };
          setAround([]);
          setRank(null);
          setAroundLoaded(true);
        })
        .finally(() => {
          aroundDone = true;
          finishIfReady();
        });
    }

    return () => {
      mounted = false;
    };
  }, [activeSlug, isGuest]);

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

      {error ? <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p> : null}

      {loading && !hasLoaded ? (
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: '2.75rem', borderRadius: '6px' }} />
          ))}
        </div>
      ) : null}

      {!error && hasLoaded ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
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
            ) : !isGuest && !aroundLoaded ? (
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                Loading your rank...
              </p>
            ) : isGuest ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                border: '1px solid color-mix(in srgb, var(--accent) 35%, var(--border))',
                borderRadius: 'var(--radius)',
                background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
              }}>
                <div style={{ display: 'grid', gap: '0.2rem', flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Guest scores don&apos;t appear on the leaderboard
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Sign in to claim your rank and compete globally.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {(['google', 'apple'] as const).map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      disabled={!!pendingProvider}
                      onClick={async () => {
                        setPendingProvider(provider);
                        await signIn(provider, { callbackUrl: window.location.href });
                        setPendingProvider(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.85rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        fontFamily: 'inherit',
                        fontWeight: 500,
                        cursor: pendingProvider ? 'not-allowed' : 'pointer',
                        opacity: pendingProvider && pendingProvider !== provider ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                        transition: 'border-color 80ms ease, background 80ms ease',
                      }}
                    >
                      {pendingProvider === provider ? <Spinner size={14} /> : provider === 'google' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                      )}
                      {pendingProvider === provider ? 'Signing in…' : provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                Play this test to see your rank.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
