'use client';

import { useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { shuffle } from '@/lib/utils';
import LivesDisplay from '@/components/LivesDisplay';
import ScoreDisplay from '@/components/ScoreDisplay';

const WORDS = shuffle([
  'planet', 'forest', 'camera', 'pencil', 'signal', 'window', 'garden', 'music', 'orange', 'memory',
  'silent', 'engine', 'button', 'future', 'energy', 'sudden', 'bridge', 'sprint', 'cookie', 'rabbit',
  'summer', 'winter', 'planetary', 'market', 'shelter', 'vacuum', 'anchor', 'tablet', 'wisdom', 'horizon',
  'bubble', 'rocket', 'puzzle', 'ladder', 'tunnel', 'mirror', 'guitar', 'sample', 'cotton', 'marble',
  'ticket', 'jungle', 'thunder', 'ocean', 'candle', 'school', 'wallet', 'fabric', 'parade', 'moment',
  'dragon', 'breeze', 'castle', 'rescue', 'galaxy', 'absorb', 'kernel', 'pepper', 'vector', 'pirate',
  'helmet', 'orchid', 'flight', 'random', 'thread', 'pillow', 'bronze', 'silver', 'golden', 'radius',
  'violin', 'search', 'global', 'native', 'vacant', 'finish', 'submit', 'canvas', 'spatial', 'neural',
  'vision', 'binary', 'rhythm', 'syntax', 'player', 'format', 'safety', 'travel', 'bright', 'wallets',
  'future', 'script', 'potion', 'castle', 'racing', 'atomic', 'haptic', 'motion', 'belief', 'friend',
]);

function pickNextWord(seen: Set<string>, usedWords: Set<string>, round: number): string {
  const repeatChance = Math.min(0.75, 0.25 + round * 0.015);
  const pickSeen = seen.size > 0 && Math.random() < repeatChance;

  if (pickSeen) {
    const seenArray = [...seen];
    return seenArray[Math.floor(Math.random() * seenArray.length)];
  }

  for (const word of WORDS) {
    if (!usedWords.has(word)) return word;
  }

  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export default function VerbalMemoryTest({ onComplete }: TestGameProps) {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(1);
  const [seenWords, setSeenWords] = useState<Set<string>>(new Set());
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [word, setWord] = useState(() => WORDS[0]);

  const status = useMemo(() => `Round ${round}`, [round]);

  const answer = (choice: 'seen' | 'new') => {
    const actuallySeen = seenWords.has(word);
    const correct = (choice === 'seen' && actuallySeen) || (choice === 'new' && !actuallySeen);

    const nextSeen = new Set(seenWords);
    nextSeen.add(word);
    setSeenWords(nextSeen);

    const nextUsed = new Set(usedWords);
    nextUsed.add(word);
    setUsedWords(nextUsed);

    if (correct) {
      setScore((prev) => prev + 1);
    } else {
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) {
        onComplete({
          score,
          unit: 'count',
          metadata: {
            rounds: round,
          },
          label: `${score} correct`,
        });
        return;
      }
    }

    const nextRound = round + 1;
    setRound(nextRound);
    setWord(pickNextWord(nextSeen, nextUsed, nextRound));
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <ScoreDisplay label="Score" value={score} />
        <LivesDisplay lives={lives} />
        <ScoreDisplay label="Progress" value={status} />
      </div>

      <div
        style={{
          minHeight: '240px',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--surface-raised)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 'clamp(2rem, 7vw, 3.5rem)', fontFamily: 'var(--font-mono)' }}>{word}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.8rem' }}>
        <button className="button" type="button" onClick={() => answer('seen')}>SEEN</button>
        <button className="button buttonGhost" type="button" onClick={() => answer('new')}>NEW</button>
      </div>
    </div>
  );
}
