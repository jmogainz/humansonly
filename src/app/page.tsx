import TestCard from '@/components/TestCard';
import { listPlayableTestsByCategory } from '@/lib/tests/registry';
import styles from './page.module.css';

const humanBenchmarkTests = listPlayableTestsByCategory('human-benchmark');
const giaTests = listPlayableTestsByCategory('gia');

export default function HomePage() {
  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.tag}>18 Cognitive Exams</p>
        <h1>Train, benchmark, and compete with HumansOnly.</h1>
        <p>
          Every test tracks personal history and global rankings. Play as guest instantly,
          then sign in to keep your scores forever.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Human Benchmark Tests</h2>
          <small>13 tests</small>
        </div>
        <div className={styles.grid}>
          {humanBenchmarkTests.map((test) => (
            <TestCard key={test.slug} test={test} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>GIA Assessment Tests</h2>
          <small>5 tests</small>
        </div>
        <div className={styles.grid}>
          {giaTests.map((test) => (
            <TestCard key={test.slug} test={test} />
          ))}
        </div>
      </section>
    </section>
  );
}
