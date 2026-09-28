import React, { useMemo } from 'react';
import { LEVELS, isUnlocked } from '../data/levels';
import { getBoss } from '../data/bosses';
import PixelIcon from './PixelIcon';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';

function chapterProgress(id, progress) {
  if ((progress.completedLevels || []).map(Number).includes(Number(id))) return 100;
  const logs = (progress.analytics || []).filter(
    (row) => Number(row.level || row.chapterId) === Number(id),
  );
  const latest = logs.at(-1);
  const answered = Array.isArray(latest?.questionLogs) ? latest.questionLogs.length : 0;
  return answered ? Math.min(99, Math.round((answered / 10) * 100)) : 0;
}

export default function ChapterSelect({ progress, onStart, onBack, lang, t }) {
  const completed = useMemo(
    () => new Set((progress.completedLevels || []).map(Number)),
    [progress.completedLevels],
  );

  return (
    <div className="chapter-select-v44">
      <div className="chapter-select-bg-v44" aria-hidden="true">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/assets/home/home-background-cinematic-poster.jpg"
        >
          <source
            src="/assets/home/home-background-cinematic.mp4"
            type="video/mp4"
          />
        </video>
        <div />
      </div>

      <header className="chapter-select-top-v44">
        <button className="chapter-select-back-v44" type="button" onClick={onBack}>
          <SolvoxUtilityArt name="back" size={28} className="solvox-back-art" />
          <span className="solvox-back-label-v82">{t('back')}</span>
        </button>

        <div className="chapter-select-title-v44">
          <small>{t('singleAdventure')}</small>
          <h1>{t('chooseChapter')}</h1>
          <p>{t('chooseChapterHint')}</p>
        </div>

        <div className="chapter-select-stat-v44">
          <b>{completed.size}/{LEVELS.length}</b>
          <span>{t('chaptersCleared')}</span>
        </div>
      </header>

      <main className="chapter-select-grid-v44">
        {LEVELS.map((level) => {
          const open = isUnlocked(progress, level.id);
          const clear = completed.has(level.id);
          const boss = getBoss(level.id);
          const pct = chapterProgress(level.id, progress);
          const title = lang === 'en' ? level.titleEn : level.title;
          const bossName = lang === 'en' ? boss.nameEn : boss.name;

          return (
            <button
              key={level.id}
              type="button"
              disabled={!open}
              className={`chapter-card-v44 ${open ? 'is-open' : 'is-locked'} ${clear ? 'is-clear' : ''}`}
              style={{ '--chapter-accent': level.accent }}
              onClick={() => open && onStart(level.id)}
            >
              <span className="chapter-card-art-v44" aria-hidden="true">
                <img src={level.art} alt="" loading="eager" />
              </span>

              <span className="chapter-card-shade-v44" aria-hidden="true" />
              <span className="chapter-card-copy-v44">
                <small>{t('chapter')} {level.id}</small>
                <strong>{title}</strong>
                <em>{bossName}</em>
              </span>

              <span className="chapter-card-progress-v44">
                <span>
                  {clear ? '100%' : open ? (pct ? `${pct}%` : t('readyToPlay')) : t('locked')}
                </span>
                <span>
                  {open ? <PixelIcon name="right" size={13} /> : <PixelIcon name="lock" size={13} />}
                </span>
              </span>

              <span className="chapter-card-meter-v44" aria-hidden="true">
                <i>
                  <b style={{ width: `${clear ? 100 : pct}%` }} />
                </i>
              </span>
            </button>
          );
        })}
      </main>
    </div>
  );
}
