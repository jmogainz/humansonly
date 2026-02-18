'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './AssessmentCompleteScreen.module.css';
import StatsShareCard from './StatsShareCard';
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
  const [display, setDisplay] = useState(0);
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

      {/* Actions */}
      <div className={styles.actions}>
        <StatsShareCard displayName={displayName ?? 'Anonymous'} bests={bests} />
        <Link href="/profile" className="button buttonGhost">
          View Profile
        </Link>
        <Link href="/" className="button buttonGhost">
          All Tests
        </Link>
      </div>
    </section>
  );
}
