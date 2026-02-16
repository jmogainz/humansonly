-- 002_leaderboards.up.sql
create table if not exists leaderboard_snapshots (
  id serial primary key,
  test_slug text not null references test_definitions(slug),
  user_id uuid not null references users(id),
  best_score numeric not null,
  rank int not null,
  snapshot_date date not null default current_date,
  unique (test_slug, user_id, snapshot_date)
);

---- create above / drop below ----

-- 002_leaderboards.down.sql
drop table if exists leaderboard_snapshots;
