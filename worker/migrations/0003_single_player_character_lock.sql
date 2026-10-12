ALTER TABLE single_player_saves
  ADD COLUMN character_locked INTEGER NOT NULL DEFAULT 0;

-- Slots that already existed before this field was introduced have already
-- entered an adventure, so preserve their selected character.
UPDATE single_player_saves
  SET character_locked = 1;
