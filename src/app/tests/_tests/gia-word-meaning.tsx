'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { generateRecentUnique, randomInt, shuffle } from '@/lib/utils';
import Timer from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import { useTimer } from '@/hooks/useTimer';

type WordGroup = {
  family: string;
  words: string[];
};

const WORD_GROUPS: WordGroup[] = [
  { family: 'tools', words: ['hammer', 'wrench', 'pliers', 'saw', 'drill'] },
  { family: 'tools', words: ['anvil', 'chisel', 'mallet', 'lathe', 'vise'] },
  { family: 'animals', words: ['lion', 'tiger', 'panther', 'jaguar', 'leopard'] },
  { family: 'animals', words: ['wolf', 'fox', 'lynx', 'otter', 'badger'] },
  { family: 'music', words: ['violin', 'cello', 'viola', 'harp', 'bass'] },
  { family: 'music', words: ['flute', 'trumpet', 'clarinet', 'oboe', 'trombone'] },
  { family: 'weather', words: ['winter', 'spring', 'summer', 'autumn', 'monsoon'] },
  { family: 'weather', words: ['rain', 'storm', 'drizzle', 'mist', 'fog'] },
  { family: 'speed', words: ['swift', 'rapid', 'quick', 'fast', 'speedy'] },
  { family: 'speed', words: ['hasty', 'brisk', 'fleet', 'snappy', 'nimble'] },
  { family: 'calm', words: ['calm', 'quiet', 'peaceful', 'serene', 'still'] },
  { family: 'calm', words: ['restful', 'gentle', 'soft', 'placid', 'steady'] },
  { family: 'joy', words: ['joyful', 'happy', 'cheerful', 'glad', 'elated'] },
  { family: 'joy', words: ['merry', 'jolly', 'upbeat', 'sunny', 'lively'] },
  { family: 'taste', words: ['bitter', 'sour', 'tart', 'acidic', 'sharp'] },
  { family: 'taste', words: ['salty', 'savory', 'spicy', 'smoky', 'rich'] },
  { family: 'shapes', words: ['oval', 'circle', 'ellipse', 'round', 'orb'] },
  { family: 'shapes', words: ['triangle', 'square', 'rectangle', 'polygon', 'rhombus'] },
  { family: 'boats', words: ['ship', 'boat', 'ferry', 'yacht', 'canoe'] },
  { family: 'boats', words: ['barge', 'skiff', 'dinghy', 'trawler', 'sloop'] },
  { family: 'gems', words: ['ruby', 'sapphire', 'emerald', 'opal', 'topaz'] },
  { family: 'gems', words: ['garnet', 'diamond', 'amber', 'jade', 'onyx'] },
  { family: 'motion', words: ['sprint', 'jog', 'dash', 'race', 'run'] },
  { family: 'motion', words: ['stride', 'walk', 'march', 'hurry', 'glide'] },
  { family: 'speech', words: ['speak', 'talk', 'chat', 'converse', 'discuss'] },
  { family: 'speech', words: ['argue', 'explain', 'describe', 'announce', 'narrate'] },
  { family: 'writing', words: ['novel', 'poem', 'essay', 'story', 'drama'] },
  { family: 'writing', words: ['memoir', 'article', 'script', 'fable', 'prose'] },
  { family: 'medical', words: ['doctor', 'nurse', 'surgeon', 'therapist', 'medic'] },
  { family: 'medical', words: ['clinic', 'ward', 'triage', 'pharmacy', 'diagnosis'] },
  { family: 'fruit', words: ['apple', 'orange', 'banana', 'pear', 'grape'] },
  { family: 'fruit', words: ['mango', 'peach', 'plum', 'kiwi', 'melon'] },
  { family: 'footwear', words: ['sandal', 'boot', 'sneaker', 'loafer', 'heel'] },
  { family: 'footwear', words: ['slipper', 'cleat', 'moccasin', 'wedge', 'oxford'] },
  { family: 'furniture', words: ['desk', 'chair', 'sofa', 'table', 'stool'] },
  { family: 'furniture', words: ['cabinet', 'dresser', 'shelf', 'bench', 'ottoman'] },
];

type Round = {
  mode: 'odd' | 'related';
  prompt: string;
  options: string[];
  answer: string;
};

const RECENT_KEY = 'gia-word-meaning';
const RECENT_WINDOW = 4000;

function familyPool(family: string, excludeIndex: number): string[] {
  return WORD_GROUPS
    .flatMap((group, index) => (index !== excludeIndex && group.family === family ? group.words : []));
}

function pickDistractors(
  sourceIndex: number,
  used: Set<string>,
  count: number,
  preferSameFamily = true
): string[] {
  const sourceFamily = WORD_GROUPS[sourceIndex].family;
  const sameFamily = preferSameFamily
    ? shuffle(familyPool(sourceFamily, sourceIndex)).filter((word) => !used.has(word))
    : [];
  const otherFamilies = shuffle(
    WORD_GROUPS.flatMap((group, index) => (
      index !== sourceIndex && group.family !== sourceFamily ? group.words : []
    ))
  ).filter((word) => !used.has(word));
  const fallback = shuffle(
    WORD_GROUPS.flatMap((group, index) => (index !== sourceIndex ? group.words : []))
  ).filter((word) => !used.has(word));
  const merged = [...sameFamily, ...otherFamilies, ...fallback];
  const picked: string[] = [];

  for (const word of merged) {
    if (picked.length >= count) break;
    if (used.has(word)) continue;
    used.add(word);
    picked.push(word);
  }

  return picked;
}

function makeOddRound(): Round {
  const sourceIndex = randomInt(0, WORD_GROUPS.length - 1);
  const source = shuffle([...WORD_GROUPS[sourceIndex].words]);
  const optionCount = Math.random() < 0.5 ? 4 : 5;
  const relatedCount = optionCount - 1;
  const related = source.slice(0, relatedCount);
  const used = new Set(related);
  const odd = pickDistractors(sourceIndex, used, 1, false)[0];

  return {
    mode: 'odd',
    prompt: 'Which word is least related to the others?',
    options: shuffle([...related, odd]),
    answer: odd,
  };
}

function makeRelatedRound(): Round {
  const sourceIndex = randomInt(0, WORD_GROUPS.length - 1);
  const source = shuffle([...WORD_GROUPS[sourceIndex].words]);
  const cue = source[0];
  const correct = source[1];
  const optionCount = Math.random() < 0.5 ? 4 : 5;
  const distractorCount = optionCount - 1;
  const used = new Set([cue, correct]);
  const distractors = pickDistractors(sourceIndex, used, distractorCount);

  return {
    mode: 'related',
    prompt: `Which word is most related to "${cue}"?`,
    options: shuffle([correct, ...distractors]),
    answer: correct,
  };
}

function makeRound(): Round {
  return Math.random() > 0.5 ? makeOddRound() : makeRelatedRound();
}

function roundSignature(round: Round): string {
  return `${round.mode}|${round.prompt}|${round.answer}|${round.options.join(',')}`;
}

function makeUniqueRound(): Round {
  return generateRecentUnique(RECENT_KEY, RECENT_WINDOW, makeRound, roundSignature);
}

export default function GiaWordMeaningTest({ onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeUniqueRound());
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [finished, setFinished] = useState(false);
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
    autoStart: true,
    onExpire: complete,
  });

  const answer = (word: string) => {
    if (finished || submittedRef.current) return;
    if (word === round.answer) {
      statsRef.current.correct += 1;
    } else {
      statsRef.current.incorrect += 1;
    }
    setCorrect(statsRef.current.correct);
    setIncorrect(statsRef.current.incorrect);
    setRound(makeUniqueRound());
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Timer label="Remaining" milliseconds={timer.remainingMs} progress={1 - timer.progress} />

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <ScoreDisplay label="Correct" value={correct} />
        <ScoreDisplay label="Incorrect" value={incorrect} />
        <ScoreDisplay label="Net" value={score.toFixed(2)} />
      </div>

      <h2 style={{ margin: 0 }}>{round.prompt}</h2>

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
