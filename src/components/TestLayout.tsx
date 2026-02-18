import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './TestLayout.module.css';
import { FeedbackProvider, useFeedback } from './FeedbackContext';

type TestLayoutProps = {
  title: string;
  subtitle: string;
  sidebar?: ReactNode;
  children: ReactNode;
  onQuit?: () => void;
};

function TestLayoutInner({ title, subtitle, sidebar, children, onQuit }: TestLayoutProps) {
  const { feedback } = useFeedback();

  const contentClassName = `${styles.content} ${
    feedback === 'success' ? styles.flashSuccess : 
    feedback === 'danger' ? styles.flashDanger : ''
  }`;

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          {onQuit ? (
            <button type="button" className={styles.back} onClick={onQuit}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.2rem' }}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Quit Assessment
            </button>
          ) : (
            <Link className={styles.back} href="/">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.2rem' }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
          )}
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {sidebar ? <div className={styles.sidebar}>{sidebar}</div> : null}
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

export type { TestLayoutProps };
