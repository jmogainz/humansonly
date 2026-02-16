import type { ScoreUnit, TestDefinition } from '@/lib/tests/types';

export type TestCompletePayload = {
  score: number;
  unit: ScoreUnit;
  metadata?: Record<string, unknown>;
  label?: string;
};

export type TestGameProps = {
  definition: TestDefinition;
  onComplete: (payload: TestCompletePayload) => void;
};
