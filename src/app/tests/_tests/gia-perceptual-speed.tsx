'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle } from '@/lib/utils';
import Timer from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import { useTimer } from '@/hooks/useTimer';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const COLUMN_COUNT = 4;

type Column = {
  top: string;
  bottom: string;
  same: boolean;
};

type Round = {
  columns: Column[];
  answer: number;
};

function pickUniqueLetters(count: number): string[] {
  return shuffle([...LETTERS]).slice(0, count);
}

function makeRound(): Round {
  const numSame = randomInt(0, COLUMN_COUNT);
  const matchingLetters = pickUniqueLetters(numSame);
  const columns: Column[] = [];

  for (let i = 0; i < numSame; i += 1) {
    const letter = matchingLetters[i];
    columns.push({
      top: letter.toLowerCase(),
      bottom: letter.toUpperCase(),
      same: true,
    });
  }

  while (columns.length < COLUMN_COUNT) {
    const [a, b] = pickUniqueLetters(2);
    columns.push({
      top: a.toLowerCase(),
      bottom: b.toUpperCase(),
      same: false,
    });
  }

  return {
    columns: shuffle(columns),
    answer: numSame,
  };
}

export default function GiaPerceptualSpeedTest({ onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeRound());
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const submittedRef = useRef(false);
  const statsRef = useRef({ correct: 0, incorrect: 0 });

  const score = useMemo(() => correct - incorrect * 0.25, [correct, incorrect]);

  const complete = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setFinished(true);
    const finalCorrect = statsRef.current.correct;
    const finalIncorrect = statsRef.current.incorrect;
    const finalScore = finalCorrect - finalIncorrect * 0.25;
    onComplete({
      score: finalScore,
      unit: 'net',
      metadata: {
        correct: finalCorrect,
        incorrect: finalIncorrect,
        penalty: 0.25,
      },
      label: `Net ${finalScore.toFixed(2)}`,
    });
  }, [onComplete]);

  const timer = useTimer({
    mode: 'down',
    durationMs: 120_000,
    autoStart: false,
    onExpire: complete,
  });

  const handleStart = () => {
    setStarted(true);
    timer.start();
  };

  const answer = (value: number) => {
    if (finished || submittedRef.current) return;
    if (value === round.answer) {
      statsRef.current.correct += 1;
    } else {
      statsRef.current.incorrect += 1;
    }
    setCorrect(statsRef.current.correct);
    setIncorrect(statsRef.current.incorrect);
    setRound(makeRound());
  };

  if (!started) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem', placeItems: 'center', minHeight: '300px', textAlign: 'center' }}>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <h2 style={{ margin: 0 }}>Ready?</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Count how many columns share the same letter (case-insensitive). You have 2 minutes.
          </p>
        </div>
        <button type="button" className="button" onClick={handleStart} style={{ minWidth: '160px' }}>
          Start Test
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Timer label="Remaining" milliseconds={timer.remainingMs} progress={1 - timer.progress} />

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <ScoreDisplay label="Correct" value={correct} />
        <ScoreDisplay label="Incorrect" value={incorrect} />
        <ScoreDisplay label="Net" value={score.toFixed(2)} />
      </div>

      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          display: 'grid',
          gap: '0.8rem',
        }}
      >
        <h2 style={{ margin: 0 }}>How many columns have the same letter?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.6rem' }}>
          {round.columns.map((column, index) => (
            <div
              key={index}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '0.9rem',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '1.6rem',
                display: 'grid',
                gap: '0.35rem',
              }}
            >
              <span>{column.top}</span>
              <span>{column.bottom}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.55rem' }}>
        {Array.from({ length: COLUMN_COUNT + 1 }, (_, count) => (
          <button key={count} type="button" className="button" onClick={() => answer(count)}>
            {count}
          </button>
        ))}
      </div>
    </div>
  );
}
