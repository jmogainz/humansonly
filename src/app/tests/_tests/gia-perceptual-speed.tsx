'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle, generateRecentUnique } from '@/lib/utils';
import Timer from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import { useTimer } from '@/hooks/useTimer';
import TestStartScreen from '@/components/TestStartScreen';

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
  signature: string;
};

function pickUniqueLetters(count: number): string[] {
  return shuffle([...LETTERS]).slice(0, count);
}

function makeRoundRaw(): Round {
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

  const shuffled = shuffle(columns);
  const signature = shuffled.map(c => `${c.top}${c.bottom}`).join('|');

  return {
    columns: shuffled,
    answer: numSame,
    signature,
  };
}

function makeRound(): Round {
  return generateRecentUnique(
    'gia-perceptual-speed',
    10,
    makeRoundRaw,
    (r) => r.signature
  );
}

export default function GiaPerceptualSpeedTest({ definition, onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeRound());
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [netStatus, setNetStatus] = useState<'success' | 'danger' | 'neutral'>('neutral');
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
      setNetStatus('success');
    } else {
      statsRef.current.incorrect += 1;
      setNetStatus('danger');
    }
    setCorrect(statsRef.current.correct);
    setIncorrect(statsRef.current.incorrect);
    setRound(makeRound());
  };

  return (
    <div className="game-container">
      <Timer label="Remaining" milliseconds={timer.remainingMs} progress={1 - timer.progress} />

      <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1.5rem)', flexWrap: 'wrap', flexShrink: 0 }}>
        <ScoreDisplay label="Correct" value={correct} status="success" />
        <ScoreDisplay label="Incorrect" value={incorrect} status="danger" />
        <ScoreDisplay label="Net" value={score.toFixed(2)} status={netStatus} />
      </div>

      {!started ? (
        <TestStartScreen
          description="Count how many columns share the same letter (case-insensitive). You have 2 minutes."
          onStart={handleStart}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(1.1rem, 5vw, 1.6rem)', textAlign: 'center' }}>How many columns have the same letter?</h2>
          
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', 
              gap: 'clamp(0.4rem, 2vw, 0.8rem)',
              width: '100%',
              maxWidth: '600px'
            }}
          >
            {round.columns.map((column, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: 'clamp(0.6rem, 3vw, 1.2rem)',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(1.2rem, 6vw, 2rem)',
                  display: 'grid',
                  gap: '0.4rem',
                  background: 'var(--surface-raised)',
                }}
              >
                <span>{column.top}</span>
                <span>{column.bottom}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 'clamp(0.4rem, 1.5vw, 0.6rem)', width: '100%', maxWidth: '440px', marginTop: '0.5rem' }}>
            {Array.from({ length: COLUMN_COUNT + 1 }, (_, count) => (
              <button key={count} type="button" className="button" onClick={() => answer(count)}>
                {count}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
