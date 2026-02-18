'use client';

import { useEffect, useState } from 'react';
import styles from './ScrollArrow.module.css';

export default function ScrollArrow() {
  const [opacity, setOpacity] = useState(0); // Start invisible to avoid flash

  useEffect(() => {
    // Initial check
    setOpacity(Math.max(0, 1 - window.scrollY / 200));

    const handleScroll = () => {
      const newOpacity = Math.max(0, 1 - window.scrollY / 200);
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (opacity <= 0.05) return null;

  return (
    <a
      href="#gia"
      className={styles.scrollArrow}
      aria-label="Scroll to tests"
      style={{ opacity }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </a>
  );
}
