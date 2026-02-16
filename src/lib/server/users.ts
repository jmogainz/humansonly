import { ensureDbSchema, getDbPool } from './db';

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

function fallbackDisplayName(email: string | null | undefined, provider: string): string {
  if (email) {
    const [name] = email.split('@');
    if (name) return name.slice(0, 24);
  }
  return `${provider}-player`;
}

export async function upsertUserForOidcAccount(account: OidcAccount): Promise<string> {
  await ensureDbSchema();
  const pool = getDbPool();

  const existing = await pool.query<{ id: string }>(
    'select id from users where provider=$1 and provider_account_id=$2 limit 1',
    [account.provider, account.providerAccountId]
  );

  const displayName = (account.displayName ?? fallbackDisplayName(account.email, account.provider)).slice(0, 48);

  if (existing.rowCount) {
    const userId = existing.rows[0].id;
    await pool.query(
      `update users
       set email=coalesce($2, email),
           display_name=coalesce($3, display_name),
           image_url=coalesce($4, image_url),
           updated_at=now()
       where id=$1`,
      [userId, account.email ?? null, displayName, account.imageUrl ?? null]
    );
    return userId;
  }

  const created = await pool.query<{ id: string }>(
    `insert into users (provider, provider_account_id, email, display_name, image_url)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [
      account.provider,
      account.providerAccountId,
      account.email ?? null,
      displayName,
      account.imageUrl ?? null,
    ]
  );

  return created.rows[0].id;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query<{
    id: string;
    email: string | null;
    display_name: string | null;
    image_url: string | null;
    created_at: Date;
  }>(
    `select id, email, display_name, image_url, created_at
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
    displayName: row.display_name ?? 'Player',
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
    display_name: string | null;
    image_url: string | null;
  }>(
    `select id, display_name, image_url
     from users
     where id = any($1::uuid[])`,
    [userIds]
  );

  const map = new Map<string, { displayName: string; imageUrl: string | null }>();
  for (const row of result.rows) {
    map.set(row.id, {
      displayName: row.display_name ?? 'Player',
      imageUrl: row.image_url,
    });
  }
  return map;
}
