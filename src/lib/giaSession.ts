'use client';

import { GIA_COMBINED_SLUG, GIA_SLUGS } from '@/constants';

const STORAGE_KEY = 'humansonly_gia_session_v1';
const SESSION_MAX_AGE_MS = 30 * 60 * 1000;

type GiaSession = {
  startedAt: number;
  scores: Partial<Record<(typeof GIA_SLUGS)[number], number>>;
  submittedCombined: boolean;
  flowActive: boolean;
  nextIndex: number;
};

function now(): number {
  return Date.now();
}

function emptySession(): GiaSession {
  return {
    startedAt: now(),
    scores: {},
    submittedCombined: false,
    flowActive: false,
    nextIndex: 0,
  };
}

function readSession(): GiaSession {
  if (typeof window === 'undefined') return emptySession();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as GiaSession;

    if (!parsed.startedAt || now() - parsed.startedAt > SESSION_MAX_AGE_MS) {
      return emptySession();
    }

    return {
      startedAt: parsed.startedAt,
      scores: parsed.scores ?? {},
      submittedCombined: Boolean(parsed.submittedCombined),
      flowActive: Boolean(parsed.flowActive),
      nextIndex: typeof parsed.nextIndex === 'number' ? parsed.nextIndex : 0,
    };
  } catch {
    return emptySession();
  }
}

function writeSession(session: GiaSession): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function recordGiaSubtestScore(
  slug: string,
  score: number
):
  | { ready: false; accepted: boolean }
  | {
      accepted: true;
      ready: true;
      total: number;
      breakdown: Record<(typeof GIA_SLUGS)[number], number>;
    } {
  if (!GIA_SLUGS.includes(slug as (typeof GIA_SLUGS)[number])) {
    return { ready: false, accepted: false };
  }

  const session = readSession();
  if (!session.flowActive) {
    return { ready: false, accepted: false };
  }

  const key = slug as (typeof GIA_SLUGS)[number];
  const expectedSlug = GIA_SLUGS[session.nextIndex];
  if (expectedSlug !== key) {
    return { ready: false, accepted: false };
  }

  session.scores[key] = score;
  session.nextIndex += 1;

  const allComplete = GIA_SLUGS.every((testSlug) => typeof session.scores[testSlug] === 'number');
  writeSession(session);

  if (!allComplete || session.submittedCombined) {
    return { ready: false, accepted: true };
  }

  const breakdown = Object.fromEntries(
    GIA_SLUGS.map((testSlug) => [testSlug, session.scores[testSlug] ?? 0])
  ) as Record<(typeof GIA_SLUGS)[number], number>;

  const total = GIA_SLUGS.reduce((sum, testSlug) => sum + (session.scores[testSlug] ?? 0), 0);

  return {
    accepted: true,
    ready: true,
    total,
    breakdown,
  };
}

export function markGiaCombinedSubmitted(): void {
  const session = readSession();
  session.submittedCombined = true;
  session.flowActive = false;
  writeSession(session);
}

export function startGiaAssessmentSession(): void {
  const session: GiaSession = {
    startedAt: now(),
    scores: {},
    submittedCombined: false,
    flowActive: true,
    nextIndex: 0,
  };
  writeSession(session);
}

export function cancelGiaAssessmentSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const GIA_COMBINED_TEST_SLUG = GIA_COMBINED_SLUG;
