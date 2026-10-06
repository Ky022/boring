PRAGMA foreign_keys=ON;
ALTER TABLE guilds ADD COLUMN last_actor_command TEXT;
CREATE TABLE friendships (
  low_id TEXT NOT NULL REFERENCES accounts(id),
  high_id TEXT NOT NULL REFERENCES accounts(id),
  requester TEXT NOT NULL REFERENCES accounts(id),
  status TEXT NOT NULL CHECK(status IN ('pending','accepted')),
  created_ms INTEGER NOT NULL,
  PRIMARY KEY(low_id,high_id),
  CHECK(low_id<high_id),
  CHECK(requester=low_id OR requester=high_id)
);
CREATE INDEX friendships_high ON friendships(high_id,status);
CREATE TABLE guild_weeks (
  guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  week TEXT NOT NULL,
  damage INTEGER NOT NULL DEFAULT 0,
  hits INTEGER NOT NULL DEFAULT 0,
  kills INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(guild_id,week)
);
CREATE TABLE guild_week_members (
  guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  week TEXT NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  damage INTEGER NOT NULL DEFAULT 0,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(guild_id,week,account_id)
);
CREATE TABLE guild_claims (
  account_id TEXT NOT NULL REFERENCES accounts(id),
  guild_id TEXT NOT NULL,
  week TEXT NOT NULL,
  task TEXT NOT NULL,
  PRIMARY KEY(account_id,week,task)
);
UPDATE schema_metadata SET version=3 WHERE version=2;
