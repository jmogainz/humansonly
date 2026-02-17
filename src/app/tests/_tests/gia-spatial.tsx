'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle, generateRecentUnique } from '@/lib/utils';
import ScoreDisplay from '@/components/ScoreDisplay';
import Timer from '@/components/Timer';
import { useTimer } from '@/hooks/useTimer';
import TestStartScreen from '@/components/TestStartScreen';

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
  signature: string;
};

function letterInstance(char: string, mirrored?: boolean): LetterInstance {
  return {
    char,
    rotation: randomInt(0, 3),
    mirrored: mirrored ?? Math.random() > 0.5,
  };
}

function makeRoundRaw(): Round {
  const letter = LETTERS[randomInt(0, LETTERS.length - 1)];
  const numSame = randomInt(0, COLUMN_COUNT);
  const columns: Column[] = Array.from({ length: COLUMN_COUNT }, (_, i) => {
    const isSame = i < numSame;
    const mirror = Math.random() > 0.5;
    const top = letterInstance(letter, mirror);
    const bottom = letterInstance(letter, mirror);
    if (!isSame) {
      bottom.mirrored = !top.mirrored;
    }
    return {
      top,
      bottom,
      same: isSame,
    };
  });
  
  const shuffled = shuffle(columns);
  const signature = `${letter}:${shuffled.map(c => `${c.top.rotation}${c.top.mirrored ? 'm' : ''}${c.bottom.rotation}${c.bottom.mirrored ? 'm' : ''}`).join('|')}`;

  return {
    letter,
    columns: shuffled,
    answer: numSame,
    signature,
  };
}

function makeRound(): Round {
  return generateRecentUnique(
    'gia-spatial',
    10,
    makeRoundRaw,
    (r) => r.signature
  );
}

function LetterView({ value }: { value: LetterInstance }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(1.2rem, 8cqh, 2rem)',
        transform: `rotate(${value.rotation * 90}deg) scaleX(${value.mirrored ? -1 : 1})`,
      }}
    >
      {value.char}
    </span>
  );
}

export default function GiaSpatialTest({ definition, onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeRound());
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [netStatus, setNetStatus] = useState<'success' | 'danger' | 'neutral'>('neutral');
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
          description="Determine how many boxes contain the same letter (rotated is OK, mirrored is not). You have 2 minutes."
          onStart={handleStart}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.2rem', width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.1rem, 5vw, 1.6rem)' }}>How many boxes have the same letter?</h2>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Rotated letters are OK, mirrored are not.
            </p>
          </div>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${COLUMN_COUNT}, minmax(0, 1fr))`, 
              gap: 'clamp(0.5rem, 2vw, 1rem)',
              width: '100%',
              maxWidth: '520px'
            }}
          >
            {round.columns.map((column, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  display: 'grid',
                  placeItems: 'center',
                  gap: 'clamp(0.8rem, 4vh, 1.5rem)',
                  padding: 'clamp(0.8rem, 4vw, 1.5rem) 0',
                  background: 'var(--surface-raised)',
                }}
              >
                <LetterView value={column.top} />
                <LetterView value={column.bottom} />
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLUMN_COUNT + 1}, minmax(0, 1fr))`, gap: '0.6rem', maxWidth: '360px', width: '100%' }}>
            {Array.from({ length: COLUMN_COUNT + 1 }, (_, value) => (
              <button key={value} type="button" className="button" onClick={() => answer(value)}>
                {value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
