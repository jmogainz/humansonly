'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from './Spinner';

export default function AuthButton() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showProviders, setShowProviders] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isNavigatingProfile, setIsNavigatingProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname === '/profile') {
      setIsNavigatingProfile(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!showProviders) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProviders(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProviders]);

  if (auth.isLoading) return null;

  if (!auth.isAuthenticated) {
    return (
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          className="button"
          type="button"
          onClick={() => setShowProviders((prev) => !prev)}
        >
          Sign In
        </button>
        {showProviders && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '0.5rem',
              display: 'grid',
              gap: '0.35rem',
              minWidth: '200px',
              boxShadow: 'var(--card-shadow-hover)',
              zIndex: 100,
              animation: 'fadeIn 0.1s ease both',
            }}
          >
            <button
              type="button"
              disabled={!!pendingProvider}
              onClick={async () => {
                setAuthError(null);
                setPendingProvider('google');
                try {
                  await auth.signIn('google', { callbackUrl: '/profile' });
                } catch {
                  setAuthError('Google sign-in failed.');
                  setPendingProvider(null);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.55rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                cursor: pendingProvider ? 'not-allowed' : 'pointer',
                opacity: pendingProvider && pendingProvider !== 'google' ? 0.6 : 1,
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                fontWeight: 500,
                transition: 'all 50ms ease',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (pendingProvider) return;
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'var(--surface-raised)';
              }}
              onMouseLeave={(e) => {
                if (pendingProvider) return;
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg)';
              }}
            >
              {pendingProvider === 'google' ? (
                <Spinner size={18} />
              ) : (
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
                setAuthError(null);
                setPendingProvider('apple');
                try {
                  await auth.signIn('apple', { callbackUrl: '/profile' });
                } catch {
                  setAuthError('Apple sign-in failed.');
                  setPendingProvider(null);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.55rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                cursor: pendingProvider ? 'not-allowed' : 'pointer',
                opacity: pendingProvider && pendingProvider !== 'apple' ? 0.6 : 1,
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                fontWeight: 500,
                transition: 'all 50ms ease',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (pendingProvider) return;
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'var(--surface-raised)';
              }}
              onMouseLeave={(e) => {
                if (pendingProvider) return;
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg)';
              }}
            >
              {pendingProvider === 'apple' ? (
                <Spinner size={18} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              {pendingProvider === 'apple' ? 'Signing in...' : 'Continue with Apple'}
            </button>
            {authError && (
              <small style={{ color: 'var(--danger)', padding: '0 0.25rem' }}>{authError}</small>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="authActions">
      <button
        className="button buttonGhost"
        disabled={isNavigatingProfile || isSigningOut}
        onClick={() => {
          setIsNavigatingProfile(true);
          router.push('/profile');
        }}
      >
        {isNavigatingProfile ? <Spinner size={16} /> : null}
        {auth.user?.name?.slice(0, 16) || 'Profile'}
      </button>
      <button
        className="button buttonGhost"
        type="button"
        disabled={isSigningOut}
        onClick={async () => {
          setIsSigningOut(true);
          await auth.signOut({ callbackUrl: '/' });
        }}
      >
        {isSigningOut ? <Spinner size={16} /> : null}
        {isSigningOut ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  );
}
