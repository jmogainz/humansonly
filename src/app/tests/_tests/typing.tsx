'use client';

import { useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { shuffle } from '@/lib/utils';
import ScoreDisplay from '@/components/ScoreDisplay';
import TestStartScreen from '@/components/TestStartScreen';

const PASSAGES = [
  'Cognitive training only works when you measure progress honestly and repeat difficult tasks consistently.',
  'Elite performance is built on tiny improvements repeated daily under focused and deliberate practice.',
  'Reaction speed, memory, and pattern recognition improve when effort stays sustained and feedback stays immediate.',
  'The best benchmark is your own past performance under the same conditions and the same level of effort.',
  'High performers protect attention by removing distractions before each session and reviewing mistakes right after.',
  'Consistency beats intensity when small gains are tracked daily and weak patterns are corrected without excuses.',
  'Accurate timing, clean technique, and honest scoring matter more than dramatic effort in short practice bursts.',
  'Mental endurance improves when tasks stay challenging enough to force focus but not so hard they become chaotic.',
  'Fast decisions become reliable only when fundamentals are repeated slowly, then tested under strict time limits.',
  'Great training sessions end with notes on what failed, what improved, and what should be repeated tomorrow.',
  'Precision under pressure comes from routines that reduce hesitation and keep every action intentionally controlled.',
  'Skill grows faster when feedback is immediate, specific, and tied to repeatable behaviors instead of vague goals.',
  'Benchmarking is useful only when tests are completed under comparable conditions with the same level of effort.',
  'Attention is a trainable resource, and it strengthens when interruptions are removed and priorities stay clear.',
  'Reliable progress appears when difficult drills are revisited often enough that weak spots cannot hide for long.',
  'Small timing errors compound quickly, so disciplined pacing and clean execution should always come before speed.',
  'Focused repetition builds confidence because each attempt clarifies patterns that were previously missed or ignored.',
  'Objective scoring prevents guesswork and helps you compare today with last week using the same performance rules.',
  'Deliberate practice means choosing hard tasks, tracking outcomes, and adjusting strategy instead of repeating habits.',
  'Steady improvement requires patient refinement, not random effort, especially when tests punish careless responses.',
];

function countCorrect(reference: string, typed: string): number {
  let correct = 0;
  for (let i = 0; i < typed.length; i += 1) {
    if (typed[i] === reference[i]) correct += 1;
  }
  return correct;
}

export default function TypingTest({ definition, onComplete }: TestGameProps) {
  const [started, setStarted] = useState(false);
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

  if (!started) {
    return (
      <TestStartScreen
        description={definition.description}
        onStart={() => setStarted(true)}
      />
    );
  }

  return (
    <div className="game-container">
      <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1rem)', flexWrap: 'wrap', flexShrink: 0 }}>
        <ScoreDisplay label="WPM" value={wpm.toFixed(1)} />
        <ScoreDisplay label="Accuracy" value={`${accuracy.toFixed(1)}%`} />
      </div>

      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: 'clamp(0.75rem, 3vw, 1.25rem)',
          lineHeight: 1.5,
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
          background: 'var(--surface-raised)',
          flexShrink: 0,
          maxHeight: '40%',
          overflowY: 'auto'
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
        onPaste={(event) => {
          event.preventDefault();
        }}
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
        rows={4}
        placeholder="Start typing here..."
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        style={{ fontFamily: 'var(--font-mono)', flex: '1', minHeight: '120px' }}
        autoFocus
      />

      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: '1.4', flexShrink: 0 }}>
        Timer starts on first keystroke. Finish the full paragraph to submit score. Pasting is disabled.
      </small>
    </div>
  );
}
