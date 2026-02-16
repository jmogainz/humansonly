import { TEST_REGISTRY } from '@/lib/tests/registry';
import LeaderboardViewClient from '@/components/LeaderboardViewClient';

export const metadata = {
  title: 'Leaderboards - HumansOnly',
};

export default function LeaderboardPage() {
  return (
    <section style={{ width: 'min(1100px, calc(100vw - 2rem))', margin: '0 auto 2rem', display: 'grid', gap: '1rem' }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '1.1rem', background: 'var(--surface)' }}>
        <h1 style={{ marginTop: 0 }}>Global Leaderboards</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
          Browse top rankings for every test and compare your position after each run.
        </p>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '1.1rem', background: 'var(--surface)' }}>
        <LeaderboardViewClient tests={TEST_REGISTRY} />
      </div>
    </section>
  );
}
