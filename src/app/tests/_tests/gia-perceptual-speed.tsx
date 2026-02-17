'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { generateRecentUnique, randomInt, shuffle } from '@/lib/utils';
import Timer from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import { useTimer } from '@/hooks/useTimer';

const LETTERS = 'abcdefghjkmnprstuvwxyz'.split('');
const COLUMN_COUNT = 6;

type Column = {
  top: string;
  bottom: string;
  same: boolean;
};

type Round = {
  columns: Column[];
  answer: number;
};

const RECENT_KEY = 'gia-perceptual-speed';
const RECENT_WINDOW = 5000;

function pickUniqueLetters(count: number): string[] {
  return shuffle([...LETTERS]).slice(0, count);
}

function withRandomCase(value: string): string {
  return Math.random() < 0.5 ? value.toLowerCase() : value.toUpperCase();
}

function makeRound(): Round {
  const numSame = randomInt(0, COLUMN_COUNT);
  const matchingLetters = pickUniqueLetters(numSame);
  const columns: Column[] = [];

  for (let i = 0; i < numSame; i += 1) {
    const letter = matchingLetters[i];
    columns.push({
      top: withRandomCase(letter),
      bottom: withRandomCase(letter),
      same: true,
    });
  }

  while (columns.length < COLUMN_COUNT) {
    const [a, b] = pickUniqueLetters(2);
    columns.push({
      top: withRandomCase(a),
      bottom: withRandomCase(b),
      same: false,
    });
  }

  return {
    columns: shuffle(columns),
    answer: numSame,
  };
}

function roundSignature(round: Round): string {
  return `${round.answer}|${round.columns.map((column) => `${column.top}${column.bottom}`).join(',')}`;
}

function makeUniqueRound(): Round {
  return generateRecentUnique(RECENT_KEY, RECENT_WINDOW, makeRound, roundSignature);
}

export default function GiaPerceptualSpeedTest({ onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeUniqueRound());
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [finished, setFinished] = useState(false);
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
    autoStart: true,
    onExpire: complete,
  });

  const answer = (value: number) => {
    if (finished || submittedRef.current) return;
    if (value === round.answer) {
      statsRef.current.correct += 1;
    } else {
      statsRef.current.incorrect += 1;
    }
    setCorrect(statsRef.current.correct);
    setIncorrect(statsRef.current.incorrect);
    setRound(makeUniqueRound());
  };

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '0.5rem' }}>
          {round.columns.map((column, index) => (
            <div
              key={index}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '0.75rem',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '1.3rem',
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.55rem' }}>
        {Array.from({ length: COLUMN_COUNT + 1 }, (_, count) => (
          <button key={count} type="button" className="button" onClick={() => answer(count)}>
            {count}
          </button>
        ))}
      </div>
    </div>
  );
}
