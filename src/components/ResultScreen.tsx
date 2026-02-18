'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ResultScreen.module.css';
import PercentileBar from './PercentileBar';
import LeaderboardMini from './LeaderboardMini';
import type { ScoreUnit } from '@/lib/tests/types';
import { formatNumber } from '@/lib/utils';
import { Spinner } from './Spinner';
import { getTestBySlug } from '@/lib/tests/registry';
import { useSession, signIn } from 'next-auth/react';
import { apiGet } from '@/lib/api';
import type { ScoreHistoryResponse } from '@/lib/api/types';
import { getStoredGuestId } from '@/lib/guestId';
import { shareTestStatsCard } from '@/lib/share/testStatsShare';

type ResultScreenProps = {
  testSlug: string;
  scoreLabel: string;
  scoreValue: number;
  scoreUnit: ScoreUnit;
  percentile: number | null;
  personalBest: boolean;
  onPlayAgain: () => void;
  statusNode?: React.ReactNode;
};

export default function ResultScreen({
  testSlug,
  scoreLabel,
  scoreValue,
  scoreUnit,
  percentile,
  personalBest,
  onPlayAgain,
  statusNode,
}: ResultScreenProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [display, setDisplay] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const isGuest = sessionStatus !== 'loading' && !session?.user;
  const target = useMemo(() => (Number.isFinite(scoreValue) ? scoreValue : 0), [scoreValue]);

  useEffect(() => {
    let raf = 0;
    const startedAt = performance.now();

    const frame = () => {
      const elapsed = performance.now() - startedAt;
      const t = Math.min(1, elapsed / 700);
      setDisplay(target * t);
      if (t < 1) {
        raf = requestAnimationFrame(frame);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const handleShare = async () => {
    if (isSharing) return;
    const test = getTestBySlug(testSlug);
    if (!test) return;

    setIsSharing(true);
    try {
      let values: number[] = [];
      try {
        const params = new URLSearchParams({ testSlug, limit: '5000' });
        if (!session?.user?.id) {
          const guestId = getStoredGuestId();
          if (guestId) {
            params.set('guestId', guestId);
          }
        }

        const history = await apiGet<ScoreHistoryResponse>(`/api/scores/history/test?${params.toString()}`);
        const chronological = [...history.scores].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        values = chronological.map((entry) => entry.scoreValue).filter((entry) => Number.isFinite(entry));
      } catch {
        // Best effort fallback: still share current result as a one-run card.
        values = [scoreValue];
      }

      if (values.length === 0) {
        values = [scoreValue];
      }

      const runs = values.length;
      const sum = values.reduce((acc, value) => acc + value, 0);
      const avg = runs > 0 ? sum / runs : null;
      const best =
        test.direction === 'higher'
          ? Math.max(...values)
          : Math.min(...values);
      const trend =
        runs < 2
          ? null
          : test.direction === 'higher'
            ? values[runs - 1] - values[0]
            : values[0] - values[runs - 1];
      const displayName = session?.user?.name?.trim() || 'Human';

      await shareTestStatsCard({
        displayName,
        test,
        stats: {
          runs,
          best,
          avg,
          trend,
        },
      });
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <section className={styles.result}>
      {statusNode}
      <p className={styles.kicker}>Result</p>
      <h2>{scoreLabel}</h2>
      <p className={styles.mainScore}>
        {formatNumber(display, scoreValue % 1 === 0 ? 0 : 2)}
        <small> {scoreUnit}</small>
      </p>

      {personalBest ? <p className={styles.badge}>New Personal Best</p> : null}

      <PercentileBar percentile={percentile} />

      {isGuest && (
        <div className={styles.guestCta}>
          <div className={styles.guestCtaText}>
            <strong>Save your score &amp; unlock your dashboard</strong>
            <span>Sign in to track detailed stats, visualize your progress over time, and compete on global leaderboards.</span>
          </div>
          <div className={styles.guestCtaActions}>
            <button
              type="button"
              className={styles.guestCtaBtn}
              disabled={!!pendingProvider}
              onClick={async () => {
                setPendingProvider('google');
                await signIn('google', { callbackUrl: '/profile' });
                setPendingProvider(null);
              }}
            >
              {pendingProvider === 'google' ? <Spinner size={16} /> : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {pendingProvider === 'google' ? 'Signing in…' : 'Google'}
            </button>
            <button
              type="button"
              className={styles.guestCtaBtn}
              disabled={!!pendingProvider}
              onClick={async () => {
                setPendingProvider('apple');
                await signIn('apple', { callbackUrl: '/profile' });
                setPendingProvider(null);
              }}
            >
              {pendingProvider === 'apple' ? <Spinner size={16} /> : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              {pendingProvider === 'apple' ? 'Signing in…' : 'Apple'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className="button"
          type="button"
          disabled={isResetting || isNavigating}
          onClick={() => {
            setIsResetting(true);
            onPlayAgain();
          }}
        >
          {isResetting ? <Spinner size={16} /> : null}
          {isResetting ? 'Resetting...' : 'Play Again'}
        </button>
        <button
          className="button buttonGhost"
          disabled={isResetting || isNavigating || isSharing}
          onClick={() => {
            setIsNavigating(true);
            router.push(`/leaderboard/${testSlug}`);
          }}
        >
          {isNavigating ? <Spinner size={16} /> : null}
          {isNavigating ? 'Loading...' : 'View Leaderboard'}
        </button>
        <button
          type="button"
          className="button buttonGhost"
          disabled={isResetting || isNavigating || isSharing}
          onClick={() => {
            void handleShare();
          }}
        >
          {isSharing ? <Spinner size={16} /> : null}
          {isSharing ? 'Generating...' : 'Share'}
        </button>
      </div>

      <div>
        <h3>Top Players</h3>
        <LeaderboardMini testSlug={testSlug} />
      </div>
    </section>
  );
}
