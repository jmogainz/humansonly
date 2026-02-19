'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import styles from './AssessmentCompleteScreen.module.css';
import StatsShareCard from './StatsShareCard';
import { Spinner } from './Spinner';
import { GIA_SLUGS } from '@/constants';
import { TEST_REGISTRY_BY_SLUG } from '@/lib/tests/registry';
import { formatNumber } from '@/lib/utils';

type AssessmentCompleteScreenProps = {
  breakdown: Record<string, number>;
  total: number;
  combinedPersonalBest: boolean;
  displayName: string | null;
};

export default function AssessmentCompleteScreen({
  breakdown,
  total,
  combinedPersonalBest,
  displayName,
}: AssessmentCompleteScreenProps) {
  const { data: session, status: sessionStatus } = useSession();
  const isGuest = sessionStatus !== 'loading' && !session?.user;
  const [display, setDisplay] = useState(0);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const target = useMemo(() => (Number.isFinite(total) ? total : 0), [total]);

  useEffect(() => {
    let raf = 0;
    const startedAt = performance.now();
    const frame = () => {
      const elapsed = performance.now() - startedAt;
      const t = Math.min(1, elapsed / 800);
      setDisplay(target * t);
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  // Build bests array for StatsShareCard (includes all 5 subtests + combined)
  const bests = useMemo(
    () => [
      ...GIA_SLUGS.map((slug) => ({
        testSlug: slug,
        bestScore: breakdown[slug] ?? 0,
        scoreUnit: 'net',
      })),
      { testSlug: 'gia-combined', bestScore: total, scoreUnit: 'net' },
    ],
    [breakdown, total]
  );

  return (
    <section className={styles.complete}>
      {/* Header */}
      <div>
        <p className={styles.kicker}>Assessment Complete</p>
        <div className={styles.completionRow}>
          <div className={styles.checkBadge}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className={styles.modulesBadge}>5 / 5 Modules Complete</p>
        </div>
      </div>

      {/* Combined score */}
      <div className={styles.combinedSection}>
        <p className={styles.combinedLabel}>GIA Combined Score</p>
        <p className={styles.combinedScore}>
          {formatNumber(display, 2)}
          <small> net</small>
        </p>
        {combinedPersonalBest && <p className={styles.pbBadge}>New Personal Best</p>}
      </div>

      <hr className={styles.divider} />

      {/* Per-subtest breakdown */}
      <div className={styles.breakdown}>
        {GIA_SLUGS.map((slug, i) => {
          const score = breakdown[slug] ?? 0;
          const name =
            TEST_REGISTRY_BY_SLUG.get(slug)?.name.replace('GIA ', '') ?? slug;
          return (
            <div key={slug} className={styles.subtestRow}>
              <span className={styles.subtestIndex}>{i + 1}</span>
              <span className={styles.subtestName}>{name}</span>
              <span
                className={`${styles.subtestScore} ${score >= 0 ? styles.positive : styles.negative}`}
              >
                {score > 0 ? '+' : ''}
                {formatNumber(score, 2)}
                <small> net</small>
              </span>
            </div>
          );
        })}
      </div>

      <hr className={styles.divider} />

      {/* Guest sign-in CTA */}
      {isGuest && (
        <div className={styles.guestCta}>
          <div className={styles.guestCtaText}>
            <strong>Save your scores &amp; unlock your dashboard</strong>
            <span>Sign in to track your GIA history, visualize progress over time, and compete on global leaderboards.</span>
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

      {/* Actions */}
      <div className={styles.actions}>
        <StatsShareCard displayName={displayName ?? 'Anonymous'} bests={bests} label="Share" />
        {!isGuest && (
          <Link href="/profile" className="button buttonGhost">
            View Dashboard
          </Link>
        )}
        <Link href="/" className="button buttonGhost">
          All Tests
        </Link>
      </div>
    </section>
  );
}
