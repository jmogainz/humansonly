import Link from 'next/link';
import AuthButton from './AuthButton';
import ThemeToggle from './ThemeToggle';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <span className={styles.logoMark}>HO</span>
        <span>
          <strong>HumansOnly</strong>
          <small> Cognitive Benchmark Lab</small>
        </span>
      </Link>

      <nav className={styles.nav}>
        <Link href="/leaderboard" className="button buttonGhost">Leaderboards</Link>
        <ThemeToggle />
        <AuthButton />
      </nav>
    </header>
  );
}
