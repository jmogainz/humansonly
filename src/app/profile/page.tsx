'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import type { ProfileResponse, CategoryHistoryResponse } from '@/lib/api/types';
import { TEST_REGISTRY_BY_SLUG } from '@/lib/tests/registry';
import { formatNumber } from '@/lib/utils';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import { Spinner } from '@/components/Spinner';
import styles from './profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [history, setHistory] = useState<CategoryHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      apiGet<ProfileResponse>('/api/profile'),
      apiGet<CategoryHistoryResponse>('/api/scores/history'),
    ])
      .then(([profileResult, historyResult]) => {
        if (!mounted) return;

        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value);
        } else {
          const message = profileResult.reason instanceof Error ? profileResult.reason.message : 'Failed to load profile';
          setError(message);
        }

        if (historyResult.status === 'fulfilled') {
          setHistory(historyResult.value);
          setHistoryError(null);
        } else {
          const message = historyResult.reason instanceof Error ? historyResult.reason.message : 'Failed to load history';
          setHistoryError(message);
          setHistory(null);
        }
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const sortedBests = useMemo(
    () => [...(profile?.bests ?? [])].sort((a, b) => a.testSlug.localeCompare(b.testSlug)),
    [profile]
  );

  if (loading) return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.avatar} style={{ background: 'var(--surface-raised)' }}>
          <span style={{ opacity: 0 }}>U</span>
        </div>
        <div className={styles.headerInfo}>
          <div className="skeleton" style={{ height: '1.4rem', width: '140px', borderRadius: '6px' }} />
          <div className={styles.headerMeta}>
            <div className="skeleton" style={{ height: '0.8rem', width: '120px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '0.8rem', width: '100px', borderRadius: '4px' }} />
          </div>
        </div>
      </header>
      <section>
        <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
      </section>
      <section>
        <div className="skeleton" style={{ height: '1.15rem', width: '140px', borderRadius: '6px', marginBottom: '0.75rem' }} />
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '2.5rem', borderRadius: '6px' }} />
          ))}
        </div>
      </section>
    </div>
  );

  if (error) return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div className="text-center">
        <h2 style={{ color: 'var(--danger)' }}>Failed to load profile</h2>
        <p>{error}</p>
        <button
          onClick={() => {
            setIsNavigating(true);
            router.push('/');
          }}
          className="button"
          disabled={isNavigating}
        >
          {isNavigating ? <Spinner size={16} /> : null}
          {isNavigating ? 'Loading...' : 'Back Home'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      {profile && (
        <header className={styles.header}>
          <div className={styles.avatar}>
            {profile.user.displayName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className={styles.headerInfo}>
            <h1>{profile.user.displayName}</h1>
            <div className={styles.headerMeta}>
              <span>{profile.user.email || 'Private User'}</span>
              <span>Joined {new Date(profile.user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </header>
      )}

      <section>
        {historyError ? (
          <p style={{ margin: 0, color: 'var(--danger)' }}>
            History is temporarily unavailable: {historyError}
          </p>
        ) : history && history.scores.length > 0 ? (
          <PerformanceDashboard 
            displayName={profile?.user.displayName ?? 'Human'} 
            scores={history.scores} 
          />
        ) : (
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Complete tests to unlock your performance dashboard.
          </p>
        )}
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Personal Bests</h2>

        {sortedBests.length ? (
          <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 0, background: 'transparent' }}>Assessment</th>
                  <th style={{ background: 'transparent' }}>Best</th>
                  <th className="text-right" style={{ paddingRight: 0, background: 'transparent' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedBests.map((best) => {
                  const test = TEST_REGISTRY_BY_SLUG.get(best.testSlug);
                  return (
                    <tr key={best.testSlug}>
                      <td style={{ fontWeight: 500, paddingLeft: 0 }}>{test?.name.replace('GIA ', '') ?? best.testSlug}</td>
                      <td className="font-mono">
                        <span className={styles.scoreValue}>
                          {formatNumber(best.bestScore, best.bestScore % 1 === 0 ? 0 : 2)}
                        </span>
                        <span className={styles.scoreUnit}>
                          {best.scoreUnit}
                        </span>
                      </td>
                      <td className="text-right" style={{ paddingRight: 0 }}>
                        <Link href={`/leaderboard/${best.testSlug}`} className={styles.lbLink}>
                          Leaderboard &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No assessment data yet.</p>
            <button
              onClick={() => {
                setIsNavigating(true);
                router.push('/');
              }}
              className="button mt-4"
              disabled={isNavigating}
            >
              {isNavigating ? <Spinner size={16} /> : null}
              {isNavigating ? 'Loading...' : 'Start Assessment'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
