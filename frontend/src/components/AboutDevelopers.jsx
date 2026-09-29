import React from 'react';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';

const DEVS = [
  { name: 'Teuku Al Jumanatul Ali', roleKey: 'developerRoleEngineering', copyKey: 'developerTeuku' },
  { name: 'Ahmad Daniel Chalid', roleKey: 'developerRoleDesign', copyKey: 'developerAhmad' },
  { name: 'Yanni Zulhilda', roleKey: 'developerRoleContent', copyKey: 'developerYanni' },
];

export default function AboutDevelopers({ t, lang, onBack }) {
  return (
    <main className="about-page-v96" data-lang={lang}>
      <div className="about-bg-v96" aria-hidden="true">
        <video autoPlay loop muted playsInline preload="metadata" poster="/assets/home/home-background-v83-poster.jpg">
          <source src="/assets/home/home-background-v83.mp4" type="video/mp4" />
        </video>
        <div className="about-bg-shade-v96" />
      </div>

      <button className="about-back-v96" type="button" onClick={onBack}>
        <SolvoxUtilityArt name="back" size={22} className="about-back-art-v96" />
        <span>{t('back')}</span>
      </button>

      <section className="about-shell-v96" aria-labelledby="about-title-v96">
        <div className="about-team-brand-v97" aria-label="Zero to One Game Development Team">
          <span className="about-team-brand-glow-v97" aria-hidden="true"><img src="/assets/ui/brand/zero-to-one-team.png" alt="" /></span>
          <img src="/assets/ui/brand/zero-to-one-team.png" alt="Zero to One Game Development Team" className="about-team-brand-img-v97" draggable="false" />
        </div>
        <div className="about-kicker-v96">{t('aboutUs')}</div>
        <h1 id="about-title-v96">{t('aboutUsTitle')}</h1>
        <p className="about-intro-v96">{t('aboutUsIntro')}</p>
        <div className="about-divider-v96" />
        <div className="about-grid-v96">
          {DEVS.map((dev, index) => (
            <article className="about-card-v96" key={dev.name}>
              <div className="about-index-v96">0{index + 1}</div>
              <div>
                <h2>{dev.name}</h2>
                <span>{t(dev.roleKey)}</span>
                <p>{t(dev.copyKey)}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="about-footer-v96">{t('aboutUsFooter')}</p>
      </section>
    </main>
  );
}
