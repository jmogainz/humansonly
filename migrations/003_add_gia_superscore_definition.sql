-- 003_add_gia_superscore_definition.up.sql
insert into test_definitions (slug, name, direction, score_unit, leaderboard_enabled)
values ('gia-superscore', 'GIA Superscore', 'higher', 'net', true)
on conflict (slug) do update
set
  name = excluded.name,
  direction = excluded.direction,
  score_unit = excluded.score_unit,
  leaderboard_enabled = excluded.leaderboard_enabled;

---- create above / drop below ----

-- 003_add_gia_superscore_definition.down.sql
delete from test_definitions
where slug = 'gia-superscore';
