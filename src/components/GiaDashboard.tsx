'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { GIA_SLUGS } from '@/constants';
import { TEST_REGISTRY_BY_SLUG } from '@/lib/tests/registry';
import styles from './GiaDashboard.module.css';

type GiaDashboardProps = {
  scores: Array<{
    testSlug: string;
    scoreValue: number;
    createdAt: string;
    metadata: Record<string, unknown> | null;
  }>;
};

type ScorePoint = {
  date: string;
  timestamp: number;
  score: number;
  correct: number | null;
  incorrect: number | null;
};

export default function GiaDashboard({ scores }: GiaDashboardProps) {
  const chartDataByTest = useMemo(() => {
    const data: Record<string, ScorePoint[]> = {};

    // Initialize with empty arrays for each GIA subtest.
    GIA_SLUGS.forEach((slug) => {
      data[slug] = [];
    });

    // Group scores by test and format for charts.
    scores.forEach((s) => {
      if (data[s.testSlug]) {
        const metadata = s.metadata ?? {};
        const correctRaw = metadata.correct;
        const incorrectRaw = metadata.incorrect;

        data[s.testSlug].push({
          date: new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          timestamp: new Date(s.createdAt).getTime(),
          score: s.scoreValue,
          correct: typeof correctRaw === 'number' ? correctRaw : null,
          incorrect: typeof incorrectRaw === 'number' ? incorrectRaw : null,
        });
      }
    });

    Object.keys(data).forEach((slug) => {
      data[slug].sort((a, b) => a.timestamp - b.timestamp);
    });

    return data;
  }, [scores]);

  const comprehensiveData = useMemo(() => {
    return scores
      .filter((entry) => entry.testSlug === 'gia-combined')
      .map((entry) => ({
        date: new Date(entry.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        timestamp: new Date(entry.createdAt).getTime(),
        score: entry.scoreValue,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [scores]);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h2>Performance</h2>
        <p>Cognitive trajectory.</p>
      </header>

      <div className={styles.mainChart}>
        <h3>Trend</h3>
        <div className={styles.chartContainer}>
          {comprehensiveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={comprehensiveData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
                <Area type="monotone" dataKey="score" stroke="var(--accent)" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Complete all five GIA subtests to populate your combined trend.
            </p>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {GIA_SLUGS.map((slug) => {
          const test = TEST_REGISTRY_BY_SLUG.get(slug);
          const data = chartDataByTest[slug] ?? [];
          const pointsWithCorrect = data.filter((point) => typeof point.correct === 'number');
          const averageCorrect = pointsWithCorrect.length
            ? (pointsWithCorrect.reduce((acc, curr) => acc + (curr.correct ?? 0), 0) / pointsWithCorrect.length).toFixed(1)
            : null;

          return (
            <div key={slug} className={styles.smallCard}>
              <h4>{test?.name.replace('GIA ', '') ?? slug}</h4>
              <div className={styles.miniChart}>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '10px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      dot={{ r: 2, fill: 'var(--accent)' }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Avg Correct</span>
                  <span className={styles.statValue}>
                    {averageCorrect ?? '-'}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Latest</span>
                  <span className={styles.statValue}>
                    {data.length > 0 ? data[data.length - 1].score : '-'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
