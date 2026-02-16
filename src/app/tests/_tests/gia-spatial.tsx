'use client';

import { useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle } from '@/lib/utils';
import ScoreDisplay from '@/components/ScoreDisplay';
import Timer from '@/components/Timer';
import { useTimer } from '@/hooks/useTimer';

const LETTERS = ['F', 'G', 'J', 'L', 'N', 'P', 'Q', 'R', 'S', 'Z'];

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
  const sameCount = randomInt(0, 2);
  const columns: Column[] = [];

  for (let i = 0; i < 2; i += 1) {
    const char = LETTERS[randomInt(0, LETTERS.length - 1)];
    const shouldMatch = i < sameCount;

    if (shouldMatch) {
      const mirror = Math.random() > 0.5;
      columns.push({
        top: letterInstance(char, mirror),
        bottom: letterInstance(char, mirror),
        same: true,
      });
    } else {
      const mirror = Math.random() > 0.5;
      columns.push({
        top: letterInstance(char, mirror),
        bottom: letterInstance(char, !mirror),
        same: false,
      });
    }
  }

  return {
    columns: shuffle(columns),
    answer: sameCount,
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

  const score = useMemo(() => correct - incorrect * 0.5, [correct, incorrect]);

  const timer = useTimer({
    mode: 'down',
    durationMs: 120_000,
    autoStart: true,
    onExpire: () => {
      if (finished) return;
      setFinished(true);
      onComplete({
        score,
        unit: 'net',
        metadata: {
          correct,
          incorrect,
          penalty: 0.5,
        },
        label: `Net ${score.toFixed(2)}`,
      });
    },
  });

  const answer = (value: number) => {
    if (finished) return;
    if (value === round.answer) {
      setCorrect((prev) => prev + 1);
    } else {
      setIncorrect((prev) => prev + 1);
    }
    setRound(makeRound());
  };

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
        Rotations count as same. Mirrored letters do not.
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
