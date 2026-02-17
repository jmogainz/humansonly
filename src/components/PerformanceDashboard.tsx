'use client';

import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TEST_REGISTRY } from '@/lib/tests/registry';
import type { ScoreDirection, TestDefinition } from '@/lib/tests/types';
import { formatNumber } from '@/lib/utils';
import styles from './PerformanceDashboard.module.css';

type PerformanceDashboardProps = {
  scores: Array<{
    testSlug: string;
    scoreValue: number;
    createdAt: string;
    metadata: Record<string, unknown> | null;
  }>;
};

type ScorePoint = {
  dateLabel: string;
  timestamp: number;
  score: number;
  run: number;
};

type ActivityPoint = {
  date: string;
  timestamp: number;
  attempts: number;
};

function formatScore(value: number): string {
  const digits = Number.isInteger(value) ? 0 : 2;
  return formatNumber(value, digits);
}

function getDirectionalTrend(points: ScorePoint[], direction: ScoreDirection): number | null {
  if (points.length < 2) return null;
  const first = points[0].score;
  const last = points[points.length - 1].score;
  return direction === 'higher' ? last - first : first - last;
}

function getBest(points: ScorePoint[], direction: ScoreDirection): number | null {
  if (!points.length) return null;
  return direction === 'higher'
    ? Math.max(...points.map((point) => point.score))
    : Math.min(...points.map((point) => point.score));
}

function getCategoryLabel(test: TestDefinition): string {
  return test.category === 'gia' ? 'GIA' : 'Human Benchmark';
}

export default function PerformanceDashboard({ scores }: PerformanceDashboardProps) {
  const scoreDataByTest = useMemo(() => {
    const grouped = new Map<string, ScorePoint[]>();
    TEST_REGISTRY.forEach((test) => {
      grouped.set(test.slug, []);
    });

    scores.forEach((score) => {
      const target = grouped.get(score.testSlug);
      if (!target) return;

      const createdAt = new Date(score.createdAt);
      target.push({
        dateLabel: createdAt.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        timestamp: createdAt.getTime(),
        score: score.scoreValue,
        run: 0,
      });
    });

    grouped.forEach((points, slug) => {
      points.sort((a, b) => a.timestamp - b.timestamp);
      grouped.set(
        slug,
        points.map((point, index) => ({
          ...point,
          run: index + 1,
        }))
      );
    });

    return grouped;
  }, [scores]);

  const activityData = useMemo(() => {
    const buckets = new Map<string, ActivityPoint>();

    scores.forEach((score) => {
      const createdAt = new Date(score.createdAt);
      const dayStart = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
      const key = dayStart.toISOString();
      const existing = buckets.get(key);

      if (existing) {
        existing.attempts += 1;
        return;
      }

      buckets.set(key, {
        date: dayStart.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        timestamp: dayStart.getTime(),
        attempts: 1,
      });
    });

    return Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [scores]);

  const testsPlayed = useMemo(
    () => TEST_REGISTRY.filter((test) => (scoreDataByTest.get(test.slug)?.length ?? 0) > 0).length,
    [scoreDataByTest]
  );

  const latestAttemptDate = useMemo(() => {
    if (!scores.length) return null;
    const latest = scores.reduce((currentLatest, item) => {
      const itemTime = new Date(item.createdAt).getTime();
      return itemTime > currentLatest ? itemTime : currentLatest;
    }, 0);
    return new Date(latest).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }, [scores]);

  const sections = useMemo(
    () => [
      {
        id: 'human-benchmark',
        title: 'Human Benchmark Suite',
        tests: TEST_REGISTRY.filter((test) => test.category === 'human-benchmark'),
      },
      {
        id: 'gia',
        title: 'GIA Suite',
        tests: TEST_REGISTRY.filter((test) => test.category === 'gia'),
      },
    ],
    []
  );

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h2>Performance Atlas</h2>
          <p>Every test. Every run. One progression surface.</p>
        </div>
        <div className={styles.kpis}>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>Total Attempts</span>
            <span className={styles.kpiValue}>{formatNumber(scores.length)}</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>Tests Played</span>
            <span className={styles.kpiValue}>{formatNumber(testsPlayed)}</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>Latest Run</span>
            <span className={styles.kpiValue}>{latestAttemptDate ?? 'NA'}</span>
          </div>
        </div>
      </header>

      <section className={styles.activityPanel}>
        <div className={styles.sectionHeading}>
          <h3>Attempt Velocity</h3>
          <p>Runs per day across all assessments.</p>
        </div>
        <div className={styles.activityChart}>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityData} margin={{ top: 12, right: 16, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="attemptsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Area
                  type="monotone"
                  dataKey="attempts"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#attemptsGradient)"
                  isAnimationActive
                  animationDuration={850}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.emptyChart}>No history yet.</div>
          )}
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.id} className={styles.matrixSection}>
          <div className={styles.sectionHeading}>
            <h3>{section.title}</h3>
            <p>{section.tests.length} tracked tests</p>
          </div>
          <div className={styles.grid}>
            {section.tests.map((test) => {
              const points = scoreDataByTest.get(test.slug) ?? [];
              const latest = points.length > 0 ? points[points.length - 1] : null;
              const best = getBest(points, test.direction);
              const trend = getDirectionalTrend(points, test.direction);
              const trendLabel = trend === null
                ? 'NA'
                : Math.abs(trend) < 0.0001
                  ? 'Flat'
                  : `${trend > 0 ? '+' : '-'}${formatScore(Math.abs(trend))}`;
              const trendClass = trend === null
                ? styles.trendNeutral
                : trend > 0
                  ? styles.trendPositive
                  : trend < 0
                    ? styles.trendNegative
                    : styles.trendNeutral;
              const gradientId = `spark-${test.slug}`;

              return (
                <article
                  key={test.slug}
                  className={styles.card}
                  style={{ '--card-index': TEST_REGISTRY.findIndex((candidate) => candidate.slug === test.slug) } as React.CSSProperties}
                >
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.eyebrow}>{getCategoryLabel(test)}</p>
                      <h4>{test.name.replace('GIA ', '')}</h4>
                    </div>
                    <span className={styles.runPill}>{points.length} runs</span>
                  </div>

                  <div className={styles.miniChartFrame}>
                    {points.length > 0 ? (
                      <ResponsiveContainer width="100%" height={120}>
                        <AreaChart data={points} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="run" axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={10} />
                          <YAxis hide domain={["auto", "auto"]} />
                          <Tooltip
                            labelFormatter={(value) => `Run ${String(value)}`}
                            formatter={(value) => formatScore(Number(value))}
                            contentStyle={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              fontSize: '11px',
                            }}
                            cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '3 3' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="var(--accent)"
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            isAnimationActive
                            animationDuration={700}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={styles.emptyChart}>No runs yet</div>
                    )}
                  </div>

                  <div className={styles.stats}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Latest</span>
                      <span className={styles.statValue}>
                        {latest ? `${formatScore(latest.score)} ${test.scoreUnit}` : 'NA'}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Best</span>
                      <span className={styles.statValue}>
                        {best !== null ? `${formatScore(best)} ${test.scoreUnit}` : 'NA'}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Trend</span>
                      <span className={`${styles.statValue} ${trendClass}`}>
                        {trendLabel}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
