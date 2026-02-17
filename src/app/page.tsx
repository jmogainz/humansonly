import Link from 'next/link';
import TestCard from '@/components/TestCard';
import { listPlayableTestsByCategory } from '@/lib/tests/registry';
import styles from './page.module.css';

const giaTests = listPlayableTestsByCategory('gia');
const otherTests = listPlayableTestsByCategory('human-benchmark');

export default function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1>Measure Your <span>Cognitive Edge</span></h1>
        <p>
          18 precision tests across reasoning, perception, memory, and speed.
          Track your performance. Compete globally.
        </p>
        <div className={styles.cta}>
          <Link href="/tests/gia-reasoning" className="button">
            Start Assessment
          </Link>
          <a href="#all-tests" className="button buttonGhost">
            Browse Tests
          </a>
        </div>
      </header>

      <section className={styles.section} id="gia">
        <div className={styles.sectionHeader}>
          <h2>GIA Core Modules</h2>
        </div>
        <div className={styles.list}>
          {giaTests.map((test, i) => (
            <TestCard key={test.slug} test={test} featured index={i} />
          ))}
        </div>
      </section>

      <section className={styles.section} id="all-tests">
        <div className={styles.sectionHeader}>
          <h2>Benchmark Tests</h2>
        </div>
        <div className={styles.list}>
          {otherTests.map((test, i) => (
            <TestCard key={test.slug} test={test} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
