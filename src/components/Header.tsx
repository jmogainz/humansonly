import Link from 'next/link';
import AuthButton from './AuthButton';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <Logo className={styles.logo} />
      </Link>

      <nav className={styles.nav}>
        <Link href="/leaderboard" className={styles.navLink}>Leaderboards</Link>
        <ThemeToggle />
        <AuthButton />
      </nav>
    </header>
  );
}
