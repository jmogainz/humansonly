import Link from 'next/link';
import type { TestDefinition } from '@/lib/tests/types';
import { TestIcon } from './TestIcon';
import styles from './TestCard.module.css';

type TestCardProps = {
  test: TestDefinition;
  featured?: boolean;
  index?: number;
};

export default function TestCard({ test, featured, index = 0 }: TestCardProps) {
  return (
    <Link
      href={`/tests/${test.slug}`}
      className={`${styles.card} ${featured ? styles.featured : ''}`}
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <div className={styles.iconWrapper}>
        <TestIcon slug={test.slug} />
      </div>
      <div className={styles.content}>
        <h3>{test.name}</h3>
        <p>{test.description}</p>
      </div>
      <div className={styles.meta}>
        <span className={styles.unit}>{test.scoreUnit}</span>
        <span className={styles.arrow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
