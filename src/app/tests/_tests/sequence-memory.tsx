'use client';

import { useEffect, useState } from 'react';
import type { TestGameProps } from '../_shared/types';

const GRID = 3;

function nextIndex() {
  return Math.floor(Math.random() * GRID * GRID);
}

export default function SequenceMemoryTest({ onComplete }: TestGameProps) {
  const [sequence, setSequence] = useState<number[]>([nextIndex()]);
  const [inputIndex, setInputIndex] = useState(0);
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [activeCell, setActiveCell] = useState<number | null>(null);

  useEffect(() => {
    setPhase('show');
    setInputIndex(0);

    let cancelled = false;
    const timers: number[] = [];

    sequence.forEach((value, idx) => {
      const startDelay = idx * 700;
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setActiveCell(value);
        }, startDelay)
      );
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setActiveCell(null);
          if (idx === sequence.length - 1) {
            setPhase('input');
          }
        }, startDelay + 360)
      );
    });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [sequence]);

  const handleClick = (index: number) => {
    if (phase !== 'input') return;

    if (sequence[inputIndex] !== index) {
      onComplete({
        score: sequence.length,
        unit: 'level',
        metadata: { sequenceLength: sequence.length },
        label: `Level ${sequence.length}`,
      });
      return;
    }

    if (inputIndex === sequence.length - 1) {
      setSequence((prev) => [...prev, nextIndex()]);
      return;
    }

    setInputIndex((prev) => prev + 1);
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>Level {sequence.length}</strong>
        <small style={{ color: 'var(--text-muted)' }}>
          {phase === 'show' ? 'Watch the sequence' : `Repeat from ${inputIndex + 1}/${sequence.length}`}
        </small>
      </div>

      <div
        style={{
          width: 'min(520px, 100%)',
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))`,
          gap: '0.6rem',
        }}
      >
        {Array.from({ length: GRID * GRID }, (_, index) => {
          const active = activeCell === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(index)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: active
                  ? 'color-mix(in srgb, var(--accent) 50%, #fff)'
                  : 'var(--surface-raised)',
                boxShadow: active ? '0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent)' : 'none',
                transition: 'all 130ms ease',
                cursor: phase === 'input' ? 'pointer' : 'default',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
