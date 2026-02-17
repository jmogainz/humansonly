'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from './Spinner';

export default function HeroCTA() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsStarting(true);
    router.push('/tests/gia-reasoning?flow=gia&start=1');
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <button 
        onClick={handleStart} 
        className="button" 
        disabled={isStarting}
        style={{ minWidth: '180px' }}
      >
        {isStarting ? <Spinner size={18} /> : null}
        {isStarting ? 'Loading...' : 'Start Assessment'}
      </button>
      <a href="#all-tests" className="button buttonGhost">
        Browse Tests
      </a>
    </div>
  );
}
