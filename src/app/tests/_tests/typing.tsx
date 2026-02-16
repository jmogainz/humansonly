'use client';

import { useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { shuffle } from '@/lib/utils';
import ScoreDisplay from '@/components/ScoreDisplay';

const PASSAGES = [
  'Cognitive training only works when you measure progress honestly and repeat difficult tasks consistently.',
  'Elite performance is built on tiny improvements repeated daily under focused and deliberate practice.',
  'Reaction speed, memory, and pattern recognition improve when effort stays sustained and feedback stays immediate.',
  'The best benchmark is your own past performance under the same conditions and the same level of effort.',
];

function countCorrect(reference: string, typed: string): number {
  let correct = 0;
  for (let i = 0; i < typed.length; i += 1) {
    if (typed[i] === reference[i]) correct += 1;
  }
  return correct;
}

export default function TypingTest({ onComplete }: TestGameProps) {
  const [passage] = useState(() => shuffle(PASSAGES)[0]);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const startRef = useRef<number | null>(null);

  const correct = useMemo(() => countCorrect(passage, typed), [passage, typed]);
  const accuracy = useMemo(() => {
    if (!typed.length) return 100;
    return (correct / typed.length) * 100;
  }, [typed.length, correct]);

  const elapsedMs = startRef.current ? performance.now() - startRef.current : 0;

  const wpm = useMemo(() => {
    if (!startRef.current || elapsedMs <= 0) return 0;
    const minutes = elapsedMs / 60_000;
    if (minutes <= 0) return 0;
    return (correct / 5) / minutes;
  }, [correct, elapsedMs]);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <ScoreDisplay label="WPM" value={wpm.toFixed(1)} />
        <ScoreDisplay label="Accuracy" value={`${accuracy.toFixed(1)}%`} />
      </div>

      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          lineHeight: 1.7,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {passage.split('').map((char, index) => {
          const typedChar = typed[index];
          const isCurrent = index === typed.length;
          const isCorrect = typedChar === char;
          const isWrong = typedChar !== undefined && typedChar !== char;

          return (
            <span
              key={index}
              style={{
                color: isCorrect ? 'var(--success)' : isWrong ? 'var(--danger)' : 'var(--text-muted)',
                background: isCurrent ? 'color-mix(in srgb, var(--accent) 24%, transparent)' : 'transparent',
                borderRadius: '3px',
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      <textarea
        value={typed}
        onChange={(event) => {
          const next = event.target.value;
          if (!startRef.current && next.length > 0) {
            startRef.current = performance.now();
          }
          if (done) return;
          setTyped(next);

          if (next.length >= passage.length && !done) {
            setDone(true);
            const completedElapsed = performance.now() - (startRef.current ?? performance.now());
            const minutes = completedElapsed / 60_000;
            const completedCorrect = countCorrect(passage, next.slice(0, passage.length));
            const finalWpm = minutes > 0 ? (completedCorrect / 5) / minutes : 0;
            const finalAccuracy = next.length ? (completedCorrect / next.length) * 100 : 0;
            onComplete({
              score: finalWpm,
              unit: 'wpm',
              metadata: {
                accuracy: finalAccuracy,
                elapsedMs: completedElapsed,
                correctChars: completedCorrect,
              },
              label: `${finalWpm.toFixed(1)} WPM`,
            });
          }
        }}
        rows={6}
        placeholder="Start typing here..."
        style={{ fontFamily: 'var(--font-mono)' }}
      />

      <small style={{ color: 'var(--text-muted)' }}>
        Timer starts on first keystroke. Finish the full paragraph to submit score.
      </small>
    </div>
  );
}
