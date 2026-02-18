'use client';

import { useCallback, useState } from 'react';
import { apiPost } from '@/lib/api';
import type { SubmitScoreRequest, SubmitScoreResponse } from '@/lib/api/types';
import type { ScoreUnit } from '@/lib/tests/types';
import { getOrCreateGuestId } from '@/lib/guestId';

export function useScore() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitScore = useCallback(
    async (testSlug: string, scoreValue: number, scoreUnit: ScoreUnit, metadata?: Record<string, unknown>) => {
      setSubmitting(true);
      setError(null);
      try {
        const payload: SubmitScoreRequest = {
          testSlug,
          scoreValue,
          scoreUnit,
          metadata,
          guestId: getOrCreateGuestId(),
        };
        const response = await apiPost<SubmitScoreRequest, SubmitScoreResponse>('/api/scores/submit', payload);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit score';
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return {
    submitting,
    error,
    submitScore,
  };
}
