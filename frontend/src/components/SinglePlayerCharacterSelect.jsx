import React, { useState } from 'react';
import { LEVELS } from '../data/levels';
import { getPlayerAsset } from '../data/playerAssets';
import PixelIcon from './PixelIcon';
import SinglePlayerCharacterPicker from './SinglePlayerCharacterPicker';
import SolvoxBrandLogo from './SolvoxBrandLogo';

export default function SinglePlayerCharacterSelect({ levelId, playerId = 'traveler', onPlayerChange, onBack, onStart, t, lang }) {
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
    if (!launching) onBack?.();
  };

  return (
    <div className="character-select-screen">
      <div className="character-select-atmosphere" aria-hidden="true">
        <video autoPlay loop muted playsInline preload="metadata" poster="/assets/home/home-background-cinematic-poster.jpg">
          <source src="/assets/home/home-background-cinematic.mp4" type="video/mp4" />
        </video>
        <div className="character-select-atmosphere-shade" />
      </div>

      <header className="character-select-header">
        <button className="character-select-back" type="button" onClick={handleCancel} disabled={launching}>
          <PixelIcon name="back" size={16} /><span>{t('back')}</span>
        </button>
        <div className="character-select-brand"><SolvoxBrandLogo compact /></div>
        <div className="character-select-heading"><small>{t('singleAdventure')}</small><h1>{t('characterSelectTitle')}</h1><p>{t('chooseCharacterHint')}</p></div>
        <div className="character-select-chapter" aria-label={`${t('chapter')} ${level.id}`}>
          <small>{t('chapter')} {level.id}</small>
          <strong>{lang === 'en' ? level.titleEn : level.title}</strong>
        </div>
      </header>

      <main className="character-select-main">
        <SinglePlayerCharacterPicker value={playerId} onChange={onPlayerChange} t={t} levelId={level.id} />
        <section className="character-start-panel" aria-label={t('gameStartPrompt')}>
          <p className="character-start-caption">{t('selectedCharacter')}: <strong>{t(selectedCharacter.nameId)}</strong></p>
          <button className="character-start-button" type="button" disabled={launching} aria-busy={launching} onClick={handleStart}>
            <PixelIcon name="play" size={15} /><span>{launching ? t('loading') : t('playNow')}</span><PixelIcon name="right" size={14} />
          </button>
        </section>
      </main>
    </div>
  );
}
