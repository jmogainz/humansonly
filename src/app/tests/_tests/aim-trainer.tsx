'use client';

import { useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import ScoreDisplay from '@/components/ScoreDisplay';

const TARGET_COUNT = 30;
const TARGET_SIZE = 44;

function randomTarget() {
  return {
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
  };
}

export default function AimTrainerTest({ onComplete }: TestGameProps) {
  const [started, setStarted] = useState(false);
  const [hits, setHits] = useState(0);
  const [target, setTarget] = useState(randomTarget);
  const [spawnedAt, setSpawnedAt] = useState<number | null>(null);
  const [times, setTimes] = useState<number[]>([]);

  const average = useMemo(() => {
    if (!times.length) return 0;
    return times.reduce((sum, value) => sum + value, 0) / times.length;
  }, [times]);

  const handleStart = () => {
    setStarted(true);
    setHits(0);
    setTimes([]);
    setTarget(randomTarget());
    setSpawnedAt(performance.now());
  };

  const handleHit = () => {
    if (!started) return;
    const now = performance.now();
    const elapsed = spawnedAt ? now - spawnedAt : 0;
    const nextTimes = [...times, elapsed];
    const nextHits = hits + 1;

    if (nextHits >= TARGET_COUNT) {
      const finalAverage = nextTimes.reduce((sum, value) => sum + value, 0) / nextTimes.length;
      onComplete({
        score: finalAverage,
        unit: 'ms/target',
        metadata: { times: nextTimes },
        label: `${Math.round(finalAverage)} ms/target`,
      });
      return;
    }

    setTimes(nextTimes);
    setHits(nextHits);
    setTarget(randomTarget());
    setSpawnedAt(now);
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <ScoreDisplay label="Hits" value={`${hits}/${TARGET_COUNT}`} />
        <ScoreDisplay label="Average" value={`${Math.round(average)} ms`} />
      </div>

      {!started ? (
        <button className="button" type="button" onClick={handleStart}>
          Start Aim Trainer
        </button>
      ) : null}

      <div
        style={{
          width: '100%',
          minHeight: '420px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface-raised) 70%, transparent), var(--surface))',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {started ? (
          <button
            type="button"
            onClick={handleHit}
            aria-label="Target"
            style={{
              position: 'absolute',
              left: `calc(${target.x}% - ${TARGET_SIZE / 2}px)`,
              top: `calc(${target.y}% - ${TARGET_SIZE / 2}px)`,
              width: `${TARGET_SIZE}px`,
              height: `${TARGET_SIZE}px`,
              borderRadius: '999px',
              border: 'none',
              cursor: 'crosshair',
              background: 'radial-gradient(circle, #ffffff 0 24%, #e35a5a 25% 58%, #ffffff 59% 100%)',
            }}
          />
        ) : (
          <p style={{ margin: '1rem', color: 'var(--text-muted)' }}>Click start to begin 30 target challenge.</p>
        )}
      </div>
    </div>
  );
}
