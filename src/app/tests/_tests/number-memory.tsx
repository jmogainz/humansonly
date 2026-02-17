'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import TestStartScreen from '@/components/TestStartScreen';

function generateNumber(digits: number): string {
  let out = '';
  for (let i = 0; i < digits; i += 1) {
    const min = i === 0 ? 1 : 0;
    out += Math.floor(min + Math.random() * (10 - min)).toString();
  }
  return out;
}

export default function NumberMemoryTest({ definition, onComplete }: TestGameProps) {
  const [started, setStarted] = useState(false);
  const [digits, setDigits] = useState(1);
  const [target, setTarget] = useState(() => generateNumber(1));
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [guess, setGuess] = useState('');

  const prompt = useMemo(() => (phase === 'show' ? `Memorize ${digits} digit${digits > 1 ? 's' : ''}` : 'Enter the number'), [phase, digits]);

  useEffect(() => {
    if (!started || phase !== 'show') return;
    const visibleMs = Math.min(7000, 900 + digits * 550);
    const id = window.setTimeout(() => {
      setPhase('input');
    }, visibleMs);
    return () => window.clearTimeout(id);
  }, [digits, phase, started]);

  const nextLevel = (nextDigits: number) => {
    setDigits(nextDigits);
    setTarget(generateNumber(nextDigits));
    setGuess('');
    setPhase('show');
  };

  return (
    <div className="game-container" style={{ alignItems: 'center', textAlign: 'center' }}>
      {!started ? (
        <TestStartScreen
          description={definition.description}
          onStart={() => setStarted(true)}
        />
      ) : (
        <>
          <p style={{ margin: 0, color: 'var(--text-muted)', flexShrink: 0 }}>{prompt}</p>

          <div
            className="game-grid-container"
            style={{
              fontSize: 'clamp(2rem, 10vw, 4.5rem)',
              fontFamily: 'var(--font-mono)',
              minHeight: '4rem',
            }}
          >
            {phase === 'show' ? (
              <div style={{ wordBreak: 'break-all', maxWidth: '100%' }}>{target}</div>
            ) : (
              <div style={{ wordBreak: 'break-all', maxWidth: '100%' }}>{'•'.repeat(Math.min(12, digits))}</div>
            )}
          </div>

          {phase === 'input' ? (
            <form
              style={{ display: 'grid', gap: '0.6rem', width: 'min(420px, 100%)', flexShrink: 0 }}
              onSubmit={(event) => {
                event.preventDefault();
                if (guess.trim() === target) {
                  nextLevel(digits + 1);
                  return;
                }
                const bestDigits = Math.max(0, digits - 1);
                onComplete({
                  score: bestDigits,
                  unit: 'digits',
                  metadata: {
                    target,
                    guess,
                    attemptedDigits: digits,
                    bestDigits,
                  },
                  label: `${bestDigits} digits`,
                });
              }}
            >
              <input
                autoFocus
                inputMode="numeric"
                value={guess}
                onChange={(event) => setGuess(event.target.value.replace(/\D+/g, ''))}
                placeholder="Type number"
                style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', fontSize: '1.3rem' }}
              />
              <button className="button" type="submit">Submit</button>
            </form>
          ) : (
            <div style={{ height: '80px', flexShrink: 0 }} />
          )}
        </>
      )}
    </div>
  );
}
