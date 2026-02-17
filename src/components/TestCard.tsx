import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { TestDefinition } from '@/lib/tests/types';
import { TestIcon } from './TestIcon';
import { Spinner } from './Spinner';
import styles from './TestCard.module.css';

type TestCardProps = {
  test: TestDefinition;
  featured?: boolean;
  index?: number;
  isHovered?: boolean;
};

export default function TestCard({ test, featured, index = 0, isHovered }: TestCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    router.push(`/tests/${test.slug}`);
  };

  return (
    <a
      href={`/tests/${test.slug}`}
      onClick={handleClick}
      className={`${styles.card} ${featured ? styles.featured : ''} ${isHovered ? styles.hovered : ''} ${isLoading ? styles.loading : ''}`}
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <div className={styles.iconWrapper}>
        <TestIcon slug={test.slug} />
      </div>
      <div className={styles.content}>
        <div className={styles.titleWrapper}>
          <h3>{test.name}</h3>
          {featured && <span className={styles.featuredBadge}>CORE</span>}
        </div>
        <p>{test.description}</p>
      </div>
      <div className={styles.meta}>
        <span className={styles.unit}>{test.scoreUnit}</span>
        <span className={styles.arrow}>
          {isLoading ? (
            <Spinner size={14} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </span>
      </div>
    </a>
  );
}
