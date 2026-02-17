'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import type { ProfileResponse, CategoryHistoryResponse } from '@/lib/api/types';
import { TEST_REGISTRY_BY_SLUG } from '@/lib/tests/registry';
import { formatNumber } from '@/lib/utils';
import BestScoresList from '@/components/BestScoresList';
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

  // Name change state
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameChangeLoading, setNameChangeLoading] = useState(false);
  const [nameChangeError, setNameChangeError] = useState<string | null>(null);

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
          setNewName(profileResult.value.user.displayName);
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

  const giaBests = useMemo(
    () => sortedBests.filter(b => TEST_REGISTRY_BY_SLUG.get(b.testSlug)?.category === 'gia'),
    [sortedBests]
  );

  const benchmarkBests = useMemo(
    () => sortedBests.filter(b => TEST_REGISTRY_BY_SLUG.get(b.testSlug)?.category === 'human-benchmark'),
    [sortedBests]
  );

  const handleNameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (newName === profile.user.displayName) {
      setIsEditingName(false);
      setNameChangeError(null);
      return;
    }

    setNameChangeLoading(true);
    setNameChangeError(null);

    try {
      const result = await apiPost<{ displayName: string }, { displayName: string }>('/api/profile/name', {
        displayName: newName,
      });
      setProfile({
        ...profile,
        user: {
          ...profile.user,
          displayName: result.displayName,
        },
      });
      setIsEditingName(false);
    } catch (err) {
      setNameChangeError(err instanceof Error ? err.message : 'Failed to change name');
    } finally {
      setNameChangeLoading(false);
    }
  };

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
      <section className={styles.section}>
        <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
      </section>
      <section className={styles.section}>
        <div className="skeleton" style={{ height: '1.15rem', width: '140px', borderRadius: '6px', marginBottom: '1rem' }} />
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
            {isEditingName ? (
              <form onSubmit={handleNameChange} className={styles.nameEditForm}>
                <div className={styles.nameInputGroup}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={styles.nameInput}
                    autoFocus
                    disabled={nameChangeLoading}
                    maxLength={14}
                  />
                  <div className={styles.nameActions}>
                    <button 
                      type="submit" 
                      className={styles.editButton} 
                      title="Save name"
                      disabled={nameChangeLoading || !newName.trim()}
                    >
                      {nameChangeLoading ? <Spinner size={16} /> : <Check size={20} />}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditingName(false);
                        setNewName(profile.user.displayName);
                        setNameChangeError(null);
                      }} 
                      className={styles.editButton} 
                      title="Cancel"
                      disabled={nameChangeLoading}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                {nameChangeError && <div className={styles.errorText}>{nameChangeError}</div>}
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <h1>{profile.user.displayName}</h1>
                <button 
                  onClick={() => setIsEditingName(true)} 
                  className={styles.editButton}
                  title="Edit name"
                >
                  <Pencil size={18} />
                </button>
              </div>
            )}
            <div className={styles.headerMeta}>
              <span>{profile.user.email || 'Private User'}</span>
              <span>Joined {new Date(profile.user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </header>
      )}

      {historyError ? (
        <section className={styles.section}>
          <p style={{ margin: 0, color: 'var(--danger)' }}>
            History is temporarily unavailable: {historyError}
          </p>
        </section>
      ) : history && history.scores.length > 0 ? (
        <>
          <section className={styles.section}>
            <PerformanceDashboard 
              displayName={profile?.user.displayName ?? 'Human'} 
              scores={history.scores} 
              view="atlas"
            />
          </section>

          <section className={styles.section}>
            <PerformanceDashboard 
              displayName={profile?.user.displayName ?? 'Human'} 
              scores={history.scores} 
              view="matrix"
              category="gia"
            />
            {giaBests.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <BestScoresList scores={giaBests} />
              </div>
            )}
          </section>

          <section className={styles.section}>
            <PerformanceDashboard 
              displayName={profile?.user.displayName ?? 'Human'} 
              scores={history.scores} 
              view="matrix"
              category="human-benchmark"
            />
            {benchmarkBests.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <BestScoresList scores={benchmarkBests} />
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.emptyState}>
              <p>Complete tests to unlock your performance dashboard.</p>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Personal Bests</h2>
            </div>

            {sortedBests.length ? (
              <BestScoresList scores={sortedBests} />
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
        </>
      )}
    </div>
  );
}
