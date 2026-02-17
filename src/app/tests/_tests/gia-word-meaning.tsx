'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle, generateRecentUnique } from '@/lib/utils';
import Timer from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import { useTimer } from '@/hooks/useTimer';
import TestStartScreen from '@/components/TestStartScreen';

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
  ['mercury', 'venus', 'mars', 'jupiter', 'saturn'],
  ['bread', 'rice', 'pasta', 'cereal', 'oats'],
  ['shirt', 'pants', 'jacket', 'dress', 'skirt'],
  ['bicycle', 'car', 'bus', 'train', 'truck'],
  ['pencil', 'pen', 'marker', 'crayon', 'chalk'],
  ['cup', 'mug', 'glass', 'bottle', 'flask'],
  ['fork', 'spoon', 'knife', 'spatula', 'whisk'],
  ['bedroom', 'kitchen', 'bathroom', 'hallway', 'cellar'],
  ['mountain', 'valley', 'plateau', 'canyon', 'cliff'],
  ['ocean', 'river', 'lake', 'pond', 'stream'],
  ['eagle', 'hawk', 'falcon', 'owl', 'vulture'],
  ['oak', 'pine', 'maple', 'birch', 'cedar'],
  ['rose', 'tulip', 'daisy', 'lily', 'orchid'],
  ['gold', 'silver', 'copper', 'iron', 'bronze'],
  ['piano', 'guitar', 'drums', 'flute', 'trumpet'],
  ['football', 'tennis', 'hockey', 'golf', 'cricket'],
  ['paris', 'london', 'tokyo', 'berlin', 'madrid'],
  ['math', 'science', 'history', 'physics', 'biology'],
  ['laptop', 'tablet', 'phone', 'desktop', 'monitor'],
  ['red', 'blue', 'green', 'yellow', 'purple'],
];

type Round = {
  options: string[];
  answer: string;
  signature: string;
};

function makeRoundRaw(): Round {
  const firstIndex = randomInt(0, WORD_GROUPS.length - 1);
  let secondIndex = randomInt(0, WORD_GROUPS.length - 1);
  while (secondIndex === firstIndex) {
    secondIndex = randomInt(0, WORD_GROUPS.length - 1);
  }

  const groupA = shuffle([...WORD_GROUPS[firstIndex]]);
  const groupB = shuffle([...WORD_GROUPS[secondIndex]]);
  const pair = groupA.slice(0, 2);
  const odd = groupB[0];
  
  const options = shuffle([...pair, odd]);
  
  return {
    options,
    answer: odd,
    signature: `${pair.sort().join('|')}:${odd}`,
  };
}

function makeRound(): Round {
  return generateRecentUnique(
    'gia-word-meaning',
    15,
    makeRoundRaw,
    (r) => r.signature
  );
}

export default function GiaWordMeaningTest({ definition, onComplete }: TestGameProps) {
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

  const answer = (word: string) => {
    if (finished || submittedRef.current) return;
    if (word === round.answer) {
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
          description="Find the word that doesn&apos;t belong with the others. You have 2 minutes."
          onStart={handleStart}
        />
      ) : (
        <>
          <h2 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.5rem)', flexShrink: 0 }}>Which word doesn&apos;t belong?</h2>

          <div 
            className="game-grid-container"
            style={{ alignItems: 'flex-start' }}
          >
            <div 
              className="game-grid"
              style={{ 
                gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', 
                gap: 'clamp(0.4rem, 2cqw, 0.8rem)',
                aspectRatio: 'auto',
                height: 'auto',
                width: '100%',
                maxWidth: '380px'
              }}
            >
              {round.options.map((word) => (
                <button
                  key={word}
                  type="button"
                  className="game-tile"
                  onClick={() => answer(word)}
                  style={{ 
                    textTransform: 'capitalize', 
                    padding: '1rem',
                    fontSize: 'clamp(1rem, 5cqw, 1.3rem)'
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
