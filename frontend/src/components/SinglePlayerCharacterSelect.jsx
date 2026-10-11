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
  const [focusId, setFocusId] = useState(null);
  const [chosenId, setChosenId] = useState(null);
  const [launching, setLaunching] = useState(false);

  const level = LEVELS.find((item) => item.id === Number(levelId)) || LEVELS[0];
  const selectedCharacter = getPlayerAsset(chosenId || focusId || playerId);

  const handleConfirm = (id) => {
    if (launching || !['traveler', 'asuka'].includes(id)) return;
    setFocusId(id);
    setChosenId(id);
  };

  const handleStart = () => {
    if (launching || !chosenId) return;

    const chapterId = Number(levelId);
    if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > LEVELS.length) return;

    setLaunching(true);

    try {
      onPlayerChange?.(chosenId);
      const result = onStart?.(chapterId, chosenId);

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
    if (chosenId) {
      setChosenId(null);
      setFocusId(null);
      return;
    }
    if (focusId) {
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
          focusId={focusId}
          chosenId={chosenId}
          onFocus={setFocusId}
          onConfirm={handleConfirm}
          t={t}
        />

        {chosenId ? (
          <section className="cs-start-panel" aria-live="polite">
            <div className="cs-start-copy">
              <span>{lang === 'en' ? 'YOUR ADVENTURE AWAITS' : 'PETUALANGAN MENANTIMU'}</span>
              <h2>{t('gameStartPrompt')}</h2>
              <p>{t('selectedCharacter')}: <strong>{t(selectedCharacter.nameId)}</strong></p>
            </div>
            <button className="cs-start-button" type="button"
              disabled={launching} aria-busy={launching} onClick={handleStart}>
              <span aria-hidden="true">{launching ? '◌' : '▶'}</span>
              {launching ? t('loading') : lang === 'en' ? 'START' : 'MULAI'}
            </button>
          </section>
        ) : (
          <p className="cs-selection-instruction">
            {lang === 'en'
              ? 'Choose your hero to continue.'
              : 'Pilih karakter untuk melanjutkan.'}
          </p>
        )}
      </main>
    </div>
  );
}
