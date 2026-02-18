-- 002_guest_scores_retention.up.sql
create index if not exists idx_guest_scores_claimed_created_at
  on guest_scores(created_at)
  where claimed_by is not null;

create index if not exists idx_guest_scores_unclaimed_created_at
  on guest_scores(created_at)
  where claimed_by is null;

---- create above / drop below ----

-- 002_guest_scores_retention.down.sql
drop index if exists idx_guest_scores_unclaimed_created_at;
drop index if exists idx_guest_scores_claimed_created_at;
