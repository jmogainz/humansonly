'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import type { ProfileResponse, CategoryHistoryResponse } from '@/lib/api/types';
import { TEST_REGISTRY_BY_SLUG } from '@/lib/tests/registry';
import { formatNumber } from '@/lib/utils';
import GiaDashboard from '@/components/GiaDashboard';

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [history, setHistory] = useState<CategoryHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      apiGet<ProfileResponse>('/api/profile'),
      apiGet<CategoryHistoryResponse>('/api/scores/history?category=gia'),
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
          const message = historyResult.reason instanceof Error ? historyResult.reason.message : 'Failed to load GIA history';
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
    <div className="flex-center" style={{ height: '60vh' }}>
      <p className="text-muted">Loading HumansOnly Profile...</p>
    </div>
  );

  if (error) return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div className="text-center">
        <h2 style={{ color: 'var(--danger)' }}>Failed to load profile</h2>
        <p>{error}</p>
        <Link href="/" className="button">Back Home</Link>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* User Info Header - Minimal */}
      {profile && (
        <header style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'var(--text-primary)', 
            color: 'var(--bg)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 600
          }}>
            {profile.user.displayName?.[0] ?? 'U'}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{profile.user.displayName}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {profile.user.email || 'Private User'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Joined {new Date(profile.user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* GIA Performance Dashboard */}
      <section>
        {historyError ? (
          <p style={{ margin: 0, color: 'var(--danger)' }}>
            GIA history is temporarily unavailable: {historyError}
          </p>
        ) : history && history.scores.length > 0 ? (
          <GiaDashboard scores={history.scores} />
        ) : (
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Complete GIA tests to unlock your performance dashboard.
          </p>
        )}
      </section>

      {/* Best Scores Table */}
      <section>
        <div className="mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', margin: 0 }}>
             Personal Bests
          </h2>
        </div>
        
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
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatNumber(best.bestScore, best.bestScore % 1 === 0 ? 0 : 2)}
                        </span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem', fontSize: '0.75rem' }}>
                          {best.scoreUnit}
                        </span>
                      </td>
                      <td className="text-right" style={{ paddingRight: 0 }}>
                        <Link href={`/leaderboard/${best.testSlug}`} style={{ fontSize: '0.875rem', textDecoration: 'none', color: 'var(--text-muted)' }}>
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
          <div className="text-center" style={{ padding: '4rem 0', color: 'var(--text-muted)' }}>
            <p>No assessment data yet.</p>
            <Link href="/" className="button mt-4">Start Assessment</Link>
          </div>
        )}
      </section>
    </div>
  );
}
