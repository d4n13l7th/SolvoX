import React from 'react';
import { getPlayerAsset } from '../data/playerAssets';

const SINGLE_PLAYER_CHARACTERS = Object.freeze([
  { id: 'traveler', accent: '#ffcf32' },
  { id: 'asuka', accent: '#ffcf32' },
]);

export default function SinglePlayerCharacterPicker({ value = 'traveler', onChange, t }) {
  const selectedIndex = Math.max(0, SINGLE_PLAYER_CHARACTERS.findIndex((item) => item.id === value));
  const selected = SINGLE_PLAYER_CHARACTERS[selectedIndex];
  const previous = SINGLE_PLAYER_CHARACTERS[(selectedIndex - 1 + SINGLE_PLAYER_CHARACTERS.length) % SINGLE_PLAYER_CHARACTERS.length];
  const next = SINGLE_PLAYER_CHARACTERS[(selectedIndex + 1) % SINGLE_PLAYER_CHARACTERS.length];
  const selectedAsset = getPlayerAsset(selected.id);
  const previousAsset = getPlayerAsset(previous.id);
  const nextAsset = getPlayerAsset(next.id);

  const move = (direction) => {
    const nextIndex = (selectedIndex + direction + SINGLE_PLAYER_CHARACTERS.length) % SINGLE_PLAYER_CHARACTERS.length;
    onChange?.(SINGLE_PLAYER_CHARACTERS[nextIndex].id);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
  };

  return (
    <section
      className="character-carousel-v118"
      role="group"
      aria-label={t('characterSelect')}
      onKeyDown={handleKeyDown}
      style={{ '--character-accent-v118': selected.accent }}
    >
      <button
        className="character-side-preview-v118 is-left"
        type="button"
        onClick={() => onChange?.(previous.id)}
        aria-label={`${t('selectCharacter')} ${t(previousAsset.nameId)}`}
        title={t(previousAsset.nameId)}
      >
        <img src={previousAsset.portrait} alt="" draggable="false" />
      </button>

      <button
        className="character-carousel-arrow-v118 is-left"
        type="button"
        onClick={() => move(-1)}
        aria-label={t('previousCharacter')}
      >
        <span aria-hidden="true">◀</span>
      </button>

      <div className="character-hero-card-v118" aria-live="polite" aria-atomic="true">
        <div className="character-hero-inner-v118" />
        <div className="character-hero-content-v118">
          <strong className="character-hero-name-v118">{t(selectedAsset.nameId).toUpperCase()}</strong>
          <img
            key={selected.id}
            className={`character-hero-sprite-v118 character-hero-sprite-v118-${selected.id}`}
            src={selectedAsset.portrait}
            alt={t(selectedAsset.nameId)}
            draggable="false"
          />
          <span className="character-hero-role-v118">{t(selectedAsset.roleId)}</span>
        </div>
      </div>

      <button
        className="character-carousel-arrow-v118 is-right"
        type="button"
        onClick={() => move(1)}
        aria-label={t('nextCharacter')}
      >
        <span aria-hidden="true">▶</span>
      </button>

      <button
        className="character-side-preview-v118 is-right"
        type="button"
        onClick={() => onChange?.(next.id)}
        aria-label={`${t('selectCharacter')} ${t(nextAsset.nameId)}`}
        title={t(nextAsset.nameId)}
      >
        <img src={nextAsset.portrait} alt="" draggable="false" />
      </button>
    </section>
  );
}
