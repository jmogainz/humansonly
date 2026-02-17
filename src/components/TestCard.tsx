import Link from 'next/link';
import type { TestDefinition } from '@/lib/tests/types';
import { TestIcon } from './TestIcon';
import styles from './TestCard.module.css';

type TestCardProps = {
  test: TestDefinition;
  featured?: boolean;
};

export default function TestCard({ test, featured }: TestCardProps) {
  return (
    <Link href={`/tests/${test.slug}`} className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <TestIcon slug={test.slug} />
        </div>
        <span className={styles.category}>{test.category === 'gia' ? 'GIA' : 'HB'}</span>
      </div>
      <div className={styles.content}>
        <h3>{test.name}</h3>
        <p>{test.description}</p>
      </div>
      <div className={styles.footer}>
        <span className={styles.cta}>Start Assessment &rarr;</span>
      </div>
    </Link>
  );
}
