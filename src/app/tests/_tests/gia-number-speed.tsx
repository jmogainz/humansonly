'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle } from '@/lib/utils';
import ScoreDisplay from '@/components/ScoreDisplay';
import Timer from '@/components/Timer';
import { useTimer } from '@/hooks/useTimer';

type Round = {
  options: number[];
  answer: number;
};

function makeRound(): Round {
  const middle = randomInt(10, 30);
  const lower = randomInt(1, middle - 2);
  const diff = middle - lower;
  const shake = randomInt(1, diff - 1);
  const isHigherFurther = Math.random() > 0.5;
  const higher = isHigherFurther ? middle + diff + shake : middle + diff - shake;

  return {
    options: shuffle([lower, middle, higher]),
    answer: isHigherFurther ? higher : lower,
  };
}

export default function GiaNumberSpeedTest({ onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeRound());
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
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
            Pick the number furthest from the median. You have 2 minutes.
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

      <h2 style={{ margin: 0 }}>Which number is furthest from the median?</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.6rem' }}>
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
