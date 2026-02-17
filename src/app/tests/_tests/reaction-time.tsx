'use client';

import { useEffect, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import TestStartScreen from '@/components/TestStartScreen';
import Scoreboard from '@/components/Scoreboard';
import ScoreDisplay from '@/components/ScoreDisplay';
import { useFeedback } from '@/components/FeedbackContext';

type Phase = 'idle' | 'wait' | 'go' | 'too-soon';

const TOTAL_ATTEMPTS = 5;

export default function ReactionTimeTest({ definition, onComplete }: TestGameProps) {
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [attempts, setAttempts] = useState<number[]>([]);
  const startRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const submittedRef = useRef(false);
  const { triggerFeedback } = useFeedback();

  useEffect(() => {
    if (attempts.length < TOTAL_ATTEMPTS || submittedRef.current) return;
    submittedRef.current = true;
    const finalAttempts = attempts.slice(0, TOTAL_ATTEMPTS);
    const finalAverage =
      finalAttempts.reduce((sum, value) => sum + value, 0) / Math.max(1, finalAttempts.length);
    onComplete({
      score: finalAverage,
      unit: 'ms',
      metadata: {
        attempts: finalAttempts,
      },
      label: `Average ${Math.round(finalAverage)} ms`,
    });
  }, [attempts, onComplete]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startRound = () => {
    if (submittedRef.current || attempts.length >= TOTAL_ATTEMPTS) return;
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
    if (submittedRef.current || attempts.length >= TOTAL_ATTEMPTS) return;

    if (phase === 'idle' || phase === 'too-soon') {
      startRound();
      return;
    }

    if (phase === 'wait') {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setPhase('too-soon');
      triggerFeedback('danger');
      timeoutRef.current = window.setTimeout(() => {
        resetRound();
      }, 900);
      return;
    }

    if (phase === 'go' && startRef.current) {
      const delta = performance.now() - startRef.current;
      setAttempts((prev) => (prev.length >= TOTAL_ATTEMPTS ? prev : [...prev, delta]));
      triggerFeedback('success');
      startRef.current = null;
      setPhase('idle');
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
    phase === 'wait' ? 'var(--phase-wait)' : phase === 'go' ? 'var(--phase-go)' : phase === 'too-soon' ? 'var(--phase-warn)' : 'var(--phase-idle)';

  return (
    <div className="game-container">
      {!started ? (
        <div className="game-content">
          <TestStartScreen
            description={definition.description}
            onStart={() => setStarted(true)}
          />
        </div>
      ) : (
        <>
          <Scoreboard>
            <ScoreDisplay label="Round" value={`${Math.min(TOTAL_ATTEMPTS, attempts.length + 1)} / ${TOTAL_ATTEMPTS}`} />
            {attempts.length > 0 && (
              <ScoreDisplay 
                label="Last" 
                value={`${Math.round(attempts[attempts.length - 1])} ms`} 
                status="neutral" 
              />
            )}
          </Scoreboard>

          <div className="game-content" style={{ padding: 0 }}>
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
                flex: '1',
                borderRadius: '0 0 14px 14px',
                background: color,
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background 0ms ease',
                minHeight: 0
              }}
            >
              <div style={{ display: 'grid', gap: 'clamp(0.2rem, 2vh, 0.4rem)' }}>
                <h2 style={{ margin: 0, color: 'var(--phase-text)', fontSize: 'clamp(1.5rem, 8vw, 3rem)', fontWeight: 700 }}>{message}</h2>
              </div>
            </div>
          </div>
        </>
      )}

      {started && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', flexShrink: 0, padding: '1rem' }}>
          {attempts.map((attempt, index) => (
            <span
              key={index}
              style={{
                fontFamily: 'var(--font-mono)',
                border: '1px solid var(--border)',
                borderRadius: '999px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.8rem',
                background: 'var(--surface-raised)',
                fontWeight: 500
              }}
            >
              {Math.round(attempt)} ms
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
