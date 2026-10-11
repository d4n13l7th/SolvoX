import React, { useState } from 'react';
import { getPlayerAsset } from '../data/playerAssets';
import { LEVELS } from '../data/levels';
import SinglePlayerCharacterPicker from './SinglePlayerCharacterPicker';

export default function SinglePlayerCharacterSelect({
  levelId,
  playerId,
  onPlayerChange,
  onBack,
  onStart,
  t,
  lang,
}) {
  const [launching, setLaunching] = useState(false);

  const level = LEVELS.find((item) => item.id === Number(levelId)) || LEVELS[0];
  const selectedCharacter = getPlayerAsset(playerId);

  const handleStart = () => {
    const chapterId = Number(levelId);
    if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > LEVELS.length) return;

    setLaunching(true);

    try {
      onPlayerChange?.(playerId);
      const result = onStart?.(chapterId, playerId);

      if (result && typeof result.then === 'function') {
        result
          .then((resolved) => {
            if (resolved === false) setLaunching(false);
          })
          .catch((error) => {
            console.error('[CharacterSelect] Failed to start:', error);
            setLaunching(false);
          });
      } else if (result === false) {
        setLaunching(false);
      }
    } catch (error) {
      console.error('[CharacterSelect] Failed to start:', error);
      setLaunching(false);
    }
  };

  const handleCancel = () => {
    if (launching) return;
    onBack?.();
  };

  return (
    <section className="character-select-v118" aria-labelledby="character-select-title">
      <div className="character-select-header-v118">
        <button
          className="character-select-back-v118"
          type="button"
          onClick={handleCancel}
          disabled={launching}
          aria-label={t('back')}
        >
          ←
        </button>
        <div className="character-select-title-group-v118">
          <h1 id="character-select-title">{t('characterSelect')}</h1>
          <p>{t('selectCharacterFor', { chapter: level.name })}</p>
        </div>
      </div>

      <SinglePlayerCharacterPicker value={playerId} onChange={onPlayerChange} t={t} />

      {playerId ? (
        <section className="character-start-panel-v118" aria-label={t('gameStartPrompt')}>
          <h2>{t('gameStartPrompt')}</h2>
          <div className="character-start-options-v118">
            <button
              className="character-start-option-v118 is-yes"
              type="button"
              disabled={launching}
              aria-busy={launching}
              onClick={handleStart}
            >
              <span className="character-start-cursor-v118" aria-hidden="true">▶</span>
              <span>{launching ? t('loading') : t('yes')}</span>
            </button>
            <button className="character-start-option-v118 is-no" type="button" disabled={launching} onClick={handleCancel}>
              <span>{t('no')}</span>
            </button>
          </div>
          <p className="character-start-caption-v118">
            {t('selectedCharacter')}: <strong>{t(selectedCharacter.nameId)}</strong>
          </p>
        </section>
      ) : (
        <p className="character-select-hint-v118">{t('chooseCharacterHint')}</p>
      )}
    </section>
  );
}
