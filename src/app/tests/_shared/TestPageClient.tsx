'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TestDefinition } from '@/lib/tests/types';
import TestLayout from '@/components/TestLayout';
import ResultScreen from '@/components/ResultScreen';
import { useScore } from '@/hooks/useScore';
import type { TestCompletePayload } from './types';
import { TEST_COMPONENTS } from '../_tests';
import { Spinner } from '@/components/Spinner';
import { GIA_SLUGS } from '@/constants';
import { TEST_REGISTRY_BY_SLUG } from '@/lib/tests/registry';
import {
  GIA_COMBINED_TEST_SLUG,
  markGiaCombinedSubmitted,
  recordGiaSubtestScore,
  startGiaAssessmentSession,
} from '@/lib/giaSession';

type TestPageClientProps = {
  definition: TestDefinition;
  flowParam?: string | null;
  startParam?: string | null;
};

type FlowTransitionState = {
  completedCount: number;
  nextSlug: (typeof GIA_SLUGS)[number];
};

export default function TestPageClient({ definition, flowParam, startParam }: TestPageClientProps) {
  const Game = TEST_COMPONENTS[definition.slug];
  const router = useRouter();
  const completionLockRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [runId, setRunId] = useState(0);
  const [combinedNotice, setCombinedNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<TestCompletePayload | null>(null);
  const [flowTransition, setFlowTransition] = useState<FlowTransitionState | null>(null);
  const [result, setResult] = useState<{
    score: number;
    label: string;
    percentile: number | null;
    personalBest: boolean;
  } | null>(null);
  const { submitScore, submitting } = useScore();
  const isGiaSubtest = definition.category === 'gia' && definition.slug !== GIA_COMBINED_TEST_SLUG;
  const isGiaFlow = isGiaSubtest && flowParam === 'gia';
  const isFlowStart = isGiaFlow && definition.slug === GIA_SLUGS[0] && startParam === '1';

  useEffect(() => {
    if (!isFlowStart) return;
    startGiaAssessmentSession();
  }, [isFlowStart]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const handleComplete = async (payload: TestCompletePayload) => {
    setPendingPayload(payload);
    setSubmitError(null);
    setCombinedNotice(null);
    setFlowTransition(null);
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

      let shouldAdvanceFlow = false;
      if (isGiaFlow) {
        const combined = recordGiaSubtestScore(definition.slug, payload.score);
        if (!combined.accepted) {
          setCombinedNotice('Combined GIA requires running all five modules in order from Start Assessment.');
        } else if (combined.ready) {
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
        shouldAdvanceFlow = combined.accepted;
      } else {
        setCombinedNotice(null);
      }

      if (shouldAdvanceFlow) {
        const currentIndex = GIA_SLUGS.indexOf(definition.slug as (typeof GIA_SLUGS)[number]);
        const nextSlug = currentIndex >= 0 ? GIA_SLUGS[currentIndex + 1] : undefined;
        if (nextSlug) {
          setFlowTransition({
            completedCount: currentIndex + 1,
            nextSlug,
          });
          if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
          }
          transitionTimerRef.current = setTimeout(() => {
            router.push(`/tests/${nextSlug}?flow=gia`);
          }, 850);
          return;
        }
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

  if (flowTransition) {
    const nextTestName = TEST_REGISTRY_BY_SLUG.get(flowTransition.nextSlug)?.name.replace('GIA ', '') ?? flowTransition.nextSlug;
    return (
      <TestLayout title={definition.name} subtitle={definition.description}>
        <div className="animate-in" style={{ display: 'grid', gap: '0.9rem' }}>
          <p
            style={{
              margin: 0,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
            }}
          >
            Assessment in Progress
          </p>
          <h2 style={{ margin: 0 }}>Module {flowTransition.completedCount} complete</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Next module: {nextTestName}
          </p>
          <div
            aria-hidden
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface-raised)',
              borderRadius: '999px',
              height: '10px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(flowTransition.completedCount / GIA_SLUGS.length) * 100}%`,
                height: '100%',
                background: 'var(--accent)',
                transition: 'width 250ms ease',
              }}
            />
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Loading next module...
          </p>
        </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, minHeight: 0 }}>
          {submitting && !submitError ? (
            <p style={{ margin: 0, color: 'var(--text-muted)', flexShrink: 0 }}>Saving score...</p>
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
                flexShrink: 0,
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
                    {submitting ? <Spinner size={16} /> : null}
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
                flexShrink: 0,
              }}
            >
              {combinedNotice}
            </p>
          ) : null}
          <div style={{ flex: 1, minHeight: 0 }}>
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
                setFlowTransition(null);
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
