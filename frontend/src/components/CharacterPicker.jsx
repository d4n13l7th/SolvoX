import React from 'react';
import { BOSSES } from '../data/bosses';
import { getBossPreviewSrc } from '../data/bossAssets';
import { PLAYER_ASSETS } from '../data/playerAssets';
import CharacterShowcase from './CharacterShowcase';

export const MULTIPLAYER_CHARACTERS = Object.freeze([
  {
    id: 'traveler',
    nameId: 'characterTraveler',
    roleId: 'characterTravelerRole',
    portrait: PLAYER_ASSETS.traveler.portrait,
    accent: '#efbd52',
    kind: 'player',
  },
  {
    id: 'asuka',
    nameId: 'characterAsuka',
    roleId: 'characterAsukaRole',
    portrait: PLAYER_ASSETS.asuka.portrait,
    accent: '#f17a83',
    kind: 'player',
  },
  ...Object.values(BOSSES).map((boss) => ({
    id: boss.spriteId,
    nameId: `character_${boss.spriteId}`,
    roleId: `character_${boss.spriteId}_role`,
    portrait: getBossPreviewSrc(boss.spriteId),
    accent: boss.accent,
    kind: 'boss',
  })),
]);

export function findCharacter(characterId) {
  return MULTIPLAYER_CHARACTERS.find((character) => character.id === characterId)
    || MULTIPLAYER_CHARACTERS[0];
}

export default function CharacterPicker({ value = 'traveler', onChange, levelId = 1, t }) {
  return (
    <CharacterShowcase
      characters={MULTIPLAYER_CHARACTERS}
      value={findCharacter(value).id}
      onChange={onChange}
      t={t}
      levelId={levelId}
      className="multiplayer-character-showcase"
    />
  );
}
