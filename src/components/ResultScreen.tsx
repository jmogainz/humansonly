'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './ResultScreen.module.css';
import PercentileBar from './PercentileBar';
import LeaderboardMini from './LeaderboardMini';
import type { ScoreUnit } from '@/lib/tests/types';
import { formatNumber } from '@/lib/utils';
import ShareCard from './ShareCard';

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
  const [display, setDisplay] = useState(0);
  const target = useMemo(() => Math.max(0, scoreValue), [scoreValue]);

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
        <button className="button" type="button" onClick={onPlayAgain}>Play Again</button>
        <Link href={`/leaderboard/${testSlug}`} className="button buttonGhost">View Leaderboard</Link>
        <ShareCard title="HumansOnly Result" scoreText={`${scoreLabel}: ${scoreValue.toFixed(2)} ${scoreUnit}`} />
      </div>

      <div>
        <h3>Top Players</h3>
        <LeaderboardMini testSlug={testSlug} />
      </div>
    </section>
  );
}
