-- 003_auth_refactor.up.sql
create table if not exists oidc_accounts (
  provider text not null,
  provider_account_id text not null,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (provider, provider_account_id)
);

create index if not exists idx_oidc_accounts_user on oidc_accounts(user_id);

-- Migrate existing users (if any) to oidc_accounts
insert into oidc_accounts (provider, provider_account_id, user_id)
select provider, provider_account_id, id
from users
where provider is not null and provider_account_id is not null
on conflict do nothing;

-- Rename display_name to name
alter table users rename column display_name to name;

-- Drop provider columns from users
alter table users drop column if exists provider;
alter table users drop column if exists provider_account_id;

---- create above / drop below ----

-- 003_auth_refactor.down.sql
alter table users add column if not exists provider text;
alter table users add column if not exists provider_account_id text;

-- Warning: Data in oidc_accounts might be lost or need complex migration back to users if multiple accounts exist per user.
-- For simple revert, we just rename name back to display_name
alter table users rename column name to display_name;

drop table if exists oidc_accounts;
