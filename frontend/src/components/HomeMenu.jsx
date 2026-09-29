import React, { useState } from 'react';
import SolvoxBrandLogo from './SolvoxBrandLogo';

const NAV_ITEMS = [
  { id: 'play', labelKey: 'homeMain' },
  { id: 'tutorial', labelKey: 'homeTutorial' },
  { id: 'profile', labelKey: 'homeDashboard' },
  { id: 'settings', labelKey: 'homeSettings' },
  { id: 'feedback', labelKey: 'homeFeedback' },
];

export default function HomeMenu({ onMain, onTutorial, onSettings, onFeedback, onProfile, t }) {
  const [activeNav, setActiveNav] = useState('play');
  const activate = (id) => {
    setActiveNav(id);
    if (id === 'play') return onMain?.();
    if (id === 'tutorial') return onTutorial?.();
    if (id === 'profile') return onProfile?.();
    if (id === 'settings') return onSettings?.();
    if (id === 'feedback') return onFeedback?.();
  };

  return (
    <div className="home-menu-v83" data-ui="solvox-home">
      <div className="home-menu-v83-backdrop" aria-hidden="true">
        <video
          className="home-menu-v83-backdrop-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/assets/home/home-background-v83-poster.jpg"
        >
          <source src="/assets/home/home-background-v83.mp4" type="video/mp4" />
        </video>
        <div className="home-menu-v83-shade" />
      </div>

      <aside className="home-menu-v83-nav" aria-label={t('menu')}>
        <div className="home-menu-v83-brand" aria-label="Solvox">
          <SolvoxBrandLogo />
        </div>

        <nav className="home-menu-v83-menu">
          {NAV_ITEMS.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`home-menu-v83-item${active ? ' is-active' : ''}`}
                onClick={() => activate(item.id)}
                aria-current={active ? 'page' : undefined}
              >
                <span className="home-menu-v83-marker" aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="home-menu-v83-content" aria-hidden="true" />
    </div>
  );
}
