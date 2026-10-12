import React from 'react';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';

const DEVS = [
  { name: 'Teuku Al Jumanatul Ali', roleKey: 'developerRoleEngineering', copyKey: 'developerTeuku' },
  { name: 'Ahmad Daniel Chalid', roleKey: 'developerRoleDesign', copyKey: 'developerAhmad' },
  { name: 'Yanni Zulhilda', roleKey: 'developerRoleContent', copyKey: 'developerYanni' },
];

export default function AboutDevelopers({ t, lang, onBack }) {
  return (
    <main className="about-page" data-lang={lang}>
      <div className="about-bg" aria-hidden="true">
        <video autoPlay loop muted playsInline preload="metadata" poster="/assets/home/home-background-v83-poster.jpg">
          <source src="/assets/home/home-background-v83.mp4" type="video/mp4" />
        </video>
        <div className="about-bg-shade" />
      </div>

      <button className="about-back" type="button" onClick={onBack}>
        <SolvoxUtilityArt name="back" size={22} className="about-back-art" />
        <span>{t('back')}</span>
      </button>

      <section className="about-shell" aria-labelledby="about-title">
        <div className="about-team-brand" aria-label="Zero to One Game Development Team">
          <span className="about-team-brand-glow" aria-hidden="true"><img src="/assets/ui/brand/zero-to-one-team.png" alt="" /></span>
          <img src="/assets/ui/brand/zero-to-one-team.png" alt="Zero to One Game Development Team" className="about-team-brand-img" draggable="false" />
        </div>
        <div className="about-kicker">{t('aboutUs')}</div>
        <h1 id="about-title">{t('aboutUsTitle')}</h1>
        <p className="about-intro">{t('aboutUsIntro')}</p>
        <div className="about-divider" />
        <div className="about-grid">
          {DEVS.map((dev, index) => (
            <article className="about-card" key={dev.name}>
              <div className="about-index">0{index + 1}</div>
              <div>
                <h2>{dev.name}</h2>
                <span>{t(dev.roleKey)}</span>
                <p>{t(dev.copyKey)}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="about-footer">{t('aboutUsFooter')}</p>
      </section>
    </main>
  );
}
