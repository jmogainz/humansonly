'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import ScoreDisplay from '@/components/ScoreDisplay';
import TestStartScreen from '@/components/TestStartScreen';

const ANSWERS = [12, 8, 6, 29, 45, 5, 73, 15, 26, 74, 16, 42, 3, 9, 57];

type Plate = {
  answer: number;
  src: string | null;
};

function generatePlate(answer: number): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  const size = 360;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(0, 0, size, size);

  const center = size / 2;
  const radius = size * 0.42;

  for (let i = 0; i < 1400; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * radius;
    const x = center + Math.cos(angle) * dist;
    const y = center + Math.sin(angle) * dist;
    const dot = 3 + Math.random() * 7;
    const hue = 50 + Math.random() * 70;
    const sat = 45 + Math.random() * 35;
    const light = 40 + Math.random() * 30;
    ctx.fillStyle = `hsl(${hue} ${sat}% ${light}%)`;
    ctx.beginPath();
    ctx.arc(x, y, dot, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.font = 'bold 132px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'hsl(10 55% 46%)';
  ctx.fillText(String(answer), center, center + 8);

  for (let i = 0; i < 300; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * radius;
    const x = center + Math.cos(angle) * dist;
    const y = center + Math.sin(angle) * dist;
    const dot = 2 + Math.random() * 5;
    const hue = 355 + Math.random() * 30;
    const sat = 45 + Math.random() * 35;
    const light = 48 + Math.random() * 18;
    ctx.fillStyle = `hsl(${hue} ${sat}% ${light}%)`;
    ctx.beginPath();
    ctx.arc(x, y, dot, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  return canvas.toDataURL('image/png');
}

function classify(correct: number): string {
  if (correct >= 13) return 'Normal color vision';
  if (correct >= 10) return 'Mild red-green deficiency pattern';
  if (correct >= 7) return 'Moderate color deficiency pattern';
  return 'Strong color deficiency pattern';
}

export default function ColorBlindnessTest({ definition, onComplete }: TestGameProps) {
  const [started, setStarted] = useState(false);
  const [plates, setPlates] = useState<Plate[]>(() => ANSWERS.map((answer) => ({ answer, src: null })));
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [correct, setCorrect] = useState(0);

  const ensurePlate = useCallback((targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= ANSWERS.length) return;
    if (typeof document === 'undefined') return;

    window.setTimeout(() => {
      setPlates((prev) => {
        if (!prev[targetIndex] || prev[targetIndex].src) return prev;
        const next = [...prev];
        next[targetIndex] = {
          ...next[targetIndex],
          src: generatePlate(next[targetIndex].answer),
        };
        return next;
      });
    }, 0);
  }, []);

  useEffect(() => {
    if (started) {
      ensurePlate(0);
    }
  }, [ensurePlate, started]);

  useEffect(() => {
    if (started) {
      ensurePlate(index);
      ensurePlate(index + 1);
    }
  }, [index, ensurePlate, started]);

  const plate = plates[index];

  const submit = () => {
    if (!plate) return;
    if (!guess.trim()) return;

    const value = Number(guess.trim());
    const nextCorrect = value === plate.answer ? correct + 1 : correct;

    if (index === plates.length - 1) {
      const classification = classify(nextCorrect);
      onComplete({
        score: nextCorrect,
        unit: 'classification',
        metadata: {
          correct: nextCorrect,
          total: plates.length,
          classification,
        },
        label: classification,
      });
      return;
    }

    setCorrect(nextCorrect);
    setIndex((prev) => prev + 1);
    setGuess('');
  };

  if (!started) {
    return (
      <TestStartScreen
        description={definition.description}
        onStart={() => setStarted(true)}
      />
    );
  }

  return (
    <div className="game-container" style={{ alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1.5rem)', justifyContent: 'space-between', width: 'min(420px, 100%)', flexShrink: 0 }}>
        <ScoreDisplay label="Progress" value={`${index + 1}/${plates.length}`} />
        <ScoreDisplay label="Correct" value={correct} />
      </div>

      <div className="game-grid-container">
        {plate?.src ? (
          <img
            src={plate.src}
            alt="Ishihara plate"
            style={{ 
              width: 'min(360px, 90cqh, 90cqw)', 
              height: 'auto',
              aspectRatio: '1 / 1',
              borderRadius: '50%', 
              border: '1px solid var(--border)' 
            }}
          />
        ) : (
          <div
            style={{
              width: 'min(360px, 90cqh, 90cqw)', 
              aspectRatio: '1 / 1',
              borderRadius: '50%',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--text-muted)',
              background: 'var(--surface-raised)'
            }}
          >
            Generating plate...
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        style={{ width: 'min(420px, 100%)', display: 'grid', gap: '0.65rem', flexShrink: 0 }}
      >
        <input
          autoFocus
          value={guess}
          inputMode="numeric"
          onChange={(event) => setGuess(event.target.value.replace(/\D+/g, ''))}
          placeholder="Enter the number you see"
          style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}
        />
        <button type="submit" className="button" disabled={!plate?.src || !guess.trim()}>Next Plate</button>
      </form>

      <small style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.75rem', flexShrink: 0 }}>
        Screening only. This is not a medical diagnosis.
      </small>
    </div>
  );
}
