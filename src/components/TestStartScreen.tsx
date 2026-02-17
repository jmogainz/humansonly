'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Spinner } from './Spinner';

type TestStartScreenProps = {
  title?: string;
  description: string | ReactNode;
  onStart: () => void;
};

export default function TestStartScreen({ title = 'Ready?', description, onStart }: TestStartScreenProps) {
  const [isStarting, setIsStarting] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(1.5rem, 4vh, 2.5rem)',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
        maxWidth: '600px',
        padding: '1rem',
        animation: 'scaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) both',
      }}
    >
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', letterSpacing: '-0.03em' }}>{title}</h2>
        <div style={{ 
          margin: 0, 
          color: 'var(--text-muted)', 
          fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)', 
          lineHeight: '1.4',
          maxWidth: '440px',
          marginInline: 'auto'
        }}>
          {description}
        </div>
      </div>
      <button
        type="button"
        className="button"
        disabled={isStarting}
        onClick={() => {
          setIsStarting(true);
          onStart();
        }}
        style={{
          minWidth: 'min(100%, 220px)',
          padding: '0.8rem 2.5rem',
          fontSize: '1rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
        }}
      >
        {isStarting ? <Spinner size={20} /> : null}
        {isStarting ? 'Starting...' : 'Start Test'}
      </button>
    </div>
  );
}
