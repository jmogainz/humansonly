'use client';

import React, { useMemo, useState } from 'react';
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
import StatsShareCard from './StatsShareCard';
import TestStatsShareCard from './TestStatsShareCard';

type PerformanceDashboardProps = {
  displayName: string;
  scores: Array<{
    testSlug: string;
    scoreValue: number;
    createdAt: string;
    metadata: Record<string, unknown> | null;
  }>;
  view?: 'full' | 'atlas' | 'matrix';
  category?: 'gia' | 'human-benchmark';
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

export default function PerformanceDashboard({ 
  displayName, 
  scores, 
  view = 'full',
  category 
}: PerformanceDashboardProps) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const scoreDataByTest = useMemo(() => {
    const grouped = new Map<string, (ScorePoint & { metadata: any })[]>();
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
        metadata: score.metadata,
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

  const toggleExpand = (slug: string) => {
    setExpandedSlug(expandedSlug === slug ? null : slug);
  };

  const calculatedBests = useMemo(() => {
    const bests: Array<{ testSlug: string; bestScore: number; scoreUnit: string }> = [];
    scoreDataByTest.forEach((points, slug) => {
      if (points.length === 0) return;
      const test = TEST_REGISTRY.find(t => t.slug === slug);
      if (!test) return;
      const bestValue = getBest(points, test.direction);
      if (bestValue !== null) {
        bests.push({
          testSlug: slug,
          bestScore: bestValue,
          scoreUnit: test.scoreUnit,
        });
      }
    });
    return bests;
  }, [scoreDataByTest]);

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
    () => {
      const allSections = [
        {
          id: 'gia',
          title: 'GIA Core Modules',
          tests: TEST_REGISTRY.filter((test) => test.category === 'gia'),
        },
        {
          id: 'human-benchmark',
          title: 'Benchmark Tests',
          tests: TEST_REGISTRY.filter((test) => test.category === 'human-benchmark'),
        },
      ];
      if (category) {
        return allSections.filter(s => s.id === category);
      }
      return allSections;
    },
    [category]
  );

  const showAtlas = view === 'full' || view === 'atlas';
  const showMatrix = view === 'full' || view === 'matrix';

  return (
    <div className={styles.dashboard}>
      {showAtlas && (
        <>
          <header className={styles.header}>
            <div className={styles.titleBlock}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                <h2 style={{ margin: 0 }}>Performance <span>Atlas</span></h2>
                <StatsShareCard displayName={displayName} bests={calculatedBests} />
              </div>
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
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.01} />
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
        </>
      )}

      {showMatrix && sections.map((section) => (
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

              const isExpanded = expandedSlug === test.slug;
              const hasGranularData = points.some(p => p.metadata?.correct !== undefined || p.metadata?.incorrect !== undefined);

              const expandedStats = isExpanded ? {
                avg: points.reduce((acc, p) => acc + p.score, 0) / points.length,
                maxCorrect: hasGranularData ? Math.max(...points.map(p => Number(p.metadata?.correct || 0))) : null,
                avgCorrect: hasGranularData ? points.reduce((acc, p) => acc + Number(p.metadata?.correct || 0), 0) / points.length : null,
              } : null;

              return (
                <article
                  key={test.slug}
                  className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''}`}
                  style={{ '--card-index': TEST_REGISTRY.findIndex((candidate) => candidate.slug === test.slug) } as React.CSSProperties}
                  onClick={() => toggleExpand(test.slug)}
                >
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.eyebrow}>{getCategoryLabel(test)}</p>
                      <h4>{test.name.replace('GIA ', '')}</h4>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={styles.runPill}>{points.length} runs</span>
                      {points.length > 0 && (
                        <TestStatsShareCard
                          displayName={displayName}
                          test={test}
                          stats={{
                            runs: points.length,
                            best: best,
                            avg: points.reduce((acc, p) => acc + p.score, 0) / points.length,
                            trend: trend,
                          }}
                          className={styles.shareButton}
                        />
                      )}
                      <button className={styles.expandButton} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
                        {isExpanded ? '−' : '+'}
                      </button>
                    </div>
                  </div>

                  <div className={isExpanded ? styles.detailedChartFrame : styles.miniChartFrame}>
                    {points.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={points} margin={{ top: isExpanded ? 20 : 8, right: isExpanded ? 20 : 0, left: isExpanded ? 0 : 0, bottom: isExpanded ? 10 : 0 }}>
                          <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--accent)" stopOpacity={isExpanded ? 0.08 : 0.15} />
                              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id={`${gradientId}-correct`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--success)" stopOpacity={0.05} />
                              <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id={`${gradientId}-incorrect`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--danger)" stopOpacity={0.05} />
                              <stop offset="100%" stopColor="var(--danger)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} opacity={isExpanded ? 0.5 : 1} />
                          <XAxis 
                            dataKey="run" 
                            axisLine={false} 
                            tickLine={false} 
                            stroke="var(--text-muted)" 
                            fontSize={isExpanded ? 11 : 10}
                            minTickGap={isExpanded ? 30 : 20}
                            tickFormatter={(val) => {
                              if (!isExpanded) return val;
                              const point = points[Number(val) - 1];
                              return point ? point.dateLabel : val;
                            }}
                          />
                          <YAxis hide={!isExpanded} axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={11} width={35} />
                          <Tooltip
                            labelFormatter={(value, p) => {
                              const item = p && p[0] ? p[0].payload : points[Number(value) - 1];
                              if (isExpanded && item) {
                                return new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                              }
                              return `Run ${value}`;
                            }}
                            formatter={(value, name) => {
                              if (!name) return [formatScore(Number(value)), 'Score'];
                              const nameStr = String(name);
                              const label = nameStr === 'score' ? (test.scoreUnit === 'net' ? 'Net Score' : 'Score') : nameStr.charAt(0).toUpperCase() + nameStr.slice(1);
                              return [formatScore(Number(value)), label];
                            }}
                            contentStyle={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                              fontSize: isExpanded ? '12px' : '11px',
                              boxShadow: 'var(--card-shadow-hover)',
                              padding: '8px 12px',
                            }}
                            cursor={{ stroke: 'var(--accent)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                          />
                          
                          {isExpanded && hasGranularData && (
                            <>
                              <Area
                                type="monotone"
                                dataKey="metadata.correct"
                                name="correct"
                                stroke="var(--success)"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill={`url(#${gradientId}-correct)`}
                                isAnimationActive
                                animationDuration={800}
                              />
                              <Area
                                type="monotone"
                                dataKey="metadata.incorrect"
                                name="incorrect"
                                stroke="var(--danger)"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill={`url(#${gradientId}-incorrect)`}
                                isAnimationActive
                                animationDuration={900}
                              />
                            </>
                          )}

                          <Area
                            type="monotone"
                            dataKey="score"
                            name="score"
                            stroke="var(--accent)"
                            strokeWidth={isExpanded ? 3 : 2}
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

                  {isExpanded && hasGranularData && (
                    <div className={styles.granularLegend}>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: 'var(--accent)' }} />
                        <span>Net Score</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: 'var(--success)' }} />
                        <span>Correct</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: 'var(--danger)' }} />
                        <span>Incorrect</span>
                      </div>
                    </div>
                  )}

                  <div className={`${styles.stats} ${isExpanded ? styles.statsExpanded : ''}`}>
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
                    {isExpanded && expandedStats && (
                      <>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Average</span>
                          <span className={styles.statValue}>
                            {formatScore(expandedStats.avg)} {test.scoreUnit}
                          </span>
                        </div>
                        {hasGranularData && (
                          <>
                            <div className={styles.statItem}>
                              <span className={styles.statLabel}>Best Correct</span>
                              <span className={styles.statValue}>
                                {expandedStats.maxCorrect}
                              </span>
                            </div>
                            <div className={styles.statItem}>
                              <span className={styles.statLabel}>Avg Correct</span>
                              <span className={styles.statValue}>
                                {expandedStats.avgCorrect?.toFixed(1)}
                              </span>
                            </div>
                          </>
                        )}
                      </>
                    )}
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
