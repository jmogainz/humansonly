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
        <h1>HumansOnly Benchmark</h1>
        <p>
          The minimalist cognitive performance benchmark. Master the 5 pillars of mental agility:
          Reasoning, Perceptual Speed, Number Speed, Word Meaning, and Spatial Visualization.
        </p>
        <div className={styles.cta}>
          <Link href="/tests/gia-reasoning" className="button">
            Start Assessment
          </Link>
          <a href="#all-tests" className="button buttonGhost">
            View All Tests
          </a>
        </div>
      </header>

      <section className={styles.section} id="gia">
        <div className={styles.sectionHeader}>
          <h2>Core Modules</h2>
        </div>
        <div className={styles.grid}>
          {giaTests.map((test) => (
            <TestCard key={test.slug} test={test} featured />
          ))}
        </div>
      </section>

      <section className={styles.section} id="all-tests">
        <div className={styles.sectionHeader}>
          <h2>Additional Tests</h2>
        </div>
        <div className={styles.grid}>
          {otherTests.map((test) => (
            <TestCard key={test.slug} test={test} />
          ))}
        </div>
      </section>
    </div>
  );
}
