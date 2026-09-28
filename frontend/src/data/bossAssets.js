/**
 * Boss sprite asset registry.
 *
 * Every image-based boss is declared here. BossMonster only consumes this
 * manifest, so adding Chapter 3–5 artwork later does not require another
 * renderer or another one-off component.
 */
const freezeSequence = (frames, step, impactMs = null) =>
  Object.freeze({ frames: Object.freeze(frames), step, impactMs });

export const BOSS_ASSETS = Object.freeze({
  wolf: Object.freeze({
    base: '/assets/characters/wolf',
    sequences: Object.freeze({
      idle: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp'], 175),
      attack: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp'], 92, 320),
      hurt: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp'], 82),
      die: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp'], 145),
    }),
  }),
  wraith: Object.freeze({
    base: '/assets/characters/wraith',
    sequences: Object.freeze({
      idle: freezeSequence(['17.webp','18.webp','19.webp','20.webp','21.webp','22.webp'], 175),
      attack: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp','07.webp'], 92, 360),
      hurt: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp'], 82),
      die: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp'], 145),
    }),
  }),
  'equation-drake': Object.freeze({
    base: '/assets/characters/equation-drake',
    sequences: Object.freeze({
      idle: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp'], 170),
      attack: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp','07.webp','08.webp','09.webp'], 82, 420),
      hurt: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp'], 76),
      die: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp'], 145),
    }),
    effects: Object.freeze({
      attackElement: freezeSequence(['01.webp','02.webp','03.webp'], 74),
    }),
  }),
  titan: Object.freeze({
    base: '/assets/characters/titan',
    sequences: Object.freeze({
      idle: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp'], 120),
      attack: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp','07.webp'], 100, 380),
      hurt: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp'], 82),
      die: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp'], 110),
    }),
  }),
  axiom: Object.freeze({
    base: '/assets/characters/axiom',
    sequences: Object.freeze({
      idle: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp','07.webp','08.webp'], 120),
      attack: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp','07.webp'], 82, 420),
      hurt: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp'], 70),
      die: freezeSequence(['01.webp','02.webp','03.webp','04.webp','05.webp','06.webp','07.webp','08.webp','09.webp'], 100),
    }),
  }),
});

export function getBossAsset(spriteId) {
  return BOSS_ASSETS[spriteId] || null;
}

export function resolveBossSequence(spriteId, action = 'idle') {
  const asset = getBossAsset(spriteId);
  if (!asset) return null;
  if (asset.sequences[action]) return action;
  return asset.sequences.idle ? 'idle' : Object.keys(asset.sequences)[0];
}

export function getBossFrameSrc(spriteId, sequence = 'idle', frame = 0) {
  const asset = getBossAsset(spriteId);
  if (!asset) return '';
  const safeSequence = resolveBossSequence(spriteId, sequence);
  const frames = asset.sequences[safeSequence]?.frames || [];
  if (!frames.length) return '';
  const safeFrame = Math.min(Math.max(Number(frame) || 0, 0), frames.length - 1);
  return `${asset.base}/${safeSequence}/${frames[safeFrame]}`;
}

export function getBossImpactMs(spriteId, sequence = 'attack', fallback = 320) {
  return getBossAsset(spriteId)?.sequences?.[sequence]?.impactMs ?? fallback;
}

export function getBossPreviewSrc(spriteId) {
  return getBossFrameSrc(spriteId, 'idle', 0);
}
