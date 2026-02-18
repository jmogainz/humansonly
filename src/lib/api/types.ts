import type { LeaderboardEntry, ScoreUnit } from '@/lib/tests/types';

export type ApiError = {
  errorCode: string;
  message: string;
};

export type SubmitScoreRequest = {
  testSlug: string;
  scoreValue: number;
  scoreUnit: ScoreUnit;
  metadata?: Record<string, unknown>;
  guestId?: string;
};

export type SubmitScoreResponse = {
  scoreId: string;
  personalBest: boolean;
  percentile: number | null;
  saved?: boolean;
  discardReason?: string;
};

export type ScoreHistoryResponse = {
  testSlug: string;
  scores: Array<{
    id: string;
    scoreValue: number;
    scoreUnit: string;
    createdAt: string;
    metadata: Record<string, unknown> | null;
  }>;
};

export type LeaderboardResponse = {
  testSlug: string;
  entries: LeaderboardEntry[];
};

export type AroundMeResponse = {
  testSlug: string;
  rank: number;
  entries: LeaderboardEntry[];
};

export type CategoryHistoryResponse = {
  scores: Array<{
    id: string;
    testSlug: string;
    scoreValue: number;
    scoreUnit: string;
    createdAt: string;
    metadata: Record<string, unknown> | null;
  }>;
};

export type ProfileResponse = {
  user: {
    id: string;
    email: string | null;
    displayName: string;
    imageUrl: string | null;
    createdAt: string;
  };
  bests: Array<{ testSlug: string; bestScore: number; scoreUnit: string }>;
};
