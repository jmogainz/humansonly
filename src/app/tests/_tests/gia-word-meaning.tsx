'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle } from '@/lib/utils';
import Timer from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import { useTimer } from '@/hooks/useTimer';

const WORD_GROUPS: string[][] = [
  ['hammer', 'wrench', 'pliers', 'saw', 'drill'],
  ['lion', 'tiger', 'panther', 'jaguar', 'leopard'],
  ['violin', 'cello', 'viola', 'harp', 'bass'],
  ['winter', 'spring', 'summer', 'autumn', 'monsoon'],
  ['swift', 'rapid', 'quick', 'fast', 'speedy'],
  ['calm', 'quiet', 'peaceful', 'serene', 'still'],
  ['joyful', 'happy', 'cheerful', 'glad', 'elated'],
  ['bitter', 'sour', 'tart', 'acidic', 'sharp'],
  ['oval', 'circle', 'ellipse', 'round', 'orb'],
  ['ship', 'boat', 'ferry', 'yacht', 'canoe'],
  ['ruby', 'sapphire', 'emerald', 'opal', 'topaz'],
  ['sprint', 'jog', 'dash', 'race', 'run'],
  ['speak', 'talk', 'chat', 'converse', 'discuss'],
  ['novel', 'poem', 'essay', 'story', 'drama'],
  ['frost', 'ice', 'snow', 'sleet', 'hail'],
  ['doctor', 'nurse', 'surgeon', 'therapist', 'medic'],
  ['triangle', 'square', 'rectangle', 'polygon', 'rhombus'],
  ['apple', 'orange', 'banana', 'pear', 'grape'],
  ['sandal', 'boot', 'sneaker', 'loafer', 'heel'],
  ['desk', 'chair', 'sofa', 'table', 'stool'],
];

type Round = {
  options: string[];
  answer: string;
};

function makeRound(): Round {
  const firstIndex = randomInt(0, WORD_GROUPS.length - 1);
  let secondIndex = randomInt(0, WORD_GROUPS.length - 1);
  while (secondIndex === firstIndex) {
    secondIndex = randomInt(0, WORD_GROUPS.length - 1);
  }

  const groupA = shuffle([...WORD_GROUPS[firstIndex]]);
  const groupB = shuffle([...WORD_GROUPS[secondIndex]]);
  const pair = groupA.slice(0, 2);
  const odd = groupB[0];
  return {
    options: shuffle([...pair, odd]),
    answer: odd,
  };
}

export default function GiaWordMeaningTest({ onComplete }: TestGameProps) {
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

  const answer = (word: string) => {
    if (finished || submittedRef.current) return;
    if (word === round.answer) {
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
            Find the word that doesn&apos;t belong with the others. You have 2 minutes.
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

      <h2 style={{ margin: 0 }}>Which word doesn&apos;t belong?</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.6rem' }}>
        {round.options.map((word) => (
          <button
            key={word}
            type="button"
            className="button"
            onClick={() => answer(word)}
            style={{ textTransform: 'capitalize', minHeight: '3.1rem' }}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
