-- 001_initial.up.sql
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text,
  name text,
  image_url text,
  display_name_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_users_name_lower_unique on users (lower(name)) where (name is not null);

create table if not exists oidc_accounts (
  provider text not null,
  provider_account_id text not null,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (provider, provider_account_id)
);

create index if not exists idx_oidc_accounts_user on oidc_accounts(user_id);

create table if not exists test_definitions (
  slug text primary key,
  name text not null,
  direction text not null check (direction in ('higher', 'lower')),
  score_unit text not null,
  leaderboard_enabled boolean not null default true
);

insert into test_definitions (slug, name, direction, score_unit, leaderboard_enabled)
values
  ('reaction-time', 'Reaction Time', 'lower', 'ms', true),
  ('chimp-test', 'Chimp Test', 'higher', 'level', true),
  ('typing', 'Typing Test', 'higher', 'wpm', true),
  ('visual-memory', 'Visual Memory', 'higher', 'level', true),
  ('aim-trainer', 'Aim Trainer', 'lower', 'ms/target', true),
  ('number-memory', 'Number Memory', 'higher', 'digits', true),
  ('verbal-memory', 'Verbal Memory', 'higher', 'count', true),
  ('sequence-memory', 'Sequence Memory', 'higher', 'level', true),
  ('symbol-search', 'Symbol Search', 'higher', 'correct/90s', true),
  ('color-blindness', 'Color Blindness', 'higher', 'classification', false),
  ('face-memory', 'Face Memory', 'higher', 'percent', true),
  ('hue-test', 'Hue Test', 'higher', 'level', true),
  ('object-tracking', 'Object Tracking', 'higher', 'level', true),
  ('gia-reasoning', 'GIA Reasoning', 'higher', 'net', true),
  ('gia-perceptual-speed', 'GIA Perceptual Speed', 'higher', 'net', true),
  ('gia-number-speed', 'GIA Number Speed', 'higher', 'net', true),
  ('gia-word-meaning', 'GIA Word Meaning', 'higher', 'net', true),
  ('gia-spatial', 'GIA Spatial', 'higher', 'net', true),
  ('gia-combined', 'GIA Combined', 'higher', 'net', true)
on conflict (slug) do update
set
  name = excluded.name,
  direction = excluded.direction,
  score_unit = excluded.score_unit,
  leaderboard_enabled = excluded.leaderboard_enabled;

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  test_slug text not null references test_definitions(slug),
  score_value numeric not null,
  score_unit text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_scores_user on scores(user_id, test_slug, created_at desc);
create index if not exists idx_scores_test on scores(test_slug, score_value);
create index if not exists idx_scores_created on scores(created_at);

create table if not exists gia_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  reasoning_score numeric not null,
  reasoning_correct int not null,
  reasoning_incorrect int not null,
  perceptual_score numeric not null,
  perceptual_correct int not null,
  perceptual_incorrect int not null,
  number_score numeric not null,
  number_correct int not null,
  number_incorrect int not null,
  word_score numeric not null,
  word_correct int not null,
  word_incorrect int not null,
  spatial_score numeric not null,
  spatial_correct int not null,
  spatial_incorrect int not null,
  combined_score numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gia_sessions_user on gia_sessions(user_id, created_at desc);
create index if not exists idx_gia_sessions_combined on gia_sessions(combined_score desc);

create table if not exists leaderboard_snapshots (
  id serial primary key,
  test_slug text not null references test_definitions(slug),
  user_id uuid not null references users(id),
  best_score numeric not null,
  rank int not null,
  snapshot_date date not null default current_date,
  unique (test_slug, user_id, snapshot_date)
);

create table if not exists guest_scores (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null,
  test_slug text not null references test_definitions(slug),
  score_value numeric not null,
  score_unit text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  claimed_by uuid references users(id)
);

create index if not exists idx_guest_scores_guest on guest_scores(guest_id, test_slug, created_at desc);
create index if not exists idx_guest_scores_claimed on guest_scores(claimed_by);

---- create above / drop below ----

-- 001_initial.down.sql
drop table if exists leaderboard_snapshots;
drop table if exists guest_scores;
drop table if exists gia_sessions;
drop table if exists scores;
drop table if exists test_definitions;
drop table if exists oidc_accounts;
drop table if exists users;
