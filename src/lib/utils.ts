export function cn(...tokens: Array<string | false | null | undefined>): string {
  return tokens.filter(Boolean).join(' ');
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
