'use client';

import { useMemo, useState } from 'react';
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
  const middle = randomInt(10, 80);
  const lower = randomInt(1, middle - 2);
  const diff = middle - lower;
  const shake = randomInt(1, Math.max(1, diff - 1));
  const higherFurther = Math.random() > 0.5;
  const higher = higherFurther ? middle + diff + shake : middle + diff - shake;
  const answer = higherFurther ? higher : lower;

  return {
    options: shuffle([lower, middle, higher]),
    answer,
  };
}

export default function GiaNumberSpeedTest({ onComplete }: TestGameProps) {
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

      <h2 style={{ margin: 0 }}>Which number is furthest from the middle value?</h2>

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
