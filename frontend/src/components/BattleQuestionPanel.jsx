import React from 'react';
import Keypad from './Keypad';
import PixelIcon from './PixelIcon';

/**
 * Solvox battle learning console.
 *
 * V66 keeps the question area intentionally asset-free: hierarchy comes from
 * spacing, typography, borders, and progress treatment rather than decorative
 * images. Hint and keypad behavior remain separate from the question itself.
 */
const QUESTION_PANEL_THEME_BY_LEVEL = {
  1: {
    '--panel-hue-1': 'rgba(94, 160, 104, .12)',
    '--panel-hue-2': 'rgba(191, 175, 93, .08)',
    '--panel-border': 'rgba(109, 164, 117, .28)',
    '--panel-border-soft': 'rgba(95, 151, 125, .13)',
    '--panel-top': 'rgba(14, 33, 29, .97)',
    '--panel-bottom': 'rgba(5, 14, 13, .985)',
    '--panel-main-top': 'rgba(15, 37, 32, .94)',
    '--panel-main-bottom': 'rgba(5, 14, 14, .98)',
    '--panel-accent': '#9fc56a',
    '--panel-accent-2': '#59b391',
    '--panel-text-muted': '#a6bbb0',
    '--panel-key-bg': 'rgba(24, 48, 42, .96)',
    '--panel-key-bg-strong': 'rgba(11, 27, 24, .99)',
    '--panel-glow': 'rgba(74, 159, 113, .16)',
  },
  2: {
    '--panel-hue-1': 'rgba(99, 152, 205, .12)',
    '--panel-hue-2': 'rgba(132, 111, 205, .09)',
    '--panel-border': 'rgba(124, 161, 204, .29)',
    '--panel-border-soft': 'rgba(129, 156, 207, .14)',
    '--panel-top': 'rgba(16, 28, 42, .98)',
    '--panel-bottom': 'rgba(6, 12, 19, .985)',
    '--panel-main-top': 'rgba(19, 34, 51, .96)',
    '--panel-main-bottom': 'rgba(6, 13, 21, .99)',
    '--panel-accent': '#a9bde5',
    '--panel-accent-2': '#7f91e5',
    '--panel-text-muted': '#a8b7c9',
    '--panel-key-bg': 'rgba(28, 46, 63, .97)',
    '--panel-key-bg-strong': 'rgba(11, 20, 30, .99)',
    '--panel-glow': 'rgba(99, 136, 197, .16)',
  },
  3: {
    '--panel-hue-1': 'rgba(221, 79, 131, .11)',
    '--panel-hue-2': 'rgba(49, 142, 211, .10)',
    '--panel-border': 'rgba(145, 104, 153, .30)',
    '--panel-border-soft': 'rgba(116, 128, 182, .14)',
    '--panel-top': 'rgba(24, 20, 34, .98)',
    '--panel-bottom': 'rgba(8, 10, 17, .99)',
    '--panel-main-top': 'rgba(26, 24, 39, .96)',
    '--panel-main-bottom': 'rgba(8, 10, 17, .99)',
    '--panel-accent': '#78c8d8',
    '--panel-accent-2': '#d07a99',
    '--panel-text-muted': '#b8b4bf',
    '--panel-key-bg': 'rgba(34, 35, 49, .97)',
    '--panel-key-bg-strong': 'rgba(13, 15, 23, .99)',
    '--panel-glow': 'rgba(207, 82, 129, .15)',
  },
  4: {
    '--panel-hue-1': 'rgba(192, 65, 28, .14)',
    '--panel-hue-2': 'rgba(225, 142, 44, .08)',
    '--panel-border': 'rgba(210, 112, 55, .34)',
    '--panel-border-soft': 'rgba(214, 117, 56, .16)',
    '--panel-top': 'rgba(35, 18, 16, .97)',
    '--panel-bottom': 'rgba(12, 8, 9, .99)',
    '--panel-main-top': 'rgba(46, 23, 18, .94)',
    '--panel-main-bottom': 'rgba(12, 8, 9, .99)',
    '--panel-accent': '#f0b45c',
    '--panel-accent-2': '#cb5b38',
    '--panel-text-muted': '#c6aba0',
    '--panel-key-bg': 'rgba(54, 27, 22, .96)',
    '--panel-key-bg-strong': 'rgba(17, 10, 10, .995)',
    '--panel-glow': 'rgba(213, 87, 44, .18)',
  },
  5: {
    '--panel-hue-1': 'rgba(75, 137, 69, .15)',
    '--panel-hue-2': 'rgba(188, 171, 79, .09)',
    '--panel-border': 'rgba(120, 169, 86, .33)',
    '--panel-border-soft': 'rgba(128, 165, 86, .16)',
    '--panel-top': 'rgba(14, 28, 18, .96)',
    '--panel-bottom': 'rgba(7, 12, 8, .99)',
    '--panel-main-top': 'rgba(20, 38, 21, .94)',
    '--panel-main-bottom': 'rgba(7, 13, 8, .99)',
    '--panel-accent': '#c4d47a',
    '--panel-accent-2': '#63a94a',
    '--panel-text-muted': '#b7c2aa',
    '--panel-key-bg': 'rgba(24, 49, 25, .97)',
    '--panel-key-bg-strong': 'rgba(8, 15, 9, .995)',
    '--panel-glow': 'rgba(86, 161, 76, .18)',
  },
};

export default function BattleQuestionPanel({
  q,
  levelId,
  meta,
  lang,
  t,
  round,
  totalRounds,
  idx,
  answer,
  setAnswer,
  busy,
  submit,
  hintsUsed,
  hintsLeft,
  useHint,
  keypadVisible,
  onToggleKeypad,
}) {
  const progress = Math.round(((idx + 1) / totalRounds) * 100);
  const stageTitle = lang === 'en' ? meta?.titleEn : meta?.title;
  const attempts = Math.max(0, q?.attempts || 0);

  const panelTheme = QUESTION_PANEL_THEME_BY_LEVEL[Number(levelId)] || {};

  const isStoryChapter = Number(levelId) === 5;


  return (
    <section style={panelTheme} className={`battle-question-panel-v43 theme-level-${Number(levelId)} ${isStoryChapter ? 'is-story-chapter-v74' : ''}`} aria-label={t('questionPanel')}>
      <div className={`battle-question-main-v66 ${isStoryChapter ? 'is-story-main-v74' : ''}`}>
        <header className="question-header-v66">
          <div className="question-meta-v66">
            <span className="question-chip-v66 is-stage">
              <PixelIcon name="quest" size={12} />
              {t('stage')} {levelId}
            </span>
            <span className="question-chip-v66 is-title" title={stageTitle || ''}>
              {stageTitle}
            </span>
            <span className="question-chip-v66 is-round">
              {t('round')} {round}/{totalRounds}
            </span>
          </div>

          <div className="question-progress-v66" aria-label={`${progress}%`}>
            <b>{progress}%</b>
            <span><i style={{ width: `${progress}%` }} /></span>
          </div>
        </header>

        <div className={`question-content-v66 ${isStoryChapter ? 'is-scrollable-v74' : ''}`}>
          <div className="question-kicker-v66">{t('missionBrief')}</div>
          {q?.context ? <p className="question-context-v66">{q.context}</p> : null}
          <h1 className="question-text-v66">{q?.text}</h1>
          <div className="question-concept-v66">
            <span>{t('concept')}</span>
            <b>{q?.concept || '-'}</b>
          </div>
        </div>

        <div className="question-answer-v66">
          <label className="answer-shell-v66">
            <span className="answer-icon-v66"><PixelIcon name="keyboard" size={16} /></span>
            <input
              className="battle-answer-input-v66"
              disabled={busy}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submit();
              }}
              placeholder={t('typeAnswer')}
              autoComplete="off"
              inputMode="text"
            />
            <kbd>ENTER</kbd>
          </label>

          <button
            className="attack-btn-v66"
            disabled={busy || !answer.trim()}
            onClick={submit}
          >
            <PixelIcon name="sword" size={16} />
            <span>{t('answer')}</span>
          </button>
        </div>

        <div className="question-tools-v66">
          <button
            className="keypad-toggle-v66"
            type="button"
            onClick={onToggleKeypad}
            disabled={busy}
            aria-pressed={keypadVisible}
          >
            <PixelIcon name="keyboard" size={15} />
            <span>{keypadVisible ? t('hideKeyboard') : t('showKeyboard')}</span>
          </button>
          <span className="attempts-v66">
            {t('attempt')}: {attempts}/2
          </span>
        </div>
      </div>

      <aside className="hint-rail-v37" aria-label={t('hint')}>
        <div className="hint-rail-head-v37">
          <span className="hint-rail-icon-v37">
            <PixelIcon name="hint" size={15} />
          </span>
          <div>
            <b>{t('hint')}</b>
            <small>{t('hintUsage',{used:hintsUsed,left:hintsLeft})}</small>
          </div>
        </div>

        <div className="hint-rail-body-v37">
          {hintsUsed > 0 ? (
            (q?.hints || []).slice(0, hintsUsed).map((hint, index) => (
              <div className="hint-reveal-v37" key={`${index}-${hint}`}>
                <span>{index + 1}</span>
                <p>{hint}</p>
              </div>
            ))
          ) : (
            <div className="hint-empty-v37">
              <strong>{t('hintAvailable')}</strong>
              <p>{t('hintCost')}</p>
            </div>
          )}
        </div>

        <button
          className="hint-reveal-btn-v37"
          type="button"
          disabled={busy || hintsLeft <= 0 || !q?.hints?.length}
          onClick={useHint}
        >
          <PixelIcon name="hint" size={14} />
          <span>{t('revealHint')}</span>
          <em>−5 HP</em>
        </button>
      </aside>

      <aside
        className={`battle-keypad-side-v35 ${keypadVisible ? 'is-visible' : 'is-hidden'}`}
        aria-label={t('keyboardLabel')}
      >
        <div className="battle-keypad-side-head-v35">
          <span>
            <PixelIcon name="keyboard" size={15} />
            <b>{t('keyboardLabel')}</b>
          </span>
          <small className="keypad-status-v66">{t('power')}</small>
        </div>

        {keypadVisible ? (
          <Keypad
            value={answer}
            onChange={setAnswer}
            onEnter={submit}
            disabled={busy}
            t={t}
            visible={keypadVisible}
          />
        ) : (
          <div className="battle-keypad-hidden-v35">
            <PixelIcon name="keyboard" size={28} />
            <span>{t('showKeyboard')}</span>
          </div>
        )}
      </aside>
    </section>
  );
}
