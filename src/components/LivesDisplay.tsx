'use client';

type LivesDisplayProps = {
  lives: number;
  maxLives?: number;
};

export default function LivesDisplay({ lives, maxLives = 3 }: LivesDisplayProps) {
  return (
    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
      {Array.from({ length: maxLives }).map((_, index) => (
        <span key={index} aria-hidden>
          {index < lives ? '❤️' : '🖤'}
        </span>
      ))}
      <small style={{ color: 'var(--text-muted)' }}>Lives</small>
    </div>
  );
}
