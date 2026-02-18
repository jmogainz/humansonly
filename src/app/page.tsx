import TestList from '@/components/TestList';
import HeroCTA from '@/components/HeroCTA';
import ScrollArrow from '@/components/ScrollArrow';
import { listPlayableTestsByCategory } from '@/lib/tests/registry';
import styles from './page.module.css';

import AsciiPyramid from '@/components/AsciiPyramid';

const giaTests = listPlayableTestsByCategory('gia');
const otherTests = listPlayableTestsByCategory('human-benchmark');

export default function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1>Measure Your<br /><span>Cognitive Edge</span></h1>
        <p>
          18 precision tests across reasoning, perception, memory, and speed.<br />
          Track your performance. <strong>Compete globally.</strong>
        </p>
        <div className={styles.cta}>
          <HeroCTA />
        </div>
        <AsciiPyramid />
        <ScrollArrow />
      </header>

      <section className={styles.section} id="gia">
        <div className={styles.sectionHeader}>
          <h2>GIA Core Modules</h2>
        </div>
        <TestList tests={giaTests} featured />
      </section>

      <section className={styles.section} id="all-tests">
        <div className={styles.sectionHeader}>
          <h2>Benchmark Tests</h2>
        </div>
        <TestList tests={otherTests} />
      </section>
    </div>
  );
}
