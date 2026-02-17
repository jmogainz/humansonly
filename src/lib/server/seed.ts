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
    if (!test.leaderboardEnabled) continue;
    if (test.playable === false && test.slug !== 'gia-combined') continue;

    // Add 3-5 scores per test to create a "history"
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const { scoreValue, metadata } = generatePlausibleScoreWithMetadata(test.slug, test.category);
      await submitScoreForUser(userId, {
        testSlug: test.slug,
        scoreValue,
        scoreUnit: test.scoreUnit,
        metadata: { ...metadata, seeded: true },
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
      const { scoreValue } = generatePlausibleScoreWithMetadata(test.slug, test.category);
      await updateLeaderboardBest(redis, test.slug, user.id, scoreValue, test.direction);
    }
  }
}

function generatePlausibleScoreWithMetadata(slug: string, category: string): { scoreValue: number; metadata?: Record<string, any> } {
  let scoreValue = 0;
  let metadata: Record<string, any> = {};

  switch (slug) {
    case 'reaction-time': 
      scoreValue = 180 + Math.random() * 100;
      break;
    case 'chimp-test': 
      scoreValue = 8 + Math.floor(Math.random() * 12);
      break;
    case 'typing': 
      scoreValue = 60 + Math.random() * 60;
      break;
    case 'visual-memory': 
      scoreValue = 7 + Math.floor(Math.random() * 8);
      break;
    case 'aim-trainer': 
      scoreValue = 300 + Math.random() * 200;
      break;
    case 'number-memory': 
      scoreValue = 8 + Math.floor(Math.random() * 6);
      break;
    case 'verbal-memory': 
      scoreValue = 40 + Math.floor(Math.random() * 60);
      break;
    case 'sequence-memory': 
      scoreValue = 8 + Math.floor(Math.random() * 10);
      break;
    case 'symbol-search': 
      {
        const correct = 40 + Math.floor(Math.random() * 30);
        const incorrect = Math.floor(Math.random() * 5);
        scoreValue = correct;
        metadata = { correct, incorrect, attempts: correct + incorrect };
      }
      break;
    case 'hue-test': 
      scoreValue = 20 + Math.floor(Math.random() * 15);
      break;
    case 'object-tracking': 
      scoreValue = 6 + Math.floor(Math.random() * 6);
      break;
    default:
      if (category === 'gia' || slug === 'gia-combined') {
        const correct = 20 + Math.floor(Math.random() * 25);
        const incorrect = Math.floor(Math.random() * 8);
        let penalty = 0.5;
        if (slug === 'gia-reasoning') penalty = 1;
        if (slug === 'gia-perceptual-speed') penalty = 0.25;
        
        scoreValue = correct - (incorrect * penalty);
        metadata = { correct, incorrect, penalty };
      } else {
        scoreValue = 50 + Math.random() * 50;
      }
  }

  return { scoreValue, metadata };
}
