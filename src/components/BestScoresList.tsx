'use client';

import React, { useState, useRef, CSSProperties } from 'react';
import Link from 'next/link';
import { TEST_REGISTRY_BY_SLUG } from '@/lib/tests/registry';
import { formatNumber } from '@/lib/utils';
import { TestIcon } from './TestIcon';
import styles from './BestScoresList.module.css';

type BestScore = {
  testSlug: string;
  bestScore: number;
  scoreUnit: string;
};

type BestScoresListProps = {
  scores: BestScore[];
};

export default function BestScoresList({ scores }: BestScoresListProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({
    opacity: 0,
    transform: 'translateY(0)',
    height: 0,
  });
  const listRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (index: number, e: React.MouseEvent) => {
    setHoveredIndex(index);
    const target = e.currentTarget as HTMLElement;
    const list = listRef.current;
    if (list && target) {
      const targetRect = target.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      
      setIndicatorStyle({
        opacity: 1,
        transform: `translateY(${targetRect.top - listRect.top}px)`,
        height: `${targetRect.height}px`,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div 
      className={styles.listWrapper} 
      ref={listRef}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.indicator} style={indicatorStyle} />
      <div className={styles.list}>
        {scores.map((best, i) => {
          const test = TEST_REGISTRY_BY_SLUG.get(best.testSlug);
          return (
            <Link 
              key={best.testSlug}
              href={`/leaderboard/${best.testSlug}`}
              className={`${styles.item} ${hoveredIndex === i ? styles.hovered : ''}`}
              onMouseEnter={(e) => handleMouseEnter(i, e)}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className={styles.iconWrapper}>
                <TestIcon slug={best.testSlug} />
              </div>
              
              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <span className={styles.category}>{test?.category === 'gia' ? 'GIA' : 'BENCHMARK'}</span>
                  <h3>{test?.name.replace('GIA ', '') ?? best.testSlug}</h3>
                </div>
                <div className={styles.scoreRow}>
                  <span className={styles.scoreValue}>
                    {formatNumber(best.bestScore, best.bestScore % 1 === 0 ? 0 : 2)}
                  </span>
                  <span className={styles.scoreUnit}>{best.scoreUnit}</span>
                </div>
              </div>

              <div className={styles.meta}>
                <span className={styles.viewLink}>
                  <span className={styles.viewText}>Global Rank</span>
                  <svg 
                    className={styles.chevron} 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
