import Link from 'next/link';
import type { TestDefinition } from '@/lib/tests/types';
import styles from './TestCard.module.css';

type TestCardProps = {
  test: TestDefinition;
};

export default function TestCard({ test }: TestCardProps) {
  return (
    <Link href={`/tests/${test.slug}`} className={styles.card}>
      <div className={styles.headerRow}>
        <span className={styles.icon}>{test.icon}</span>
        <span className={styles.pill}>{test.category === 'gia' ? 'GIA' : 'HB'}</span>
      </div>
      <h3>{test.name}</h3>
      <p>{test.description}</p>
      <span className={styles.cta}>Start Test</span>
    </Link>
  );
}
