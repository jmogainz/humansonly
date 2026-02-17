'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ResultScreen.module.css';
import PercentileBar from './PercentileBar';
import LeaderboardMini from './LeaderboardMini';
import type { ScoreUnit } from '@/lib/tests/types';
import { formatNumber } from '@/lib/utils';
import ShareCard from './ShareCard';
import { Spinner } from './Spinner';

type ResultScreenProps = {
  testSlug: string;
  scoreLabel: string;
  scoreValue: number;
  scoreUnit: ScoreUnit;
  percentile: number | null;
  personalBest: boolean;
  onPlayAgain: () => void;
};

export default function ResultScreen({
  testSlug,
  scoreLabel,
  scoreValue,
  scoreUnit,
  percentile,
  personalBest,
  onPlayAgain,
}: ResultScreenProps) {
  const router = useRouter();
  const [display, setDisplay] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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

  return (
    <section className={styles.result}>
      <p className={styles.kicker}>Result</p>
      <h2>{scoreLabel}</h2>
      <p className={styles.mainScore}>
        {formatNumber(display, scoreValue % 1 === 0 ? 0 : 2)}
        <small> {scoreUnit}</small>
      </p>

      {personalBest ? <p className={styles.badge}>New Personal Best</p> : null}

      <PercentileBar percentile={percentile} />

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
          disabled={isResetting || isNavigating}
          onClick={() => {
            setIsNavigating(true);
            router.push(`/leaderboard/${testSlug}`);
          }}
        >
          {isNavigating ? <Spinner size={16} /> : null}
          {isNavigating ? 'Loading...' : 'View Leaderboard'}
        </button>
        <ShareCard title="HumansOnly Result" scoreText={`${scoreLabel}: ${scoreValue.toFixed(2)} ${scoreUnit}`} />
      </div>

      <div>
        <h3>Top Players</h3>
        <LeaderboardMini testSlug={testSlug} />
      </div>
    </section>
  );
}
