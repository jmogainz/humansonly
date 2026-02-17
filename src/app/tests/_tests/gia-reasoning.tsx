'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { generateRecentUnique, randomInt, shuffle } from '@/lib/utils';
import Timer from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import { useTimer } from '@/hooks/useTimer';

const NAMES = [
  'Alex', 'Noah', 'Maya', 'Leah', 'Jamal', 'Priya', 'Owen', 'Ava', 'Dylan', 'Sofia',
  'Ethan', 'Lena', 'Mateo', 'Iris', 'Jonah', 'Nina', 'Leo', 'Nora', 'Milo', 'Ruby',
  'Zane', 'Aria', 'Kian', 'Sara', 'Ravi', 'Elena', 'Kai', 'Jade', 'Aiden', 'Mina',
  'Yara', 'Hugo', 'Layla', 'Isaac', 'Tara', 'Zoya', 'Rohan', 'Liam', 'Cleo', 'Eli',
];

type Trait = {
  base: string;
  higher: string;
  lower: string;
};

const TRAITS: Trait[] = [
  { base: 'strong', higher: 'stronger', lower: 'weaker' },
  { base: 'fast', higher: 'faster', lower: 'slower' },
  { base: 'tall', higher: 'taller', lower: 'shorter' },
  { base: 'calm', higher: 'calmer', lower: 'more anxious' },
  { base: 'focused', higher: 'more focused', lower: 'more distracted' },
  { base: 'patient', higher: 'more patient', lower: 'more impatient' },
  { base: 'organized', higher: 'more organized', lower: 'less organized' },
  { base: 'creative', higher: 'more creative', lower: 'less creative' },
  { base: 'careful', higher: 'more careful', lower: 'less careful' },
  { base: 'friendly', higher: 'friendlier', lower: 'less friendly' },
  { base: 'confident', higher: 'more confident', lower: 'less confident' },
  { base: 'logical', higher: 'more logical', lower: 'less logical' },
];

type Round = {
  statements: [string, string];
  question: string;
  answer: string;
  options: [string, string];
};

const RECENT_KEY = 'gia-reasoning';
const RECENT_WINDOW = 4000;

function uniqueNames(count: number): string[] {
  return shuffle([...NAMES]).slice(0, count);
}

function relationStatement(
  higher: string,
  lower: string,
  trait: Trait
): string {
  switch (randomInt(0, 2)) {
    case 0:
      return `${higher} is ${trait.higher} than ${lower}.`;
    case 1:
      return `${lower} is ${trait.lower} than ${higher}.`;
    default:
      return `${lower} is not as ${trait.base} as ${higher}.`;
  }
}

function makeRound(): Round {
  const [highest, middle, lowest] = uniqueNames(3);
  const rank = new Map<string, number>([
    [highest, 0],
    [middle, 1],
    [lowest, 2],
  ]);

  const trait = TRAITS[randomInt(0, TRAITS.length - 1)];
  const statements: [string, string] = [
    relationStatement(highest, middle, trait),
    relationStatement(middle, lowest, trait),
  ];

  const pair = Math.random() < 0.65
    ? [highest, lowest]
    : (Math.random() < 0.5 ? [highest, middle] : [middle, lowest]);

  const askHigher = Math.random() < 0.5;
  const [left, right] = pair;
  const leftRank = rank.get(left) ?? 0;
  const rightRank = rank.get(right) ?? 0;
  const answer = askHigher
    ? (leftRank < rightRank ? left : right)
    : (leftRank > rightRank ? left : right);

  const question = askHigher
    ? `Who is ${trait.higher}, ${left} or ${right}?`
    : `Who is ${trait.lower}, ${left} or ${right}?`;

  const options = (Math.random() > 0.5 ? [left, right] : [right, left]) as [string, string];

  return {
    statements,
    question,
    answer,
    options,
  };
}

function roundSignature(round: Round): string {
  return [
    round.statements[0],
    round.statements[1],
    round.question,
    round.options[0],
    round.options[1],
    round.answer,
  ].join('|');
}

function makeUniqueRound(): Round {
  return generateRecentUnique(RECENT_KEY, RECENT_WINDOW, makeRound, roundSignature);
}

export default function GiaReasoningTest({ onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeUniqueRound());
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const submittedRef = useRef(false);
  const statsRef = useRef({ correct: 0, incorrect: 0 });

  const score = useMemo(() => correct - incorrect, [correct, incorrect]);

  const complete = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setFinished(true);
    const finalCorrect = statsRef.current.correct;
    const finalIncorrect = statsRef.current.incorrect;
    const finalScore = finalCorrect - finalIncorrect;
    onComplete({
      score: finalScore,
      unit: 'net',
      metadata: {
        correct: finalCorrect,
        incorrect: finalIncorrect,
        penalty: 1,
      },
      label: `Net ${finalScore}`,
    });
  }, [onComplete]);

  const timer = useTimer({
    mode: 'down',
    durationMs: 120_000,
    autoStart: true,
    onExpire: complete,
  });

  const answer = (picked: string) => {
    if (finished || submittedRef.current) return;
    if (picked === round.answer) {
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
        <ScoreDisplay label="Net" value={score} />
      </div>

      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.2rem',
          display: 'grid',
          gap: '0.8rem',
        }}
      >
        <small style={{ color: 'var(--text-muted)' }}>Statements</small>
        <p style={{ margin: 0, color: 'var(--text-primary)' }}>{round.statements[0]}</p>
        <p style={{ margin: 0, color: 'var(--text-primary)' }}>{round.statements[1]}</p>
        <small style={{ color: 'var(--text-muted)' }}>Question</small>
        <h2 style={{ margin: 0 }}>{round.question}</h2>
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          {round.options.map((name) => (
            <button key={name} type="button" className="button" onClick={() => answer(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
