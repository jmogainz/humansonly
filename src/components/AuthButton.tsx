'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function AuthButton() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <button className="button buttonGhost" type="button" disabled>Loading...</button>;
  }

  if (!auth.isAuthenticated) {
    return (
      <button
        className="button"
        type="button"
        onClick={() => auth.signIn(undefined, { callbackUrl: '/' })}
      >
        Sign In
      </button>
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
