'use client';

import { useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt } from '@/lib/utils';

type Round = {
  grid: number;
  hue: number;
  oddHue: number;
  oddIndex: number;
};

function makeRound(level: number): Round {
  const grid = Math.min(6, 2 + Math.floor((level - 1) / 2));
  const total = grid * grid;
  const hue = randomInt(0, 359);
  const delta = Math.max(1, 20 - Math.log2(level + 1) * 5.2);
  const oddHue = (hue + delta) % 360;
  const oddIndex = randomInt(0, total - 1);

  return {
    grid,
    hue,
    oddHue,
    oddIndex,
  };
}

export default function HueTest({ onComplete }: TestGameProps) {
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState<Round>(() => makeRound(1));

  const total = round.grid * round.grid;

  const tiles = useMemo(
    () => Array.from({ length: total }, (_, index) => index),
    [total]
  );

  const pick = (index: number) => {
    if (index === round.oddIndex) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setRound(makeRound(nextLevel));
      return;
    }

    onComplete({
      score: level,
      unit: 'level',
      metadata: { level },
      label: `Level ${level}`,
    });
  };

  return (
    <div style={{ display: 'grid', gap: '0.9rem' }}>
      <strong style={{ fontFamily: 'var(--font-mono)' }}>Level {level}</strong>
      <p style={{ margin: 0, color: 'var(--text-muted)' }}>Click the tile with a slightly different hue.</p>

      <div
        style={{
          display: 'grid',
          width: 'min(580px, 100%)',
          gridTemplateColumns: `repeat(${round.grid}, minmax(0, 1fr))`,
          gap: '0.5rem',
        }}
      >
        {tiles.map((index) => {
          const hue = index === round.oddIndex ? round.oddHue : round.hue;
          return (
            <button
              key={index}
              type="button"
              onClick={() => pick(index)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: '10px',
                border: '1px solid color-mix(in srgb, hsl(0 0% 0%) 16%, transparent)',
                background: `hsl(${hue} 72% 52%)`,
                cursor: 'pointer',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
