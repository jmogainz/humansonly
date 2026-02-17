import { TEST_REGISTRY } from '../tests/registry';
import { submitScoreForUser, getAllScoresForUser } from './scores';
import { getLeaderboardRedis } from './redis';
import { updateLeaderboardBest } from './leaderboard';
import { getDbPool, ensureDbSchema } from './db';

export async function seedUserData(userId: string) {
  // Only seed if no scores exist
  const existing = await getAllScoresForUser(userId);
  if (existing.length > 0) return;

  console.log(`Seeding account data for user ${userId}...`);

  for (const test of TEST_REGISTRY) {
    if (!test.leaderboardEnabled || test.playable === false) continue;

    // Add 3-5 scores per test to create a "history"
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const scoreValue = generatePlausibleScore(test.slug, test.category);
      await submitScoreForUser(userId, {
        testSlug: test.slug,
        scoreValue,
        scoreUnit: test.scoreUnit,
        metadata: { seeded: true },
      });
    }
  }
}

export async function seedGlobalLeaderboard() {
  const redis = getLeaderboardRedis();
  if (!redis) return;

  // Check if already seeded (look at first test)
  const firstTest = TEST_REGISTRY[0];
  const count = await redis.zcard(`leaderboard:${firstTest.slug}`);
  if (count > 20) return;

  console.log('Seeding global leaderboard data...');

  const pool = getDbPool();
  await ensureDbSchema();

  const dummyUsers = [
    { id: '00000000-0000-0000-0000-000000000001', name: 'Speedster' },
    { id: '00000000-0000-0000-0000-000000000002', name: 'MemoryMaster' },
    { id: '00000000-0000-0000-0000-000000000003', name: 'ClickGod' },
    { id: '00000000-0000-0000-0000-000000000004', name: 'TypeRacer' },
    { id: '00000000-0000-0000-0000-000000000005', name: 'Brainiac' },
    { id: '00000000-0000-0000-0000-000000000006', name: 'AverageJoe' },
    { id: '00000000-0000-0000-0000-000000000007', name: 'FastFingers' },
    { id: '00000000-0000-0000-0000-000000000008', name: 'ZenMaster' },
    { id: '00000000-0000-0000-0000-000000000009', name: 'LogicPro' },
    { id: '00000000-0000-0000-0000-000000000010', name: 'EagleEye' },
  ];

  for (const user of dummyUsers) {
    await pool.query(
      'insert into users (id, name, email) values ($1, $2, $3) on conflict (id) do nothing',
      [user.id, user.name, `${user.name.toLowerCase()}@example.com`]
    );
  }

  for (const test of TEST_REGISTRY) {
    if (!test.leaderboardEnabled || test.playable === false) continue;

    for (const user of dummyUsers) {
      const scoreValue = generatePlausibleScore(test.slug, test.category);
      await updateLeaderboardBest(redis, test.slug, user.id, scoreValue, test.direction);
    }
  }
}

function generatePlausibleScore(slug: string, category: string): number {
  switch (slug) {
    case 'reaction-time': return 180 + Math.random() * 100;
    case 'chimp-test': return 8 + Math.floor(Math.random() * 12);
    case 'typing': return 60 + Math.random() * 60;
    case 'visual-memory': return 7 + Math.floor(Math.random() * 8);
    case 'aim-trainer': return 300 + Math.random() * 200;
    case 'number-memory': return 8 + Math.floor(Math.random() * 6);
    case 'verbal-memory': return 40 + Math.floor(Math.random() * 60);
    case 'sequence-memory': return 8 + Math.floor(Math.random() * 10);
    case 'symbol-search': return 40 + Math.floor(Math.random() * 30);
    case 'hue-test': return 20 + Math.floor(Math.random() * 15);
    case 'object-tracking': return 6 + Math.floor(Math.random() * 6);
    default:
      if (category === 'gia') return 15 + Math.floor(Math.random() * 20);
      return 50 + Math.random() * 50;
  }
}
