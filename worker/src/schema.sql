-- Solvox history tables. Only needed for option (a); option (b) runs without them.
-- Apply with:  wrangler d1 execute solvox --file=./schema.sql

CREATE TABLE IF NOT EXISTS matches (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  ts                TEXT    NOT NULL,
  match_id          TEXT    NOT NULL,
  level_id          INTEGER,
  mode              TEXT,
  player            TEXT    NOT NULL,
  opponent          TEXT,
  answered          INTEGER DEFAULT 0,
  correct           INTEGER DEFAULT 0,
  accuracy          INTEGER DEFAULT 0,
  score             INTEGER DEFAULT 0,
  hp_remaining      INTEGER DEFAULT 0,
  wins              INTEGER DEFAULT 0,
  draw              INTEGER DEFAULT 0,
  losses            INTEGER DEFAULT 0,
  duration_sec      INTEGER DEFAULT 0,
  total_questions   INTEGER DEFAULT 10,
  hints_used        INTEGER DEFAULT 0,
  decisive_question TEXT,
  decisive_concept  TEXT
);

CREATE INDEX IF NOT EXISTS idx_matches_player ON matches (player);
CREATE INDEX IF NOT EXISTS idx_matches_ts     ON matches (ts);

CREATE TABLE IF NOT EXISTS feedback (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluations (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      TEXT NOT NULL,
  payload TEXT NOT NULL
);
