import { notFound } from 'next/navigation';
import LeaderboardViewClient from '@/components/LeaderboardViewClient';
import { getTestBySlug, TEST_REGISTRY } from '@/lib/tests/registry';

type PageProps = {
  params: Promise<{ testSlug: string }>;
};

export default async function TestLeaderboardPage({ params }: PageProps) {
  const { testSlug } = await params;
  const test = getTestBySlug(testSlug);
  if (!test) {
    notFound();
  }

  return (
    <section style={{ width: 'min(1100px, calc(100vw - 2rem))', margin: '0 auto 2rem', display: 'grid', gap: '1rem' }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '1.1rem', background: 'var(--surface)' }}>
        <h1 style={{ marginTop: 0 }}>{test.name} Leaderboard</h1>
        <p style={{ marginBottom: 0, color: 'var(--text-muted)' }}>{test.description}</p>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '1.1rem', background: 'var(--surface)' }}>
        <LeaderboardViewClient tests={TEST_REGISTRY} initialSlug={test.slug} />
      </div>
    </section>
  );
}
