import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './TestLayout.module.css';

type TestLayoutProps = {
  title: string;
  subtitle: string;
  sidebar?: ReactNode;
  children: ReactNode;
};

export default function TestLayout({ title, subtitle, sidebar, children }: TestLayoutProps) {
  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <Link className={styles.back} href="/">← Back to tests</Link>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {sidebar ? <aside>{sidebar}</aside> : null}
      </div>
      <div className={styles.content}>{children}</div>
    </section>
  );
}
