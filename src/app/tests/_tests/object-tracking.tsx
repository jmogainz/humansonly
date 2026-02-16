'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';

type Circle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  target: boolean;
};

const WIDTH = 820;
const HEIGHT = 500;

function buildCircles(level: number): Circle[] {
  const count = Math.min(16, 7 + level * 2);
  const targetCount = Math.min(6, 2 + Math.floor(level / 2));

  const circles: Circle[] = [];
  for (let i = 0; i < count; i += 1) {
    const r = 16;
    let x = 0;
    let y = 0;
    let attempts = 0;
    do {
      x = 30 + Math.random() * (WIDTH - 60);
      y = 30 + Math.random() * (HEIGHT - 60);
      attempts += 1;
    } while (
      attempts < 60 &&
      circles.some((circle) => Math.hypot(circle.x - x, circle.y - y) < circle.r + r + 8)
    );

    circles.push({
      id: i,
      x,
      y,
      vx: (Math.random() * 2 - 1) * (1.5 + level * 0.15),
      vy: (Math.random() * 2 - 1) * (1.5 + level * 0.15),
      r,
      target: i < targetCount,
    });
  }

  return circles.sort(() => Math.random() - 0.5);
}

export default function ObjectTrackingTest({ onComplete }: TestGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const circlesRef = useRef<Circle[]>(buildCircles(1));
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'highlight' | 'moving' | 'select'>('highlight');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#232529';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const circle of circlesRef.current) {
      const isTargetVisible = phase === 'highlight' && circle.target;
      const isSelected = selected.has(circle.id);
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      ctx.fillStyle = isTargetVisible ? '#f2cf59' : '#f0f0f0';
      ctx.fill();

      if (isSelected) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#5adb7f';
        ctx.stroke();
      }
    }
  }, [phase, selected]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (phase !== 'highlight') return;
    const id = window.setTimeout(() => {
      setPhase('moving');
    }, 1800);
    return () => window.clearTimeout(id);
  }, [phase, level]);

  useEffect(() => {
    if (phase !== 'moving') return;

    const started = performance.now();
    let raf = 0;

    const tick = (time: number) => {
      const elapsed = time - started;
      for (const circle of circlesRef.current) {
        circle.x += circle.vx;
        circle.y += circle.vy;

        if (circle.x < circle.r || circle.x > WIDTH - circle.r) {
          circle.vx *= -1;
          circle.x = Math.max(circle.r, Math.min(WIDTH - circle.r, circle.x));
        }

        if (circle.y < circle.r || circle.y > HEIGHT - circle.r) {
          circle.vy *= -1;
          circle.y = Math.max(circle.r, Math.min(HEIGHT - circle.r, circle.y));
        }
      }

      draw();

      if (elapsed >= 5000) {
        setPhase('select');
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, draw]);

  useEffect(() => {
    if (phase !== 'select') return;
    draw();
  }, [phase, draw]);

  const evaluateSelection = (nextSelected: Set<number>) => {
    const targetIds = circlesRef.current.filter((circle) => circle.target).map((circle) => circle.id);
    if (nextSelected.size < targetIds.length) return;

    const correct = targetIds.every((id) => nextSelected.has(id));
    if (correct) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      circlesRef.current = buildCircles(nextLevel);
      setSelected(new Set());
      setPhase('highlight');
      return;
    }

    onComplete({
      score: level,
      unit: 'level',
      metadata: {
        level,
      },
      label: `Level ${level}`,
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== 'select') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const hit = circlesRef.current.find((circle) => Math.hypot(circle.x - x, circle.y - y) <= circle.r);
    if (!hit) return;

    const next = new Set(selected);
    if (next.has(hit.id)) {
      next.delete(hit.id);
    } else {
      next.add(hit.id);
    }
    setSelected(next);
    evaluateSelection(next);
  };

  const targetCount = circlesRef.current.filter((circle) => circle.target).length;

  return (
    <div style={{ display: 'grid', gap: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>Level {level}</strong>
        <small style={{ color: 'var(--text-muted)' }}>
          {phase === 'highlight'
            ? `Memorize ${targetCount} highlighted circles`
            : phase === 'moving'
              ? 'Track while circles move'
              : `Select ${targetCount} targets`}
        </small>
      </div>

      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          maxWidth: '820px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          cursor: phase === 'select' ? 'pointer' : 'default',
          background: '#232529',
        }}
      />
    </div>
  );
}
