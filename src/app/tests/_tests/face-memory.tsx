'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { shuffle } from '@/lib/utils';
import Scoreboard from '@/components/Scoreboard';
import ScoreDisplay from '@/components/ScoreDisplay';
import TestStartScreen from '@/components/TestStartScreen';

const FACE_URI_CACHE = new Map<number, string>();

function seeded(seed: number) {
  let value = seed * 9301 + 49297;
  return () => {
    value = (value * 233280 + 12345) % 233280;
    return value / 233280;
  };
}

function faceDataUri(seed: number): string {
  const cached = FACE_URI_CACHE.get(seed);
  if (cached) {
    return cached;
  }

  const rand = seeded(seed + 1);
  const skin = `hsl(${18 + rand() * 22} ${35 + rand() * 30}% ${58 + rand() * 20}%)`;
  const hair = `hsl(${18 + rand() * 32} ${20 + rand() * 30}% ${15 + rand() * 18}%)`;
  const shirt = `hsl(${rand() * 360} ${45 + rand() * 35}% ${35 + rand() * 25}%)`;
  const eyeOffset = 10 + rand() * 8;
  const nose = 2 + rand() * 5;
  const mouth = 42 + rand() * 10;

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='260' viewBox='0 0 220 260'>
    <rect width='220' height='260' rx='26' fill='hsl(${200 + rand() * 50} 26% 90%)'/>
    <circle cx='110' cy='112' r='64' fill='${skin}'/>
    <ellipse cx='110' cy='72' rx='70' ry='36' fill='${hair}'/>
    <circle cx='${110 - eyeOffset}' cy='112' r='5' fill='#222'/>
    <circle cx='${110 + eyeOffset}' cy='112' r='5' fill='#222'/>
    <rect x='106' y='122' width='${nose}' height='18' rx='4' fill='hsl(20 25% 45%)'/>
    <path d='M80 ${mouth} q30 22 60 0' stroke='#5d2d2d' stroke-width='4' fill='none' stroke-linecap='round'/>
    <rect x='44' y='176' width='132' height='72' rx='14' fill='${shirt}'/>
  </svg>`;

  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  FACE_URI_CACHE.set(seed, uri);
  return uri;
}

type LevelState = {
  level: number;
  studyIds: number[];
  testIds: number[];
  studySet: Set<number>;
};

function buildLevel(level: number, source: number[]): LevelState {
  const studyCount = 4 + level;
  const studyIds = source.slice(0, studyCount);
  const newIds = source.slice(studyCount, studyCount * 2);
  const testIds = shuffle([...studyIds, ...newIds]);
  return {
    level,
    studyIds,
    testIds,
    studySet: new Set(studyIds),
  };
}

export default function FaceMemoryTest({ definition, onComplete }: TestGameProps) {
  const pool = useMemo(() => shuffle(Array.from({ length: 140 }, (_, index) => index + 1)), []);
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'study' | 'test'>('study');
  const [levelState, setLevelState] = useState<LevelState>(() => buildLevel(1, pool));
  const [timer, setTimer] = useState(8);
  const [testIndex, setTestIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!started || phase !== 'study') return;
    setTimer(6 + level * 2);
    const interval = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setPhase('test');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase, level, started]);

  const handleAnswer = (choiceSeen: boolean) => {
    if (phase !== 'test') return;
    const faceId = levelState.testIds[testIndex];
    const actuallySeen = levelState.studySet.has(faceId);
    const wasCorrect = (choiceSeen && actuallySeen) || (!choiceSeen && !actuallySeen);

    const nextCorrect = wasCorrect ? correct + 1 : correct;
    const nextTotal = total + 1;
    setCorrect(nextCorrect);
    setTotal(nextTotal);

    if (testIndex >= levelState.testIds.length - 1) {
      if (level >= 7) {
        const accuracy = nextTotal > 0 ? (nextCorrect / nextTotal) * 100 : 0;
        onComplete({
          score: accuracy,
          unit: 'percent',
          metadata: {
            correct: nextCorrect,
            total: nextTotal,
            levelsCompleted: 7,
          },
          label: `${accuracy.toFixed(1)}% accuracy`,
        });
        return;
      }

      const nextLevel = level + 1;
      const offset = nextLevel * 14;
      const nextPool = pool.slice(offset);
      setLevel(nextLevel);
      setLevelState(buildLevel(nextLevel, nextPool));
      setTestIndex(0);
      setPhase('study');
      return;
    }

    setTestIndex((prev) => prev + 1);
  };

  const currentFace = phase === 'study'
    ? null
    : levelState.testIds[testIndex];
  const studyFaceUris = useMemo(
    () => levelState.studyIds.map((faceId) => ({ faceId, src: faceDataUri(faceId) })),
    [levelState.studyIds]
  );
  const currentFaceUri = useMemo(
    () => (currentFace !== null ? faceDataUri(currentFace) : null),
    [currentFace]
  );

  return (
    <div className="game-container">
      {!started ? (
        <div className="game-content">
          <TestStartScreen
            description={definition.description}
            onStart={() => setStarted(true)}
          />
        </div>
      ) : (
        <>
          <Scoreboard>
            <ScoreDisplay label="Level" value={level} status="neutral" />
            <ScoreDisplay label="Correct" value={`${correct} / ${total}`} status={total > 0 ? (correct === total ? 'success' : 'neutral') : 'neutral'} />
            {phase === 'study' ? (
              <ScoreDisplay label="Time" value={`${timer}s`} status={timer < 3 ? 'danger' : 'neutral'} />
            ) : (
               <ScoreDisplay label="Progress" value={`${testIndex + 1} / ${levelState.testIds.length}`} />
            )}
          </Scoreboard>

          <div className="game-content">
            {phase === 'study' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0 }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', textAlign: 'center', fontSize: '1rem' }}>Study these faces carefully.</p>
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(90px, 20vw, 150px), 1fr))', 
                    gap: 'clamp(0.5rem, 2vw, 1rem)', 
                    overflowY: 'auto',
                    flex: 1,
                    paddingRight: '4px'
                  }}
                >
                  {studyFaceUris.map(({ faceId, src }) => (
                    <img
                      key={faceId}
                      src={src}
                      alt="Study face"
                      style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', flex: 1, justifyContent: 'center' }}
              >
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>
                  Have you seen this face before?
                </p>
                {currentFaceUri ? (
                  <img
                    src={currentFaceUri}
                    alt="Face memory test"
                    style={{ width: 'min(240px, 60cqh, 60cqw)', height: 'auto', aspectRatio: '220/260', borderRadius: '16px', border: '4px solid var(--surface-raised)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
                  />
                ) : null}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', width: 'min(400px, 100%)', gap: '0.75rem' }}>
                  <button className="button" type="button" onClick={() => handleAnswer(true)} style={{ padding: '0.75rem' }}>SEEN</button>
                  <button className="button buttonGhost" type="button" onClick={() => handleAnswer(false)} style={{ padding: '0.75rem' }}>NEW</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
