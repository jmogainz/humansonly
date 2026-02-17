'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, generateRecentUnique } from '@/lib/utils';
import Timer from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import { useTimer } from '@/hooks/useTimer';
import TestStartScreen from '@/components/TestStartScreen';

const NAMES = [
  'Alex', 'Noah', 'Maya', 'Leah', 'Jamal', 'Priya', 'Owen', 'Ava', 'Dylan', 'Sofia',
  'Ethan', 'Lena', 'Mateo', 'Iris', 'Jonah', 'Nina', 'Leo', 'Nora', 'Milo', 'Ruby',
  'Zane', 'Aria', 'Kian', 'Sara', 'Ravi', 'Elena', 'Kai', 'Jade', 'Aiden', 'Mina',
  'Yara', 'Hugo', 'Layla', 'Isaac', 'Tara', 'Zoya', 'Rohan', 'Liam', 'Cleo', 'Eli',
  'Amara', 'Caleb', 'Elias', 'Hana', 'Jude', 'Kira', 'Luka', 'Mira', 'Nico', 'Sasha',
];

interface AdjectivePair {
  pos: string;
  posComp: string;
  neg: string;
  negComp: string;
}

const PAIRS: AdjectivePair[] = [
  { pos: 'strong', posComp: 'stronger', neg: 'weak', negComp: 'weaker' },
  { pos: 'fast', posComp: 'faster', neg: 'slow', negComp: 'slower' },
  { pos: 'tall', posComp: 'taller', neg: 'short', negComp: 'shorter' },
  { pos: 'brave', posComp: 'braver', neg: 'fearful', negComp: 'more fearful' },
  { pos: 'calm', posComp: 'calmer', neg: 'anxious', negComp: 'more anxious' },
  { pos: 'friendly', posComp: 'friendlier', neg: 'hostile', negComp: 'more hostile' },
  { pos: 'smart', posComp: 'smarter', neg: 'dim', negComp: 'dimmer' },
  { pos: 'organized', posComp: 'organized', neg: 'chaotic', negComp: 'more chaotic' },
  { pos: 'patient', posComp: 'patient', neg: 'impulsive', negComp: 'more impulsive' },
  { pos: 'kind', posComp: 'kinder', neg: 'cruel', negComp: 'crueler' },
  { pos: 'creative', posComp: 'creative', neg: 'uncreative', negComp: 'less creative' },
  { pos: 'focused', posComp: 'focused', neg: 'distracted', negComp: 'more distracted' },
  { pos: 'heavy', posComp: 'heavier', neg: 'light', negComp: 'lighter' },
  { pos: 'rich', posComp: 'richer', neg: 'poor', negComp: 'poorer' },
  { pos: 'happy', posComp: 'happier', neg: 'sad', negComp: 'sadder' },
  { pos: 'loud', posComp: 'louder', neg: 'quiet', negComp: 'quieter' },
  { pos: 'bright', posComp: 'brighter', neg: 'dim', negComp: 'dimmer' },
  { pos: 'old', posComp: 'older', neg: 'young', negComp: 'younger' },
  { pos: 'large', posComp: 'larger', neg: 'small', negComp: 'smaller' },
  { pos: 'hard', posComp: 'harder', neg: 'soft', negComp: 'softer' },
  { pos: 'good', posComp: 'better', neg: 'bad', negComp: 'worse' },
  { pos: 'wide', posComp: 'wider', neg: 'narrow', negComp: 'narrower' },
  { pos: 'deep', posComp: 'deeper', neg: 'shallow', negComp: 'shallower' },
  { pos: 'sharp', posComp: 'sharper', neg: 'blunt', negComp: 'blunter' },
  { pos: 'smooth', posComp: 'smoother', neg: 'rough', negComp: 'rougher' },
  { pos: 'thick', posComp: 'thicker', neg: 'thin', negComp: 'thinner' },
  { pos: 'full', posComp: 'fuller', neg: 'empty', negComp: 'emptier' },
  { pos: 'clean', posComp: 'cleaner', neg: 'dirty', negComp: 'dirtier' },
  { pos: 'hot', posComp: 'hotter', neg: 'cold', negComp: 'colder' },
  { pos: 'dry', posComp: 'dryer', neg: 'wet', negComp: 'wetter' },
  { pos: 'tough', posComp: 'tougher', neg: 'fragile', negComp: 'more fragile' },
];

type Round = {
  statement: string;
  question: string;
  answer: string;
  options: [string, string];
  signature: string;
};

function makeRoundRaw(): Round {
  const name1 = NAMES[randomInt(0, NAMES.length - 1)];
  let name2 = NAMES[randomInt(0, NAMES.length - 1)];
  while (name2 === name1) {
    name2 = NAMES[randomInt(0, NAMES.length - 1)];
  }

  const pairIndex = randomInt(0, PAIRS.length - 1);
  const pair = PAIRS[pairIndex];
  
  const isName1Positive = Math.random() > 0.5;
  const positiveName = isName1Positive ? name1 : name2;
  const negativeName = isName1Positive ? name2 : name1;

  const statementType = randomInt(0, 3); 
  let statement = '';
  switch (statementType) {
    case 0:
      statement = `${positiveName} is ${pair.posComp} than ${negativeName}.`;
      break;
    case 1:
      statement = `${negativeName} is ${pair.negComp} than ${positiveName}.`;
      break;
    case 2:
      statement = `${negativeName} is not as ${pair.pos} as ${positiveName}.`;
      break;
    case 3:
      statement = `${positiveName} is not as ${pair.neg} as ${negativeName}.`;
      break;
  }

  const questionPositive = Math.random() > 0.5;
  const question = questionPositive 
    ? `Who is ${pair.posComp}?` 
    : `Who is ${pair.negComp}?`;

  const answer = questionPositive ? positiveName : negativeName;
  const options = Math.random() > 0.5 ? [name1, name2] : [name2, name1];

  return {
    statement,
    question,
    answer,
    options: [options[0], options[1]],
    signature: `${pair.pos}-${name1}-${name2}`,
  };
}

function makeRound(): Round {
  return generateRecentUnique(
    'gia-reasoning',
    15,
    makeRoundRaw,
    (r) => r.signature
  );
}

export default function GiaReasoningTest({ definition, onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeRound());
  const [phase, setPhase] = useState<'statement' | 'question'>('statement');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [netStatus, setNetStatus] = useState<'success' | 'danger' | 'neutral'>('neutral');
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
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
    autoStart: false,
    onExpire: complete,
  });

  const handleStart = () => {
    setStarted(true);
    timer.start();
  };

  if (!started) {
    return (
      <TestStartScreen
        description="Read each statement, then answer the question. You have 2 minutes."
        onStart={handleStart}
      />
    );
  }

  const answer = (picked: string) => {
    if (finished || submittedRef.current) return;
    if (picked === round.answer) {
      statsRef.current.correct += 1;
      setNetStatus('success');
    } else {
      statsRef.current.incorrect += 1;
      setNetStatus('danger');
    }
    setCorrect(statsRef.current.correct);
    setIncorrect(statsRef.current.incorrect);
    setRound(makeRound());
    setPhase('statement');
  };

  return (
    <div className="game-container">
      <Timer label="Remaining" milliseconds={timer.remainingMs} progress={1 - timer.progress} />

      <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1.5rem)', flexWrap: 'wrap', flexShrink: 0 }}>
        <ScoreDisplay label="Correct" value={correct} status="success" />
        <ScoreDisplay label="Incorrect" value={incorrect} status="danger" />
        <ScoreDisplay label="Net" value={score} status={netStatus} />
      </div>

      <div
        className="game-grid-container"
        style={{
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: 'clamp(1rem, 5vw, 1.5rem)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 'clamp(1rem, 4vh, 2rem)',
          background: 'var(--surface-raised)',
        }}
      >
        {phase === 'statement' ? (
          <div style={{ textAlign: 'center', display: 'grid', gap: '1rem', width: '100%' }}>
            <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statement</small>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 5vw, 2.2rem)' }}>{round.statement}</h2>
            <button 
              type="button" 
              className="button" 
              onClick={() => setPhase('question')}
              style={{ padding: '0.8rem 2rem', fontSize: '1rem', marginInline: 'auto' }}
            >
              Show Question
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', display: 'grid', gap: '1rem', width: '100%' }}>
            <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question</small>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 5vw, 2.2rem)' }}>{round.question}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'clamp(0.5rem, 2vw, 1rem)', maxWidth: '500px', marginInline: 'auto', width: '100%' }}>
              {round.options.map((name) => (
                <button 
                  key={name} 
                  type="button" 
                  className="button" 
                  onClick={() => answer(name)}
                  style={{ padding: '0.8rem 1rem', fontSize: '1rem' }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
