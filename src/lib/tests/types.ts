export type ScoreDirection = 'higher' | 'lower';

export type ScoreUnit =
  | 'ms'
  | 'ms/target'
  | 'level'
  | 'wpm'
  | 'digits'
  | 'count'
  | 'correct/90s'
  | 'percent'
  | 'net'
  | 'classification';

export type TestCategory = 'human-benchmark' | 'gia';

export type TestDefinition = {
  slug: string;
  name: string;
  description: string;
  category: TestCategory;
  icon: string;
  scoreUnit: ScoreUnit;
  direction: ScoreDirection;
  leaderboardEnabled: boolean;
  playable?: boolean;
  timeLimitSeconds?: number;
};

export type ScoreSubmission = {
  testSlug: string;
  scoreValue: number;
  scoreUnit: ScoreUnit;
  metadata?: Record<string, unknown>;
  guestId?: string;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  imageUrl: string | null;
  scoreValue: number;
  scoreUnit: ScoreUnit;
  createdAt: string;
  isCurrentUser?: boolean;
};
