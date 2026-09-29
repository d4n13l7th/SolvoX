import React from 'react';
import PixelIcon from './PixelIcon';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';

const MODE_ART = {
  single: '/assets/ui/modes/single-mode-v94.webp',
  multi: '/assets/ui/modes/multi-mode-v94.webp',
};

function ModeCard({type,label,eyebrow,description,action,onActivate,t}){
  const isSingle = type === 'single';
  return <button className={`mode-card-v45 ${type}`} type="button" onClick={onActivate}>
    <span className="mode-card-v45-shine" aria-hidden="true" />
    <span className="mode-card-v45-frame" aria-hidden="true" />
    <div className="mode-card-v45-copy">
      <small>{eyebrow}</small>
      <h2>{label}</h2>
      <p>{description}</p>
      <span className="mode-card-v45-action">
        <span>{action}</span>
        <b><PixelIcon name="right" size={15}/></b>
      </span>
    </div>
    <div className="mode-card-v45-art" aria-hidden="true">
      <img src={MODE_ART[type]} alt="" draggable="false" />
    </div>
    <span className="mode-card-v45-tag" aria-hidden="true">
      <span>{isSingle ? t('modePrimary') : t('modeSocial')}</span>
    </span>
  </button>;
}

export default function ModeSelect({lang,t,onBack,onSingle,onMulti}){
  return <div className="mode-select-v45">
    <div className="mode-select-backdrop" aria-hidden="true">
      <video autoPlay loop muted playsInline preload="metadata" poster="/assets/home/home-background-v83-poster.jpg">
        <source src="/assets/home/home-background-v83.mp4" type="video/mp4" />
      </video>
      <div />
    </div>

    <button className="mode-select-back-v45" onClick={onBack}>
      <SolvoxUtilityArt name="back" size={28} className="solvox-back-art" />
      <span className="solvox-back-label-v82">{t('back')}</span>
    </button>

    <main className="mode-select-shell-v45">
      <header className="mode-select-header-v45">
        <span>{t('mainMode')}</span>
        <h1>{t('chooseMode')}</h1>
        <p>{t('chooseModeHint')}</p>
      </header>

      <section className="mode-select-grid-v45" aria-label={t('chooseMode')}>
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

      <div className="mode-select-note-v45">
        <PixelIcon name="spark" size={13}/>
        <span>{t('modeMathNote')}</span>
      </div>
    </main>
  </div>;
}
