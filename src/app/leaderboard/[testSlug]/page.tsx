import { notFound } from 'next/navigation';
import LeaderboardViewClient from '@/components/LeaderboardViewClient';
import { getTestBySlug, TEST_REGISTRY } from '@/lib/tests/registry';
import styles from '../leaderboard.module.css';

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
    <section className={styles.page}>
      <div className={styles.card}>
        <h1>{test.name} Leaderboard</h1>
        <p>{test.description}</p>
      </div>
      <div className={styles.card}>
        <LeaderboardViewClient tests={TEST_REGISTRY} initialSlug={test.slug} />
      </div>
    </section>
  );
}
