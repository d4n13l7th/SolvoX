import React from 'react';
import SolvoxUtilityArt from './SolvoxUtilityArt';

const STEPS = [
  ['01','tutorialModeTitle','tutorialModeBody'],
  ['02','tutorialQuestionTitle','tutorialQuestionBody'],
  ['03','tutorialAttackTitle','tutorialAttackBody'],
  ['04','tutorialHintTitle','tutorialHintBody'],
  ['05','tutorialFeedbackTitle','tutorialFeedbackBody'],
  ['06','tutorialBossTitle','tutorialBossBody'],
];

export default function Tutorial({ t, onClose }) {
  return (
    <div className="tutorial-backdrop" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <section className="tutorial-card">
        <header className="tutorial-head">
          <div className="tutorial-kicker">{t('tutorialKicker')}</div>
          <div className="tutorial-title-wrap">
            <div>
              <h2 id="tutorial-title">{t('tutorialTitle')}</h2>
              <p>{t('tutorialIntro')}</p>
            </div>
            <button className="tutorial-close" type="button" onClick={onClose} aria-label={t('close')} title={t('close')}>
              <SolvoxUtilityArt name="close" size={16} />
            </button>
          </div>
        </header>

        <div className="tutorial-grid">
          {STEPS.map(([num,titleKey,bodyKey]) => (
            <article className="tutorial-step" key={num}>
              <span className="tutorial-step-index">{num}</span>
              <div className="tutorial-step-copy">
                <h3>{t(titleKey)}</h3>
                <p>{t(bodyKey)}</p>
              </div>
            </article>
          ))}
        </div>

        <footer className="tutorial-footer">
          <p>{t('tutorialTip')}</p>
          <button className="primary-btn tutorial-action" type="button" onClick={onClose}>{t('tutorialGotIt')}</button>
        </footer>
      </section>
    </div>
  );
}
