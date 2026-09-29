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
    <div className="tutorial-backdrop-v102" role="dialog" aria-modal="true" aria-labelledby="tutorial-title-v102">
      <section className="tutorial-card-v102">
        <header className="tutorial-head-v102">
          <div className="tutorial-kicker-v102">{t('tutorialKicker')}</div>
          <div className="tutorial-title-wrap-v102">
            <div>
              <h2 id="tutorial-title-v102">{t('tutorialTitle')}</h2>
              <p>{t('tutorialIntro')}</p>
            </div>
            <button className="tutorial-close-v102" type="button" onClick={onClose} aria-label={t('close')} title={t('close')}>
              <SolvoxUtilityArt name="close" size={16} />
            </button>
          </div>
        </header>

        <div className="tutorial-grid-v102">
          {STEPS.map(([num,titleKey,bodyKey]) => (
            <article className="tutorial-step-v102" key={num}>
              <span className="tutorial-step-index-v102">{num}</span>
              <div className="tutorial-step-copy-v102">
                <h3>{t(titleKey)}</h3>
                <p>{t(bodyKey)}</p>
              </div>
            </article>
          ))}
        </div>

        <footer className="tutorial-footer-v102">
          <p>{t('tutorialTip')}</p>
          <button className="primary-btn tutorial-action-v102" type="button" onClick={onClose}>{t('tutorialGotIt')}</button>
        </footer>
      </section>
    </div>
  );
}
