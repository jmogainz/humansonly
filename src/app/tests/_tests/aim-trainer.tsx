'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import ScoreDisplay from '@/components/ScoreDisplay';
import { clamp } from '@/lib/utils';
import TestStartScreen from '@/components/TestStartScreen';

const TARGET_COUNT = 30;
const TARGET_SIZE = 44;

function randomTarget(width: number, height: number) {
  const padding = TARGET_SIZE / 2 + 4;
  const safeWidth = Math.max(padding * 2, width);
  const safeHeight = Math.max(padding * 2, height);

  return {
    x: padding + Math.random() * (safeWidth - padding * 2),
    y: padding + Math.random() * (safeHeight - padding * 2),
  };
}

export default function AimTrainerTest({ definition, onComplete }: TestGameProps) {
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [hits, setHits] = useState(0);
  const [arenaSize, setArenaSize] = useState({ width: 800, height: 420 });
  const [target, setTarget] = useState(() => randomTarget(800, 420));
  const [spawnedAt, setSpawnedAt] = useState<number | null>(null);
  const [times, setTimes] = useState<number[]>([]);

  useEffect(() => {
    const updateSize = () => {
      const arena = arenaRef.current;
      if (!arena) return;
      const rect = arena.getBoundingClientRect();
      setArenaSize({
        width: Math.max(rect.width, TARGET_SIZE + 12),
        height: Math.max(rect.height, TARGET_SIZE + 12),
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const padding = TARGET_SIZE / 2 + 4;
    setTarget((prev) => ({
      x: clamp(prev.x, padding, arenaSize.width - padding),
      y: clamp(prev.y, padding, arenaSize.height - padding),
    }));
  }, [arenaSize.width, arenaSize.height]);

  const average = useMemo(() => {
    if (!times.length) return 0;
    return times.reduce((sum, value) => sum + value, 0) / times.length;
  }, [times]);

  const handleStart = () => {
    setStarted(true);
    setFinished(false);
    setHits(0);
    setTimes([]);
    setTarget(randomTarget(arenaSize.width, arenaSize.height));
    setSpawnedAt(performance.now());
  };

  const handleHit = () => {
    if (!started || finished) return;
    const now = performance.now();
    const elapsed = spawnedAt ? now - spawnedAt : 0;
    const nextTimes = [...times, elapsed];
    const nextHits = hits + 1;

    if (nextHits >= TARGET_COUNT) {
      setTimes(nextTimes);
      setHits(nextHits);
      setFinished(true);
      setSpawnedAt(null);
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
    setTarget(randomTarget(arenaSize.width, arenaSize.height));
    setSpawnedAt(now);
  };

  if (!started) {
    return (
      <TestStartScreen
        description={definition.description}
        onStart={handleStart}
      />
    );
  }

  return (
    <div className="game-container">
      <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1.5rem)', flexWrap: 'wrap', flexShrink: 0 }}>
        <ScoreDisplay label="Hits" value={`${hits}/${TARGET_COUNT}`} />
        <ScoreDisplay label="Average" value={`${Math.round(average)} ms`} />
      </div>

      <div
        className="game-grid-container"
        ref={arenaRef}
        style={{
          borderRadius: '14px',
          border: '1px solid var(--border)',
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface-raised) 70%, transparent), var(--surface))',
          position: 'relative',
          overflow: 'hidden',
          display: 'block'
        }}
      >
        {!finished ? (
          <button
            type="button"
            onClick={handleHit}
            aria-label="Target"
            style={{
              position: 'absolute',
              left: `${target.x - TARGET_SIZE / 2}px`,
              top: `${target.y - TARGET_SIZE / 2}px`,
              width: `${TARGET_SIZE}px`,
              height: `${TARGET_SIZE}px`,
              borderRadius: '999px',
              border: 'none',
              cursor: 'crosshair',
              background: 'radial-gradient(circle, #ffffff 0 24%, #e35a5a 25% 58%, #ffffff 59% 100%)',
            }}
          />
        ) : (
          <p style={{ margin: '1rem', color: 'var(--text-muted)' }}>
            Run complete. Saving result...
          </p>
        )}
      </div>
    </div>
  );
}
