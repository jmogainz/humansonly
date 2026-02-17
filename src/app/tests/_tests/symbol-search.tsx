'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle } from '@/lib/utils';
import ScoreDisplay from '@/components/ScoreDisplay';
import Timer, { formatTime } from '@/components/Timer';
import Scoreboard from '@/components/Scoreboard';
import { useTimer } from '@/hooks/useTimer';
import TestStartScreen from '@/components/TestStartScreen';

const SYMBOLS = ['★', '◆', '●', '▲', '■', '⬢', '⬧', '✚', '✖', '✜', '✦', '✧', '◓', '◑', '◈'];

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

export default function SymbolSearchTest({ definition, onComplete }: TestGameProps) {
  const [started, setStarted] = useState(false);
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
        correct: finalScore,
        incorrect: finalAttempts - finalScore,
        attempts: finalAttempts,
        accuracy: finalAttempts ? finalScore / finalAttempts : 0,
      },
      label: `${finalScore} correct`,
    });
  }, [onComplete]);

  const timer = useTimer({
    mode: 'down',
    durationMs: 90_000,
    autoStart: false,
    onExpire: complete,
  });

  useEffect(() => {
    if (started && !timer.running && !finished) {
      timer.start();
    }
  }, [started, timer, finished]);

  useEffect(() => {
    if (!timer.running && !finished && timer.remainingMs === 0 && started) {
      complete();
    }
  }, [timer.running, timer.remainingMs, finished, complete, started]);

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

  const incorrect = attempts - score;

  return (
    <div className="game-container">
      <Scoreboard>
        <ScoreDisplay label="Time" value={formatTime(timer.remainingMs)} />
        <ScoreDisplay label="Correct" value={score} status="success" />
        <ScoreDisplay label="Incorrect" value={incorrect} status="danger" />
        <ScoreDisplay label="Accuracy" value={`${accuracy.toFixed(1)}%`} status={accuracy > 80 ? 'success' : accuracy > 50 ? 'neutral' : 'danger'} />
      </Scoreboard>

      <Timer progress={1 - timer.progress} />

      <div className="game-content">
        {!started ? (
          <TestStartScreen
            description={definition.description}
            onStart={() => setStarted(true)}
          />
        ) : (
          <>
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: 'clamp(1rem, 5vw, 2rem)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 'clamp(1rem, 4vh, 2rem)',
                background: 'var(--surface-raised)',
                width: '100%',
                maxWidth: '500px',
                marginInline: 'auto'
              }}
            >
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>Does the target appear in the row?</p>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 'clamp(2rem, 10vw, 3.5rem)', textAlign: 'center' }}>{round.target}</h2>
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 'clamp(0.4rem, 2vw, 0.75rem)', 
                  justifyContent: 'center',
                  width: '100%',
                  maxWidth: '320px',
                  marginInline: 'auto'
                }}
              >
                {round.row.map((symbol, index) => (
                  <span
                    key={`${symbol}-${index}`}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      aspectRatio: '1 / 1',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 'clamp(1.2rem, 6vw, 1.6rem)',
                      background: 'var(--surface)',
                    }}
                  >
                    {symbol}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', maxWidth: '400px', width: '100%', marginInline: 'auto' }}>
              <button className="button" type="button" onClick={() => answer(true)}>YES</button>
              <button className="button buttonGhost" type="button" onClick={() => answer(false)}>NO</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
