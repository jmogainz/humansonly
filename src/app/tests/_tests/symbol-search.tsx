'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle } from '@/lib/utils';
import ScoreDisplay from '@/components/ScoreDisplay';
import Timer from '@/components/Timer';
import { useTimer } from '@/hooks/useTimer';

const SYMBOLS = ['★', '◆', '●', '▲', '☀', '☂', '♠', '♣', '♥', '☕', '✿', '✚', '☾', '♫', '☁'];

type Round = {
  target: string;
  row: string[];
  answer: boolean;
};

function makeRound(): Round {
  const target = SYMBOLS[randomInt(0, SYMBOLS.length - 1)];
  const include = Math.random() >= 0.5;
  const row = shuffle(Array.from({ length: 8 }, () => SYMBOLS[randomInt(0, SYMBOLS.length - 1)]));
  if (include) {
    row[randomInt(0, row.length - 1)] = target;
  } else {
    for (let i = 0; i < row.length; i += 1) {
      if (row[i] === target) {
        row[i] = SYMBOLS[(SYMBOLS.indexOf(target) + 1) % SYMBOLS.length];
      }
    }
  }
  return { target, row, answer: include };
}

export default function SymbolSearchTest({ onComplete }: TestGameProps) {
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [round, setRound] = useState<Round>(() => makeRound());
  const [finished, setFinished] = useState(false);
  const submittedRef = useRef(false);
  const statsRef = useRef({ score: 0, attempts: 0 });

  const complete = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setFinished(true);
    const finalScore = statsRef.current.score;
    const finalAttempts = statsRef.current.attempts;
    onComplete({
      score: finalScore,
      unit: 'correct/90s',
      metadata: {
        attempts: finalAttempts,
        accuracy: finalAttempts ? finalScore / finalAttempts : 0,
      },
      label: `${finalScore} correct`,
    });
  }, [onComplete]);

  const timer = useTimer({
    mode: 'down',
    durationMs: 90_000,
    autoStart: true,
    onExpire: complete,
  });

  useEffect(() => {
    if (!timer.running && !finished && timer.remainingMs === 0) {
      complete();
    }
  }, [timer.running, timer.remainingMs, finished, complete]);

  const accuracy = useMemo(() => {
    if (!attempts) return 100;
    return (score / attempts) * 100;
  }, [score, attempts]);

  const answer = (value: boolean) => {
    if (finished || submittedRef.current) return;
    const nextAttempts = statsRef.current.attempts + 1;
    let nextScore = statsRef.current.score;
    statsRef.current.attempts = nextAttempts;
    if (value === round.answer) {
      nextScore += 1;
      statsRef.current.score = nextScore;
    }
    setAttempts(nextAttempts);
    setScore(nextScore);
    setRound(makeRound());
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Timer label="Remaining" milliseconds={timer.remainingMs} progress={1 - timer.progress} />

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <ScoreDisplay label="Correct" value={score} />
        <ScoreDisplay label="Attempts" value={attempts} />
        <ScoreDisplay label="Accuracy" value={`${accuracy.toFixed(1)}%`} />
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
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Does the target appear in the row?</p>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '2.4rem' }}>{round.target}</h2>
        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
          {round.row.map((symbol, index) => (
            <span
              key={`${symbol}-${index}`}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '10px',
                width: '2.5rem',
                height: '2.5rem',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.2rem',
              }}
            >
              {symbol}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.7rem' }}>
        <button className="button" type="button" onClick={() => answer(true)}>YES</button>
        <button className="button buttonGhost" type="button" onClick={() => answer(false)}>NO</button>
      </div>
    </div>
  );
}
