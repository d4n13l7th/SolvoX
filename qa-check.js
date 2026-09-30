const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const must = (condition, message) => {
  if (!condition) throw new Error(message);
};

const app = read('frontend/src/App.jsx');
const home = read('frontend/src/components/HomeMenu.jsx');
const modes = read('frontend/src/components/ModeSelect.jsx');
const chapters = read('frontend/src/components/ChapterSelect.jsx');
const settings = read('frontend/src/components/Settings.jsx');
const utilityArt = read('frontend/src/components/SolvoxUtilityArt.jsx');
const profile = read('frontend/src/components/ProfilePanel.jsx');
const battle = read('frontend/src/components/Battle.jsx');
const battlePanel = read('frontend/src/components/BattleQuestionPanel.jsx');
const solvoxQuestions = read('frontend/src/data/solvoxQuestions.js');
const combatStage = read('frontend/src/components/CombatStage.jsx');
const server = read('server.js');
const apiServer = read('backend/server.js');
const icon = read('frontend/src/components/PixelIcon.jsx');
const keypad = read('frontend/src/components/Keypad.jsx');
const multi = read('frontend/src/components/Multiplayer.jsx');
const evaluation = read('frontend/src/components/Evaluation.jsx');
const feedback = read('frontend/src/components/Feedback.jsx');
const gameMeta = read('frontend/src/config/game.js');
const i18n = read('frontend/src/services/i18n.js');
const css = read('frontend/src/styles/app.css');
const ui42 = read('frontend/src/styles/ui-v42.css');
const chapterCss = read('frontend/src/styles/chapter-select-v44.css');
const battleCss = read('frontend/src/styles/battle-v43.css');
const levels = read('frontend/src/data/levels.js');
const backgrounds = read('frontend/src/config/backgrounds.js');
const responsive105 = read('frontend/src/styles/responsive-v105.css');
const englishQuestions = JSON.parse(fs.readFileSync(path.join(root, 'backend/solvoxQuestions.en.json'), 'utf8'));
const main = read('frontend/src/main.jsx');
const pkg = require('./package.json');

/* -------------------------------------------------------------------------- */
/* Application routing / Home                                                */
/* -------------------------------------------------------------------------- */
must(
  app.includes('ProfilePanel') &&
    app.includes('HomeMenu') &&
    app.includes('ModeSelect'),
  'Main routing components missing',
);
must(!app.includes('MathActivities') && !app.includes("screen==='activities'") && !app.includes('activityLogs:'), 'Legacy Math Lab wiring still present');
must(app.includes('summarizePerformance(result).mastery'), 'Completed runs do not persist mastery');
must(
  !home.includes("id: 'activities'") &&
    home.includes("id: 'settings'") &&
    home.includes("id: 'feedback'"),
  'Home navigation still exposes the retired Math Lab or is missing core controls',
);
must(!home.includes("id: 'multi'") && !home.includes('nav-multiplayer-icon.png'), 'Multiplayer must not be exposed directly on home');
must(!home.includes('onChangeLang') && !home.includes("lang==='id'?'EN':'ID'"), 'Home language switch should be moved to Settings');
must(!home.includes('home-v31-chapter-row') && !home.includes('home-v31-next-banner'), 'Removed Home chapter/overflow panel is still referenced');
must(!home.includes('SpriteCharacter') && !home.includes('home-v31-character'), 'Home character should be removed from Home');
must(home.includes('home-menu-v83') && home.includes("id: 'play'") && home.includes("id: 'tutorial'") && home.includes("labelKey: 'homeMain'") && home.includes("labelKey: 'homeTutorial'") && home.includes("labelKey: 'homeDashboard'") && home.includes("labelKey: 'homeSettings'") && home.includes("labelKey: 'homeFeedback'"), 'V103 Home menu is missing one or more core text navigation items');
must(!home.includes('SolvoxUtilityArt') && !home.includes('home-v31') && !home.includes('homeHeroTitle') && !home.includes('continueAdventure') && !home.includes('viewProfile'), 'Legacy Home icon/hero implementation remains in HomeMenu');
must(home.includes('onTutorial') && home.includes("id: 'tutorial'"), 'Home tutorial entry point is missing');
must(exists('frontend/src/components/Tutorial.jsx') && read('frontend/src/components/Tutorial.jsx').includes('tutorial-title-v102') && read('frontend/src/components/Tutorial.jsx').includes('tutorialGotIt'), 'Tutorial component is missing or incomplete');

/* -------------------------------------------------------------------------- */
/* Main mode selection / learning surfaces                                   */
/* -------------------------------------------------------------------------- */
must(
  modes.includes('singleModeDesc') &&
    modes.includes('multiModeDesc') &&
    modes.includes('onSingle') &&
    modes.includes('onMulti'),
  'Main mode selector missing single/multiplayer cards',
);
must(
  app.includes("onSingle={()=>setScreen('chapters')}") &&
    app.includes("screen==='chapters'") &&
    chapters.includes('chooseChapter'),
  'Single Player must route to a dedicated chapter selector',
);
must(!exists(path.join(root, 'frontend/src/components/MathActivities.jsx')), 'Legacy MathActivities component still present');
must(
  settings.includes('language-switch-v42') &&
    settings.includes('onChangeLang') &&
    app.includes('onChangeLang={changeLang}'),
  'Language selector must be wired to App state',
);

/* -------------------------------------------------------------------------- */
/* Profile / backend                                                          */
/* -------------------------------------------------------------------------- */
must(profile.includes('/api/player-profile') && profile.includes("t('recentRuns')"), 'Player profile is not data-driven');
must(server.includes("require('./backend/server')") && apiServer.includes("app.get('/api/player-profile'"), 'Player profile API endpoint missing');

/* -------------------------------------------------------------------------- */
/* Battle behavior                                                            */
/* -------------------------------------------------------------------------- */
must(!battle.includes('setPaused') && !battle.includes('rpg-pause-v29'), 'Battle pause control should be removed');
must(battle.includes('battle-home-back-v43') && !battle.includes('battle-feedback-top-v36'), 'Battle back/feedback controls are inconsistent');
must(solvoxQuestions.match(/\"id\":/g)?.length === 50 && solvoxQuestions.match(/\"feedback\":/g)?.length === 50, 'SOLVOX question feedback pack must contain one feedback entry for all 50 questions');
must(battle.includes('const learningFeedback = String(q.feedback || q.explanation ||'), 'Wrong-answer feedback must resolve from the active question content');
must(battle.includes('{feedback.message}') && battle.includes('battle-mistake-copy-v41'), 'Question-specific feedback must render inside the V41 mistake banner');
must(battlePanel.includes('hint-rail-v37') && battlePanel.includes('hint-reveal-btn-v37'), 'Contextual hint rail is missing');
must(!battlePanel.includes('hint-btn-v23') && !battlePanel.includes('hint-panel-v23'), 'Hint must not render inside the question panel');
must(battlePanel.includes('keypad-toggle-v66') && battlePanel.includes('attempts-v66'), 'Question panel controls missing');
must(battlePanel.includes('QUESTION_PANEL_THEME_BY_LEVEL') && battlePanel.includes('style={panelTheme}'), 'Chapter-aware question panel theme wiring is missing');
must(!battlePanel.includes('feedback-panel-v23'), 'Learning feedback must not expand inside the question panel');
must(battle.includes('battle-top-rail-v43') && battle.includes('hp-card-v62') && battle.includes('hp-track-v62'), 'Battle HUD missing');
must(battle.includes('getBossImpactMs') && battle.includes('bossAttackImpactMs'), 'Boss attack impact timing is not synchronized with the selected boss asset');
must(combatStage.includes('getBoundingClientRect') && combatStage.includes('getDistance') && combatStage.includes('bossRect.left - playerRect.right'), 'Real attack distance calculation missing');
must(!battle.includes('finalizeQuestion'), 'Unused finalizeQuestion helper remains');
must(!battle.includes('<BattleQuestionPanel') || !battle.slice(battle.indexOf('<BattleQuestionPanel')).includes('feedback={feedback}'), 'Dead feedback prop remains on question panel');

/* -------------------------------------------------------------------------- */
/* Battle styling ownership / cleanup                                         */
/* -------------------------------------------------------------------------- */
must(main.includes("import './styles/battle-v43.css';"), 'Dedicated Battle V43 stylesheet is not wired into main');
must(
  battleCss.includes('.battle-question-panel-v43') &&
    battleCss.includes('margin: 0;') &&
    battleCss.includes('grid-template-columns: minmax(0, 1.62fr)') && battleCss.includes('.question-content-v66') && battleCss.includes('.question-answer-v66') &&
    battleCss.includes('rgba(110, 213, 201'),
  'Clean Battle question dock styling is missing',
);
must(!battlePanel.includes('question-copy-v65') && !battleCss.includes('question-copy-v65'), 'Retired V65 question wrapper still exists');
must(!battleCss.includes('stage-frame-clean.png'), 'Question panel still depends on decorative stage frame asset');
for (const legacy of [
  'battle-ui-v24',
  'battle-ui-v23',
  'battle-v23',
  'battle-top-rail-v23',
  'battle-question-panel-v23',
  'combat-stage-v24',
  'rpg-pause-v29',
  'pause-overlay-v29',
]) {
  must(!css.includes(`.${legacy}`), `Legacy selector remains in app.css: ${legacy}`);
  must(!ui42.includes(`.${legacy}`), `Legacy selector remains in ui-v42.css: ${legacy}`);
}
must(!ui42.includes('.home-v31-next-banner'), 'Removed Home overflow banner style remains in ui-v42.css');
must(!ui42.includes('html,body,#root{width:100%;height:100%;overflow:hidden}'), 'Legacy fixed viewport overflow rule remains in ui-v42.css');
must(!ui42.includes('.app-shell{height:100dvh;min-height:100dvh;overflow:hidden}'), 'Legacy fixed app-shell overflow rule remains in ui-v42.css');
must(/html,\s*body,\s*#root/.test(responsive105) && responsive105.includes('overflow-y: auto !important') && responsive105.includes('touch-action: pan-y'), 'Mobile document scroll contract is missing');
must(main.includes("import './styles/home-menu-v83.css';") && main.includes("import './styles/tutorial-v102.css';"), 'V103 Home/tutorial styles are not wired into main');
must(main.includes("import './styles/responsive-v105.css';") && exists('frontend/src/styles/tutorial-v102.css') && !exists('frontend/src/styles/responsive-v101.css') && responsive105.includes('.battle-reference-v43') && responsive105.includes('mobile document-scroll contract'), 'V103 responsive portrait layer is not wired correctly');
must(responsive105.includes('.mode-select-v45') && responsive105.includes('overflow: visible !important') && responsive105.includes('height: auto !important'), 'Mobile mode selector must use natural vertical scrolling');
must(responsive105.includes('.chapter-select-v44') && responsive105.includes('overflow: visible !important') && responsive105.includes('min-height: 0 !important'), 'Mobile chapter selector must use natural vertical scrolling');
must(responsive105.includes('.battle-reference-arena-v43') && responsive105.includes('touch-action: pan-y') && responsive105.includes('.settings-head-v102') && responsive105.includes('filter:none!important'), 'V103 responsive battle/mobile/settings layer is incomplete');
must(!exists('frontend/src/components/OrientationNotice.jsx') && !main.includes('OrientationNotice'), 'Legacy orientation blocker remains after portrait-responsive update');
must(Array.isArray(englishQuestions) && englishQuestions.length === 50 && englishQuestions.every(q => q.text && q.feedback && Array.isArray(q.hints) && q.hints.length === 3), 'English question pack must contain 50 complete questions');
must(read('frontend/src/data/questions.js').includes('getSolvoxQuestions(levelId, count, _lang)'), 'Single-player question loader is not language-aware');
must(read('backend/question-generator.js').includes('packEn') && read('backend/question-generator.js').includes("lang === 'en' ? packEn : packId"), 'Multiplayer question generator is not language-aware');
must(read('frontend/src/services/solvoxEvaluation.js').includes('CHAPTER_RULES_EN') && read('frontend/src/services/solvoxEvaluation.js').includes("result.lang === 'en'"), 'English chapter evaluation rules are missing');
must(!css.includes('.home-v31') && !ui42.includes('.home-v31'), 'Legacy V31 Home CSS remains after the V77 rewrite');
must(!read('frontend/src/styles/font-v78.css').includes('home-menu-v77') && !responsive105.includes('home-menu-v77'), 'Retired V77 Home selectors remain in shared styles');
must(exists('frontend/src/components/SolvoxBrandLogo.jsx') && exists('frontend/src/styles/solvox-brand-v89.css') && main.includes("import './styles/solvox-brand-v89.css';") && read('frontend/src/components/SolvoxBrandLogo.jsx').includes('solvox-logo-v89.png'), 'Solvox V89 image logo is missing or not wired');
    must(!exists('frontend/public/assets/ui/brand/solvox-wordmark-v83.svg') && !exists('frontend/src/components/SolvoxHtmlLogo.jsx') && !exists('frontend/src/styles/solvox-logo-v83.css'), 'Retired V83 logo implementation remains');
must(!exists('frontend/public/assets/ui/brand/solvox-logo.png'), 'Retired image-based Solvox logo remains');
must(!exists('frontend/public/assets/ui/utility/icons/main.png') && !exists('frontend/public/assets/ui/utility/art/main.png'), 'Retired Main utility art remains');
must(main.includes("import './styles/chapter-select-v44.css';") && chapters.includes('chapter-card-v44') && chapterCss.includes('.chapter-card-art-v44'), 'Current chapter art UI is not wired to a dedicated stylesheet');
must(levels.includes("art:'/assets/ui/chapters/chapter-1.png'") && levels.includes("art:'/assets/ui/chapters/chapter-5.png'"), 'Chapter artwork metadata missing');
for (let id = 1; id <= 5; id += 1) must(exists(`frontend/public/assets/ui/chapters/chapter-${id}.png`), `Chapter ${id} artwork asset missing`);
must(
  backgrounds.includes("3: { type:'video'") &&
    backgrounds.includes("/assets/backgrounds/level3/chapter3-arena-4x1.mp4") &&
    backgrounds.includes("chapter3-video-poster-4x1.jpg") &&
    backgrounds.includes("scale:1.0"),
  'Chapter 3 supplied video background is not wired',
);
must(exists('frontend/public/assets/backgrounds/level3/chapter3-arena-4x1.mp4'), 'Chapter 3 video background asset is missing');
must(exists('frontend/public/assets/backgrounds/level3/chapter3-video-poster-4x1.jpg'), 'Chapter 3 video poster is missing');
must(!exists('frontend/public/assets/backgrounds/level3/chapter3-battle-4x1.png'), 'Retired Chapter 3 image background remains');
must(!exists('frontend/public/assets/backgrounds/level3/chapter3-arena.mp4'), 'Retired Chapter 3 video remains');
must(!exists('frontend/public/assets/backgrounds/level3/chapter3-video-poster.jpg'), 'Retired Chapter 3 poster remains');
must(!exists('frontend/public/assets/backgrounds/level3/background.mp4'), 'Retired Chapter 3 video asset remains');
must(!exists('frontend/public/assets/backgrounds/level3/background.png'), 'Retired Chapter 3 poster remains');
must(!chapters.includes('chapter-emblem-') && !chapterCss.includes('chapter-emblem-v43') && !ui42.includes('chapter-emblem-v43'), 'Retired chapter emblem implementation remains');

/* -------------------------------------------------------------------------- */
/* i18n / assets / data                                                       */
/* -------------------------------------------------------------------------- */
must(
  !i18n.includes('mathActivities') &&
    i18n.includes('chooseMode') &&
    i18n.includes('languageEnglish'),
  'Bilingual translation keys missing or retired Math Lab keys remain',
);
must(exists('frontend/public/assets/home/home-background-v83.mp4') && read('frontend/src/components/HomeMenu.jsx').includes('home-background-v83.mp4'), 'V83 Home background video is missing or not wired');
must(read('frontend/src/components/ModeSelect.jsx').includes('home-background-v83.mp4') && read('frontend/src/components/ModeSelect.jsx').includes('home-background-v83-poster.jpg'), 'Mode selection is not sharing the Home background video');
must(!exists('frontend/public/assets/home/home-background.gif'), 'Unused home GIF should be removed');
must(!exists('frontend/public/assets/characters/wanderer'), 'Legacy Wanderer player asset folder remains');
must(!exists('frontend/public/assets/ui/reference/player-avatar-portrait.png'), 'Legacy player portrait remains');
must(!exists('frontend/public/assets/characters/wanderer_BACKUP_V24.2'), 'Unused backup sprite folder should be removed');
must(!exists('frontend/public/assets/ui/reference/pause.png'), 'Unused pause raster should be removed');
must(pkg.version === '103.0.0', 'Root package version changed unexpectedly (bumped to 103.0.0 for the V103 release; update this pin in the same commit).');
must(exists('frontend/src/styles/battle-v43.css'), 'Dedicated Battle stylesheet missing');
must(keypad.includes("'²'") && keypad.includes("'fraction'") && keypad.includes("'a'") && keypad.includes("'z'"), 'Math keypad revision missing');
must(multi.includes('turn:hint') && multi.includes('viewSolution') && multi.includes('tieBreakHintRule'), 'Multiplayer hint support missing');
must(apiServer.includes("socket.on('turn:hint'") && apiServer.includes('hintsUsed') && apiServer.includes('finishSummary'), 'Multiplayer hint/tie-break tracking missing');
must(feedback.includes('PixelIcon'), 'Feedback icon import missing');
must(evaluation.includes('eval-summary-v105') && evaluation.includes('eval-detail-v105') && evaluation.includes('evalStrengthsTitle') && evaluation.includes('eval-accordion-v105'), 'V105 evaluation restructure is missing');
// Guards the two things the V105 restructure silently dropped from the V35 learning map:
// the adaptive next-action line and the per-question time / retry stats.
must(evaluation.includes('buildNextAction') && evaluation.includes('eval-next-action-v105') && evaluation.includes("t('evaluationAction')") && /weakConcepts\.length/.test(evaluation) && /evaluationActionReview/.test(evaluation) && /evaluationActionChallenge/.test(evaluation) && /evaluationActionPractice/.test(evaluation), 'Evaluation adaptive next-action guidance is missing (V35 learning-map regression)');
must(evaluation.includes('summary.avgTimePerAnsweredQuestion') && evaluation.includes('summary.retryQuestions'), 'Evaluation must still surface per-question time and retry counts');
must(gameMeta.includes("title: 'Solvox'") && gameMeta.includes("shortTitle: 'Solvox'"), 'Game branding config missing');
must(read('frontend/index.html').includes('/assets/ui/brand/solvox-logo-v89.png'), 'V89 favicon is not wired');

const playerAssets = read('frontend/src/data/playerAssets.js');
const playerData = read('frontend/src/data/player.js');
must(playerAssets.includes("base: '/assets/characters/traveler'"), 'Traveler asset registry missing');
must(playerAssets.includes("idle: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png']"), 'Traveler idle registry incomplete');
must(playerAssets.includes("attack: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png','07.png']"), 'Traveler attack registry incomplete');
must(playerData.includes("id: ACTIVE_PLAYER_ID") && playerData.includes("name: 'The Traveler'"), 'Active player identity missing');
must(!exists('frontend/src/data/wanderer.js'), 'Legacy Wanderer player data module remains');

const expectedPlayerFrames = {
  idle: 6,
  attack: 7,
  hurt: 5,
  die: 6,
};
for (const [state, expected] of Object.entries(expectedPlayerFrames)) {
  const stateDir = path.join(root, 'frontend/public/assets/characters/traveler', state);
  const frames = fs.existsSync(stateDir)
    ? fs.readdirSync(stateDir).filter((file) => file.endsWith('.png')).sort()
    : [];
  must(
    frames.length === expected,
    `traveler ${state} pack incomplete: expected ${expected} PNG frames, found ${frames.length}`,
  );
}

const bossMonster = read('frontend/src/components/BossMonster.jsx');

/* -------------------------------------------------------------------------- */
/* Boss renderer syntax regression guard                                     */
/* -------------------------------------------------------------------------- */
function checkBalancedDelimiters(source, fileName) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  let state = 'code';
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (state === 'code') {
      if (ch === '/' && next === '/') { state = 'line'; i += 1; continue; }
      if (ch === '/' && next === '*') { state = 'block'; i += 1; continue; }
      if (ch === '\"' || ch === "'" || ch === '`') { state = ch; continue; }
      if ('([{'.includes(ch)) stack.push(ch);
      else if (')]}'.includes(ch)) {
        if (stack[stack.length - 1] !== pairs[ch]) {
          throw new Error(`${fileName}: mismatched delimiter '${ch}' near character ${i}`);
        }
        stack.pop();
      }
      continue;
    }

    if (state === 'line') {
      if (ch === '\n') state = 'code';
      continue;
    }

    if (state === 'block') {
      if (ch === '*' && next === '/') { state = 'code'; i += 1; }
      continue;
    }

    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === state) state = 'code';
  }

  must(stack.length === 0, `${fileName}: unclosed delimiter(s): ${stack.join(' ')}`);
}

checkBalancedDelimiters(bossMonster, 'frontend/src/components/BossMonster.jsx');
must(
  (bossMonster.match(/useImperativeHandle\(ref, \(\) => \({/g) || []).length === 2 &&
    bossMonster.includes('}), [boss]);') &&
    !bossMonster.includes('}, [boss]);'),
  'Boss renderer imperative-handle syntax is malformed',
);

const spriteCharacter = read('frontend/src/components/SpriteCharacter.jsx');
checkBalancedDelimiters(spriteCharacter, 'frontend/src/components/SpriteCharacter.jsx');
must(!combatStage.includes('vs-badge-v43') && !combatStage.includes('combat-center-v43'), 'Decorative VS arena marker still exists');
must(spriteCharacter.includes('visualScale') && spriteCharacter.includes('parentElement?.getBoundingClientRect().width'), 'Player canvas is not responsive to fighter wrapper width');
must(bossMonster.includes('visualScale') && bossMonster.includes('canvas.parentElement?.getBoundingClientRect().width'), 'Boss canvas is not responsive to fighter wrapper width');
must(responsive105.includes('.battle-reference-arena-v43') && responsive105.includes('height: 27dvh') && responsive105.includes('@media (max-width: 420px)'), 'V99 mobile battle sizing rules are missing');
must(!responsive105.includes('.vs-badge-v43'), 'Responsive stylesheet still references removed VS badge');

must(main.includes("import './styles/ui-v93.css';") && exists('frontend/src/styles/ui-v93.css'), 'V93 visual refinement stylesheet is not wired');
  must(main.includes("import './styles/ui-v96.css';") && exists('frontend/src/styles/ui-v96.css'), 'V96 polish stylesheet is not wired');
must(exists('frontend/src/styles/responsive-v105.css') && !exists('frontend/src/styles/responsive-v102.css') && !exists('frontend/src/styles/responsive-v101.css') && !exists('frontend/src/styles/responsive-v94.css') && !exists('frontend/src/styles/responsive-v93.css'), 'Responsive source cleanup is incomplete');
must(multi.includes('home-background-v83.mp4') && multi.includes('multi-home-bg-v93'), 'Multiplayer Home background video is not wired');
must(profile.includes('SolvoxUtilityArt name="close"'), 'Profile close control is not using the dedicated close artwork');
must(settings.includes('settings-about-row-v96') && settings.includes('settings-close-btn-v96') && !settings.includes('success-v27'), 'Settings V96 about/close cleanup is incomplete');
must(battlePanel.includes('is-story-chapter-v74'), 'Story chapter class is missing');
must(exists('frontend/src/components/AboutDevelopers.jsx') && main.includes("import './styles/ui-v96.css';"), 'About Us page/style is not wired');
must(app.includes("screen==='about'&&<AboutDevelopers") && app.includes('onAboutUs'), 'About Us navigation is not wired through App');
must(utilityArt.includes("back: '/assets/ui/utility/icons/back-v82.webp'") && utilityArt.includes("close: '/assets/ui/utility/icons/close-v96.png'"), 'Back/close icon routing is incorrect');
must(exists('frontend/public/assets/ui/utility/icons/back-v82.webp') && exists('frontend/public/assets/ui/utility/icons/close-v96.png') && !exists('frontend/public/assets/ui/utility/icons/back-v94.png') && !exists('frontend/public/assets/ui/utility/icons/close-v94.png'), 'Back/close assets are not cleaned correctly');
must(!settings.includes('developer-team-v94') && !settings.includes('success-v27'), 'Legacy developer/success block remains in Settings');
must(i18n.includes("homeMain:'Main'") && i18n.includes("homeMain:'Play'"), 'Home Main/Play bilingual labels are not configured');
  must(settings.includes('openAboutUs') && app.includes('onAboutUs'), 'About Us action is not wired');
  must(!settings.includes('success-v27'), 'Legacy Settings success markup remains');
  must(!settings.includes('developer-team-v94'), 'Legacy developer team block remains in Settings');
  must(utilityArt.includes('close-v96.png'), 'Close artwork does not use the compact V96 asset');


const bossAssets = read('frontend/src/data/bossAssets.js');
const bossData = read('frontend/src/data/bosses.js');
must(bossAssets.includes("base: '/assets/characters/wolf'"), 'Wolf WebP asset manifest missing');
must(bossAssets.includes("base: '/assets/characters/equation-drake'"), 'Chapter 3 Equation Drake asset manifest missing');
must(bossAssets.includes("base: '/assets/characters/wraith'"), 'Wraith WebP asset manifest missing');
must(bossData.includes("id: 'wolf'") && bossData.includes("id: 'wraith'"), 'Chapter 1/2 boss data missing');
must(bossData.includes("3: {") && bossData.includes("4: {") && bossData.includes("5: {"), 'Chapter 3–5 boss slots missing');
must(bossData.includes("id: 'equation-drake'") && bossData.includes("renderer: 'webp'"), 'Chapter 3 WebP boss data missing');
must(bossMonster.includes('getBossAsset'), 'Shared boss asset renderer missing');
must(bossMonster.includes('state.pending') && bossMonster.includes('attackElement') && bossMonster.includes('logicalW = Math.round(size * 1.42)'), 'Chapter 3 boss preload/element attack guard missing');
must(read('frontend/src/components/CombatStage.jsx').includes('levelId={levelId}'), 'Boss level ID is not passed to renderer');
must(!exists('frontend/src/data/shadowWolfAssets.js'), 'Obsolete Shadow Wolf manifest remains');

const bossAssetRoot = path.join(root, 'frontend/public/assets/characters');
const expectedBossFrames = {
  wolf: { idle: 6, attack: 6, hurt: 5, die: 5 },
  wraith: { idle: 6, attack: 7, hurt: 5, die: 6 },
};
for (const [bossId, states] of Object.entries(expectedBossFrames)) {
  for (const [state, expected] of Object.entries(states)) {
    const stateDir = path.join(bossAssetRoot, bossId, state);
    const frames = fs.existsSync(stateDir)
      ? fs.readdirSync(stateDir).filter((file) => file.endsWith('.webp')).sort()
      : [];
    must(
      frames.length === expected,
      `${bossId} ${state} pack incomplete: expected ${expected} WebP frames, found ${frames.length}`,
    );
  }
}


const equationDrakeRoot = path.join(bossAssetRoot, 'equation-drake');
const equationDrakeFrames = { idle: 6, attack: 9, hurt: 6, die: 5 };
for (const [state, expected] of Object.entries(equationDrakeFrames)) {
  const stateDir = path.join(equationDrakeRoot, state);
  const frames = fs.existsSync(stateDir)
    ? fs.readdirSync(stateDir).filter((file) => file.endsWith('.webp')).sort()
    : [];
  must(frames.length === expected, `equation-drake ${state} pack incomplete: expected ${expected}, found ${frames.length}`);
}
const attackElementDir = path.join(equationDrakeRoot, 'effects', 'attackElement');
const attackElementFrames = fs.existsSync(attackElementDir)
  ? fs.readdirSync(attackElementDir).filter((file) => file.endsWith('.webp')).sort()
  : [];
must(attackElementFrames.length === 3, `equation-drake attack element pack incomplete: expected 3, found ${attackElementFrames.length}`);

for (const legacyPath of [
  'frontend/public/assets/characters/shadow-wolf',
  'frontend/src/data/shadowWolfAssets.js',
]) {
  must(!exists(legacyPath), `Legacy boss asset path remains: ${legacyPath}`);
}


/* -------------------------------------------------------------------------- */
/* V62 motion / multiplayer polish regression guard                           */
/* -------------------------------------------------------------------------- */
const spriteV62 = read('frontend/src/components/SpriteCharacter.jsx');
const bossV62 = read('frontend/src/components/BossMonster.jsx');
const multiV62 = read('frontend/src/components/Multiplayer.jsx');
const multiplayer = multiV62;
const solvoxEval = read('frontend/src/services/solvoxEvaluation.js');
const gitignore = read('.gitignore');
const ui34V62 = read('frontend/src/styles/ui-v34.css');
must(spriteV62.includes('requestAnimationFrame(tick)') && spriteV62.includes('motionX') && spriteV62.includes('drawImage(image'), 'Traveler smoothing layer is missing');
must(!spriteV62.includes('setInterval('), 'Traveler animation regressed to interval-based frame stepping');
must(bossV62.includes('requestAnimationFrame(tick)') && bossV62.includes('asset-boss-canvas-v62') && bossV62.includes('drawImage(image'), 'WebP boss smoothing layer is missing');
must(!bossV62.includes('setInterval('), 'WebP boss animation regressed to interval-based frame stepping');
must(multiV62.includes('mp-arena-v104') && multiV62.includes('SpriteCharacter') && multiV62.includes('BossMonster') && multiV62.includes('data-combat-seq'), 'V104 multiplayer battle arena hooks are missing');
// The old mp-attack-flash-v62 / mp-damage-pop-v62 spans belonged to the retired V34 pixel
// markup. V104 replaces them with renderer-driven impacts, so they must NOT come back.
must(multiV62.includes('playerBattleImpact') && multiV62.includes('bossBattleImpact'), 'V104 arena must drive hit/impact feedback through the sprite renderers');
must(!multiV62.includes('mp-attack-flash-v62') && !multiV62.includes('mp-damage-pop-v62'), 'Retired V34 combat spans must not reappear in the V104 arena markup');
must(ui34V62.includes('.multi-page-v26{height:100dvh') && ui34V62.includes('overflow-y:auto') && ui34V62.includes('scroll-behavior:smooth'), 'Multiplayer scroll container is missing');
must(ui34V62.includes('@keyframes mpAttackV62') && ui34V62.includes('@keyframes mpHitV62') && ui34V62.includes('@keyframes mpDamageV62'), 'Multiplayer combat animation layer is incomplete');

checkBalancedDelimiters(battle, 'frontend/src/components/Battle.jsx');
const combatV62 = read('frontend/src/components/CombatStage.jsx');
checkBalancedDelimiters(combatV62, 'frontend/src/components/CombatStage.jsx');
must(spriteV62.includes('One-shot states return to idle in the same render tick') && spriteV62.includes("state.mode = 'idle';") && spriteV62.includes('canvas.style.transform = `translate3d(') && spriteV62.includes('const x = baseX;'), 'Traveler one-shot/attack render guard failed');
  must(!spriteV62.includes('drawImage(nextImage'), 'Traveler attack renderer still cross-fades frames');
  must(!bossV62.includes('drawImage(nextImage'), 'WebP boss renderer still cross-fades frames');
must(!read('frontend/src/styles/battle-v43.css').includes('.asset-boss-seq-attack-v40{animation:'), 'Battle stylesheet still overrides boss WebP transform animation');
  must(read('frontend/src/styles/battle-v43.css').includes('text-wrap: balance') && read('frontend/src/styles/battle-v43.css').includes('focus-within') && read('frontend/src/styles/battle-v43.css').includes('grid-template-columns: minmax(0, 1.62fr)'), 'Battle question panel polish is missing');
must(read('frontend/src/styles/battle-v43.css').includes('.hp-card-v62') && read('frontend/src/styles/battle-v43.css').includes('.fighter-slot-v62'), 'V62 HUD/anchor styling is missing');

must(!multi.includes('multi-toolbar-v25') && !multi.includes('multi-toolbar-v26'), 'Retired multiplayer toolbar markup remains');
for (const file of ['frontend/src/styles/app.css','frontend/src/styles/ui-v32.css','frontend/src/styles/ui-v34.css','frontend/src/styles/responsive-v105.css']) {
  must(!read(file).includes('multi-toolbar-v25') && !read(file).includes('multi-toolbar-v26'), `Retired multiplayer toolbar CSS remains in ${file}`);
}
must(!read('frontend/src/components/Settings.jsx').includes('<span>{t(\'languageIndonesia\')}</span>') && !read('frontend/src/components/Settings.jsx').includes('<span>{t(\'languageEnglish\')}</span>'), 'Language selector labels should be icon-only');
must(!exists('frontend/public/assets/ui/brand/solvox-logo-v84.svg') && !exists('frontend/src/styles/solvox-brand-v84.css') && !exists('frontend/src/styles/brand-v83.css'), 'Retired V83/V84 brand assets/styles remain');
must(exists('frontend/public/assets/ui/brand/solvox-logo-v89.png'), 'V89 logo asset is missing');


// V98 Chapter 3 background + mobile conflict guards.
must(backgrounds.includes("level3/chapter3-arena-4x1.mp4"), 'Chapter 3 4:1 video background is not configured');
must(!backgrounds.includes('chapter3-battle-4x1.png'), 'Legacy Chapter 3 image background is still configured');
must(exists('frontend/public/assets/backgrounds/level3/chapter3-arena-4x1.mp4'), 'Chapter 3 video asset is missing');
must(exists('frontend/public/assets/backgrounds/level3/chapter3-video-poster-4x1.jpg'), 'Chapter 3 video poster is missing');
must(!exists('frontend/public/assets/backgrounds/level3/chapter3-battle-4x1.png'), 'Legacy Chapter 3 background asset remains');
must(!main.includes("responsive-v96.css") && !exists('frontend/src/styles/responsive-v96.css'), 'Legacy V96 responsive source remains active');
must(responsive105.includes('overflow: visible !important') && responsive105.includes('touch-action: pan-y') && responsive105.includes('fighter-player-v43 .sprite-wrap'), 'V101 mobile conflict fixes are incomplete');
must(responsive105.includes('bg-mobile-object-position') && responsive105.includes('object-fit: cover !important') && responsive105.includes('transform: none !important'), 'Responsive arena background contract is missing');
must(!main.includes('responsive-v98.css') && !exists('frontend/src/styles/responsive-v98.css'), 'Legacy V98 responsive source remains active');
must(battle.includes('battle-answer-input-v66') && !battle.includes('battle-answer-input-v23'), 'Battle focus selector still points at retired V23 input');

console.log('V61 QA STATIC + REGRESSION PASS');
console.log('V62 QA MOTION + MULTIPLAYER PASS');

must(settings.includes('settings-v101.webp') && settings.includes('settings-head-art-v102'), 'Settings must use the supplied V101 settings icon with the V103 header layout');
must(!feedback.includes('SolvoxUtilityArt name=\"feedback\"'), 'Feedback modal must not render the decorative feedback utility artwork');
must(!profile.includes('PixelIcon name=\"pixelNinja\"') && !profile.includes('pixel-icon-raster'), 'Profile must not render the retired pixel/raster profile artwork');
must(exists('frontend/public/assets/ui/utility/icons/settings-v101.webp'), 'V101 settings icon asset is missing');
must(!exists('frontend/public/assets/ui/reference/avatar-medallion-clean.png'), 'Retired profile avatar asset still exists');
console.log('V103: settings icon polish, Home tutorial guide, V91 mobile reference geometry, chapter-aware question themes, visible mobile feedback, icon-only language selector');
console.log('Battle: one dedicated V43 stylesheet, full-width HUD, continuous question/hint/keypad dock, real attack-distance calculation');
console.log('Cleanup: legacy V23/V24 layout roots removed from app/ui-v42, dead Battle helper/prop removed');
console.log('Content: bilingual i18n, profile API, multiplayer hint tracking, Traveler player pack, Wolf + Wraith + Equation Drake WebP boss packs');

const v94StaleRefs=[['frontend/src/components/ModeSelect.jsx',['single-player-hero.png','multiplayer-hero.png']],['frontend/src/components/Multiplayer.jsx',['AJM-XXXX']],['frontend/src/services/i18n.js',['AJM-XXXX']]];
for(const [rel,badRefs] of v94StaleRefs){
  const text=read(rel);
  for(const bad of badRefs){ must(!text.includes(bad), `V94 stale reference: ${rel} -> ${bad}`); }
}
for(const asset of ['single-mode-v94.webp','multi-mode-v94.webp']) must(exists(`frontend/public/assets/ui/modes/${asset}`), `V94 missing mode asset: ${asset}`);
for(const asset of ['flag-id-v94.png','flag-en-v94.png','back-v82.webp','close-v96.png']) must(exists(`frontend/public/assets/ui/utility/icons/${asset}`), `V96 missing utility asset: ${asset}`);
must(exists('frontend/public/assets/ui/modes/single-mode-v94.webp') && exists('frontend/public/assets/ui/modes/multi-mode-v94.webp'), 'V94 mode artwork is missing');
must(!exists('frontend/public/assets/ui/modes/single-player-hero.png') && !exists('frontend/public/assets/ui/modes/multiplayer-hero.png'), 'Old mode artwork assets remain');
must(!exists('frontend/public/assets/ui/utility/icons/back.webp'), 'Old back icon asset remains');
must(battle.includes('bossDieDurationMs + 140') && battle.includes('playerDieDurationMs + 140'), 'Evaluation timing is not synchronized with die animations');
must(settings.includes('flag-id-v94.png') && settings.includes('flag-en-v94.png') && settings.includes('settings-about-row-v96'), 'V96 Settings flags/about routing are missing');

/* -------------------------------------------------------------------------- */
/* Production backend + integration contract                                */
/* -------------------------------------------------------------------------- */
/* Everything above validates the frontend. These checks cover the Cloudflare
 * Worker that actually runs in production, plus the transport contract that a
 * new version folder must not break. Without these, copying a version folder
 * over the repo can silently pass QA and 404 in production. */

const workerRoom = read('worker/src/room.js');
const workerIndex = read('worker/src/index.js');
const workerGame = read('worker/src/game.js');
const realtime = read('frontend/src/services/realtime.js');
const runtimeConfig = read('frontend/public/config.js');
const frontendPkg = require('./frontend/package.json');
const componentFiles = fs
  .readdirSync(path.join(root, 'frontend/src/components'))
  .filter((f) => f.endsWith('.jsx'))
  .map((f) => read(`frontend/src/components/${f}`));

// The Worker is the only backend in production; backend/ is an archive.
must(!workerRoom.includes('express') && !workerIndex.includes('require('), 'Worker must stay dependency-free, not import the legacy Express server');
must(workerIndex.includes("'/health'") && workerIndex.includes('health-probe') && workerIndex.includes('idFromName'), 'Worker health probe is missing: /health must actually reach a Durable Object');
must(workerIndex.includes('SOLVOX_ROOM') || exists('worker/wrangler.toml'), 'Durable Object binding is missing');

// A dropped player must be recoverable inside the grace window.
must(/ROOM_GRACE_MS\s*=\s*\d+/.test(workerGame), 'ROOM_GRACE_MS is not defined');
must(workerRoom.includes('player:disconnected') && workerRoom.includes('room:reconnected'), 'Reconnect/grace events are missing');
must(workerRoom.includes('storage.setAlarm') && workerRoom.includes('async alarm') && workerRoom.includes('storage.deleteAlarm'), 'Turn alarm is missing: setAlarm + alarm handler + deleteAlarm are all required');

// Transport contract: one shim, no library, no bare same-origin /api calls.
must(!componentFiles.some((c) => /from ['"]socket\.io-client['"]/.test(c)), 'A component imports socket.io-client directly; use services/realtime.js instead');
must(!realtime.includes("from 'socket.io-client'"), 'services/realtime.js must not depend on socket.io-client');
must(!frontendPkg.dependencies || !frontendPkg.dependencies['socket.io-client'], 'socket.io-client is still a frontend dependency but is unused');
must(realtime.includes('export') && realtime.includes('connect'), 'services/realtime.js no longer exposes the realtime client');

// A bare fetch('/api/...') hits the Vercel origin and 404s silently, because the
// backend lives on a different host. Every API call must go through apiUrl().
const bareApiCalls = componentFiles
  .map((f) => `frontend/src/components/${f}`)
  .filter((_, i) => /fetch\(\s*['"`]\/api\//.test(componentFiles[i]));
must(bareApiCalls.length === 0, `Bare fetch('/api/...') bypasses the backend host in: ${bareApiCalls.join(', ')}`);
must(exists('frontend/src/config.js') && read('frontend/src/config.js').includes('export function apiUrl'), 'apiUrl() helper is missing from src/config.js');

// Runtime config must target the Worker and must not point a dev server at it.
must(runtimeConfig.includes('solvox-worker.workers.dev'), 'public/config.js does not target the Cloudflare Worker');
must(runtimeConfig.includes('isLocalDev') && runtimeConfig.includes("'5173'"), 'public/config.js lost the local-dev guard; a Vite dev server would hit production');

// Nothing in a new version folder may overwrite the production transport.
must(exists('worker') && exists('frontend/src/services/realtime.js') && exists('frontend/src/config.js'), 'A production transport file is missing from the repo');

/* -------------------------------------------------------------------------- */
/* V104/V105/V107 feature contract                                            */
/* -------------------------------------------------------------------------- */
const sound = read('frontend/src/services/sound.js');
const aiFeedback = read('frontend/src/services/aiFeedback.js');
const uiV104 = read('frontend/src/styles/ui-v104.css');
const evalCss105 = read('frontend/src/styles/evaluation-v105.css');

// -- V105 sound: a toggle that actually mutes, and an mp3 that actually exists.
must(sound.includes('export function playSound') && sound.includes('export function isSoundEnabled') && sound.includes('export function setSoundEnabled'), 'sound.js must expose playSound/isSoundEnabled/setSoundEnabled');
must(sound.includes("STORAGE_KEY = 'solvox.sound.enabled'") && /function enabled\(\)\s*\{\s*return localStorage\.getItem\(STORAGE_KEY\)/.test(sound), 'playSound must gate on the persisted toggle, not just accept a flag');
must(sound.includes("case 'playerAttack'") && sound.includes("case 'chapter1BossAttack'") && sound.includes("case 'victory'") && sound.includes("case 'defeat'"), 'sound.js is missing one of the wired cue kinds');
must(exists('frontend/public/assets/audio/player-attack.mp3') && exists('frontend/public/assets/audio/chapter1-boss-attack.mp3'), 'V105 attack audio assets are missing');
must(sound.includes('/assets/audio/player-attack.mp3') && sound.includes('/assets/audio/chapter1-boss-attack.mp3'), 'sound.js asset paths must match the files on disk');
must(settings.includes("t('sound')") && settings.includes('setSoundEnabled') && settings.includes('isSoundEnabled'), 'Settings does not wire the sound toggle');
must(battle.includes("playSound('playerAttack')") && battle.includes('playSound(isCorrect ?'), 'Battle does not fire the V105 sound cues');
must(multiplayer.includes("playSound(x?.correct?'correct':'wrong')"), 'Multiplayer does not fire answer sound cues');

// -- V105 hint cost: a real escalation, and the button must respect it.
must(battle.includes('const HINT_COSTS = [5, 10, 15]') && battle.includes('hp <= hintCost') && battle.includes('value - hintCost'), 'Single-player hint cost must escalate 5/10/15 HP and gate on remaining HP');
must(battlePanel.includes('hintCost') && battlePanel.includes('currentHp') && battlePanel.includes("t('hintCostDynamic', { cost: hintCost })") && battlePanel.includes('−{hintCost} HP'), 'Hint rail must show the real dynamic HP cost');
must(battlePanel.includes('currentHp <= hintCost'), 'Hint button must stay disabled when the player cannot afford the hint');
must(i18n.includes('hintCostDynamic:') && /hintCostDynamic:'−\{cost\} HP/.test(i18n), 'hintCostDynamic must exist in both languages with a {cost} placeholder');
// The old flat "-5 HP" copy is now a lie; it must not survive anywhere.
must(!i18n.includes("hintCost:'-5 HP."), 'Static hintCost copy ("-5 HP") survived the V105 dynamic-cost change');

// -- V108 AI feedback: progressive enhancement only, and it must use apiUrl().
must(battle.includes('enhanceFeedback') && battle.includes('q.feedback'), 'Battle must keep the local feedback as the immediate fallback');
must(aiFeedback.includes("from '../config'") && aiFeedback.includes('apiUrl('), 'aiFeedback.js must route through apiUrl(); a bare /api/ path 404s against the Vercel origin');
must(!aiFeedback.includes("from './api'") && !aiFeedback.includes('socket.io'), 'aiFeedback.js must not depend on the unported kyoka auth shim');
// Every failure path must return the fallback, or a missing route would blank the feedback.
const aiFallbackPaths = (aiFeedback.match(/return fallback;/g) || []).length;
must(aiFallbackPaths >= 4, `enhanceFeedback must fall back on every failure path (found ${aiFallbackPaths}, need >= 4: no endpoint, non-2xx, empty body, throw)`);
must(aiFeedback.includes('AbortController') && aiFeedback.includes('4500'), 'enhanceFeedback must be time-bounded so a slow AI call cannot stall the battle');
// Off by default: the Worker has no /api/ai-feedback route, so defaulting to one
// burns a request per wrong answer and just logs a 404.
must(/VITE_SOLVOX_AI_FEEDBACK_ENDPOINT\)\s*\|\|\s*'';/.test(aiFeedback), 'aiFeedback endpoint must resolve to an empty string when unconfigured, so the no-endpoint fallback is reachable');
must(!aiFeedback.includes("|| '/api/ai-feedback'"), 'aiFeedback must not default to a route the Worker does not serve');
must(battle.includes("playSound('hint');") && battle.includes('// Hints live only in the dedicated hint rail'), 'Battle hint block lost its rail-only invariant during the V105 port');

// -- V104 arena: canonical sprites, and the dead pixel arena must be fully gone.
must(multiplayer.includes('SpriteCharacter') && multiplayer.includes('BossMonster') && multiplayer.includes('mp-arena-v104'), 'Multiplayer must use the canonical Single Player Traveler/boss sprites');
must(multiplayer.includes('playerBattleImpact') && multiplayer.includes('bossBattleImpact') && multiplayer.includes('getArenaLungeDistance'), 'V104 arena must wire the renderer impact callbacks and viewport-aware lunge');
must(multiplayer.includes("room?.combatEvent?.seq") && multiplayer.includes(".play('attack',{distance})"), 'V104 arena must trigger attacks off the room combatEvent sequence');
must(multiplayer.includes('.idle()'), 'V104 arena must reset fighters on each new question');
must(!multiplayer.includes('mp-fighter-v34') && !multiplayer.includes('mp-clash-v34') && !multiplayer.includes('mp-arena-v34'), 'Retired V34 pixel arena markup remains in Multiplayer');
for (const file of ['frontend/src/styles/ui-v34.css', 'frontend/src/styles/ui-v93.css', 'frontend/src/styles/responsive-v105.css']) {
  for (const dead of ['mp-arena-v34', 'mp-fighter-v34', 'mp-clash-v34', 'mp-fighter-sprite']) {
    must(!read(file).includes(dead), `Dead arena selector ${dead} remains in ${file}`);
  }
}
must(!read('frontend/src/styles/ui-v34.css').includes('mpAttackV35') && !read('frontend/src/styles/ui-v34.css').includes('mpSlashV35'), 'V35 arena keyframes remain after the V104 rewrite');
// The responsive layer still references the live V104 arena; a rename must not orphan it.
must(responsive105.includes('.mp-battle-v104 .mp-arena-v104') && responsive105.includes('.mp-sprite-frame-v104'), 'V105 mobile rules for the V104 arena are missing');
must(exists('frontend/src/styles/ui-v104.css') && main.includes("import './styles/ui-v104.css';"), 'V104 arena stylesheet is not wired into main');

// -- V105/V106 mobile battle flow: feedback must be a grid row, not an overlay.
must(battle.includes('has-feedback-v106') && responsive105.includes('.battle-ui-v43.has-feedback-v106'), 'V106 feedback-row class must be applied in Battle and styled in the responsive layer');
must(responsive105.includes('.battle-ui-v43:not(.has-feedback-v106)') && responsive105.includes('grid-template-rows: auto 0'), 'Without a mistake the feedback row must collapse to zero height');
must(responsive105.includes('font-size: 16px !important'), 'Answer input must keep a 16px minimum to stop mobile browser zoom');
must(responsive105.includes('env(safe-area-inset-bottom)') && responsive105.includes('orientation: landscape'), 'V106 safe-area and landscape battle flow are missing');

// -- V105 evaluation: summary first, per-question detail on demand.
must(exists('frontend/src/styles/evaluation-v105.css') && main.includes("import './styles/evaluation-v105.css';"), 'V105 evaluation stylesheet is not wired into main');
must(evaluation.includes('eval-summary-v105') && evaluation.includes('eval-accordion-v105') && evaluation.includes('eval-detail-v105'), 'V105 evaluation layout is missing');
must(evaluation.includes('buildStrengths') && evaluation.includes('buildAdvice'), 'V105 evaluation must derive strengths/advice from the run');
must(evaluation.includes('<details') && evaluation.includes('onToggle'), 'Per-question evaluation detail must be an expandable disclosure, not a flat list');
must(evaluation.includes('eval-card-v105') && evalCss105.includes('.eval-card-v105'), 'Evaluation card must carry the V105 class that the stylesheet targets');
must(evaluation.includes("apiUrl('/api/evaluation')") && !evaluation.includes("from './api'"), 'Evaluation must keep posting through the repo apiUrl() transport');
for (const key of ['evalStrengthsTitle', 'evalAdviceTitle', 'evalDetailsTitle', 'question', 'yourAnswer', 'explanation']) {
  must(new RegExp(`\\b${key}:`).test(i18n), `Missing V105 i18n key: ${key}`);
}

// -- Labels must be bilingual, and the source filename must not leak into the UI.
must(solvoxEval.includes('CATEGORY_TITLES') && solvoxEval.includes('CATEGORY_TITLES[lang].master'), 'Evaluation category titles must be language-aware');
must(!solvoxEval.includes('EVALUASI SOAL SOLVOX.docx'), 'Evaluation UI leaks its source filename');
must(!evaluation.includes('EVALUASI SOAL SOLVOX.docx'), 'Evaluation component leaks its source filename');

// -- Multiplayer hint cost mirrors the single-player escalation, capped at two.
must(multiplayer.includes('turnHintCost') && multiplayer.includes('5*((me?.hintsUsed||0)+1)'), 'Multiplayer hint cost must escalate 5/10 HP');
must(multiplayer.includes('me?.hintsUsed||0)>=2') && multiplayer.includes('me?.hp||0)<=turnHintCost'), 'Multiplayer must cap hints at 2 and refuse when HP is too low');
must(multiplayer.includes('mp-feedback-banner-v105') && uiV104.includes('.mp-feedback-banner-v105'), 'Multiplayer feedback banner markup and CSS must match');

// -- Anti-rollback: the ported features must not smuggle the old backend back in.
must(!exists('frontend/src/services/api.js') && !exists('frontend/src/services/auth.js'), 'kyoka auth shim (api.js/auth.js) must not return without a Worker-side account store');
must(!exists('frontend/src/components/AuthScreen.jsx'), 'AuthScreen must stay out until an account route exists on the Worker');
must(!multiplayer.includes('playVsBot') && !multiplayer.includes('createBot') && !multiplayer.includes('isBot'), 'Bot mode must stay out until the Worker room logic supports it');
must(gitignore.includes('data/*.jsonl') && gitignore.includes('!data/.gitkeep'), 'Runtime player data (*.jsonl) must stay git-ignored so analytics never leak into the repo');
must(pkg.version === '103.0.0', 'Root package version changed unexpectedly (bumped to 103.0.0 for the V103 release; update this pin in the same commit).');


console.log('Worker + integration contract PASS');
console.log('V104 arena / V105 sound+hint+evaluation / V106 mobile battle contract PASS');
