'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import Scoreboard from '@/components/Scoreboard';
import ScoreDisplay from '@/components/ScoreDisplay';
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
        <div className="game-container">
          <Scoreboard>
            <ScoreDisplay label="Level" value={`${digits} Digits`} />
          </Scoreboard>
    
          <div className="game-content">
            {!started ? (
              <TestStartScreen
                description={definition.description}
                onStart={() => setStarted(true)}
              />
            ) : (
              <>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'clamp(0.85rem, 3vw, 1rem)', textAlign: 'center', letterSpacing: '0.02em' }}>{prompt}</p>
    
                <div
                  style={{
                    fontSize: 'clamp(2rem, 10vw, 4rem)',
                    fontFamily: 'var(--font-mono)',
                    minHeight: '4.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                  }}
                >
                  <div key={`${digits}-${phase}`} className="animate-in">
                    {phase === 'show' ? (
                      <div style={{ wordBreak: 'break-all', maxWidth: '100%' }}>{target}</div>
                    ) : (
                      <div style={{ wordBreak: 'break-all', maxWidth: '100%', opacity: 0.3 }}>{'•'.repeat(Math.min(12, digits))}</div>
                    )}
                  </div>
                </div>
    
                {phase === 'input' ? (
                  <form
                    style={{ display: 'grid', gap: '0.75rem', width: 'min(400px, 100%)', marginInline: 'auto' }}
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
                      style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', fontSize: '1.4rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                    />
                    <button className="button" type="submit">Submit Answer</button>
                  </form>
                ) : (
                  <div style={{ minHeight: '84px' }} />
                )}
              </>
            )}
          </div>
        </div>
      );
    }
