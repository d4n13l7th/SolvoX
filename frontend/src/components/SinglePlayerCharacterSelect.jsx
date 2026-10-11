import React, { useState } from 'react';
import { LEVELS } from '../data/levels';
import { getPlayerAsset } from '../data/playerAssets';
import PixelIcon from './PixelIcon';
import SinglePlayerCharacterPicker from './SinglePlayerCharacterPicker';

export default function SinglePlayerCharacterSelect({
  levelId,
  playerId = 'traveler',
  onPlayerChange,
  onBack,
  onStart,
  t,
  lang,
}) {
  const [unusedFocus, setFocusId] = useState(null);
  const [unusedChosen, setChosenId] = useState(null);
  const [launching, setLaunching] = useState(false);

  const level = LEVELS.find((item) => item.id === Number(levelId)) || LEVELS[0];
  const selectedCharacter = getPlayerAsset(unusedChosen || unusedFocus || playerId);

  const handleConfirm = (id) => {
    if (launching || !['traveler', 'asuka'].includes(id)) return;
    setFocusId(id);
    setChosenId(id);
  };

  const handleStart = () => {
    if (launching || !unusedChosen) return;

    const chapterId = Number(levelId);
    if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > LEVELS.length) return;

    setLaunching(true);

    try {
      onPlayerChange?.(unusedChosen);
      const result = onStart?.(chapterId, unusedChosen);

      if (result === false) {
        setLaunching(false);
      } else if (result && typeof result.then === 'function') {
        result.catch((error) => {
          console.error('[CharacterSelect] Failed to start:', error);
          setLaunching(false);
        });
      }
    } catch (error) {
      console.error('[CharacterSelect] Failed to start:', error);
      setLaunching(false);
    }
  };

  const handleBack = () => {
    if (launching) return;
    if (unusedChosen) {
      setChosenId(null);
      setFocusId(null);
      return;
    }
    if (unusedFocus) {
      setFocusId(null);
      return;
    }
    onBack?.();
  };

  return (
    <div className="character-select-screen-v118 cs-redesign">
      <div className="character-select-atmosphere-v118" aria-hidden="true">
        <span className="pixel-star-v118 star-one" />
        <span className="pixel-star-v118 star-two" />
        <span className="pixel-star-v118 star-three" />
      </div>

      <header className="character-select-header-v118">
        <button className="character-select-back-v118" type="button"
          onClick={handleBack} disabled={launching}>
          <PixelIcon name="left" size={16} />
          <span>{t('back')}</span>
        </button>
        <h1>{t('characterSelectTitle')}</h1>
        <div className="character-select-chapter-v118">
          <small>{t('chapter')} {level.id}</small>
          <strong>{lang === 'en' ? level.titleEn : level.title}</strong>
        </div>
      </header>

      <main className="character-select-main-v118 cs-character-main">
        <p className="character-select-hint-v118 cs-character-hint">
          {t('chooseCharacterHint')}
        </p>

        <SinglePlayerCharacterPicker
          unusedFocus={unusedFocus}
          unusedChosen={unusedChosen}
          onFocus={setFocusId}
          onConfirm={handleConfirm}
          t={t}
        />

        {unusedChosen ? (
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
      </main>
    </div>
  );
}
