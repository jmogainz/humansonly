export function cn(...tokens: Array<string | false | null | undefined>): string {
  return tokens.filter(Boolean).join(' ');
}

const RECENT_SIGNATURE_PREFIX = 'humansonly_recent_signatures_v1:';
const RECENT_SIGNATURE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type RecentSignaturePayload = {
  updatedAt: number;
  signatures: string[];
};

type RecentSignatureTracker = {
  queue: string[];
  set: Set<string>;
  maxSize: number;
  hydrated: boolean;
};

const RECENT_SIGNATURE_TRACKERS = new Map<string, RecentSignatureTracker>();

function hydrateRecentTracker(storageKey: string, tracker: RecentSignatureTracker): void {
  if (tracker.hydrated || typeof window === 'undefined') return;
  tracker.hydrated = true;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw) as RecentSignaturePayload;
    if (!parsed?.updatedAt || !Array.isArray(parsed.signatures)) return;
    if (Date.now() - parsed.updatedAt > RECENT_SIGNATURE_TTL_MS) return;
    const clipped = parsed.signatures.slice(-tracker.maxSize);
    tracker.queue = clipped;
    tracker.set = new Set(clipped);
  } catch {
    // Best effort only.
  }
}

function persistRecentTracker(storageKey: string, tracker: RecentSignatureTracker): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: RecentSignaturePayload = {
      updatedAt: Date.now(),
      signatures: tracker.queue,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // Best effort only.
  }
}

function getRecentTracker(testKey: string, maxRecent: number): {
  tracker: RecentSignatureTracker;
  storageKey: string;
} {
  const storageKey = `${RECENT_SIGNATURE_PREFIX}${testKey}`;
  const existing = RECENT_SIGNATURE_TRACKERS.get(storageKey);
  if (existing) {
    if (maxRecent !== existing.maxSize) {
      existing.maxSize = maxRecent;
      if (existing.queue.length > maxRecent) {
        existing.queue = existing.queue.slice(-maxRecent);
        existing.set = new Set(existing.queue);
      }
    }
    hydrateRecentTracker(storageKey, existing);
    return { tracker: existing, storageKey };
  }

  const tracker: RecentSignatureTracker = {
    queue: [],
    set: new Set<string>(),
    maxSize: maxRecent,
    hydrated: false,
  };
  RECENT_SIGNATURE_TRACKERS.set(storageKey, tracker);
  hydrateRecentTracker(storageKey, tracker);
  return { tracker, storageKey };
}

function pushRecentSignature(
  tracker: RecentSignatureTracker,
  signature: string
): void {
  if (tracker.set.has(signature)) return;
  if (tracker.queue.length >= tracker.maxSize) {
    const oldest = tracker.queue.shift();
    if (oldest !== undefined) {
      tracker.set.delete(oldest);
    }
  }
  tracker.queue.push(signature);
  tracker.set.add(signature);
}

export function generateRecentUnique<T>(
  testKey: string,
  maxRecent: number,
  factory: () => T,
  signatureOf: (value: T) => string,
  maxAttempts = 64
): T {
  const { tracker, storageKey } = getRecentTracker(testKey, maxRecent);

  let chosen = factory();
  let signature = signatureOf(chosen);
  if (!tracker.set.has(signature)) {
    pushRecentSignature(tracker, signature);
    persistRecentTracker(storageKey, tracker);
    return chosen;
  }

  for (let attempt = 1; attempt < maxAttempts; attempt += 1) {
    const candidate = factory();
    const candidateSignature = signatureOf(candidate);
    chosen = candidate;
    signature = candidateSignature;
    if (!tracker.set.has(candidateSignature)) {
      break;
    }
  }

  pushRecentSignature(tracker, signature);
  persistRecentTracker(storageKey, tracker);
  return chosen;
}

export function generateSessionUnique<T>(
  seenSignatures: Set<string>,
  factory: () => T,
  signatureOf: (value: T) => string,
  maxAttempts = 512
): T {
  let chosen = factory();
  let signature = signatureOf(chosen);

  if (!seenSignatures.has(signature)) {
    seenSignatures.add(signature);
    return chosen;
  }

  for (let attempt = 1; attempt < maxAttempts; attempt += 1) {
    const candidate = factory();
    const candidateSignature = signatureOf(candidate);
    chosen = candidate;
    signature = candidateSignature;
    if (!seenSignatures.has(candidateSignature)) {
      break;
    }
  }

  seenSignatures.add(signature);
  return chosen;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms)) return '--';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function makeGuestId(): string {
  return `guest_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
