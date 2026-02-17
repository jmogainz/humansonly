'use client';

type PercentileBarProps = {
  percentile: number | null;
};

export default function PercentileBar({ percentile }: PercentileBarProps) {
  if (percentile === null) {
    return <p style={{ color: 'var(--text-muted)' }}>Percentile will appear after leaderboard sync.</p>;
  }

  const clamped = Math.max(0, Math.min(100, percentile));

  return (
    <div style={{ display: 'grid', gap: '0.4rem' }}>
      <p style={{ margin: 0 }}>
        Better than <strong>{clamped.toFixed(1)}%</strong> of players
      </p>
      <div
        style={{
          height: '8px',
          borderRadius: '999px',
          background: 'color-mix(in srgb, var(--surface-raised) 70%, var(--border))',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
          }}
        />
      </div>
    </div>
  );
}
