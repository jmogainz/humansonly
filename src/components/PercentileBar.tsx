'use client';

import styles from './PercentileBar.module.css';

type PercentileBarProps = {
  percentile: number | null;
};

export default function PercentileBar({ percentile }: PercentileBarProps) {
  if (percentile === null) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Percentile will appear after leaderboard sync.</p>;
  }

  const clamped = Math.max(0, Math.min(100, percentile));

  return (
    <div className={styles.container}>
      <p>
        Better than <strong>{clamped.toFixed(1)}%</strong> of players
      </p>
      <div className={styles.bar}>
        <div
          className={styles.fill}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
