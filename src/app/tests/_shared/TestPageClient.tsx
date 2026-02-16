'use client';

import { useState } from 'react';
import type { TestDefinition } from '@/lib/tests/types';
import TestLayout from '@/components/TestLayout';
import ResultScreen from '@/components/ResultScreen';
import { useScore } from '@/hooks/useScore';
import type { TestCompletePayload } from './types';
import { TEST_COMPONENTS } from '../_tests';
import {
  GIA_COMBINED_TEST_SLUG,
  markGiaCombinedSubmitted,
  recordGiaSubtestScore,
} from '@/lib/giaSession';

type TestPageClientProps = {
  definition: TestDefinition;
};

export default function TestPageClient({ definition }: TestPageClientProps) {
  const Game = TEST_COMPONENTS[definition.slug];
  const [runId, setRunId] = useState(0);
  const [combinedNotice, setCombinedNotice] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    label: string;
    percentile: number | null;
    personalBest: boolean;
  } | null>(null);
  const { submitScore, submitting } = useScore();

  if (!Game) {
    return (
      <TestLayout title={definition.name} subtitle={definition.description}>
        <p>Test implementation is missing for this route.</p>
      </TestLayout>
    );
  }

  return (
    <TestLayout
      title={definition.name}
      subtitle={definition.description}
      sidebar={
        <div style={{ display: 'grid', gap: '0.2rem', textAlign: 'right' }}>
          <small style={{ color: 'var(--text-muted)' }}>Score Unit</small>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>{definition.scoreUnit}</strong>
        </div>
      }
    >
      {result ? (
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          {combinedNotice ? (
            <p
              style={{
                margin: 0,
                border: '1px solid color-mix(in srgb, var(--accent) 45%, var(--border))',
                borderRadius: '10px',
                padding: '0.65rem 0.8rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
              }}
            >
              {combinedNotice}
            </p>
          ) : null}
          <ResultScreen
            testSlug={definition.slug}
            scoreLabel={result.label}
            scoreValue={result.score}
            scoreUnit={definition.scoreUnit}
            percentile={result.percentile}
            personalBest={result.personalBest}
            onPlayAgain={() => {
              setResult(null);
              setRunId((prev) => prev + 1);
              setCombinedNotice(null);
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          {submitting ? <p style={{ margin: 0, color: 'var(--text-muted)' }}>Submitting score...</p> : null}
          <Game
            key={runId}
            definition={definition}
            onComplete={async (payload: TestCompletePayload) => {
              try {
                const response = await submitScore(
                  definition.slug,
                  payload.score,
                  payload.unit,
                  payload.metadata
                );

                if (definition.category === 'gia' && definition.slug !== GIA_COMBINED_TEST_SLUG) {
                  const combined = recordGiaSubtestScore(definition.slug, payload.score);
                  if (combined.ready) {
                    const combinedResponse = await submitScore(
                      GIA_COMBINED_TEST_SLUG,
                      combined.total,
                      'net',
                      { breakdown: combined.breakdown }
                    );
                    markGiaCombinedSubmitted();
                    setCombinedNotice(
                      `GIA Combined submitted: ${combined.total.toFixed(2)} net (${combinedResponse.personalBest ? 'new PB' : 'recorded'})`
                    );
                  } else {
                    setCombinedNotice(null);
                  }
                } else {
                  setCombinedNotice(null);
                }

                setResult({
                  score: payload.score,
                  label: payload.label ?? `${payload.score} ${payload.unit}`,
                  percentile: response.percentile,
                  personalBest: response.personalBest,
                });
              } catch {
                setCombinedNotice(null);
                setResult({
                  score: payload.score,
                  label: payload.label ?? `${payload.score} ${payload.unit}`,
                  percentile: null,
                  personalBest: false,
                });
              }
            }}
          />
        </div>
      )}
    </TestLayout>
  );
}
