'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { shuffle } from '@/lib/utils';
import LivesDisplay from '@/components/LivesDisplay';
import TestStartScreen from '@/components/TestStartScreen';

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

export default function ChimpTest({ definition, onComplete }: TestGameProps) {
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(4);
  const [strikes, setStrikes] = useState(0);
  const [cells, setCells] = useState<Cell[]>(() => makeLevel(4));
  const [phase, setPhase] = useState<'show' | 'hide'>('show');
  const [nextExpected, setNextExpected] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const maxLives = 3;
  const lives = maxLives - strikes;

  useEffect(() => {
    if (!started) return;
    setPhase('show');
    const id = window.setTimeout(() => setPhase('hide'), 1050);
    return () => window.clearTimeout(id);
  }, [cells, started]);

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

  if (!started) {
    return (
      <TestStartScreen
        description={definition.description}
        onStart={() => setStarted(true)}
      />
    );
  }

  return (
    <div className="game-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>Level {Math.min(level, MAX_LEVEL)}</strong>
        <LivesDisplay lives={lives} maxLives={maxLives} />
      </div>

      <p style={{ margin: 0, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</p>

      <div className="game-grid-container">
        <div
          className="game-grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gap: 'clamp(0.2rem, 1.5cqw, 0.55rem)',
          }}
        >
          {cells.map((cell) => {
            const showNumber = phase === 'show' || nextExpected > (cell.number ?? 999);
            return (
              <button
                key={cell.id}
                type="button"
                className="game-tile"
                onClick={() => handleCellClick(cell)}
                style={{
                  background: showNumber ? 'var(--accent-subtle)' : 'var(--tile-default)',
                  color: showNumber ? 'var(--tile-text)' : 'transparent',
                  cursor: phase === 'hide' ? 'pointer' : 'default',
                  fontSize: 'clamp(0.8rem, 4cqw, 1.2rem)',
                }}
              >
                {cell.number ?? ''}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
