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
  'Arjun', 'Beatrice', 'Chen', 'Dante', 'Esme', 'Finn', 'Gia', 'Hiro', 'Ines', 'Jasper',
  'Kenza', 'Lior', 'Malik', 'Noa', 'Oscar', 'Paloma', 'Quinn', 'Remy', 'Soren', 'Talia',
  'Uma', 'Vigo', 'Wren', 'Xander', 'Yuna', 'Zayd', 'Alba', 'Bodhi', 'Cora', 'Dax',
  'Elodie', 'Felix', 'Gwen', 'Ida', 'Jace', 'Kaia', 'Lenz', 'Maia', 'Noel', 'Opal',
  'Pax', 'Rumi', 'Silas', 'Thea', 'Uri', 'Veda', 'Wolf', 'Xena', 'Zion', 'Amos',
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
  { pos: 'organized', posComp: 'more organized', neg: 'chaotic', negComp: 'more chaotic' },
  { pos: 'patient', posComp: 'more patient', neg: 'impulsive', negComp: 'more impulsive' },
  { pos: 'kind', posComp: 'kinder', neg: 'cruel', negComp: 'crueler' },
  { pos: 'creative', posComp: 'more creative', neg: 'uncreative', negComp: 'more uncreative' },
  { pos: 'focused', posComp: 'more focused', neg: 'distracted', negComp: 'more distracted' },
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
  { pos: 'bold', posComp: 'bolder', neg: 'timid', negComp: 'more timid' },
  { pos: 'wealthy', posComp: 'wealthier', neg: 'needy', negComp: 'needier' },
  { pos: 'energetic', posComp: 'more energetic', neg: 'lethargic', negComp: 'more lethargic' },
  { pos: 'generous', posComp: 'more generous', neg: 'stingy', negComp: 'stingier' },
  { pos: 'honest', posComp: 'more honest', neg: 'deceitful', negComp: 'more deceitful' },
  { pos: 'loyal', posComp: 'more loyal', neg: 'fickle', negComp: 'more fickle' },
  { pos: 'modest', posComp: 'more modest', neg: 'vain', negComp: 'vainer' },
  { pos: 'polite', posComp: 'more polite', neg: 'rude', negComp: 'ruder' },
  { pos: 'reliable', posComp: 'more reliable', neg: 'erratic', negComp: 'more erratic' },
  { pos: 'wise', posComp: 'wiser', neg: 'foolish', negComp: 'more foolish' },
  { pos: 'agile', posComp: 'more agile', neg: 'clumsy', negComp: 'clumsier' },
  { pos: 'vibrant', posComp: 'more vibrant', neg: 'dull', negComp: 'duller' },
  { pos: 'steady', posComp: 'steadier', neg: 'shaky', negComp: 'shakier' },
  { pos: 'mature', posComp: 'more mature', neg: 'childish', negComp: 'more childish' },
  { pos: 'graceful', posComp: 'more graceful', neg: 'awkward', negComp: 'more awkward' },
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
  const p = isName1Positive ? name1 : name2;
  const n = isName1Positive ? name2 : name1;

  const statementTemplates = [
    // Direct
    () => `${p} is ${pair.posComp} than ${n}.`,
    () => `${n} is ${pair.negComp} than ${p}.`,
    () => `${p} is clearly ${pair.posComp} than ${n}.`,
    () => `${n} is clearly ${pair.negComp} than ${p}.`,
    // Negation
    () => `${n} is not as ${pair.pos} as ${p}.`,
    () => `${p} is not as ${pair.neg} as ${n}.`,
    () => `${n} is certainly not as ${pair.pos} as ${p}.`,
    () => `${p} is certainly not as ${pair.neg} as ${n}.`,
    // Synonym
    () => `${p} is less ${pair.neg} than ${n}.`,
    () => `${n} is less ${pair.pos} than ${p}.`,
    () => `${p} is truly less ${pair.neg} than ${n}.`,
    () => `${n} is truly less ${pair.pos} than ${p}.`,
  ];

  const statementIndex = randomInt(0, statementTemplates.length - 1);
  const statement = statementTemplates[statementIndex]();

  const questionTemplates = [
    // Direct
    { text: `Who is ${pair.posComp}?`, answer: p },
    { text: `Who is ${pair.negComp}?`, answer: n },
    { text: `Which one is ${pair.posComp}?`, answer: p },
    { text: `Which one is ${pair.negComp}?`, answer: n },
    // Synonym
    { text: `Who is less ${pair.pos}?`, answer: n },
    { text: `Who is less ${pair.neg}?`, answer: p },
    { text: `Which one is less ${pair.pos}?`, answer: n },
    { text: `Which one is less ${pair.neg}?`, answer: p },
  ];

  const questionObj = questionTemplates[randomInt(0, questionTemplates.length - 1)];
  const question = questionObj.text;
  const answer = questionObj.answer;
  const options = Math.random() > 0.5 ? [name1, name2] : [name2, name1];

  return {
    statement,
    question,
    answer,
    options: [options[0], options[1]],
    signature: `${pair.pos}-${statementIndex}-${question}-${name1}-${name2}`,
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

      {!started ? (
        <TestStartScreen
          description="Read each statement, then answer the question. You have 2 minutes."
          onStart={handleStart}
        />
      ) : (
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
      )}
    </div>
  );
}
