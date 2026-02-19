'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import Scoreboard from '@/components/Scoreboard';
import ScoreDisplay from '@/components/ScoreDisplay';
import LivesDisplay from '@/components/LivesDisplay';
import TestStartScreen from '@/components/TestStartScreen';
import { useFeedback } from '@/components/FeedbackContext';

type Circle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  target: boolean;
  selected: boolean;
  correct?: boolean; // Used for feedback phase
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
  const count = Math.min(18, 6 + Math.floor(level / 2));
  const targetCount = Math.min(6, 2 + Math.floor(level / 4));
  
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
      attempts < 100 &&
      circles.some((circle) => Math.hypot(circle.x - x, circle.y - y) < circle.r + r + 12)
    );

    const speed = 1.6 + level * 0.12;
    const angle = Math.random() * Math.PI * 2;

    circles.push({
      id: i,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r,
      target: i < targetCount,
      selected: false,
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
    }
    
    // Boundary checks after collision resolution
    const c = circles[i];
    if (c.x < c.r) { c.x = c.r; c.vx = Math.abs(c.vx); }
    if (c.x > width - c.r) { c.x = width - c.r; c.vx = -Math.abs(c.vx); }
    if (c.y < c.r) { c.y = c.r; c.vy = Math.abs(c.vy); }
    if (c.y > height - c.r) { c.y = height - c.r; c.vy = -Math.abs(c.vy); }
  }
}

export default function ObjectTrackingTest({ definition, onComplete }: TestGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const circlesRef = useRef<Circle[]>([]);
  const { triggerFeedback } = useFeedback();
  
  const [started, setStarted] = useState(false);
  const [arena, setArena] = useState<{ width: number; height: number }>({ width: MAX_WIDTH, height: MAX_HEIGHT });
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<'memorize' | 'moving' | 'select' | 'feedback'>('memorize');
  const [selectedCount, setSelectedCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const targetCount = circlesRef.current.filter(c => c.target).length;

  const [colors, setColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    setColors({
      bg: rootStyles.getPropertyValue('--surface-raised').trim() || '#232529',
      text: rootStyles.getPropertyValue('--text-primary').trim() || '#f0f0f0',
      accent: rootStyles.getPropertyValue('--accent').trim() || '#06b6d4',
      success: rootStyles.getPropertyValue('--success').trim() || '#10b981',
      danger: rootStyles.getPropertyValue('--danger').trim() || '#ef4444',
      warning: rootStyles.getPropertyValue('--warning').trim() || '#f59e0b',
    });
  }, [started]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors.bg) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, arena.width, arena.height);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, arena.width, arena.height);

    for (const circle of circlesRef.current) {
      ctx.save();
      
      let fill = colors.text;
      let stroke: string | null = null;
      let glow: string | null = null;

      if (phase === 'memorize' && circle.target) {
        fill = colors.warning;
        glow = colors.warning;
      } else if (phase === 'select' && circle.selected) {
        stroke = colors.accent;
        glow = colors.accent;
      } else if (phase === 'feedback') {
        if (circle.target) {
           fill = colors.success;
           glow = colors.success;
        }
        if (circle.selected && !circle.target) {
           stroke = colors.danger;
           glow = colors.danger;
        }
      }

      // Draw shadow/glow
      if (glow) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = glow;
      }

      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.restore();
    }
  }, [arena, phase, colors]);

  // Initial build and resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const updateArena = () => {
      const parentWidth = canvas.parentElement?.getBoundingClientRect().width ?? MAX_WIDTH;
      const next = nextArena(parentWidth);
      setArena(next);
    };

    updateArena();
    const observer = new ResizeObserver(updateArena);
    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, []);

  // Initialize circles when level or started changes
  useEffect(() => {
    if (!started) return;
    circlesRef.current = buildCircles(level, arena.width, arena.height);
    setSelectedCount(0);
    setIsCorrect(null);
    setPhase('memorize');
    draw();
  }, [started, level, arena.width, arena.height, draw]);

  // Phase transitions
  useEffect(() => {
    if (!started) return;

    if (phase === 'memorize') {
      const id = window.setTimeout(() => setPhase('moving'), 2000);
      return () => window.clearTimeout(id);
    }

    if (phase === 'moving') {
      let raf = 0;
      const start = performance.now();
      const duration = 5000 + Math.min(3000, level * 200);

      const tick = (time: number) => {
        const elapsed = time - start;
        
        for (const c of circlesRef.current) {
          c.x += c.vx;
          c.y += c.vy;
          
          if (c.x < c.r || c.x > arena.width - c.r) {
            c.vx *= -1;
            c.x = clamp(c.x, c.r, arena.width - c.r);
          }
          if (c.y < c.r || c.y > arena.height - c.r) {
            c.vy *= -1;
            c.y = clamp(c.y, c.r, arena.height - c.r);
          }
        }
        
        resolveCollisions(circlesRef.current, arena.width, arena.height);
        draw();

        if (elapsed < duration) {
          raf = requestAnimationFrame(tick);
        } else {
          setPhase('select');
        }
      };
      
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    if (phase === 'feedback') {
      const id = window.setTimeout(() => {
        const targetIds = circlesRef.current.filter(c => c.target).map(c => c.id);
        const selectedIds = circlesRef.current.filter(c => c.selected).map(c => c.id);
        const correct = targetIds.length === selectedIds.length && targetIds.every(id => selectedIds.includes(id));

        if (correct) {
          setLevel(l => l + 1);
        } else {
          setLives(l => {
            const next = l - 1;
            if (next <= 0) {
              setSubmitted(true);
            }
            return next;
          });
          // Re-trigger current level if still have lives
          if (lives > 1) {
            circlesRef.current = buildCircles(level, arena.width, arena.height);
            setSelectedCount(0);
            setPhase('memorize');
          }
        }
      }, 1500);
      return () => window.clearTimeout(id);
    }
  }, [started, phase, arena, draw, level, lives]);

  // Submission
  useEffect(() => {
    if (submitted) {
      onComplete({
        score: level - 1,
        unit: 'level',
        metadata: { level: level - 1 },
        label: `Level ${level - 1}`,
      });
    }
  }, [submitted, level, onComplete]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (phase !== 'select') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scaleX = arena.width / rect.width;
    const scaleY = arena.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const hit = circlesRef.current.find(c => Math.hypot(c.x - x, c.y - y) < c.r + 10);
    if (hit) {
      if (hit.selected) {
        hit.selected = false;
        setSelectedCount(s => s - 1);
      } else if (selectedCount < targetCount) {
        hit.selected = true;
        setSelectedCount(s => s + 1);
      }
      draw();
    }
  };

  const handleSubmit = () => {
    if (selectedCount !== targetCount) return;
    
    const targetIds = circlesRef.current.filter(c => c.target).map(c => c.id);
    const selectedIds = circlesRef.current.filter(c => c.selected).map(c => c.id);
    const correct = targetIds.length === selectedIds.length && targetIds.every(id => selectedIds.includes(id));
    
    setIsCorrect(correct);
    if (correct) {
      triggerFeedback('success');
    }
    // 'danger' feedback is handled by LivesDisplay when lives decrement
    
    setPhase('feedback');
    draw();
  };

  return (
    <div className="game-container">
      <Scoreboard>
        <ScoreDisplay label="Level" value={level} />
        <LivesDisplay lives={lives} />
      </Scoreboard>

      <div className="game-content">
        {!started ? (
          <TestStartScreen
            description={definition.description}
            onStart={() => setStarted(true)}
          />
        ) : (
          <>
            <div style={{ textAlign: 'center', minHeight: '1.5rem', marginBottom: '0.5rem' }}>
              <p className="animate-in" style={{ margin: 0, color: phase === 'feedback' ? (isCorrect ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)', fontSize: '1.1rem', fontWeight: phase === 'feedback' ? 600 : 400 }}>
                {phase === 'memorize' && `Memorize the ${targetCount} highlighted targets`}
                {phase === 'moving' && 'Keep your eyes on them...'}
                {phase === 'select' && `Select the ${targetCount} targets you tracked`}
                {phase === 'feedback' && (isCorrect ? 'Correct!' : 'Incorrect')}
              </p>
            </div>

            <div className="game-grid-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <canvas
                ref={canvasRef}
                width={arena.width}
                height={arena.height}
                onPointerDown={handlePointerDown}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxWidth: `${MAX_WIDTH}px`,
                  borderRadius: '16px',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  cursor: phase === 'select' ? 'pointer' : 'default',
                  touchAction: 'none',
                  boxShadow: phase === 'select' ? '0 0 20px rgba(6, 182, 212, 0.1)' : 'none',
                  transition: 'box-shadow 0.3s ease',
                }}
              />
            </div>

            <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1rem' }}>
              {phase === 'select' && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {selectedCount} / {targetCount} selected
                  </span>
                  <button
                    className="button"
                    onClick={handleSubmit}
                    disabled={selectedCount !== targetCount}
                    style={{ minWidth: '120px' }}
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
