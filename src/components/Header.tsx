'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthButton from './AuthButton';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import MenuButton from './MenuButton';
import MoreMenuModal from './MoreMenuModal';
import styles from './Header.module.css';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => setIsMenuOpen(true);
    document.addEventListener('humansonly:open-menu', handler);
    return () => document.removeEventListener('humansonly:open-menu', handler);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} onClick={() => setIsMenuOpen(false)}>
          <Logo className={styles.logo} />
        </Link>

        <nav className={styles.nav}>
          <Link href="/leaderboard" className={styles.navLink}>Leaderboards</Link>
          <ThemeToggle />
          <AuthButton />
        </nav>

        <div className={styles.mobileActions}>
          <MenuButton
            ref={menuButtonRef}
            isOpen={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
        </div>
      </header>

      <MoreMenuModal
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        triggerButtonRef={menuButtonRef}
      />
    </>
  );
}
