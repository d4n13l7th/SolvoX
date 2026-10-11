-- 0001_single_player.sql
--
-- Cloud save untuk Single Player. Empat tabel:
--   guest_players       — sesi tamu (bearer token di-hash, bukan disimpan mentah)
--   single_player_saves — slot petualangan (maks 5 per tamu, divalidasi di store)
--   battle_checkpoints  — posisi tengah pertempuran per (slot, chapter)
--   chapter_runs        — riwayat satu percobaan chapter, idempoten via client_run_id
--
-- Gaya mengikuti src/schema.sql: SQLite polos (tanpa STRICT), ts TEXT NOT NULL.
-- D1 mengaktifkan foreign_keys secara default, jadi ON DELETE CASCADE berlaku.

CREATE TABLE IF NOT EXISTS guest_players (
  id            TEXT PRIMARY KEY,
  token_hash    TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL DEFAULT 'Player',
  character_id  TEXT NOT NULL DEFAULT 'traveler',
  exp           INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guest_players_token
  ON guest_players(token_hash);

CREATE TABLE IF NOT EXISTS single_player_saves (
  id                    TEXT PRIMARY KEY,
  guest_id              TEXT NOT NULL,
  name                  TEXT NOT NULL,
  character_id          TEXT NOT NULL DEFAULT 'traveler',
  current_chapter_id    INTEGER NOT NULL DEFAULT 1,
  completed_levels_json TEXT NOT NULL DEFAULT '[]',
  exp                   INTEGER NOT NULL DEFAULT 0,
  revision              INTEGER NOT NULL DEFAULT 1,
  legacy_import_key     TEXT,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  FOREIGN KEY (guest_id) REFERENCES guest_players(id) ON DELETE CASCADE,
  -- NULL unik berkali-kali di SQLite, jadi slot tanpa impor tidak saling bentrok.
  UNIQUE (guest_id, legacy_import_key)
);

CREATE INDEX IF NOT EXISTS idx_saves_guest_updated
  ON single_player_saves(guest_id, updated_at);

CREATE TABLE IF NOT EXISTS battle_checkpoints (
  save_id      TEXT NOT NULL,
  chapter_id   INTEGER NOT NULL,
  revision     INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  PRIMARY KEY (save_id, chapter_id),
  FOREIGN KEY (save_id) REFERENCES single_player_saves(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_save
  ON battle_checkpoints(save_id);

CREATE TABLE IF NOT EXISTS chapter_runs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  save_id       TEXT NOT NULL,
  chapter_id    INTEGER NOT NULL,
  client_run_id TEXT NOT NULL,
  outcome       TEXT NOT NULL,
  correct       INTEGER NOT NULL DEFAULT 0,
  answered      INTEGER NOT NULL DEFAULT 0,
  hints_used    INTEGER NOT NULL DEFAULT 0,
  duration_sec  INTEGER NOT NULL DEFAULT 0,
  exp_awarded   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (save_id) REFERENCES single_player_saves(id) ON DELETE CASCADE,
  UNIQUE (save_id, client_run_id)
);

CREATE INDEX IF NOT EXISTS idx_runs_save_created
  ON chapter_runs(save_id, created_at);

CREATE INDEX IF NOT EXISTS idx_runs_save_chapter
  ON chapter_runs(save_id, chapter_id);
