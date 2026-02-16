'use client';

import { useMemo, useState } from 'react';
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

  const answer = (word: string) => {
    if (finished) return;
    if (word === round.answer) {
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

      <h2 style={{ margin: 0 }}>Which word does not belong?</h2>

      <div style={{ display: 'grid', gap: '0.6rem' }}>
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
