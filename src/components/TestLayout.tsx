import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './TestLayout.module.css';
import { FeedbackProvider, useFeedback } from './FeedbackContext';

type TestLayoutProps = {
  title: string;
  subtitle: string;
  sidebar?: ReactNode;
  children: ReactNode;
};

function TestLayoutInner({ title, subtitle, sidebar, children }: TestLayoutProps) {
  const { feedback } = useFeedback();

  const contentClassName = `${styles.content} ${
    feedback === 'success' ? styles.flashSuccess : 
    feedback === 'danger' ? styles.flashDanger : ''
  }`;

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <Link className={styles.back} href="/">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.2rem' }}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to tests
          </Link>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {sidebar ? <aside>{sidebar}</aside> : null}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

export default function TestLayout(props: TestLayoutProps) {
  return (
    <FeedbackProvider>
      <TestLayoutInner {...props} />
    </FeedbackProvider>
  );
}
