import crypto from 'node:crypto';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import { env } from '@/lib/server/env';
import { getUserProfile, upsertUserForOidcAccount } from '@/lib/server/users';
import { seedUserData, seedGlobalLeaderboard } from '@/lib/server/seed';

const envSecret = env('AUTH_SECRET') || env('NEXTAUTH_SECRET');
if (envSecret && !process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = envSecret;
}

const envUrl = env('AUTH_URL') || env('NEXTAUTH_URL');
if (envUrl && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = envUrl;
}

const APPLE_AUDIENCE = 'https://appleid.apple.com';
const APPLE_CLIENT_SECRET_TTL_SECONDS = 60 * 60 * 24 * 180;
const SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function loadApplePrivateKey(): string | null {
  const raw = env('APPLE_PRIVATE_KEY');
  if (!raw) return null;
  return raw.replace(/\\n/g, '\n').trim();
}

function buildAppleClientSecret(): string | null {
  const directSecret = env('APPLE_CLIENT_SECRET');
  if (directSecret) return directSecret;

  const clientId = env('APPLE_CLIENT_ID');
  const teamId = env('APPLE_TEAM_ID');
  const keyId = env('APPLE_KEY_ID');
  const privateKey = loadApplePrivateKey();

  if (!clientId || !teamId || !keyId || !privateKey) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const claims = {
    iss: teamId,
    iat: now,
    exp: now + APPLE_CLIENT_SECRET_TTL_SECONDS,
    aud: APPLE_AUDIENCE,
    sub: clientId,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaims = base64UrlEncode(JSON.stringify(claims));
  const payload = `${encodedHeader}.${encodedClaims}`;

  const signature = crypto.sign('SHA256', Buffer.from(payload), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  });

  return `${payload}.${base64UrlEncode(signature)}`;
}

const providers = [];

if (env('GOOGLE_CLIENT_ID') && env('GOOGLE_CLIENT_SECRET')) {
  providers.push(
    Google({
      clientId: env('GOOGLE_CLIENT_ID')!,
      clientSecret: env('GOOGLE_CLIENT_SECRET')!,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

const appleClientId = env('APPLE_CLIENT_ID');
const appleClientSecret = buildAppleClientSecret();
if (appleClientId && appleClientSecret) {
  providers.push(
    Apple({
      clientId: appleClientId,
      clientSecret: appleClientSecret,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: 'name email',
          response_mode: 'form_post',
        },
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== 'production',
  providers,
  secret: envSecret,
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  cookies: {
    callbackUrl: {
      name: '__Secure-next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: '__Secure-next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
        maxAge: 60 * 15,
      },
    },
    state: {
      name: '__Secure-next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
        maxAge: 60 * 15,
      },
    },
    nonce: {
      name: '__Secure-next-auth.nonce',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },
  callbacks: {
    jwt: async ({ token, account, user }) => {
      if (account?.provider && account.providerAccountId) {
        const userId = await upsertUserForOidcAccount({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          email: token.email ?? user?.email ?? null,
          name: (token.name as string | undefined) ?? user?.name ?? null,
          imageUrl: (token.picture as string | undefined) ?? user?.image ?? null,
        });
        token.userId = userId;

        if (env('NEXT_PUBLIC_ENV') === 'dev') {
          // Seed global leaderboard on any login if in dev
          await seedGlobalLeaderboard();

          // Only seed personal account history if signing in with Apple
          if (account.provider === 'apple') {
            await seedUserData(userId);
          }
        }
      }
      if (account?.provider) {
        token.provider = account.provider;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token.userId) {
        session.user.id = token.userId;
        const profile = await getUserProfile(token.userId);
        if (profile?.displayName) {
          session.user.name = profile.displayName;
        }
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      // Keep relative callback URLs working (e.g. "/profile").
      if (url.startsWith('/')) {
        const resolved = `${baseUrl}${url}`;
        const resolvedUrl = new URL(resolved);
        const isRoot = resolvedUrl.pathname === '/' && !resolvedUrl.search && !resolvedUrl.hash;
        if (isRoot) {
          return `${baseUrl}/profile`;
        }
        return resolved;
      }

      try {
        const target = new URL(url);
        const base = new URL(baseUrl);

        // Default safe case: same origin.
        if (target.origin === base.origin) {
          return url;
        }

        // Treat apex and www hosts as equivalent and preserve path/query/hash.
        const normalizeHost = (host: string) => host.replace(/^www\./, '');
        if (
          target.protocol === base.protocol &&
          normalizeHost(target.hostname) === normalizeHost(base.hostname)
        ) {
          const sameSiteTarget = `${base.origin}${target.pathname}${target.search}${target.hash}`;
          const targetUrl = new URL(sameSiteTarget);
          const isRoot = targetUrl.pathname === '/' && !targetUrl.search && !targetUrl.hash;
          if (isRoot) {
            return `${base.origin}/profile`;
          }
          return sameSiteTarget;
        }
      } catch {
        // Fall through to safe default.
      }

      // If callbackUrl is invalid/mismatched, prefer profile over homepage.
      return `${baseUrl}/profile`;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
