'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import type { ProfileResponse } from '@/lib/api/types';
import { TEST_REGISTRY_BY_SLUG } from '@/lib/tests/registry';
import { formatNumber } from '@/lib/utils';

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<ProfileResponse>('/api/profile')
      .then((response) => {
        if (!mounted) return;
        setProfile(response);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load profile');
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

  return (
    <section style={{ width: 'min(980px, calc(100vw - 2rem))', margin: '0 auto 2rem', display: 'grid', gap: '1rem' }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '1.1rem', background: 'var(--surface)' }}>
        <h1 style={{ marginTop: 0 }}>Profile</h1>
        <p style={{ marginBottom: 0, color: 'var(--text-muted)' }}>
          Track your personal bests across all HumansOnly exams.
        </p>
      </div>

      {loading ? <p>Loading profile...</p> : null}
      {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}

      {profile ? (
        <>
          <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem', background: 'var(--surface)' }}>
            <strong>{profile.user.displayName}</strong>
            <p style={{ margin: '0.3rem 0 0', color: 'var(--text-muted)' }}>
              {profile.user.email ?? 'No public email'}
            </p>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem', background: 'var(--surface)' }}>
            <h2 style={{ marginTop: 0 }}>Best Scores</h2>
            {sortedBests.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Best</th>
                    <th>Leaderboard</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBests.map((best) => {
                    const test = TEST_REGISTRY_BY_SLUG.get(best.testSlug);
                    return (
                      <tr key={best.testSlug}>
                        <td>{test?.name ?? best.testSlug}</td>
                        <td>{formatNumber(best.bestScore, best.bestScore % 1 === 0 ? 0 : 2)} {best.scoreUnit}</td>
                        <td>
                          <Link href={`/leaderboard/${best.testSlug}`} className="button buttonGhost">
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No scores yet. Play any test to populate your profile.</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
