'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle, generateRecentUnique } from '@/lib/utils';
import ScoreDisplay from '@/components/ScoreDisplay';
import Timer from '@/components/Timer';
import { useTimer } from '@/hooks/useTimer';
import TestStartScreen from '@/components/TestStartScreen';

type Round = {
  options: number[];
  answer: number;
  question: string;
  signature: string;
};

function makeRoundRaw(): Round {
  // Increased range from 10-30 to 10-90
  const middle = randomInt(10, 90);
  const lower = randomInt(1, middle - 2);
  const diff = middle - lower;
  const shake = randomInt(1, Math.max(1, diff - 1));
  const isHigherFurther = Math.random() > 0.5;
  const higher = isHigherFurther ? middle + diff + shake : middle + diff - shake;

  const options = [lower, middle, higher];
  
  // Randomly ask for the median or the furthest from median
  const isAskingMedian = Math.random() > 0.5;
  const question = isAskingMedian 
    ? "Which number is the median?" 
    : "Which number is furthest from the median?";
  const answer = isAskingMedian ? middle : (isHigherFurther ? higher : lower);
  
  const signature = `${isAskingMedian ? 'm' : 'f'}:${options.sort((a, b) => a - b).join('|')}`;

  return {
    options: shuffle(options),
    answer,
    question,
    signature,
  };
}

function makeRound(): Round {
  return generateRecentUnique(
    'gia-number-speed',
    15,
    makeRoundRaw,
    (r) => r.signature
  );
}

export default function GiaNumberSpeedTest({ definition, onComplete }: TestGameProps) {
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
          description="Pick the median or the number furthest from it as requested. You have 2 minutes."
          onStart={handleStart}
        />
      ) : (
        <>
          <h2 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.5rem)', flexShrink: 0 }}>{round.question}</h2>

          <div 
            className="game-grid-container"
            style={{ alignItems: 'flex-start' }}
          >
            <div 
              className="game-grid"
              style={{ 
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
                gap: 'clamp(0.4rem, 2cqw, 0.8rem)',
                aspectRatio: 'auto',
                height: 'auto',
                width: '100%',
                maxWidth: '480px'
              }}
            >
              {round.options.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="game-tile"
                  style={{ fontSize: 'clamp(1.2rem, 6cqw, 1.8rem)', padding: '1rem 0' }}
                  onClick={() => answer(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
