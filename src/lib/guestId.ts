import { makeGuestId } from '@/lib/utils';

export const GUEST_STORAGE_KEY = 'humansonly_guest_id';
const GUEST_COOKIE_KEY = 'humansonly_guest_id';
const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 5;

let inMemoryGuestId: string | null = null;

function readGuestCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const segments = document.cookie.split(';');
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed.startsWith(`${GUEST_COOKIE_KEY}=`)) continue;
    const rawValue = trimmed.slice(GUEST_COOKIE_KEY.length + 1);
    if (!rawValue) return null;
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }
  return null;
}

function writeGuestCookie(guestId: string): void {
  if (typeof document === 'undefined') return;
  const encoded = encodeURIComponent(guestId);
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const canShareAcrossHosts = hostname === 'humansonly.com' || hostname.endsWith('.humansonly.com');
  const domainAttr = canShareAcrossHosts ? '; Domain=humansonly.com' : '';
  const secureAttr = isHttps ? '; Secure' : '';
  document.cookie = `${GUEST_COOKIE_KEY}=${encoded}; Max-Age=${GUEST_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${domainAttr}${secureAttr}`;
}

function readGuestStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(GUEST_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeGuestStorage(guestId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, guestId);
  } catch {
    // Best effort only; cookie fallback still keeps the ID sticky.
  }
}

export function getStoredGuestId(): string | null {
  if (typeof window === 'undefined') return null;

  const stored = readGuestStorage();
  if (stored) {
    inMemoryGuestId = stored;
    return stored;
  }

  const fromCookie = readGuestCookie();
  if (fromCookie) {
    inMemoryGuestId = fromCookie;
    writeGuestStorage(fromCookie);
    return fromCookie;
  }

  return inMemoryGuestId;
}

export function setStoredGuestId(guestId: string): void {
  inMemoryGuestId = guestId;
  writeGuestStorage(guestId);
  writeGuestCookie(guestId);
}

export function getOrCreateGuestId(): string {
  const existing = getStoredGuestId();
  if (existing) return existing;

  const created = makeGuestId();
  setStoredGuestId(created);
  return created;
}
