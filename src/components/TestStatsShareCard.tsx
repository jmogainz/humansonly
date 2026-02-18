'use client';

import { useState } from 'react';
import type { TestDefinition } from '@/lib/tests/types';
import { Spinner } from './Spinner';
import { shareTestStatsCard } from '@/lib/share/testStatsShare';

type TestStatsShareCardProps = {
  displayName: string;
  test: TestDefinition;
  stats: {
    runs: number;
    best: number | null;
    avg: number | null;
    trend: number | null;
  };
  className?: string;
};

export default function TestStatsShareCard({ 
  displayName, 
  test, 
  stats,
  className 
}: TestStatsShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);
    
    try {
      await shareTestStatsCard({ displayName, test, stats });
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      className={className}
      onClick={handleShare}
      disabled={isGenerating}
      title="Share test stats"
    >
      {isGenerating ? <Spinner size={14} /> : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      )}
    </button>
  );
}
