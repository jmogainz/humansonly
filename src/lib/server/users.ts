import { ensureDbSchema, getDbPool } from './db';
import { randomDisplayNameCandidate } from './displayNames';

export type OidcAccount = {
  provider: string;
  providerAccountId: string;
  email?: string | null;
  displayName?: string | null;
  imageUrl?: string | null;
};

export type UserProfile = {
  id: string;
  email: string | null;
  displayName: string;
  imageUrl: string | null;
  createdAt: string;
};

// Generate a random display name
function generateDisplayName(): string {
  return randomDisplayNameCandidate((min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  });
}

export async function upsertUserForOidcAccount(account: OidcAccount): Promise<string> {
  await ensureDbSchema();
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingLink = await client.query<{ user_id: string }>(
      'select user_id from oidc_accounts where provider=$1 and provider_account_id=$2 limit 1',
      [account.provider, account.providerAccountId]
    );

    if (existingLink.rowCount) {
      const userId = existingLink.rows[0].user_id;
      // Update basic info but preserve the display name
      await client.query(
        `update users
         set email=coalesce($2, email),
             image_url=coalesce($3, image_url),
             updated_at=now()
         where id=$1`,
        [userId, account.email ?? null, account.imageUrl ?? null]
      );
      await client.query('COMMIT');
      return userId;
    }

    let userId: string | null = null;

    if (account.email) {
      const byEmail = await client.query<{ id: string }>('select id from users where email=$1', [account.email]);
      if (byEmail.rowCount) {
        userId = byEmail.rows[0].id;
      }
    }

    if (!userId) {
      const randomName = generateDisplayName();
      const created = await client.query<{ id: string }>(
        'insert into users (email, name, image_url) values ($1, $2, $3) returning id',
        [account.email ?? null, randomName, account.imageUrl ?? null]
      );
      userId = created.rows[0].id;
    }

    await client.query(
      'insert into oidc_accounts (provider, provider_account_id, user_id) values ($1, $2, $3) on conflict do nothing',
      [account.provider, account.providerAccountId, userId]
    );

    await client.query('COMMIT');
    return userId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query<{
    id: string;
    email: string | null;
    name: string | null;
    image_url: string | null;
    created_at: Date;
  }>(
    `select id, email, name, image_url, created_at
     from users
     where id=$1
     limit 1`,
    [userId]
  );

  if (!result.rowCount) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    displayName: row.name ?? 'Player',
    imageUrl: row.image_url,
    createdAt: row.created_at.toISOString(),
  };
}

export async function mapDisplayNames(userIds: string[]): Promise<Map<string, { displayName: string; imageUrl: string | null }>> {
  if (userIds.length === 0) return new Map();
  await ensureDbSchema();
  const pool = getDbPool();

  const result = await pool.query<{
    id: string;
    name: string | null;
    image_url: string | null;
  }>(
    `select id, name, image_url
     from users
     where id = any($1::uuid[])`,
    [userIds]
  );

  const map = new Map<string, { displayName: string; imageUrl: string | null }>();
  for (const row of result.rows) {
    map.set(row.id, {
      displayName: row.name ?? 'Player',
      imageUrl: row.image_url,
    });
  }
  return map;
}
