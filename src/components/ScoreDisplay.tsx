'use client';

type ScoreDisplayProps = {
  label?: string;
  value: number | string;
};

export default function ScoreDisplay({ label = 'Score', value }: ScoreDisplayProps) {
  return (
    <div style={{ display: 'grid', gap: '0.15rem' }}>
      <small style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</small>
      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>{value}</strong>
    </div>
  );
}
