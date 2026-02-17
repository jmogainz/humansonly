'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { shuffle } from '@/lib/utils';
import LivesDisplay from '@/components/LivesDisplay';
import Scoreboard from '@/components/Scoreboard';
import ScoreDisplay from '@/components/ScoreDisplay';
import TestStartScreen from '@/components/TestStartScreen';
import { useFeedback } from '@/components/FeedbackContext';

function roundConfig(level: number) {
  const size = Math.min(7, 3 + Math.floor((level - 1) / 3));
  const total = size * size;
  const flashCount = Math.min(total - 1, 2 + level);
  const pattern = shuffle(Array.from({ length: total }, (_, index) => index)).slice(0, flashCount);
  return { size, pattern };
}

export default function VisualMemoryTest({ definition, onComplete }: TestGameProps) {
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pattern, setPattern] = useState<number[]>(() => roundConfig(1).pattern);
  const [gridSize, setGridSize] = useState(roundConfig(1).size);
  const [submitted, setSubmitted] = useState(false);
  const { triggerFeedback } = useFeedback();

  useEffect(() => {
    if (!started) return;
    setPhase('show');
    const id = window.setTimeout(() => setPhase('input'), 1100);
    return () => window.clearTimeout(id);
  }, [pattern, started]);

  useEffect(() => {
    if (lives > 0 || submitted) return;
    setSubmitted(true);
    const completedLevel = Math.max(0, level - 1);
    onComplete({
      score: completedLevel,
      unit: 'level',
      metadata: { completedLevel, attemptedLevel: level },
      label: `Level ${completedLevel}`,
    });
  }, [lives, submitted, level, onComplete]);

  const patternSet = useMemo(() => new Set(pattern), [pattern]);

  const nextRound = (nextLevel: number) => {
    const next = roundConfig(nextLevel);
    setGridSize(next.size);
    setPattern(next.pattern);
    setSelected(new Set());
  };

  const evaluateSelection = (nextSelected: Set<number>) => {
    if (nextSelected.size < pattern.length) return;

    const correct =
      nextSelected.size === patternSet.size &&
      [...nextSelected].every((index) => patternSet.has(index));

    if (correct) {
      triggerFeedback('success');
      const nextLevel = level + 1;
      setLevel(nextLevel);
      nextRound(nextLevel);
      return;
    }

    const nextLives = lives - 1;
    setLives(nextLives);
    if (nextLives > 0) {
      nextRound(level);
    }
  };

  const handleClick = (index: number) => {
    if (phase !== 'input') return;
    if (selected.has(index)) return;

    const nextSelected = new Set(selected);
    nextSelected.add(index);
    setSelected(nextSelected);
    evaluateSelection(nextSelected);
  };

  const total = gridSize * gridSize;

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
            <ScoreDisplay label="Level" value={level} />
            <LivesDisplay lives={lives} />
          </Scoreboard>

          <div className="game-content">
            <p style={{ margin: 0, color: 'var(--text-muted)', textAlign: 'center', fontSize: '1rem' }}>
              {phase === 'show' ? 'Memorize highlighted tiles' : 'Select every tile that flashed'}
            </p>

            <div className="game-grid-container">
              <div
                className="game-grid"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  gap: 'clamp(0.2rem, 1.5cqw, 0.6rem)',
                }}
              >
                {Array.from({ length: total }, (_, index) => {
                  const isPattern = patternSet.has(index);
                  const wasSelected = selected.has(index);
                  return (
                    <button
                      key={index}
                      type="button"
                      className="game-tile"
                      onClick={() => handleClick(index)}
                      style={{
                        background:
                          phase === 'show' && isPattern
                            ? 'var(--accent)'
                            : wasSelected
                              ? 'color-mix(in srgb, var(--accent) 40%, var(--surface-raised))'
                              : 'var(--surface-raised)',
                        cursor: phase === 'input' ? 'pointer' : 'default',
                        borderRadius: 'clamp(4px, 1.5cqw, 12px)',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
