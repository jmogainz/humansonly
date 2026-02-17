'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { generateRecentUnique, randomInt, shuffle } from '@/lib/utils';
import ScoreDisplay from '@/components/ScoreDisplay';
import Timer from '@/components/Timer';
import { useTimer } from '@/hooks/useTimer';

type Round = {
  anchor: number;
  options: number[];
  answer: number;
};

const RECENT_KEY = 'gia-number-speed';
const RECENT_WINDOW = 5000;

function uniqueOptions(values: number[]): number[] {
  return [...new Set(values)];
}

function makeRound(): Round {
  const anchor = randomInt(20, 180);
  const far = randomInt(10, 36);
  const second = Math.max(3, far - randomInt(3, 7));
  const third = Math.max(2, second - randomInt(1, 5));
  const fourth = Math.max(1, third - randomInt(1, 4));
  const distances = [far, second, third, fourth];

  const signs = shuffle([1, -1, Math.random() > 0.5 ? 1 : -1, Math.random() > 0.5 ? 1 : -1]);
  let values = distances.map((distance, index) => anchor + distance * signs[index]);
  if (uniqueOptions(values).length < 4) {
    values = [
      anchor + far,
      anchor - second,
      anchor + third,
      anchor - fourth,
    ];
  }

  const answer = values[0];

  return {
    anchor,
    options: shuffle(values),
    answer,
  };
}

function roundSignature(round: Round): string {
  return `${round.anchor}|${round.answer}|${round.options.join(',')}`;
}

function makeUniqueRound(): Round {
  return generateRecentUnique(RECENT_KEY, RECENT_WINDOW, makeRound, roundSignature);
}

export default function GiaNumberSpeedTest({ onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeUniqueRound());
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const submittedRef = useRef(false);
  const statsRef = useRef({ correct: 0, incorrect: 0 });

  const score = useMemo(() => correct - incorrect * 0.5, [correct, incorrect]);

  const complete = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setFinished(true);
    const finalCorrect = statsRef.current.correct;
    const finalIncorrect = statsRef.current.incorrect;
    const finalScore = finalCorrect - finalIncorrect * 0.5;
    onComplete({
      score: finalScore,
      unit: 'net',
      metadata: {
        correct: finalCorrect,
        incorrect: finalIncorrect,
        penalty: 0.5,
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

      <h2 style={{ margin: 0 }}>Which option is furthest from the middle value?</h2>

      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '0.8rem',
          background: 'var(--surface-raised)',
          fontFamily: 'var(--font-mono)',
          fontSize: '1.3rem',
          textAlign: 'center',
        }}
      >
        Middle value: <strong>{round.anchor}</strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.6rem' }}>
        {round.options.map((value) => (
          <button
            key={value}
            type="button"
            className="button"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', minHeight: '3.2rem' }}
            onClick={() => answer(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
