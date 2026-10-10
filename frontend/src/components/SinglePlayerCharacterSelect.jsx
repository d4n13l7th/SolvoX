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
  const [launching, setLaunching] = useState(false);
  const level = LEVELS.find((item) => item.id === Number(levelId)) || LEVELS[0];
  const selectedCharacter = getPlayerAsset(playerId);

  const handleStart = () => {
    if (launching) return;
    const chapterId = Number(levelId);
    if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > LEVELS.length) return;
    setLaunching(true);
    onStart?.(chapterId, playerId);
  };

  const handleCancel = () => {
    if (launching) return;
    onBack?.();
  };

  return (
    <div className="character-select-screen-v118">
      <div className="character-select-atmosphere-v118" aria-hidden="true">
        <span className="pixel-star-v118 star-one" />
        <span className="pixel-star-v118 star-two" />
        <span className="pixel-star-v118 star-three" />
      </div>

      <header className="character-select-header-v118">
        <button className="character-select-back-v118" type="button" onClick={handleCancel} disabled={launching}>
          <PixelIcon name="left" size={16} />
          <span>{t('back')}</span>
        </button>
        <h1>{t('characterSelectTitle')}</h1>
        <div className="character-select-chapter-v118" aria-label={`${t('chapter')} ${level.id}`}>
          <small>{t('chapter')} {level.id}</small>
          <strong>{lang === 'en' ? level.titleEn : level.title}</strong>
        </div>
      </header>

      <main className="character-select-main-v118">
        <p className="character-select-hint-v118">{t('chooseCharacterHint')}</p>
        <SinglePlayerCharacterPicker value={playerId} onChange={onPlayerChange} t={t} />

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
      </main>
    </div>
  );
}
