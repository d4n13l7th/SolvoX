import React from 'react';
import PixelIcon from './PixelIcon';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';

const MODE_ART = {
  single: '/assets/ui/modes/single-mode-v94.webp',
  multi: '/assets/ui/modes/multi-mode-v94.webp',
};

function ModeCard({type,label,eyebrow,description,action,onActivate,t}){
  const isSingle = type === 'single';
  return <button className={`mode-card ${type}`} type="button" onClick={onActivate}>
    <span className="mode-card-shine" aria-hidden="true" />
    <span className="mode-card-frame" aria-hidden="true" />
    <div className="mode-card-copy">
      <small>{eyebrow}</small>
      <h2>{label}</h2>
      <p>{description}</p>
      <span className="mode-card-action">
        <span>{action}</span>
        <b><PixelIcon name="right" size={15}/></b>
      </span>
    </div>
    <div className="mode-card-art" aria-hidden="true">
      <img src={MODE_ART[type]} alt="" draggable="false" />
    </div>
    <span className="mode-card-tag" aria-hidden="true">
      <span>{isSingle ? t('modePrimary') : t('modeSocial')}</span>
    </span>
  </button>;
}

export default function ModeSelect({lang,t,onBack,onSingle,onMulti}){
  return <div className="mode-select">
    <div className="mode-select-backdrop" aria-hidden="true">
      <video autoPlay loop muted playsInline preload="metadata" poster="/assets/home/home-background-v83-poster.jpg">
        <source src="/assets/home/home-background-v83.mp4" type="video/mp4" />
      </video>
      <div />
    </div>

    <button className="mode-select-back" onClick={onBack}>
      <SolvoxUtilityArt name="back" size={28} className="solvox-back-art" />
      <span className="solvox-back-label">{t('back')}</span>
    </button>

    <main className="mode-select-shell">
      <header className="mode-select-header">
        <span>{t('mainMode')}</span>
        <h1>{t('chooseMode')}</h1>
        <p>{t('chooseModeHint')}</p>
      </header>

      <section className="mode-select-grid" aria-label={t('chooseMode')}>
        <ModeCard
          type="single"
          label={t('single')}
          eyebrow={t('modePrimary')}
          description={t('singleModeDesc')}
          action={t('campaign')}
          onActivate={onSingle}
          t={t}
        />
        <ModeCard
          type="multi"
          label={t('multi')}
          eyebrow={t('modeSocial')}
          description={t('multiModeDesc')}
          action={t('battleWithFriend')}
          onActivate={onMulti}
          t={t}
        />
      </section>

      <div className="mode-select-note">
        <PixelIcon name="spark" size={13}/>
        <span>{t('modeMathNote')}</span>
      </div>
    </main>
  </div>;
}
