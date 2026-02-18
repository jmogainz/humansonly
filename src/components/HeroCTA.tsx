'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from './Spinner';
import styles from './HeroCTA.module.css';

export default function HeroCTA() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsStarting(true);
    router.push('/tests/gia-reasoning?flow=gia&start=1');
  };

  const handleBrowse = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('gia');
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.actions}>
      <button
        onClick={handleStart}
        className="button"
        disabled={isStarting}
        style={{ minWidth: '180px' }}
      >
        {isStarting ? <Spinner size={18} /> : null}
        {isStarting ? 'Loading...' : 'Start Assessment'}
      </button>

      <button onClick={handleBrowse} className={styles.scrollCue}>
        Browse Tests
      </button>
    </div>
  );
}
