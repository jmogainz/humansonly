'use client';

import { useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import Scoreboard from '@/components/Scoreboard';
import ScoreDisplay from '@/components/ScoreDisplay';
import { randomInt } from '@/lib/utils';
import TestStartScreen from '@/components/TestStartScreen';

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

export default function HueTest({ definition, onComplete }: TestGameProps) {
  const [started, setStarted] = useState(false);
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
    <div className="game-container">
      <Scoreboard>
        <ScoreDisplay label="Level" value={level} />
      </Scoreboard>

      <div className="game-content">
        {!started ? (
          <TestStartScreen
            description={definition.description}
            onStart={() => setStarted(true)}
          />
        ) : (
          <>
            <p style={{ margin: 0, color: 'var(--text-muted)', textAlign: 'center', fontSize: '1rem' }}>Click the tile with a slightly different hue.</p>

            <div className="game-grid-container">
              <div
                className="game-grid"
                style={{
                  gridTemplateColumns: `repeat(${round.grid}, minmax(0, 1fr))`,
                  gap: 'clamp(0.2rem, 1.5cqw, 0.6rem)',
                }}
              >
                {tiles.map((index) => {
                  const hue = index === round.oddIndex ? round.oddHue : round.hue;
                  return (
                    <button
                      key={index}
                      type="button"
                      className="game-tile"
                      onClick={() => pick(index)}
                      style={{
                        border: '1px solid color-mix(in srgb, hsl(0 0% 0%) 12%, transparent)',
                        background: `hsl(${hue} 72% 52%)`,
                        borderRadius: 'clamp(6px, 1.5cqw, 12px)',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
