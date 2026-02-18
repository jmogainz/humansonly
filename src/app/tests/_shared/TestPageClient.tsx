'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TestDefinition } from '@/lib/tests/types';
import TestLayout from '@/components/TestLayout';
import ResultScreen from '@/components/ResultScreen';
import AssessmentCompleteScreen from '@/components/AssessmentCompleteScreen';
import { useScore } from '@/hooks/useScore';
import { useAuth } from '@/hooks/useAuth';
import type { TestCompletePayload } from './types';
import { TEST_COMPONENTS } from '../_tests';
import { Spinner } from '@/components/Spinner';
import { GIA_SLUGS } from '@/constants';
import { TEST_REGISTRY_BY_SLUG } from '@/lib/tests/registry';
import {
  GIA_COMBINED_TEST_SLUG,
  cancelGiaAssessmentSession,
  markGiaCombinedSubmitted,
  recordGiaSubtestScore,
  startGiaAssessmentSession,
} from '@/lib/giaSession';
import { formatNumber } from '@/lib/utils';

type TestPageClientProps = {
  definition: TestDefinition;
  flowParam?: string | null;
  startParam?: string | null;
};

type FlowTransitionState = {
  completedCount: number;
  nextSlug: (typeof GIA_SLUGS)[number];
  completedScore: number;
};

type AssessmentCompleteState = {
  total: number;
  breakdown: Record<string, number>;
  combinedPersonalBest: boolean;
};

export default function TestPageClient({ definition, flowParam, startParam }: TestPageClientProps) {
  const Game = TEST_COMPONENTS[definition.slug];
  const router = useRouter();
  const { user } = useAuth();
  const completionLockRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [runId, setRunId] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<TestCompletePayload | null>(null);
  const [flowTransition, setFlowTransition] = useState<FlowTransitionState | null>(null);
  const [assessmentComplete, setAssessmentComplete] = useState<AssessmentCompleteState | null>(null);
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
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  const handleQuit = () => {
    if (window.confirm('Quit the GIA Assessment? Your scores so far will still be saved.')) {
      cancelGiaAssessmentSession();
      router.push('/');
    }
  };

  const handleComplete = async (payload: TestCompletePayload) => {
    setPendingPayload(payload);
    setSubmitError(null);
    setSubmitNotice(null);
    setFlowTransition(null);
    setAssessmentComplete(null);

    try {
      const response = await submitScore(
        definition.slug,
        payload.score,
        payload.unit,
        payload.metadata
      );
      if (response.saved === false) {
        setSubmitNotice(response.discardReason ?? 'This run was not saved.');
        setResult({
          score: payload.score,
          label: payload.label ?? `${payload.score} ${payload.unit}`,
          percentile: null,
          personalBest: false,
        });
        setPendingPayload(null);
        return;
      }

      if (isGiaFlow) {
        const combined = recordGiaSubtestScore(definition.slug, payload.score);

        if (!combined.accepted) {
          // Out-of-order or session expired — fall through to regular result
          setResult({
            score: payload.score,
            label: payload.label ?? `${payload.score} ${payload.unit}`,
            percentile: response.percentile,
            personalBest: response.personalBest,
          });
          setPendingPayload(null);
          return;
        }

        if (combined.ready) {
          // Last test — submit combined and show the complete screen
          let combinedPersonalBest = false;
          try {
            const combinedResponse = await submitScore(
              GIA_COMBINED_TEST_SLUG,
              combined.total,
              'net',
              { breakdown: combined.breakdown }
            );
            markGiaCombinedSubmitted();
            combinedPersonalBest = combinedResponse.personalBest;
          } catch {
            // Combined submission failed but we still show results
            markGiaCombinedSubmitted();
          }
          setAssessmentComplete({
            total: combined.total,
            breakdown: combined.breakdown,
            combinedPersonalBest,
          });
          setPendingPayload(null);
          return;
        }

        // Intermediate test — show transition then advance
        const currentIndex = GIA_SLUGS.indexOf(definition.slug as (typeof GIA_SLUGS)[number]);
        const nextSlug = GIA_SLUGS[currentIndex + 1];
        if (nextSlug) {
          setFlowTransition({
            completedCount: currentIndex + 1,
            nextSlug,
            completedScore: payload.score,
          });
          if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
          transitionTimerRef.current = setTimeout(() => {
            router.push(`/tests/${nextSlug}?flow=gia`);
          }, 5000);
          return;
        }
      }

      // Standard (non-flow) result
      setResult({
        score: payload.score,
        label: payload.label ?? `${payload.score} ${payload.unit}`,
        percentile: response.percentile,
        personalBest: response.personalBest,
      });
      setPendingPayload(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit score';
      setSubmitError(`${message}. Your local result is shown below.`);
      setResult({
        score: payload.score,
        label: payload.label ?? `${payload.score} ${payload.unit}`,
        percentile: null,
        personalBest: false,
      });
    }
  };

  if (!Game) {
    return (
      <TestLayout title={definition.name} subtitle={definition.description}>
        <p>Test implementation is missing for this route.</p>
      </TestLayout>
    );
  }

  // ── Assessment complete screen ──────────────────────────────────────────
  if (assessmentComplete) {
    return (
      <TestLayout title="GIA Assessment" subtitle="Cognitive Battery · 5/5 Complete">
        <AssessmentCompleteScreen
          breakdown={assessmentComplete.breakdown}
          total={assessmentComplete.total}
          combinedPersonalBest={assessmentComplete.combinedPersonalBest}
          displayName={user?.name ?? null}
        />
      </TestLayout>
    );
  }

  // ── Between-test transition ─────────────────────────────────────────────
  if (flowTransition) {
    const nextTestName =
      TEST_REGISTRY_BY_SLUG.get(flowTransition.nextSlug)?.name.replace('GIA ', '') ??
      flowTransition.nextSlug;
    const completedTestName =
      definition.name.replace('GIA ', '');
    const scoreDisplay = flowTransition.completedScore;

    return (
      <TestLayout
        title={definition.name}
        subtitle={definition.description}
        onQuit={handleQuit}
      >
        <div
          className="animate-in"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
            padding: '1.75rem',
            height: '100%',
          }}
        >
          {/* Kicker */}
          <p
            style={{
              margin: 0,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          >
            Assessment in Progress
          </p>

          {/* Completed test + score */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                  border: '1.5px solid color-mix(in srgb, var(--accent) 50%, var(--border))',
                  color: 'var(--accent)',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                {completedTestName} complete
              </h2>
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
                fontWeight: 700,
                color: scoreDisplay >= 0 ? 'var(--accent)' : 'var(--text-muted)',
                lineHeight: 1,
                paddingLeft: '2rem',
              }}
            >
              {scoreDisplay > 0 ? '+' : ''}
              {formatNumber(scoreDisplay, 2)}
              <small
                style={{ fontSize: '0.35em', color: 'var(--text-muted)', fontWeight: 500 }}
              >
                {' '}net
              </small>
            </p>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', paddingLeft: '0.1rem' }}>
            {GIA_SLUGS.map((slug, i) => (
              <div
                key={slug}
                style={{
                  width: i < flowTransition.completedCount ? 10 : 8,
                  height: i < flowTransition.completedCount ? 10 : 8,
                  borderRadius: '50%',
                  background:
                    i < flowTransition.completedCount
                      ? 'var(--accent)'
                      : 'var(--border)',
                  transition: 'all 200ms ease',
                  flexShrink: 0,
                }}
              />
            ))}
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginLeft: '0.3rem',
              }}
            >
              {flowTransition.completedCount} / {GIA_SLUGS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div
            aria-hidden
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface-raised)',
              borderRadius: '999px',
              height: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(flowTransition.completedCount / GIA_SLUGS.length) * 100}%`,
                height: '100%',
                background: 'var(--accent)',
                transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>

          {/* Next up */}
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Next up:{' '}
            <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{nextTestName}</strong>
          </p>

          {/* Loading pulse */}
          <p
            style={{
              margin: 0,
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              opacity: 0.6,
            }}
          >
            Loading next module...
          </p>
        </div>
      </TestLayout>
    );
  }

  // ── Playing or showing individual result ────────────────────────────────
  return (
    <TestLayout
      title={definition.name}
      subtitle={definition.description}
      onQuit={isGiaFlow ? handleQuit : undefined}
      sidebar={
        isGiaFlow ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.15rem',
            }}
          >
            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Module
            </span>
            <strong
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                color: 'var(--accent)',
              }}
            >
              {GIA_SLUGS.indexOf(definition.slug as (typeof GIA_SLUGS)[number]) + 1} / {GIA_SLUGS.length}
            </strong>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', opacity: 0.8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit</span>
            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{definition.scoreUnit}</strong>
          </div>
        )
      }
    >
      {result ? (
        <ResultScreen
          testSlug={definition.slug}
          scoreLabel={result.label}
          scoreValue={result.score}
          scoreUnit={definition.scoreUnit}
          percentile={result.percentile}
          personalBest={result.personalBest}
          statusNode={
            <>
              {submitting && !submitError ? (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Saving score...
                </p>
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
                  <p style={{ margin: 0, color: 'var(--danger)', fontSize: '0.9rem' }}>
                    {submitError}
                  </p>
                  {pendingPayload ? (
                    <div>
                      <button
                        type="button"
                        className="button buttonGhost"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
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
              {submitNotice && !submitError ? (
                <div
                  style={{
                    margin: 0,
                    border: '1px solid color-mix(in srgb, var(--warning) 40%, var(--border))',
                    borderRadius: '10px',
                    padding: '0.7rem 0.8rem',
                    background: 'color-mix(in srgb, var(--warning) 8%, transparent)',
                  }}
                >
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {submitNotice}
                  </p>
                </div>
              ) : null}
            </>
          }
          onPlayAgain={() => {
            completionLockRef.current = false;
            setResult(null);
            setRunId((prev) => prev + 1);
            setSubmitError(null);
            setSubmitNotice(null);
            setPendingPayload(null);
            setFlowTransition(null);
          }}
        />
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
