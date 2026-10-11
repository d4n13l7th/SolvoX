import React, { useRef } from 'react';
import { getPlayerAsset } from '../data/playerAssets';
import CharacterSelectIdle from './CharacterSelectIdle';

const SINGLE_PLAYER_CHARACTERS = Object.freeze([
  { id: 'traveler', number: '01' },
  { id: 'asuka', number: '02' },
]);

export default function SinglePlayerCharacterPicker({
  focusId,
  chosenId,
  onFocus,
  onConfirm,
  t,
}) {
  const lastPointerType = useRef('mouse');
  const touchFocusedId = useRef(null);

  const handleActivate = (id, event) => {
    if (event.detail === 0) {
      // Keyboard: Enter atau Space memilih karakter yang sedang difokuskan.
      onFocus?.(id);
      onConfirm?.(id);
      return;
    }

    if (lastPointerType.current === 'touch') {
      // Tap pertama hanya memfokuskan; tap kedua mengonfirmasi.
      if (touchFocusedId.current !== id) {
        touchFocusedId.current = id;
        onFocus?.(id);
        return;
      }

      onConfirm?.(id);
      return;
    }

    // Mouse: hover memfokuskan; klik pada kartu fokus mengonfirmasi.
    if (focusId !== id) {
      onFocus?.(id);
      return;
    }

    onConfirm?.(id);
  };

  return (
    <section
      className="cs-picker"
      role="group"
      aria-label={t('characterSelect')}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onFocus?.(null);
        }
      }}
    >
      {SINGLE_PLAYER_CHARACTERS.map((character) => {
        const asset = getPlayerAsset(character.id);
        const isFocused = focusId === character.id;
        const isChosen = chosenId === character.id;

        return (
          <button
            key={character.id}
            type="button"
            className={[
              'cs-character-card',
              isFocused && 'is-focused',
              isChosen && 'is-chosen',
              chosenId && !isChosen && 'is-dimmed',
            ].filter(Boolean).join(' ')}
            onPointerDown={(event) => {
              lastPointerType.current = event.pointerType;
            }}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') {
                onFocus?.(character.id);
              }
            }}
            onFocus={() => onFocus?.(character.id)}
            onClick={(event) => handleActivate(character.id, event)}
            aria-pressed={isChosen}
            aria-label={`${t('selectCharacter')} ${t(asset.nameId)}`}
          >
            <span className="cs-card-top">
              <span className="cs-card-number">CHARACTER {character.number}</span>
              <span className="cs-card-status">
                {isChosen
                  ? ( 'SELECTED' )
                  : isFocused
                    ? ( 'FOCUSED' )
                    : 'AVAILABLE'}
              </span>
            </span>

            <span className="cs-character-art">
              <CharacterSelectIdle
                playerId={character.id}
                size={300}
                className={`cs-character-sprite cs-character-sprite-${character.id}`}
              />
            </span>

            <span className="cs-character-info">
              <strong>{t(asset.nameId)}</strong>
              <span>{t(asset.roleId)}</span>
            </span>

            <span className="cs-card-footer">
              {isChosen
                ? '✓ ' + (t('selectedCharacter') || 'SELECTED')
                : isFocused
                  ? '▶ ' + (t('selectCharacter') || 'SELECT CHARACTER')
                  : 'TAP TO INSPECT'}
            </span>
          </button>
        );
      })}
    </section>
  );
}
