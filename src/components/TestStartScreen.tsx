'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Spinner } from './Spinner';

type TestStartScreenProps = {
  title?: string;
  description: string | ReactNode;
  onStart: () => void;
};

export default function TestStartScreen({ title = 'Ready?', description, onStart }: TestStartScreenProps) {
  const [isStarting, setIsStarting] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const isGuest = sessionStatus !== 'loading' && !session?.user;
  const [showSignIn, setShowSignIn] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSignIn) return;
    const handleClick = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setShowSignIn(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSignIn]);

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
      {isGuest && (
        <div ref={pillRef} style={{ position: 'relative', display: 'inline-flex' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.7rem',
            borderRadius: '999px',
            border: '1px solid var(--border)',
            background: 'var(--surface-raised)',
            color: 'var(--text-muted)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
          }}>
            Guest mode · scores won&apos;t be saved ·{' '}
            <button
              type="button"
              onClick={() => setShowSignIn((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                letterSpacing: 'inherit',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              Sign in
            </button>
          </div>
          {showSignIn && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '0.5rem',
              display: 'grid',
              gap: '0.35rem',
              minWidth: '210px',
              boxShadow: 'var(--card-shadow-hover)',
              zIndex: 100,
              animation: 'fadeIn 0.1s ease both',
            }}>
              <button
                type="button"
                disabled={!!pendingProvider}
                onClick={async () => {
                  setPendingProvider('google');
                  await signIn('google', { callbackUrl: window.location.href });
                  setPendingProvider(null);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)', color: 'var(--text-primary)',
                  cursor: pendingProvider ? 'not-allowed' : 'pointer',
                  opacity: pendingProvider && pendingProvider !== 'google' ? 0.6 : 1,
                  fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 500,
                  width: '100%',
                }}
              >
                {pendingProvider === 'google' ? <Spinner size={18} /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {pendingProvider === 'google' ? 'Signing in...' : 'Continue with Google'}
              </button>
              <button
                type="button"
                disabled={!!pendingProvider}
                onClick={async () => {
                  setPendingProvider('apple');
                  await signIn('apple', { callbackUrl: window.location.href });
                  setPendingProvider(null);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)', color: 'var(--text-primary)',
                  cursor: pendingProvider ? 'not-allowed' : 'pointer',
                  opacity: pendingProvider && pendingProvider !== 'apple' ? 0.6 : 1,
                  fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 500,
                  width: '100%',
                }}
              >
                {pendingProvider === 'apple' ? <Spinner size={18} /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                )}
                {pendingProvider === 'apple' ? 'Signing in...' : 'Continue with Apple'}
              </button>
            </div>
          )}
        </div>
      )}
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
