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
    nameId: 'characterTraveler',
    roleId: 'characterTravelerRole',
    base: '/assets/characters/traveler',
    portrait: '/assets/characters/traveler/idle/01.png',
    referenceSize: Object.freeze({ width: 160, height: 160 }),
    frameFocus: Object.freeze({ idle: 0.5, attack: 0.5, hurt: 0.5, die: 0.5 }),
    sequences: Object.freeze({
      idle: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png'], 150),
      attack: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png','07.png'], 82, 5),
      hurt: freezeSequence(['01.png','02.png','03.png','04.png','05.png'], 112),
      die: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png'], 175),
    }),
  }),
  asuka: Object.freeze({
    id: 'asuka',
    nameId: 'characterAsuka',
    roleId: 'characterAsukaRole',
    base: '/assets/characters/asuka',
    sequenceFolders: Object.freeze({ idle: 'idle-asuka', attack: 'attack-asuka', hurt: 'hurt-asuka', die: 'die-asuka' }),
    portrait: '/assets/characters/asuka/idle-asuka/idle-asuka_01.webp',
    referenceSize: Object.freeze({ width: 343, height: 365 }),
    // The supplied attack canvas contains a long beam to the right. Focus the
    // renderer on Asuka's body so the effects can extend without shrinking the
    // fighter or pushing her out of the arena.
    frameFocus: Object.freeze({ idle: 0.5, attack: 0.30, hurt: 0.5, die: 0.5 }),
    sequences: Object.freeze({
      idle: freezeSequence(['idle-asuka_01.webp','idle-asuka_02.webp','idle-asuka_03.webp','idle-asuka_04.webp','idle-asuka_05.webp','idle-asuka_06.webp'], 150),
      attack: freezeSequence(['attack-asuka_01.webp','attack-asuka_02.webp','attack-asuka_03.webp','attack-asuka_04.webp','attack-asuka_05.webp','attack-asuka_06.webp','attack-asuka_07.webp','attack-asuka_08.webp','attack-asuka_09.webp','attack-asuka_10.webp','attack-asuka_11.webp','attack-asuka_12.webp'], 78, 8),
      hurt: freezeSequence(['hurt-asuka_01.webp','hurt-asuka_02.webp','hurt-asuka_03.webp','hurt-asuka_04.webp','hurt-asuka_05.webp','hurt-asuka_06.webp','hurt-asuka_07.webp','hurt-asuka_08.webp'], 105),
      die: freezeSequence(['die-asuka_01.webp','die-asuka_02.webp','die-asuka_03.webp','die-asuka_04.webp','die-asuka_05.webp'], 170),
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


