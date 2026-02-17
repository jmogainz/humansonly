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
      setIsPulsing(true);
      if (status !== 'neutral') {
        triggerFeedback(status);
      }
      const timer = setTimeout(() => setIsPulsing(false), 400);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value, status, triggerFeedback]);

  const color = status === 'success' ? 'var(--success)' : status === 'danger' ? 'var(--danger)' : 'var(--text-primary)';

  return (
    <div style={{ 
      display: 'grid', 
      gap: '0.1rem',
      transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transform: isPulsing ? 'scale(1.05)' : 'scale(1)',
    }}>
      <small style={{ 
        color: 'var(--text-muted)', 
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {label}
      </small>
      <strong style={{ 
        fontFamily: 'var(--font-mono)', 
        fontSize: '1.25rem',
        color: isPulsing ? color : 'var(--text-primary)',
        transition: 'color 0.2s ease',
      }}>
        {value}
      </strong>
    </div>
  );
}
