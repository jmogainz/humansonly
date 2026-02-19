'use client';

import { useEffect, useState, useRef } from 'react';
import { useFeedback } from './FeedbackContext';

type ScoreDisplayProps = {
  label?: string;
  value: number | string;
  status?: 'success' | 'danger' | 'neutral';
};

export default function ScoreDisplay({ label = 'Score', value, status = 'neutral' }: ScoreDisplayProps) {
  const [isPulsing, setIsPulsing] = useState(false);
  const prevValueRef = useRef(value);
  const { triggerFeedback } = useFeedback();

  useEffect(() => {
    if (value !== prevValueRef.current) {
      if (status !== 'neutral') {
        setIsPulsing(true);
        triggerFeedback(status);
        const timer = setTimeout(() => setIsPulsing(false), 400);
        prevValueRef.current = value;
        return () => clearTimeout(timer);
      }
      prevValueRef.current = value;
    }
  }, [value, status, triggerFeedback]);

  const color = status === 'success' ? 'var(--success)' : status === 'danger' ? 'var(--danger)' : 'var(--text-primary)';

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transform: isPulsing ? 'scale(1.02)' : 'scale(1)',
    }}>
      <span style={{ 
        color: 'var(--text-muted)', 
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 500
      }}>
        {label}
      </span>
      <span style={{
        display: 'block',
        minWidth: '4.5rem',
        textAlign: 'center',
        fontSize: '1.25rem',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        color: isPulsing ? color : 'var(--text-primary)',
        transition: 'color 0.2s ease',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum"',
      }}>
        {value}
      </span>
    </div>
  );
}
