'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';

function generateNumber(digits: number): string {
  let out = '';
  for (let i = 0; i < digits; i += 1) {
    const min = i === 0 ? 1 : 0;
    out += Math.floor(min + Math.random() * (10 - min)).toString();
  }
  return out;
}

export default function NumberMemoryTest({ onComplete }: TestGameProps) {
  const [digits, setDigits] = useState(1);
  const [target, setTarget] = useState(() => generateNumber(1));
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [guess, setGuess] = useState('');

  const prompt = useMemo(() => (phase === 'show' ? `Memorize ${digits} digit${digits > 1 ? 's' : ''}` : 'Enter the number'), [phase, digits]);

  useEffect(() => {
    if (phase !== 'show') return;
    const visibleMs = digits * 1000;
    const id = window.setTimeout(() => {
      setPhase('input');
    }, visibleMs);
    return () => window.clearTimeout(id);
  }, [digits, phase]);

  const nextLevel = (nextDigits: number) => {
    setDigits(nextDigits);
    setTarget(generateNumber(nextDigits));
    setGuess('');
    setPhase('show');
  };

  return (
    <div style={{ display: 'grid', gap: '1rem', justifyItems: 'center', textAlign: 'center' }}>
      <p style={{ margin: 0, color: 'var(--text-muted)' }}>{prompt}</p>

      <div
        style={{
          fontSize: 'clamp(2rem, 9vw, 4rem)',
          fontFamily: 'var(--font-mono)',
          minHeight: '5rem',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {phase === 'show' ? target : '•'.repeat(Math.min(12, digits))}
      </div>

      {phase === 'input' ? (
        <form
          style={{ display: 'grid', gap: '0.6rem', width: 'min(420px, 100%)' }}
          onSubmit={(event) => {
            event.preventDefault();
            if (guess.trim() === target) {
              nextLevel(digits + 1);
              return;
            }
            onComplete({
              score: digits,
              unit: 'digits',
              metadata: {
                target,
                guess,
                digits,
              },
              label: `${digits} digits`,
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
      ) : null}
    </div>
  );
}
