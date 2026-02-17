'use client';

import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import TestCard from './TestCard';
import type { TestDefinition } from '@/lib/tests/types';
import styles from './TestList.module.css';

type TestListProps = {
  tests: TestDefinition[];
  featured?: boolean;
};

export default function TestList({ tests, featured }: TestListProps) {
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
        {tests.map((test, i) => (
          <div 
            key={test.slug} 
            onMouseEnter={(e) => handleMouseEnter(i, e)}
            className={styles.itemWrapper}
          >
            <TestCard 
              test={test} 
              featured={featured} 
              index={i} 
              isHovered={hoveredIndex === i}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
