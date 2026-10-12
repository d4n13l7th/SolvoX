import React from 'react';
import { getBossBySpriteId } from '../data/bosses';
import { PLAYER } from '../data/player';
import MultiplayerFighter from './MultiplayerFighter';
import PixelIcon from './PixelIcon';

const PLAYER_SKILLS = ['skillNormal', 'skillDash', 'skillSpirit', 'skillUltimate'];

export default function CharacterShowcase({ characters, value, onChange, t, levelId = 1, className = '' }) {
  const selectedIndex = Math.max(0, characters.findIndex((character) => character.id === value));
  const selected = characters[selectedIndex] || characters[0];
  if (!selected) return null;

  const boss = selected.kind === 'boss' ? getBossBySpriteId(selected.id) : null;
  const stats = boss
    ? [
        [t('characterHp'), boss.hp],
        [t('characterDamage'), boss.damage],
        [t('characterElement'), boss.element],
      ]
    : [
        [t('characterHp'), PLAYER.stats.hp],
        [t('characterEnergy'), PLAYER.stats.energy],
        [t('characterRole'), t(selected.roleId)],
      ];
  const skills = boss?.skills || PLAYER_SKILLS.map((skill) => t(skill));

  return (
    <div className={`character-showcase ${className}`}>
      <aside className="character-showcase-roster">
        <div className="character-showcase-section-title">
          <small>{t('characterRosterEyebrow')}</small>
          <h2>{t('characterRoster')}</h2>
        </div>
        <div className="character-showcase-list" role="listbox" aria-label={t('characterRoster')}>
          {characters.map((character, index) => {
            const active = character.id === selected.id;
            return (
              <button
                key={character.id}
                type="button"
                role="option"
                aria-selected={active}
                className={`character-showcase-choice ${active ? 'is-active' : ''} ${character.kind === 'boss' ? 'is-boss' : ''}`}
                style={{ '--character-accent': character.accent || '#82d7b5' }}
                onClick={() => onChange?.(character.id)}
              >
                <span className="character-showcase-choice-icon"><img src={character.portrait} alt="" draggable="false" loading="lazy" /></span>
                <span className="character-showcase-choice-copy"><b>{t(character.nameId)}</b><small>{t(character.roleId)}</small></span>
                <span className="character-showcase-choice-index">{String(index + 1).padStart(2, '0')}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className={`character-showcase-stage ${selected.kind === 'boss' ? 'is-boss' : ''}`} style={{ '--character-accent': selected.accent || '#82d7b5' }} aria-live="polite" aria-label={t(selected.nameId)}>
        <div className="character-stage-rune" aria-hidden="true"><i /><b /><span /></div>
        <div className="character-stage-ground" aria-hidden="true" />
        <div className="character-stage-id"><PixelIcon name={selected.kind === 'boss' ? 'skull' : 'profile'} size={13} /><span>{t(selected.kind === 'boss' ? 'characterTypeBoss' : 'characterTypePlayer')}</span><b>{String(selectedIndex + 1).padStart(2, '0')}</b></div>
        <div className="character-stage-fighter" key={selected.id}>
          <MultiplayerFighter characterId={selected.id} levelId={levelId} size={selected.kind === 'boss' ? 370 : 345} />
        </div>
        <div className="character-stage-name"><span>{t('selectedCharacter')}</span><strong>{t(selected.nameId)}</strong><small>{t(selected.roleId)}</small></div>
        <nav className="character-showcase-strip" aria-label={t('characterSelect')}>
          {characters.map((character) => (
            <button key={character.id} type="button" className={character.id === selected.id ? 'is-active' : ''} style={{ '--character-accent': character.accent || '#82d7b5' }} onClick={() => onChange?.(character.id)} aria-label={t(character.nameId)} aria-pressed={character.id === selected.id}>
              <img src={character.portrait} alt="" draggable="false" loading="lazy" />
            </button>
          ))}
        </nav>
      </section>

      <aside className="character-showcase-details" style={{ '--character-accent': selected.accent || '#82d7b5' }}>
        <div className="character-detail-heading">
          <span className="character-detail-emblem"><PixelIcon name={selected.kind === 'boss' ? 'skull' : 'sword'} size={23} /></span>
          <div><small>{t(selected.kind === 'boss' ? 'characterTypeBoss' : 'characterTypePlayer')}</small><h2>{t(selected.nameId)}</h2><p>{t(selected.roleId)}</p></div>
        </div>
        <div className="character-detail-rule" />
        <div className="character-detail-stats">
          {stats.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}
        </div>
        <div className="character-detail-skills">
          <h3>{t('characterSkills')}</h3>
          <div>{skills.map((skill, index) => <span key={`${skill}-${index}`}><i>{String(index + 1).padStart(2, '0')}</i>{skill}</span>)}</div>
        </div>
        <p className="character-detail-note">{t('characterSelectionNote')}</p>
        <div className="character-detail-current"><PixelIcon name="check" size={13} /><span>{t('selectedCharacter')}</span></div>
      </aside>
    </div>
  );
}
