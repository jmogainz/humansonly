'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';

type Phase = 'idle' | 'wait' | 'go' | 'too-soon';

const TOTAL_ATTEMPTS = 5;

export default function ReactionTimeTest({ onComplete }: TestGameProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const startRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  const avg = useMemo(() => {
    if (attempts.length === 0) return 0;
    return attempts.reduce((sum, value) => sum + value, 0) / attempts.length;
  }, [attempts]);

  useEffect(() => {
    if (attempts.length !== TOTAL_ATTEMPTS || submittedRef.current) return;
    submittedRef.current = true;
    onComplete({
      score: avg,
      unit: 'ms',
      metadata: {
        attempts,
      },
      label: `Average ${Math.round(avg)} ms`,
    });
  }, [attempts, avg, onComplete]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startRound = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setPhase('wait');
    startRef.current = null;
    const delay = Math.floor(1000 + Math.random() * 5000);
    timeoutRef.current = window.setTimeout(() => {
      startRef.current = performance.now();
      setPhase('go');
    }, delay);
  };

  const resetRound = () => {
    setPhase('idle');
  };

  const handleClick = () => {
    if (phase === 'idle' || phase === 'too-soon') {
      startRound();
      return;
    }

    if (phase === 'wait') {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setPhase('too-soon');
      timeoutRef.current = window.setTimeout(() => {
        resetRound();
      }, 900);
      return;
    }

    if (phase === 'go' && startRef.current) {
      const delta = performance.now() - startRef.current;
      setAttempts((prev) => [...prev, delta]);
      const nextRound = round + 1;
      setRound(nextRound);
      if (nextRound <= TOTAL_ATTEMPTS) {
        setPhase('idle');
      }
    }
  };

  const remaining = TOTAL_ATTEMPTS - attempts.length;

  const message =
    phase === 'idle'
      ? remaining === TOTAL_ATTEMPTS
        ? 'Click to start'
        : `Round ${attempts.length + 1}: click to continue`
      : phase === 'wait'
        ? 'Wait for green...'
        : phase === 'go'
          ? 'CLICK!'
          : 'Too soon!';

  const color =
    phase === 'wait' ? '#b34747' : phase === 'go' ? '#4a9c56' : phase === 'too-soon' ? '#9a6b39' : '#3d5aa3';

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
          }
        }}
        style={{
          width: '100%',
          minHeight: '340px',
          borderRadius: '14px',
          background: color,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'background 160ms ease',
        }}
      >
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '2rem' }}>{message}</h2>
          <p style={{ margin: 0, color: '#fff', opacity: 0.95 }}>
            {attempts.length}/{TOTAL_ATTEMPTS} rounds complete
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {attempts.map((attempt, index) => (
          <span
            key={index}
            style={{
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--border)',
              borderRadius: '999px',
              padding: '0.25rem 0.6rem',
            }}
          >
            {Math.round(attempt)} ms
          </span>
        ))}
      </div>
    </div>
  );
}
