'use client';

import { useRef, useState } from 'react';
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
  const completionLockRef = useRef(false);
  const [runId, setRunId] = useState(0);
  const [combinedNotice, setCombinedNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<TestCompletePayload | null>(null);
  const [result, setResult] = useState<{
    score: number;
    label: string;
    percentile: number | null;
    personalBest: boolean;
  } | null>(null);
  const { submitScore, submitting } = useScore();

  const handleComplete = async (payload: TestCompletePayload) => {
    setPendingPayload(payload);
    setSubmitError(null);
    setCombinedNotice(null);
    setResult({
      score: payload.score,
      label: payload.label ?? `${payload.score} ${payload.unit}`,
      percentile: null,
      personalBest: false,
    });

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
          try {
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
          } catch {
            setCombinedNotice('GIA Combined could not sync this run. Your subtest score was saved.');
          }
        } else {
          setCombinedNotice(null);
        }
      } else {
        setCombinedNotice(null);
      }

      setResult((prev) => ({
        score: prev?.score ?? payload.score,
        label: prev?.label ?? payload.label ?? `${payload.score} ${payload.unit}`,
        percentile: response.percentile,
        personalBest: response.personalBest,
      }));
      setPendingPayload(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit score';
      setCombinedNotice(null);
      setSubmitError(`${message}. Your local result is shown below.`);
    }
  };

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
          <small style={{ color: 'var(--text-muted)' }}>Scored in</small>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>{definition.scoreUnit}</strong>
        </div>
      }
    >
      {result ? (
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          {submitting && !submitError ? (
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Saving score...</p>
          ) : null}
          {submitError ? (
            <div
              style={{
                margin: 0,
                border: '1px solid color-mix(in srgb, var(--danger) 45%, var(--border))',
                borderRadius: '10px',
                padding: '0.75rem 0.8rem',
                display: 'grid',
                gap: '0.5rem',
              }}
            >
              <p style={{ margin: 0, color: 'var(--danger)' }}>{submitError}</p>
              {pendingPayload ? (
                <div>
                  <button
                    type="button"
                    className="button buttonGhost"
                    onClick={() => {
                      void handleComplete(pendingPayload);
                    }}
                    disabled={submitting}
                  >
                    {submitting ? 'Retrying...' : 'Retry Submission'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
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
              completionLockRef.current = false;
              setResult(null);
              setRunId((prev) => prev + 1);
              setCombinedNotice(null);
              setSubmitError(null);
              setPendingPayload(null);
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          <Game
            key={runId}
            definition={definition}
            onComplete={(payload: TestCompletePayload) => {
              if (completionLockRef.current) return;
              completionLockRef.current = true;
              void handleComplete(payload);
            }}
          />
        </div>
      )}
    </TestLayout>
  );
}
