'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './MoreMenuModal.module.css';

type MoreMenuModalProps = {
  open: boolean;
  onClose: () => void;
  triggerButtonRef?: React.RefObject<HTMLButtonElement>;
};

type Theme = 'dark' | 'light';

function readDomTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem('humansonly_theme', theme);
  
  const darkIcon = document.querySelector('link[href="/favicon-dark.svg"]');
  const lightIcon = document.querySelector('link[href="/favicon-light.svg"]');
  
  if (theme === 'dark') {
    if (darkIcon) darkIcon.removeAttribute('media');
    if (lightIcon) lightIcon.setAttribute('media', 'none');
  } else {
    if (lightIcon) lightIcon.removeAttribute('media');
    if (darkIcon) darkIcon.setAttribute('media', 'none');
  }
}

function MoreMenuModal({
  open,
  onClose,
  triggerButtonRef,
}: MoreMenuModalProps) {
  const auth = useAuth();
  const router = useRouter();
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(readDomTheme());
  }, []);

  // Calculate menu position based on trigger button
  useEffect(() => {
    if (!open || !triggerButtonRef?.current) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const button = triggerButtonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [open, triggerButtonRef]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  const handleSignOut = async () => {
    onClose();
    await auth.signOut({ callbackUrl: '/' });
  };

  if (!open) return null;

  const style = menuPosition
    ? { top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }
    : undefined;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.dropdown} style={style} role="menu" aria-label="Menu">
        <Link href="/leaderboard" className={styles.menuItem} onClick={onClose} role="menuitem">
          <span>Leaderboards</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21V10h6V3h6v4h6v14H3zM9 10v11M15 7v14" />
          </svg>
        </Link>

        <button type="button" className={styles.menuItem} onClick={handleToggleTheme} role="menuitem">
          <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        <div className={styles.divider} />

        {auth.isAuthenticated ? (
          <>
            <Link href="/profile" className={styles.menuItem} onClick={onClose} role="menuitem">
              <span>Profile</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
            <button type="button" className={styles.menuItem} onClick={handleSignOut} role="menuitem">
              <span>Sign Out</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        ) : (
          <button 
            type="button" 
            className={`${styles.menuItem} ${styles.primary}`} 
            onClick={() => {
              onClose();
              // For simplicity, just navigate to home which will show providers if we want
              // but AuthButton logic is complex. 
              // Maybe we should just trigger the AuthButton's provider list?
              // Let's just Link to profile, it usually redirects to sign in if not auth.
              router.push('/profile');
            }} 
            role="menuitem"
          >
            <span>Sign In</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}

export default React.memo(MoreMenuModal);
