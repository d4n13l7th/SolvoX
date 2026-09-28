import { ACTIVE_PLAYER_ID } from './playerAssets';

export const PLAYER = {
  id: ACTIVE_PLAYER_ID,
  name: 'The Traveler',
  role: 'Main Character',
  quoteId: 'traveler.quote',
  stats: { hp: 100, energy: 50, str: 10, dex: 12, int: 8, vit: 10, luk: 5 },
  special: ['Dash Invulnerability', 'Combo Attack (4 Hit)', 'Spirit Skill', 'Energy Regeneration'],
  skills: [
    { id:'normal', nameId:'skill.normal', type:'attack' },
    { id:'dash', nameId:'skill.dash', type:'movement' },
    { id:'spirit', nameId:'skill.spirit', type:'attack' },
    { id:'ultimate', nameId:'skill.ultimate', type:'ultimate' }
  ],
  variants: ['Default', 'Black', 'Red', 'Blue', 'Purple'],
  equipment: {
    weapons: ['Sword (Default)', 'Sword (Blue)', 'Sword (Red)', 'Sword (Purple)'],
    armor: ['Helm', 'Armor', 'Cape', 'Accessory']
  },
  animations: ['idle','attack','hurt','die']
};
