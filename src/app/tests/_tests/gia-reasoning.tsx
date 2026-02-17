'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, generateRecentUnique, shuffle } from '@/lib/utils';
import Timer, { formatTime } from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import Scoreboard from '@/components/Scoreboard';
import { useTimer } from '@/hooks/useTimer';
import TestStartScreen from '@/components/TestStartScreen';

const NAMES = [
  'Alex', 'Noah', 'Maya', 'Leah', 'Jamal', 'Priya', 'Owen', 'Ava', 'Dylan', 'Sofia',
  'Ethan', 'Lena', 'Mateo', 'Iris', 'Jonah', 'Nina', 'Leo', 'Nora', 'Milo', 'Ruby',
  'Zane', 'Aria', 'Kian', 'Sara', 'Ravi', 'Elena', 'Kai', 'Jade', 'Aiden', 'Mina',
  'Yara', 'Hugo', 'Layla', 'Isaac', 'Tara', 'Zoya', 'Rohan', 'Liam', 'Cleo', 'Eli',
  'Oscar', 'Bella', 'Caleb', 'Veda', 'Enzo', 'Zuri', 'Theo', 'Ayla', 'Arlo', 'Esme',
  'Silas', 'Nola', 'Hugo', 'Zara', 'Felix', 'Thea', 'Jude', 'Alma', 'Otis', 'Lyra',
  'Miro', 'Clara', 'Soren', 'Sia', 'Otto', 'Zelda', 'Remy', 'Opal', 'Finn', 'Flora',
  'Bram', 'Gaia', 'Cass', 'Luna', 'Vesper', 'Aura', 'Pax', 'Dune', 'Nova', 'Echo',
  'Reed', 'Sage', 'Wren', 'Lark', 'Fawn', 'Cliff', 'Lake', 'Vale', 'Glen', 'Brook',
  'Slate', 'Flint', 'Ash', 'Clay', 'Onyx', 'Azure', 'Jade', 'Rose', 'Iris', 'Fern',
];

const ADJECTIVES = [
  'taller', 'shorter', 'faster', 'slower', 'stronger', 'weaker', 'smarter', 'wiser',
  'older', 'younger', 'richer', 'poorer', 'louder', 'quieter', 'deeper', 'higher',
  'larger', 'smaller', 'longer', 'wider', 'colder', 'hotter', 'brighter', 'darker',
  'harder', 'softer', 'braver', 'kinder', 'heavier', 'lighter', 'calmer', 'bolder',
];

const CONNECTORS = ['than', 'is compared to'];

type Round = {
  statement: string;
  question: string;
  names: string[];
  options: string[];
  answer: string;
  signature: string;
};

function makeRoundRaw(): Round {
  const [nameA, nameB] = generateRecentUnique('gia-reasoning-names', 20, () => NAMES[randomInt(0, NAMES.length - 1)], (n) => n, 2);
  const adj = ADJECTIVES[randomInt(0, ADJECTIVES.length - 1)];
  const connector = CONNECTORS[randomInt(0, CONNECTORS.length - 1)];

  // Statement: A is taller than B.
  // Question: Who is shorter?
  const statement = `${nameA} is ${adj} ${connector} ${nameB}.`;

  const opposites: Record<string, string> = {
    taller: 'shorter',
    shorter: 'taller',
    faster: 'slower',
    slower: 'faster',
    stronger: 'weaker',
    weaker: 'stronger',
    smarter: 'dumber',
    wiser: 'less wise',
    older: 'younger',
    younger: 'older',
    richer: 'poorer',
    poorer: 'richer',
    louder: 'quieter',
    quieter: 'louder',
    deeper: 'shallower',
    shallower: 'deeper',
    higher: 'lower',
    lower: 'higher',
    larger: 'smaller',
    smaller: 'larger',
    longer: 'shorter',
    wider: 'narrower',
    colder: 'warmer',
    hotter: 'cooler',
    brighter: 'dimmer',
    darker: 'lighter',
    harder: 'softer',
    softer: 'harder',
    braver: 'less brave',
    kinder: 'less kind',
    heavier: 'lighter',
    lighter: 'heavier',
    calmer: 'noisier',
    bolder: 'shier',
  };

  const isAskingOpposite = Math.random() > 0.5;
  const questionAdj = isAskingOpposite ? opposites[adj] || adj : adj;
  const question = `Who is ${questionAdj}?`;

  let answer = '';
  if (isAskingOpposite) {
    answer = nameB;
  } else {
    answer = nameA;
  }

  return {
    statement,
    question,
    names: [nameA, nameB],
    options: shuffle([nameA, nameB]),
    answer,
    signature: `${nameA}|${nameB}|${adj}|${questionAdj}`,
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
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [netStatus, setNetStatus] = useState<'success' | 'danger' | 'neutral'>('neutral');
  const [phase, setPhase] = useState<'statement' | 'question'>('statement');
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const submittedRef = useRef(false);
  const statsRef = useRef({ correct: 0, incorrect: 0 });

  const score = useMemo(() => {
    const s = correct - incorrect * 1;
    return s < 0 ? 0 : s;
  }, [correct, incorrect]);

  const complete = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setFinished(true);
    const finalCorrect = statsRef.current.correct;
    const finalIncorrect = statsRef.current.incorrect;
    const finalScore = Math.max(0, finalCorrect - finalIncorrect * 1);
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
      <Scoreboard>
        <ScoreDisplay label="Time" value={formatTime(timer.remainingMs)} />
        <ScoreDisplay label="Correct" value={correct} status="success" />
        <ScoreDisplay label="Incorrect" value={incorrect} status="danger" />
        <ScoreDisplay label="Net" value={score} status={netStatus} />
      </Scoreboard>
      
      <Timer progress={1 - timer.progress} />

      <div className="game-content">
        {!started ? (
          <TestStartScreen
            description="Read each statement, then answer the question. You have 2 minutes."
            onStart={handleStart}
          />
        ) : (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: 'clamp(1.5rem, 6vw, 3rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 'clamp(1.5rem, 5vh, 2.5rem)',
              background: 'var(--surface-raised)',
              width: '100%',
              maxWidth: '640px',
              marginInline: 'auto'
            }}
          >
            {phase === 'statement' ? (
              <div style={{ textAlign: 'center', display: 'grid', gap: '1.5rem', width: '100%' }}>
                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>Statement</small>
                <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 6vw, 2.25rem)', fontWeight: 600, lineHeight: 1.3 }}>{round.statement}</h2>
                <button 
                  type="button" 
                  className="button" 
                  onClick={() => setPhase('question')}
                  style={{ padding: '0.8rem 2.5rem', fontSize: '1rem', marginInline: 'auto', minWidth: '200px' }}
                >
                  Show Question
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', display: 'grid', gap: '1.5rem', width: '100%' }}>
                <div style={{ display: 'grid', gap: '0.4rem' }}>
                  <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>Question</small>
                  <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 6vw, 2.25rem)', fontWeight: 600, lineHeight: 1.3 }}>{round.question}</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem', maxWidth: '440px', marginInline: 'auto', width: '100%' }}>
                  {round.options.map((name) => (
                    <button 
                      key={name} 
                      type="button" 
                      className="button" 
                      onClick={() => answer(name)}
                      style={{ padding: '0.8rem 1rem', fontSize: '1.15rem' }}
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
    </div>
  );
}
