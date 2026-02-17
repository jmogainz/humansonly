'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { shuffle } from '@/lib/utils';
import ScoreDisplay from '@/components/ScoreDisplay';

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

export default function FaceMemoryTest({ onComplete }: TestGameProps) {
  const pool = useMemo(() => shuffle(Array.from({ length: 140 }, (_, index) => index + 1)), []);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'study' | 'test'>('study');
  const [levelState, setLevelState] = useState<LevelState>(() => buildLevel(1, pool));
  const [timer, setTimer] = useState(8);
  const [testIndex, setTestIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (phase !== 'study') return;
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
  }, [phase, level]);

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
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <ScoreDisplay label="Level" value={level} />
        <ScoreDisplay label="Correct" value={`${correct}/${total}`} />
        {phase === 'study' ? <ScoreDisplay label="Study Time" value={`${timer}s`} /> : null}
      </div>

      {phase === 'study' ? (
        <div style={{ display: 'grid', gap: '0.7rem' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Study these faces, then identify them in the next phase.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.7rem' }}>
            {studyFaceUris.map(({ faceId, src }) => (
              <img
                key={faceId}
                src={src}
                alt="Study face"
                style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)' }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.8rem', justifyItems: 'center' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Face {testIndex + 1}/{levelState.testIds.length}
          </p>
          {currentFaceUri ? (
            <img
              src={currentFaceUri}
              alt="Face memory test"
              style={{ width: 'min(260px, 80vw)', borderRadius: '14px', border: '1px solid var(--border)' }}
            />
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', width: 'min(420px, 100%)', gap: '0.7rem' }}>
            <button className="button" type="button" onClick={() => handleAnswer(true)}>SEEN</button>
            <button className="button buttonGhost" type="button" onClick={() => handleAnswer(false)}>NEW</button>
          </div>
        </div>
      )}
    </div>
  );
}
