'use client';

import { useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt } from '@/lib/utils';
import Timer from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import { useTimer } from '@/hooks/useTimer';

const NAMES = [
  'Alex', 'Noah', 'Maya', 'Leah', 'Jamal', 'Priya', 'Owen', 'Ava', 'Dylan', 'Sofia',
  'Ethan', 'Lena', 'Mateo', 'Iris', 'Jonah', 'Nina', 'Leo', 'Nora', 'Milo', 'Ruby',
  'Zane', 'Aria', 'Kian', 'Sara', 'Ravi', 'Elena', 'Kai', 'Jade', 'Aiden', 'Mina',
  'Yara', 'Hugo', 'Layla', 'Isaac', 'Tara', 'Zoya', 'Rohan', 'Liam', 'Cleo', 'Eli',
];

const PAIRS = [
  ['stronger', 'weaker'],
  ['faster', 'slower'],
  ['taller', 'shorter'],
  ['braver', 'more fearful'],
  ['calmer', 'more anxious'],
  ['friendlier', 'more hostile'],
  ['smarter', 'less smart'],
  ['more organized', 'more chaotic'],
  ['more patient', 'more impulsive'],
  ['kinder', 'crueler'],
  ['more creative', 'less creative'],
  ['more focused', 'more distracted'],
];

type Round = {
  name1: string;
  name2: string;
  statementPositive: boolean;
  questionPositive: boolean;
  positiveWord: string;
  negativeWord: string;
  answer: string;
  options: [string, string];
};

function makeRound(): Round {
  const name1 = NAMES[randomInt(0, NAMES.length - 1)];
  let name2 = NAMES[randomInt(0, NAMES.length - 1)];
  while (name2 === name1) {
    name2 = NAMES[randomInt(0, NAMES.length - 1)];
  }

  const [positiveWord, negativeWord] = PAIRS[randomInt(0, PAIRS.length - 1)];
  const statementPositive = Math.random() > 0.5;
  const questionPositive = Math.random() > 0.5;

  const answer = statementPositive === questionPositive ? name1 : name2;
  const options = Math.random() > 0.5 ? [name1, name2] : [name2, name1];

  return {
    name1,
    name2,
    statementPositive,
    questionPositive,
    positiveWord,
    negativeWord,
    answer,
    options: [options[0], options[1]],
  };
}

export default function GiaReasoningTest({ onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeRound());
  const [phase, setPhase] = useState<'statement' | 'question'>('statement');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const score = useMemo(() => correct - incorrect, [correct, incorrect]);

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
          penalty: 1,
        },
        label: `Net ${score}`,
      });
    },
  });

  const statement = round.statementPositive
    ? `${round.name1} is ${round.positiveWord} than ${round.name2}.`
    : `${round.name1} is not as ${round.positiveWord} as ${round.name2}.`;

  const question = round.questionPositive
    ? `Who is ${round.positiveWord}?`
    : `Who is ${round.negativeWord}?`;

  const answer = (picked: string) => {
    if (finished) return;
    if (picked === round.answer) {
      setCorrect((prev) => prev + 1);
    } else {
      setIncorrect((prev) => prev + 1);
    }
    setRound(makeRound());
    setPhase('statement');
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
        {phase === 'statement' ? (
          <>
            <small style={{ color: 'var(--text-muted)' }}>Statement</small>
            <h2 style={{ margin: 0 }}>{statement}</h2>
            <button type="button" className="button" onClick={() => setPhase('question')}>
              Show Question
            </button>
          </>
        ) : (
          <>
            <small style={{ color: 'var(--text-muted)' }}>Question</small>
            <h2 style={{ margin: 0 }}>{question}</h2>
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {round.options.map((name) => (
                <button key={name} type="button" className="button" onClick={() => answer(name)}>
                  {name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
