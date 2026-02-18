'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { shuffle, generateSessionUnique } from '@/lib/utils';
import LivesDisplay from '@/components/LivesDisplay';
import Scoreboard from '@/components/Scoreboard';
import ScoreDisplay from '@/components/ScoreDisplay';
import TestStartScreen from '@/components/TestStartScreen';
import { useFeedback } from '@/components/FeedbackContext';

type Cell = {
  id: number;
  number: number | null;
};

const GRID_SIZE = 5;
const MAX_LEVEL = GRID_SIZE * GRID_SIZE;

function makeLevelRaw(level: number): Cell[] {
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

function levelSignature(cells: Cell[]): string {
  return cells.map((cell) => (cell.number === null ? '_' : String(cell.number))).join('|');
}

function makeLevel(level: number, seenSignatures: Set<string>): Cell[] {
  return generateSessionUnique(
    seenSignatures,
    () => makeLevelRaw(level),
    levelSignature
  );
}

export default function ChimpTest({ definition, onComplete }: TestGameProps) {
  const seenLevelSignaturesRef = useRef<Set<string>>(new Set());
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(4);
  const [strikes, setStrikes] = useState(0);
  const [cells, setCells] = useState<Cell[]>(() => makeLevel(4, seenLevelSignaturesRef.current));
  const [phase, setPhase] = useState<'show' | 'hide'>('show');
  const [nextExpected, setNextExpected] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const { triggerFeedback } = useFeedback();

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
      triggerFeedback('success');
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
        setCells(makeLevel(nextLevel, seenLevelSignaturesRef.current));
        setNextExpected(1);
        return;
      }
      setNextExpected((prev) => prev + 1);
      return;
    }

    const nextStrikes = strikes + 1;
    setStrikes(nextStrikes);
    if (nextStrikes < maxLives) {
      setCells(makeLevel(level, seenLevelSignaturesRef.current));
      setNextExpected(1);
    }
  };

  return (
    <div className="game-container">
      <Scoreboard>
        <ScoreDisplay label="Level" value={Math.min(level, MAX_LEVEL)} />
        <LivesDisplay lives={lives} maxLives={maxLives} />
      </Scoreboard>

      <div className="game-content">
        {!started ? (
          <TestStartScreen
            description={definition.description}
            onStart={() => setStarted(true)}
          />
        ) : (
          <>
            <p style={{ margin: 0, color: 'var(--text-muted)', textAlign: 'center', fontSize: '1rem' }}>{label}</p>

            <div className="game-grid-container">
              <div
                className="game-grid"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                  gap: 'clamp(0.2rem, 1.5cqw, 0.6rem)',
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
                        fontSize: 'clamp(0.9rem, 4cqw, 1.4rem)',
                        fontWeight: 600
                      }}
                    >
                      {cell.number ?? ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
