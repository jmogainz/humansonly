'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle } from '@/lib/utils';
import ScoreDisplay from '@/components/ScoreDisplay';
import Timer from '@/components/Timer';
import { useTimer } from '@/hooks/useTimer';

const LETTERS = ['F', 'G', 'J', 'L', 'N', 'P', 'Q', 'R', 'S', 'Z'];
const COLUMN_COUNT = 2;

type LetterInstance = {
  char: string;
  rotation: number;
  mirrored: boolean;
};

type Column = {
  top: LetterInstance;
  bottom: LetterInstance;
  same: boolean;
};

type Round = {
  letter: string;
  columns: Column[];
  answer: number;
};

function letterInstance(char: string, mirrored?: boolean): LetterInstance {
  return {
    char,
    rotation: randomInt(0, 3),
    mirrored: mirrored ?? Math.random() > 0.5,
  };
}

function makeRound(): Round {
  const letter = LETTERS[randomInt(0, LETTERS.length - 1)];
  const numOneMirrored = randomInt(0, COLUMN_COUNT);
  const columns: Column[] = Array.from({ length: COLUMN_COUNT }, (_, i) => {
    const isOneMirrored = i < numOneMirrored;
    const mirror = Math.random() > 0.5;
    const top = letterInstance(letter, mirror);
    const bottom = letterInstance(letter, mirror);
    if (isOneMirrored) {
      bottom.mirrored = !top.mirrored;
    }
    return {
      top,
      bottom,
      same: !isOneMirrored,
    };
  });
  return {
    letter,
    columns: shuffle(columns),
    answer: COLUMN_COUNT - numOneMirrored,
  };
}

function LetterView({ value }: { value: LetterInstance }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-mono)',
        fontSize: '2rem',
        transform: `rotate(${value.rotation * 90}deg) scaleX(${value.mirrored ? -1 : 1})`,
      }}
    >
      {value.char}
    </span>
  );
}

export default function GiaSpatialTest({ onComplete }: TestGameProps) {
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
            Determine how many boxes contain the same letter (rotated is OK, mirrored is not). You have 2 minutes.
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

      <h2 style={{ margin: 0 }}>How many boxes have the same letter?</h2>
      <p style={{ margin: 0, color: 'var(--text-muted)' }}>
        Rotated letters are considered the same, while mirrored letters are not.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.8rem' }}>
        {round.columns.map((column, index) => (
          <div
            key={index}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '12px',
              minHeight: '170px',
              display: 'grid',
              placeItems: 'center',
              gap: '1.3rem',
              padding: '1rem 0.4rem',
              background: 'var(--surface-raised)',
            }}
          >
            <LetterView value={column.top} />
            <LetterView value={column.bottom} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.6rem' }}>
        {[0, 1, 2].map((value) => (
          <button key={value} type="button" className="button" onClick={() => answer(value)}>
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
