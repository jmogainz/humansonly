import { TEST_REGISTRY } from '@/lib/tests/registry';
import LeaderboardViewClient from '@/components/LeaderboardViewClient';
import styles from './leaderboard.module.css';

export const metadata = {
  title: 'Leaderboards - HumansOnly',
};

export default function LeaderboardPage() {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <h1>Global Leaderboards</h1>
        <p>
          Browse top rankings for every test and compare your position after each run.
        </p>
      </div>
      <div className={styles.card}>
        <LeaderboardViewClient tests={TEST_REGISTRY} />
      </div>
    </section>
  );
}
