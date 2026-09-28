/**
 * Player sprite asset registry.
 *
 * The active single-player character is declared once here. SpriteCharacter
 * consumes this manifest so future player art can be swapped without adding
 * another renderer or duplicating animation logic.
 */
const freezeSequence = (frames, step, impactFrame = null) =>
  Object.freeze({ frames: Object.freeze(frames), step, impactFrame });

export const PLAYER_ASSETS = Object.freeze({
  traveler: Object.freeze({
    id: 'traveler',
    base: '/assets/characters/traveler',
    portrait: '/assets/characters/traveler/idle/01.png',
    sequences: Object.freeze({
      idle: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png'], 150),
      attack: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png','07.png'], 82, 5),
      hurt: freezeSequence(['01.png','02.png','03.png','04.png','05.png'], 112),
      die: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png'], 175),
    }),
  }),
});

export const ACTIVE_PLAYER_ID = 'traveler';

export function getPlayerAsset(playerId = ACTIVE_PLAYER_ID) {
  return PLAYER_ASSETS[playerId] || PLAYER_ASSETS[ACTIVE_PLAYER_ID];
}

export function resolvePlayerSequence(action = 'idle', playerId = ACTIVE_PLAYER_ID) {
  const asset = getPlayerAsset(playerId);
  if (asset.sequences[action]) return action;
  return 'idle';
}


