'use client';
import { useEffect, useRef } from 'react';
import styles from './LivesDisplay.module.css';
import { useFeedback } from './FeedbackContext';

type LivesDisplayProps = {
  lives: number;
  maxLives?: number;
};

export default function LivesDisplay({ lives, maxLives = 3 }: LivesDisplayProps) {
  const slots = Array.from({ length: maxLives });
  const { triggerFeedback } = useFeedback();
  const prevLivesRef = useRef(lives);

  useEffect(() => {
    if (lives < prevLivesRef.current) {
      triggerFeedback('danger');
    }
    prevLivesRef.current = lives;
  }, [lives, triggerFeedback]);

  return (
    <div className={styles.root}>
      {slots.map((_, index) => {
        const active = index < lives;
        const gradientId = `shieldGradient_${index}_${maxLives}`;
        return (
          <svg
            key={index}
            className={`${styles.shield} ${active ? styles.active : styles.spent}`}
            viewBox="0 0 32 32"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={active ? '#eef2f7' : '#6a707d'} />
                <stop offset="50%" stopColor={active ? '#c9d1dc' : '#4d5360'} />
                <stop offset="100%" stopColor={active ? '#9ea8b8' : '#3b414d'} />
              </linearGradient>
            </defs>
            <path
              d="M16 2.8 25.8 6.6v8.2c0 7.2-4 12.1-9.8 15.4C10.2 26.9 6.2 22 6.2 14.8V6.6z"
              fill={`url(#${gradientId})`}
              stroke={active ? 'color-mix(in srgb, var(--accent) 30%, #7f8998)' : '#4a515f'}
              strokeWidth="1.25"
            />
            {active && (
              <path
                d="M16 9.3 18 13l4 .6-2.9 2.8.7 4-3.8-2-3.8 2 .7-4-2.9-2.8 4-.6z"
                fill="color-mix(in srgb, var(--accent) 35%, #ffffff)"
                stroke="color-mix(in srgb, var(--accent) 45%, #7b8798)"
                strokeWidth="0.7"
              />
            )}
            {!active && (
              <path
                d="M10 22.3 22 10.3"
                stroke="color-mix(in srgb, var(--danger) 40%, #ffb4b4)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            )}
          </svg>
        );
      })}
      <small className={styles.label}>Lives</small>
    </div>
  );
}
