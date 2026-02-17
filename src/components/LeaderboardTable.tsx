import type { LeaderboardEntry } from '@/lib/tests/types';
import { formatNumber } from '@/lib/utils';
import styles from './LeaderboardTable.module.css';

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
  highlightUserId?: string | null;
};

export default function LeaderboardTable({ entries, highlightUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No champions yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.rankCol}>Rank</th>
            <th>Athlete</th>
            <th className={styles.scoreCol}>Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isMe = highlightUserId ? entry.userId === highlightUserId : entry.isCurrentUser;
            const rankClass = entry.rank === 1 ? styles.rank1 : 
                            entry.rank === 2 ? styles.rank2 : 
                            entry.rank === 3 ? styles.rank3 : '';
            
            return (
              <tr key={`${entry.rank}-${entry.userId}`} className={isMe ? styles.rowHighlight : ''}>
                <td className={styles.rankCol}>
                  <div className={`${styles.rankBadge} ${rankClass}`}>
                    {entry.rank}
                  </div>
                </td>
                <td>
                  <div className={styles.playerInfo}>
                    <div className={styles.avatar}>
                      {(entry.displayName || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <span className={isMe ? styles.meName : ''}>
                      {entry.displayName} {isMe && <span style={{ opacity: 0.6 }}>(You)</span>}
                    </span>
                  </div>
                </td>
                <td className={styles.scoreCol}>
                  <span className={styles.score}>
                    {formatNumber(entry.scoreValue, entry.scoreValue % 1 === 0 ? 0 : 2)}
                  </span>
                  <span className={styles.unit}>{entry.scoreUnit}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
