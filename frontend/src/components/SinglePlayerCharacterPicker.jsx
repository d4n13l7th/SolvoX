import React from 'react';
import { PLAYER_ASSETS } from '../data/playerAssets';
import CharacterShowcase from './CharacterShowcase';

const SINGLE_PLAYER_CHARACTERS = Object.freeze([
  { ...PLAYER_ASSETS.traveler, accent: '#82d7b5', kind: 'player' },
  { ...PLAYER_ASSETS.asuka, accent: '#e9a46b', kind: 'player' },
]);

export default function SinglePlayerCharacterPicker({ value = 'traveler', onChange, t, levelId = 1 }) {
  return <CharacterShowcase characters={SINGLE_PLAYER_CHARACTERS} value={value} onChange={onChange} t={t} levelId={levelId} className="single-character-showcase" />;
}
