'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import Scoreboard from '@/components/Scoreboard';
import ScoreDisplay from '@/components/ScoreDisplay';
import TestStartScreen from '@/components/TestStartScreen';

type Circle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  target: boolean;
};

const MAX_WIDTH = 820;
const MAX_HEIGHT = 500;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 260;
const ARENA_RATIO = MAX_WIDTH / MAX_HEIGHT;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function circleRadius(width: number): number {
  return width < 520 ? 18 : 16;
}

function nextArena(parentWidth: number): { width: number; height: number } {
  const width = clamp(Math.round(parentWidth), MIN_WIDTH, MAX_WIDTH);
  const height = clamp(Math.round(width / ARENA_RATIO), MIN_HEIGHT, MAX_HEIGHT);
  return { width, height };
}

function buildCircles(level: number, width: number, height: number): Circle[] {
  const areaRatio = (width * height) / (MAX_WIDTH * MAX_HEIGHT);
  const densityScale = clamp(Math.sqrt(areaRatio), 0.65, 1);
  const count = Math.max(6, Math.round(Math.min(16, (7 + level * 2) * densityScale)));
  const targetCount = Math.min(Math.max(2, Math.floor(count * 0.38)), 6);

  const circles: Circle[] = [];
  const r = circleRadius(width);
  const padding = r + 10;

  for (let i = 0; i < count; i += 1) {
    let x = 0;
    let y = 0;
    let attempts = 0;

    do {
      x = padding + Math.random() * (width - padding * 2);
      y = padding + Math.random() * (height - padding * 2);
      attempts += 1;
    } while (
      attempts < 80 &&
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

function resolveCollisions(circles: Circle[], width: number, height: number): void {
  for (let i = 0; i < circles.length; i += 1) {
    for (let j = i + 1; j < circles.length; j += 1) {
      const a = circles[i];
      const b = circles[j];

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distance = Math.hypot(dx, dy);
      const minDistance = a.r + b.r + 4;

      if (distance >= minDistance) continue;

      if (distance < 0.001) {
        dx = (Math.random() - 0.5) * 0.01;
        dy = (Math.random() - 0.5) * 0.01;
        distance = Math.hypot(dx, dy);
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;

      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      const relativeVx = b.vx - a.vx;
      const relativeVy = b.vy - a.vy;
      const velocityAlongNormal = relativeVx * nx + relativeVy * ny;

      if (velocityAlongNormal < 0) {
        const impulse = -velocityAlongNormal;
        a.vx -= impulse * nx;
        a.vy -= impulse * ny;
        b.vx += impulse * nx;
        b.vy += impulse * ny;
      }

      a.x = clamp(a.x, a.r, width - a.r);
      a.y = clamp(a.y, a.r, height - a.r);
      b.x = clamp(b.x, b.r, width - b.r);
      b.y = clamp(b.y, b.r, height - b.r);
    }
  }
}

export default function ObjectTrackingTest({ definition, onComplete }: TestGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const circlesRef = useRef<Circle[]>([]);
  const submittedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [arena, setArena] = useState<{ width: number; height: number }>({ width: MAX_WIDTH, height: MAX_HEIGHT });
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'highlight' | 'moving' | 'select'>('highlight');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [targetCount, setTargetCount] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, arena.width, arena.height);
    const rootStyles = getComputedStyle(document.documentElement);
    const canvasBg = rootStyles.getPropertyValue('--surface-raised').trim() || '#232529';
    const circleColor = rootStyles.getPropertyValue('--text-primary').trim() || '#f0f0f0';
    const highlightColor = rootStyles.getPropertyValue('--warning').trim() || '#f2cf59';
    const selectedColor = rootStyles.getPropertyValue('--success').trim() || '#5adb7f';

    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, arena.width, arena.height);

    for (const circle of circlesRef.current) {
      const isTargetVisible = phase === 'highlight' && circle.target;
      const isSelected = selected.has(circle.id);
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      ctx.fillStyle = isTargetVisible ? highlightColor : circleColor;
      ctx.fill();

      if (isSelected) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = selectedColor;
        ctx.stroke();
      }
    }
  }, [arena.width, arena.height, phase, selected]);

  useEffect(() => {
    if (!started) return;
    circlesRef.current = buildCircles(level, arena.width, arena.height);
    setTargetCount(circlesRef.current.filter((circle) => circle.target).length);
    draw();
  }, [arena.width, arena.height, level, draw, started]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const updateArena = () => {
      const parentWidth = canvas.parentElement?.getBoundingClientRect().width ?? MAX_WIDTH;
      setArena(nextArena(parentWidth));
    };

    updateArena();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateArena);
      observer.observe(canvas.parentElement);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateArena);
    return () => window.removeEventListener('resize', updateArena);
  }, []);

  useEffect(() => {
    if (started) {
      draw();
    }
  }, [draw, started]);

  useEffect(() => {
    if (!started || phase !== 'highlight') return;
    const id = window.setTimeout(() => {
      setPhase('moving');
    }, 1800);
    return () => window.clearTimeout(id);
  }, [phase, level, started]);

  useEffect(() => {
    if (!started || phase !== 'moving') return;

    const startedTime = performance.now();
    let raf = 0;

    const tick = (time: number) => {
      const elapsed = time - startedTime;
      for (const circle of circlesRef.current) {
        circle.x += circle.vx;
        circle.y += circle.vy;

        if (circle.x < circle.r || circle.x > arena.width - circle.r) {
          circle.vx *= -1;
          circle.x = clamp(circle.x, circle.r, arena.width - circle.r);
        }

        if (circle.y < circle.r || circle.y > arena.height - circle.r) {
          circle.vy *= -1;
          circle.y = clamp(circle.y, circle.r, arena.height - circle.r);
        }
      }

      resolveCollisions(circlesRef.current, arena.width, arena.height);
      draw();

      if (elapsed >= 5000) {
        setPhase('select');
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, arena.width, arena.height, draw, started]);

  useEffect(() => {
    if (phase !== 'select' || !started) return;
    draw();
  }, [phase, draw, started]);

  const evaluateSelection = (nextSelected: Set<number>) => {
    const targetIds = circlesRef.current.filter((circle) => circle.target).map((circle) => circle.id);
    const correct = targetIds.every((id) => nextSelected.has(id));
    if (correct) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setSelected(new Set());
      setPhase('highlight');
      return;
    }

    if (submittedRef.current) return;
    submittedRef.current = true;
    onComplete({
      score: level,
      unit: 'level',
      metadata: {
        level,
      },
      label: `Level ${level}`,
    });
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'select') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = arena.width / rect.width;
    const scaleY = arena.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const hit = circlesRef.current.find((circle) => Math.hypot(circle.x - x, circle.y - y) <= circle.r + 4);
    if (!hit) return;

    const next = new Set(selected);
    if (next.has(hit.id)) {
      next.delete(hit.id);
    } else {
      if (next.size >= targetCount) return;
      next.add(hit.id);
    }
    setSelected(next);
  };

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
            {phase === 'select' ? (
               <ScoreDisplay label="Selected" value={`${selected.size} / ${targetCount}`} status={selected.size === targetCount ? 'success' : 'neutral'} />
            ) : (
               <ScoreDisplay label="Targets" value={targetCount} />
            )}
          </Scoreboard>

          <div className="game-content">
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0, fontSize: '1rem' }}>
              {phase === 'highlight'
                ? `Memorize ${targetCount} targets`
                : phase === 'moving'
                  ? 'Track while circles move'
                  : `Select ${targetCount} targets, then submit`}
            </p>

            <div className="game-grid-container" style={{ flex: 1 }}>
              <canvas
                ref={canvasRef}
                width={arena.width}
                height={arena.height}
                onPointerDown={handleCanvasPointerDown}
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: `${MAX_WIDTH}px`,
                  maxHeight: `${MAX_HEIGHT}px`,
                  margin: '0 auto',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  cursor: phase === 'select' ? 'pointer' : 'default',
                  background: 'var(--surface-raised)',
                  touchAction: 'manipulation',
                }}
              />
            </div>
            {phase === 'select' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="button buttonGhost"
                    onClick={() => setSelected(new Set())}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="button"
                    disabled={selected.size !== targetCount}
                    onClick={() => evaluateSelection(selected)}
                    style={{ padding: '0.5rem 1.5rem' }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
