'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { shuffle } from '@/lib/utils';
import LivesDisplay from '@/components/LivesDisplay';

type Cell = {
  id: number;
  number: number | null;
};

const GRID_SIZE = 5;
const MAX_LEVEL = GRID_SIZE * GRID_SIZE;

function makeLevel(level: number): Cell[] {
  const total = GRID_SIZE * GRID_SIZE;
  const count = Math.min(level, total);
  const numbers = shuffle(Array.from({ length: total }, (_, index) => index)).slice(0, count);
  const map = new Map<number, number>();
  numbers.forEach((cellIndex, index) => map.set(cellIndex, index + 1));

  return Array.from({ length: total }, (_, index) => ({
    id: index,
    number: map.get(index) ?? null,
  }));
}

export default function ChimpTest({ onComplete }: TestGameProps) {
  const [level, setLevel] = useState(4);
  const [strikes, setStrikes] = useState(0);
  const [cells, setCells] = useState<Cell[]>(() => makeLevel(4));
  const [phase, setPhase] = useState<'show' | 'hide'>('show');
  const [nextExpected, setNextExpected] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const maxLives = 3;
  const lives = maxLives - strikes;

  useEffect(() => {
    setPhase('show');
    const id = window.setTimeout(() => setPhase('hide'), 1050);
    return () => window.clearTimeout(id);
  }, [cells]);

  useEffect(() => {
    if (lives > 0 || submitted) return;
    setSubmitted(true);
    const finalLevel = Math.min(level - 1, MAX_LEVEL);
    onComplete({
      score: finalLevel,
      unit: 'level',
      metadata: {
        finalLevel,
        strikes,
      },
      label: `Level ${finalLevel}`,
    });
  }, [lives, level, strikes, onComplete, submitted]);

  const label = useMemo(() => {
    if (phase === 'show') return 'Memorize the numbers';
    return `Click numbers in order: ${nextExpected} → ${Math.min(level, MAX_LEVEL)}`;
  }, [phase, nextExpected, level]);

  const handleCellClick = (cell: Cell) => {
    if (phase !== 'hide') return;
    if (!cell.number) return;

    if (cell.number === nextExpected) {
      const targetForRound = Math.min(level, MAX_LEVEL);
      if (nextExpected === targetForRound) {
        if (level >= MAX_LEVEL) {
          if (!submitted) {
            setSubmitted(true);
            onComplete({
              score: MAX_LEVEL,
              unit: 'level',
              metadata: {
                finalLevel: MAX_LEVEL,
                strikes,
                perfectRun: true,
              },
              label: `Level ${MAX_LEVEL}`,
            });
          }
          return;
        }

        const nextLevel = level + 1;
        setLevel(nextLevel);
        setCells(makeLevel(nextLevel));
        setNextExpected(1);
        return;
      }
      setNextExpected((prev) => prev + 1);
      return;
    }

    const nextStrikes = strikes + 1;
    setStrikes(nextStrikes);
    if (nextStrikes < maxLives) {
      setCells(makeLevel(level));
      setNextExpected(1);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>Level {Math.min(level, MAX_LEVEL)}</strong>
        <LivesDisplay lives={lives} maxLives={maxLives} />
      </div>

      <p style={{ margin: 0, color: 'var(--text-muted)' }}>{label}</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          gap: '0.55rem',
          maxWidth: '580px',
        }}
      >
        {cells.map((cell) => {
          const showNumber = phase === 'show' || nextExpected > (cell.number ?? 999);
          return (
            <button
              key={cell.id}
              type="button"
              onClick={() => handleCellClick(cell)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: showNumber ? 'var(--accent-subtle)' : 'var(--tile-default)',
                color: showNumber ? 'var(--tile-text)' : 'transparent',
                fontFamily: 'var(--font-mono)',
                fontSize: '1.2rem',
                cursor: phase === 'hide' ? 'pointer' : 'default',
              }}
            >
              {cell.number ?? ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
