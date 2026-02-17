'use client';

import { useMemo, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import LivesDisplay from '@/components/LivesDisplay';
import ScoreDisplay from '@/components/ScoreDisplay';
import TestStartScreen from '@/components/TestStartScreen';

const WORDS = Array.from(new Set([
  'planet', 'forest', 'camera', 'pencil', 'signal', 'window', 'garden', 'music', 'orange', 'memory',
  'silent', 'engine', 'button', 'future', 'energy', 'bridge', 'sprint', 'cookie', 'rabbit', 'summer',
  'winter', 'market', 'shelter', 'vacuum', 'anchor', 'tablet', 'wisdom', 'horizon', 'bubble', 'rocket',
  'puzzle', 'ladder', 'tunnel', 'mirror', 'guitar', 'sample', 'cotton', 'marble', 'ticket', 'jungle',
  'thunder', 'ocean', 'candle', 'school', 'wallet', 'fabric', 'parade', 'moment', 'dragon', 'breeze',
  'castle', 'rescue', 'galaxy', 'kernel', 'pepper', 'vector', 'pirate', 'helmet', 'orchid', 'flight',
  'thread', 'pillow', 'bronze', 'silver', 'radius', 'violin', 'search', 'global', 'native', 'vacant',
  'finish', 'submit', 'canvas', 'spatial', 'neural', 'vision', 'binary', 'rhythm', 'syntax', 'player',
  'format', 'safety', 'travel', 'bright', 'script', 'potion', 'racing', 'atomic', 'motion', 'belief',
  'friend', 'copper', 'timber', 'ledger', 'harbor', 'desert', 'meadow', 'crystal', 'helmet', 'harvest',
  'island', 'canyon', 'quartz', 'ember', 'ripple', 'comet', 'compass', 'bottle', 'lantern', 'parcel',
]));

function pickNextWord(seen: Set<string>, usedWords: Set<string>, round: number, previousWord: string): string {
  const repeatChance = Math.min(0.75, 0.25 + round * 0.015);
  const pickSeen = seen.size > 0 && Math.random() < repeatChance;

  if (pickSeen) {
    const seenArray = [...seen].filter((value) => value !== previousWord);
    if (seenArray.length > 0) {
      return seenArray[Math.floor(Math.random() * seenArray.length)];
    }
  }

  const unseenWords = WORDS.filter((candidate) => !usedWords.has(candidate) && candidate !== previousWord);
  if (unseenWords.length > 0) {
    return unseenWords[Math.floor(Math.random() * unseenWords.length)];
  }

  if (pickSeen) {
    const seenArray = [...seen];
    return seenArray[Math.floor(Math.random() * seenArray.length)];
  }

  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export default function VerbalMemoryTest({ definition, onComplete }: TestGameProps) {
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(1);
  const [seenWords, setSeenWords] = useState<Set<string>>(new Set());
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [word, setWord] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);

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
    setWord(pickNextWord(nextSeen, nextUsed, nextRound, word));
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
    <div className="game-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'clamp(0.5rem, 2vw, 1.5rem)', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1.5rem)', flexWrap: 'wrap' }}>
          <ScoreDisplay label="Score" value={score} status="success" />
          <ScoreDisplay label="Round" value={round} status="neutral" />
        </div>
        <LivesDisplay lives={lives} />
      </div>

      <div
        className="game-grid-container"
        style={{
          border: '1px solid var(--border)',
          borderRadius: '14px',
          background: 'var(--surface-raised)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 'clamp(1.8rem, 8vw, 3.5rem)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{word}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.8rem', flexShrink: 0 }}>
        <button className="button" type="button" onClick={() => answer('seen')}>SEEN</button>
        <button className="button buttonGhost" type="button" onClick={() => answer('new')}>NEW</button>
      </div>
    </div>
  );
}
