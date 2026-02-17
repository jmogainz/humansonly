'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthButton() {
  const auth = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  if (auth.isLoading) {
    return <button className="button buttonGhost" type="button" disabled>Loading...</button>;
  }

  if (!auth.isAuthenticated) {
    return (
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <button
          className="button"
          type="button"
          onClick={async () => {
            setAuthError(null);
            try {
              await auth.signIn(undefined, { callbackUrl: '/' });
            } catch {
              setAuthError('Sign-in is currently unavailable.');
            }
          }}
        >
          Sign In
        </button>
        {authError ? <small style={{ color: 'var(--danger)' }}>{authError}</small> : null}
      </div>
    );
  }

  return (
    <div className="authActions">
      <Link href="/profile" className="button buttonGhost">
        {auth.user?.name?.slice(0, 16) || 'Profile'}
      </Link>
      <button
        className="button buttonGhost"
        type="button"
        onClick={() => auth.signOut({ callbackUrl: '/' })}
      >
        Sign Out
      </button>
    </div>
  );
}
