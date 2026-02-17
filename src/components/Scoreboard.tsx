import type { ReactNode } from 'react';
import styles from './Scoreboard.module.css';

type ScoreboardProps = {
  children: ReactNode;
};

export default function Scoreboard({ children }: ScoreboardProps) {
  return (
    <div className={styles.container}>
      <div className={styles.items}>
        {children}
      </div>
    </div>
  );
}
