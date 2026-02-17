import styles from './Timer.module.css';

type TimerProps = {
  label?: string;
  milliseconds: number;
  progress?: number;
};

function formatTime(milliseconds: number): string {
  const total = Math.max(0, milliseconds);
  if (total >= 60_000) {
    const minutes = Math.floor(total / 60_000);
    const seconds = Math.floor((total % 60_000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  const seconds = Math.floor(total / 1000);
  const centiseconds = Math.floor((total % 1000) / 10);
  return `${seconds}.${String(centiseconds).padStart(2, '0')}`;
}

export default function Timer({ label = 'Time', milliseconds, progress }: TimerProps) {
  const pct = Math.max(0, Math.min(100, (progress ?? 0) * 100));

  return (
    <div className={styles.timer}>
      <div className={styles.row}>
        <span>{label}</span>
        <strong>{formatTime(milliseconds)}</strong>
      </div>
      <div className={styles.barTrack}>
        <div className={styles.bar} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
