'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, useCallback } from 'react';
import type { TestGameProps } from '../_shared/types';
import { shuffle } from '@/lib/utils';
import Scoreboard from '@/components/Scoreboard';
import ScoreDisplay from '@/components/ScoreDisplay';
import TestStartScreen from '@/components/TestStartScreen';
import { generateFaceSVG } from '@/lib/tests/face-generator';

// Pre-generate pool of unique seeds to ensure variety
const SEED_POOL = Array.from({ length: 200 }, (_, i) => 1000 + i * 7);

type Phase = 'study' | 'test' | 'feedback';

type LevelState = {
  level: number;
  studyIds: number[];
  testIds: number[];
  studySet: Set<number>;
};

function buildLevel(level: number, pool: number[]): LevelState {
  // Level 1: 4 study, 8 test (4 seen, 4 new)
  // Level 7: 10 study, 20 test (10 seen, 10 new)
  const studyCount = 3 + level;
  const shuffledPool = shuffle([...pool]);
  const studyIds = shuffledPool.slice(0, studyCount);
  const newIds = shuffledPool.slice(studyCount, studyCount * 2);
  const testIds = shuffle([...studyIds, ...newIds]);
  
  return {
    level,
    studyIds,
    testIds,
    studySet: new Set(studyIds),
  };
}

export default function FaceMemoryTest({ definition, onComplete }: TestGameProps) {
  // Use a stable shuffled pool for the entire session
  const sessionPool = useMemo(() => shuffle([...SEED_POOL]), []);
  
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<Phase>('study');
  const [levelState, setLevelState] = useState<LevelState>(() => buildLevel(1, sessionPool.slice(0, 30)));
  const [timer, setTimer] = useState(0);
  const [testIndex, setTestIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; faceId: number } | null>(null);

  const totalStudyTime = useMemo(() => 5 + level * 2, [level]);

  // Start study timer
  useEffect(() => {
    if (!started || phase !== 'study') return;
    
    setTimer(totalStudyTime);
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
  }, [phase, level, started, totalStudyTime]);

  const handleAnswer = useCallback((choiceSeen: boolean) => {
    if (phase !== 'test') return;
    
    const faceId = levelState.testIds[testIndex];
    const actuallySeen = levelState.studySet.has(faceId);
    const isCorrect = (choiceSeen && actuallySeen) || (!choiceSeen && !actuallySeen);

    const nextCorrect = isCorrect ? correct + 1 : correct;
    const nextTotal = total + 1;
    
    setCorrect(nextCorrect);
    setTotal(nextTotal);
    setFeedback({ isCorrect, faceId });
    setPhase('feedback');

    // Small delay for feedback before next face or level
    setTimeout(() => {
      setFeedback(null);
      
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
        } else {
          const nextLevel = level + 1;
          const poolOffset = nextLevel * 20; // Ensure enough faces for later levels
          setLevel(nextLevel);
          setLevelState(buildLevel(nextLevel, sessionPool.slice(poolOffset, poolOffset + 40)));
          setTestIndex(0);
          setPhase('study');
        }
      } else {
        setTestIndex((prev) => prev + 1);
        setPhase('test');
      }
    }, 600);
  }, [phase, level, levelState, testIndex, correct, total, onComplete, sessionPool]);

  return (
    <div className="game-container">
      <Scoreboard>
        <ScoreDisplay label="Level" value={`${level} / 7`} />
        <ScoreDisplay 
          label="Accuracy" 
          value={total > 0 ? `${Math.round((correct / total) * 100)}%` : '—'} 
          status={total > 0 ? (correct/total > 0.8 ? 'success' : 'neutral') : 'neutral'}
        />
        {phase === 'study' ? (
          <ScoreDisplay label="Time" value={`${timer}s`} status={timer < 3 ? 'danger' : 'neutral'} />
        ) : (
          <ScoreDisplay label="Progress" value={`${testIndex + 1} / ${levelState.testIds.length}`} />
        )}
      </Scoreboard>

      <div className="game-content">
        {!started ? (
          <TestStartScreen
            description={definition.description}
            onStart={() => setStarted(true)}
          />
        ) : (
          <>
            {phase === 'study' ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.5rem', 
                width: '100%', 
                height: '100%',
                maxWidth: '800px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>Study Phase</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Memorize these {levelState.studyIds.length} faces.</p>
                </div>

                <div style={{ 
                  width: '100%', 
                  height: '4px', 
                  background: 'var(--surface-raised)', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(timer / totalStudyTime) * 100}%`,
                    background: 'var(--accent)',
                    transition: 'width 1s linear'
                  }} />
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--surface-raised)',
                  borderRadius: 'var(--radius-lg)',
                  overflowY: 'auto',
                  maxHeight: '60vh'
                }}>
                  {levelState.studyIds.map((id) => (
                    <div key={id} className="animate-in" style={{ 
                      aspectRatio: '100/140', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      boxShadow: 'var(--card-shadow)',
                      border: '1px solid var(--border)'
                    }}>
                      <img 
                        src={generateFaceSVG(id)} 
                        alt="Face" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '2rem',
                width: '100%',
                maxWidth: '400px'
              }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 500 }}>
                  Have you seen this face?
                </p>

                <div style={{ position: 'relative', width: '200px', height: '280px' }}>
                  <div key={testIndex} className="animate-in" style={{ 
                    width: '100%', 
                    height: '100%',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
                    border: feedback 
                      ? `4px solid ${feedback.isCorrect ? 'var(--success)' : 'var(--danger)'}` 
                      : '2px solid var(--border)',
                    transition: 'border-color 0.2s ease',
                    position: 'relative'
                  }}>
                    <img 
                      src={generateFaceSVG(levelState.testIds[testIndex])} 
                      alt="Test face" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    
                    {feedback && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: feedback.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          background: feedback.isCorrect ? 'var(--success)' : 'var(--danger)',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '99px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                          {feedback.isCorrect ? 'CORRECT' : 'WRONG'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1rem', 
                  width: '100%' 
                }}>
                  <button 
                    className="button" 
                    disabled={phase === 'feedback'}
                    onClick={() => handleAnswer(true)}
                    style={{ height: '3.5rem', fontSize: '1rem' }}
                  >
                    YES (Seen)
                  </button>
                  <button 
                    className="button buttonGhost" 
                    disabled={phase === 'feedback'}
                    onClick={() => handleAnswer(false)}
                    style={{ height: '3.5rem', fontSize: '1rem' }}
                  >
                    NO (New)
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
