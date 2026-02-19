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
};

type Phase = 'memorize' | 'moving' | 'select' | 'feedback';

type LevelConfig = {
  totalObjects: number;
  targets: number;
  moveSpeed: number;
  moveDuration: number;
  memorizeTime: number;
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

function levelConfig(level: number): LevelConfig {
  const totalObjects = Math.min(4 + (level - 1), 12);
  return {
    totalObjects,
    targets: Math.min(Math.min(2 + Math.floor((level - 1) / 3), 5), totalObjects - 1),
    moveSpeed: Math.min(1.5 + (level - 1) * 0.15, 4),
    moveDuration: Math.max(5000 - (level - 1) * 100, 3000),
    memorizeTime: Math.max(2500 - (level - 1) * 50, 1500),
  };
}

function buildCircles(level: number, width: number, height: number): Circle[] {
  const config = levelConfig(level);
  const circles: Circle[] = [];
  const r = circleRadius(width);
  const padding = r + 10;

  for (let i = 0; i < config.totalObjects; i += 1) {
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

    const angle = Math.random() * Math.PI * 2;

    circles.push({
      id: i,
      x,
      y,
      vx: Math.cos(angle) * config.moveSpeed,
      vy: Math.sin(angle) * config.moveSpeed,
      r,
      target: false,
      selected: false,
    });
  }

  const shuffledIds = [...Array(config.totalObjects).keys()];
  for (let i = shuffledIds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
  }
  for (const id of shuffledIds.slice(0, config.targets)) {
    circles[id].target = true;
  }

  return circles;
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

    const c = circles[i];
    if (c.x < c.r) {
      c.x = c.r;
      c.vx = Math.abs(c.vx);
    }
    if (c.x > width - c.r) {
      c.x = width - c.r;
      c.vx = -Math.abs(c.vx);
    }
    if (c.y < c.r) {
      c.y = c.r;
      c.vy = Math.abs(c.vy);
    }
    if (c.y > height - c.r) {
      c.y = height - c.r;
      c.vy = -Math.abs(c.vy);
    }
  }
}

export default function ObjectTrackingTest({ definition, onComplete }: TestGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const circlesRef = useRef<Circle[]>([]);
  const phaseRef = useRef<Phase>('memorize');
  const rafRef = useRef<number | null>(null);
  const memorizeTimerRef = useRef<number | null>(null);
  const moveTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const { triggerFeedback } = useFeedback();

  const [started, setStarted] = useState(false);
  const [arena, setArena] = useState<{ width: number; height: number }>({
    width: MAX_WIDTH,
    height: MAX_HEIGHT,
  });
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(1);
  const [phase, setPhase] = useState<Phase>('memorize');
  const [targetCount, setTargetCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [colors, setColors] = useState<Record<string, string>>({});

  const updatePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearRoundSchedulers = useCallback(() => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (memorizeTimerRef.current) {
      window.clearTimeout(memorizeTimerRef.current);
      memorizeTimerRef.current = null;
    }
    if (moveTimerRef.current) {
      window.clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

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

    const currentPhase = phaseRef.current;

    for (const circle of circlesRef.current) {
      ctx.save();

      let fill = colors.text;
      let stroke: string | null = null;
      let glow: string | null = null;

      if (currentPhase === 'memorize' && circle.target) {
        fill = colors.warning;
        glow = colors.warning;
      } else if (currentPhase === 'select' && circle.selected) {
        stroke = colors.accent;
        glow = colors.accent;
      } else if (currentPhase === 'feedback') {
        if (circle.target && circle.selected) {
          fill = colors.success;
          glow = colors.success;
        } else if ((circle.target && !circle.selected) || (!circle.target && circle.selected)) {
          fill = colors.danger;
          glow = colors.danger;
        }
      }

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
  }, [arena.height, arena.width, colors]);

  const startLevelRound = useCallback(() => {
    if (!started || submitted) return;

    clearRoundSchedulers();

    const config = levelConfig(level);
    circlesRef.current = buildCircles(level, arena.width, arena.height);
    setTargetCount(config.targets);
    setSelectedCount(0);
    setIsCorrect(null);
    updatePhase('memorize');
    draw();

    memorizeTimerRef.current = window.setTimeout(() => {
      updatePhase('moving');

      const tick = () => {
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
        rafRef.current = window.requestAnimationFrame(tick);
      };

      rafRef.current = window.requestAnimationFrame(tick);
      moveTimerRef.current = window.setTimeout(() => {
        if (rafRef.current) {
          window.cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        updatePhase('select');
        draw();
      }, config.moveDuration);
    }, config.memorizeTime);
  }, [
    started,
    submitted,
    clearRoundSchedulers,
    level,
    arena.width,
    arena.height,
    updatePhase,
    draw,
  ]);

  const evaluateSelection = useCallback(() => {
    if (phaseRef.current !== 'select') return;

    const selected = circlesRef.current.filter((c) => c.selected);
    const correct =
      selected.length === targetCount && selected.every((circle) => circle.target);

    setIsCorrect(correct);
    updatePhase('feedback');
    draw();
    triggerFeedback(correct ? 'success' : 'danger');

    feedbackTimerRef.current = window.setTimeout(() => {
      if (correct) {
        setLevel((current) => current + 1);
        return;
      }

      setLives((current) => {
        const next = current - 1;
        if (next <= 0) {
          setSubmitted(true);
        }
        return next;
      });
    }, 1000);
  }, [draw, targetCount, triggerFeedback, updatePhase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const updateArena = () => {
      const parentWidth = canvas.parentElement?.getBoundingClientRect().width ?? MAX_WIDTH;
      const next = nextArena(parentWidth);
      setArena((current) =>
        current.width === next.width && current.height === next.height ? current : next
      );
    };

    updateArena();
    const observer = new ResizeObserver(updateArena);
    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || submitted || lives <= 0) return;
    startLevelRound();
  }, [started, submitted, lives, level, arena.width, arena.height, startLevelRound]);

  useEffect(() => {
    if (!started) return;
    draw();
  }, [started, phase, arena.width, arena.height, colors, draw]);

  useEffect(() => {
    return () => {
      clearRoundSchedulers();
    };
  }, [clearRoundSchedulers]);

  useEffect(() => {
    if (!submitted) return;
    const finalLevel = Math.max(0, level - 1);
    onComplete({
      score: finalLevel,
      unit: 'level',
      metadata: { level: finalLevel },
      label: `Level ${finalLevel}`,
    });
  }, [submitted, level, onComplete]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (phaseRef.current !== 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = arena.width / rect.width;
    const scaleY = arena.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const hit = circlesRef.current.find(
      (c) => !c.selected && Math.hypot(c.x - x, c.y - y) < c.r + 10
    );
    if (!hit) return;

    hit.selected = true;
    const nextSelectedCount = circlesRef.current.filter((c) => c.selected).length;
    setSelectedCount(nextSelectedCount);
    draw();

    if (nextSelectedCount >= targetCount) {
      evaluateSelection();
    }
  };

  return (
    <div className="game-container">
      <Scoreboard>
        <ScoreDisplay label="Level" value={level} />
        <LivesDisplay lives={lives} />
      </Scoreboard>

      <div className="game-content">
        {!started ? (
          <TestStartScreen description={definition.description} onStart={() => setStarted(true)} />
        ) : (
          <>
            <div style={{ textAlign: 'center', minHeight: '1.5rem', marginBottom: '0.5rem' }}>
              <p
                className="animate-in"
                style={{
                  margin: 0,
                  color:
                    phase === 'feedback'
                      ? isCorrect
                        ? 'var(--success)'
                        : 'var(--danger)'
                      : 'var(--text-muted)',
                  fontSize: '1.1rem',
                  fontWeight: phase === 'feedback' ? 600 : 400,
                }}
              >
                {phase === 'memorize' && `Memorize the ${targetCount} highlighted targets`}
                {phase === 'moving' && 'Keep your eyes on them...'}
                {phase === 'select' && `Select the ${targetCount} targets you tracked`}
                {phase === 'feedback' && (isCorrect ? 'Correct!' : 'Incorrect')}
              </p>
            </div>

            <div
              className="game-grid-container"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
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

            <div
              style={{
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '1rem',
              }}
            >
              {phase === 'select' && (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {selectedCount} / {targetCount} selected
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
