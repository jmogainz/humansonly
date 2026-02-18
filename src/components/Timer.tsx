import styles from './Timer.module.css';

export function formatTime(milliseconds: number): string {
  const total = Math.max(0, milliseconds);
  if (total >= 60_000) {
    const minutes = Math.floor(total / 60_000);
    const seconds = Math.floor((total % 60_000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  if (total >= 10_000) {
    return String(Math.floor(total / 1000));
  }
  const seconds = Math.floor(total / 1000);
  const tenths = Math.floor((total % 1000) / 100);
  return `${seconds}.${tenths}`;
}

type TimerProps = {
  progress: number;
};

export default function Timer({ progress }: TimerProps) {
  const pct = Math.max(0, Math.min(100, (progress ?? 0) * 100));

  return (
    <div className={styles.timer}>
      <div className={styles.barTrack}>
        <div className={styles.bar} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
