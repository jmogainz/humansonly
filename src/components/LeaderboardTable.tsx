import type { LeaderboardEntry } from '@/lib/tests/types';
import { formatNumber } from '@/lib/utils';

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
  highlightUserId?: string | null;
};

export default function LeaderboardTable({ entries, highlightUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No scores yet.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isMe = highlightUserId ? entry.userId === highlightUserId : entry.isCurrentUser;
            return (
              <tr key={`${entry.rank}-${entry.userId}`} style={isMe ? { background: 'color-mix(in srgb, var(--accent) 16%, transparent)' } : undefined}>
                <td>#{entry.rank}</td>
                <td>{entry.displayName}</td>
                <td>
                  {formatNumber(entry.scoreValue, entry.scoreValue % 1 === 0 ? 0 : 2)} {entry.scoreUnit}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
