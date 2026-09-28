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
const responsive93 = read('frontend/src/styles/responsive-v93.css');
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
must(home.includes('home-menu-v83') && home.includes("id: 'play'") && home.includes("labelKey: 'homeMain'") && home.includes("labelKey: 'homeDashboard'") && home.includes("labelKey: 'homeSettings'") && home.includes("labelKey: 'homeFeedback'"), 'V83 Home menu is missing one or more core text navigation items');
must(!home.includes('SolvoxUtilityArt') && !home.includes('home-v31') && !home.includes('homeHeroTitle') && !home.includes('continueAdventure') && !home.includes('viewProfile'), 'Legacy Home icon/hero implementation remains in HomeMenu');

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
must(responsive93.includes('html, body, #root') && responsive93.includes('overflow-y: auto !important') && responsive93.includes('touch-action: pan-y'), 'Mobile document scroll contract is missing');
must(main.includes("import './styles/home-menu-v83.css';"), 'V83 Home stylesheet is not wired into main');
must(main.includes("import './styles/responsive-v93.css';") && responsive93.includes('portrait') && responsive93.includes('.battle-reference-v43') && responsive93.includes('V93'), 'V93 responsive portrait layer is not wired correctly');
must(responsive93.includes('.mode-select-v45') && responsive93.includes('overflow: visible !important') && responsive93.includes('height: auto !important') && responsive93.includes('document-scroll contract'), 'Mobile mode selector must use natural vertical scrolling');
must(responsive93.includes('.chapter-select-v44') && responsive93.includes('overflow: visible !important') && responsive93.includes('min-height: 0 !important'), 'Mobile chapter selector must use natural vertical scrolling');
must(responsive93.includes('.battle-reference-arena-v43') && responsive93.includes('touch-action: pan-y'), 'V93 responsive battle/mobile layer is incomplete');
must(!exists('frontend/src/components/OrientationNotice.jsx') && !main.includes('OrientationNotice'), 'Legacy orientation blocker remains after portrait-responsive update');
must(Array.isArray(englishQuestions) && englishQuestions.length === 50 && englishQuestions.every(q => q.text && q.feedback && Array.isArray(q.hints) && q.hints.length === 3), 'English question pack must contain 50 complete questions');
must(read('frontend/src/data/questions.js').includes('getSolvoxQuestions(levelId, count, _lang)'), 'Single-player question loader is not language-aware');
must(read('backend/question-generator.js').includes('packEn') && read('backend/question-generator.js').includes("lang === 'en' ? packEn : packId"), 'Multiplayer question generator is not language-aware');
must(read('frontend/src/services/solvoxEvaluation.js').includes('CHAPTER_RULES_EN') && read('frontend/src/services/solvoxEvaluation.js').includes("result.lang === 'en'"), 'English chapter evaluation rules are missing');
must(!css.includes('.home-v31') && !ui42.includes('.home-v31'), 'Legacy V31 Home CSS remains after the V77 rewrite');
must(!read('frontend/src/styles/font-v78.css').includes('home-menu-v77') && !responsive93.includes('home-menu-v77'), 'Retired V77 Home selectors remain in shared styles');
must(exists('frontend/src/components/SolvoxBrandLogo.jsx') && exists('frontend/src/styles/solvox-brand-v89.css') && main.includes("import './styles/solvox-brand-v89.css';") && read('frontend/src/components/SolvoxBrandLogo.jsx').includes('solvox-logo-v89.png'), 'Solvox V89 image logo is missing or not wired');
    must(!exists('frontend/public/assets/ui/brand/solvox-wordmark-v83.svg') && !exists('frontend/src/components/SolvoxHtmlLogo.jsx') && !exists('frontend/src/styles/solvox-logo-v83.css'), 'Retired V83 logo implementation remains');
must(!exists('frontend/public/assets/ui/brand/solvox-logo.png'), 'Retired image-based Solvox logo remains');
must(!exists('frontend/public/assets/ui/utility/icons/main.png') && !exists('frontend/public/assets/ui/utility/art/main.png'), 'Retired Main utility art remains');
must(main.includes("import './styles/chapter-select-v44.css';") && chapters.includes('chapter-card-v44') && chapterCss.includes('.chapter-card-art-v44'), 'Current chapter art UI is not wired to a dedicated stylesheet');
must(levels.includes("art:'/assets/ui/chapters/chapter-1.png'") && levels.includes("art:'/assets/ui/chapters/chapter-5.png'"), 'Chapter artwork metadata missing');
for (let id = 1; id <= 5; id += 1) must(exists(`frontend/public/assets/ui/chapters/chapter-${id}.png`), `Chapter ${id} artwork asset missing`);
must(
  backgrounds.includes("3: { type:'image'") &&
    backgrounds.includes("/assets/backgrounds/level3/chapter3-battle-4x1.png") &&
    backgrounds.includes("fit:'fill'") &&
    backgrounds.includes("scale:1.0"),
  'Chapter 3 wide battle background is not wired',
);
must(exists('frontend/public/assets/backgrounds/level3/chapter3-battle-4x1.png'), 'Chapter 3 4:1 background asset missing');
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
must(pkg.version === '4.3.0', 'Root package version changed unexpectedly');
must(exists('frontend/src/styles/battle-v43.css'), 'Dedicated Battle stylesheet missing');
must(keypad.includes("'²'") && keypad.includes("'fraction'") && keypad.includes("'a'") && keypad.includes("'z'"), 'Math keypad revision missing');
must(multi.includes('turn:hint') && multi.includes('viewSolution') && multi.includes('tieBreakHintRule'), 'Multiplayer hint support missing');
must(apiServer.includes("socket.on('turn:hint'") && apiServer.includes('hintsUsed') && apiServer.includes('finishSummary'), 'Multiplayer hint/tie-break tracking missing');
must(feedback.includes('PixelIcon'), 'Feedback icon import missing');
must(evaluation.includes('eval-learning-map-v35') && evaluation.includes('evaluationAction'), 'Evaluation learning layer missing');
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
must(responsive93.includes('.battle-reference-arena-v43') && responsive93.includes('clamp(210px,29dvh,270px)') && responsive93.includes('max-width:520px'), 'V93 mobile battle sizing rules are missing');
must(!responsive93.includes('.vs-badge-v43'), 'Responsive stylesheet still references removed VS badge');

must(main.includes("import './styles/ui-v93.css';") && exists('frontend/src/styles/ui-v93.css'), 'V93 visual refinement stylesheet is not wired');
must(exists('frontend/src/styles/responsive-v93.css') && !exists('frontend/src/styles/responsive-v92.css'), 'Responsive source cleanup is incomplete');
must(multi.includes('home-background-v83.mp4') && multi.includes('multi-home-bg-v93'), 'Multiplayer Home background video is not wired');
must(!profile.includes('SolvoxUtilityArt') && !settings.includes('SolvoxUtilityArt'), 'Dashboard/settings utility artwork still overlaps modal headers');
must(settings.includes('settings-head-mark-v93'), 'Settings V93 header is missing');
must(battlePanel.includes('is-story-chapter-v74'), 'Story chapter class is missing');

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
const ui34V62 = read('frontend/src/styles/ui-v34.css');
must(spriteV62.includes('requestAnimationFrame(tick)') && spriteV62.includes('motionX') && spriteV62.includes('drawImage(image'), 'Traveler smoothing layer is missing');
must(!spriteV62.includes('setInterval('), 'Traveler animation regressed to interval-based frame stepping');
must(bossV62.includes('requestAnimationFrame(tick)') && bossV62.includes('asset-boss-canvas-v62') && bossV62.includes('drawImage(image'), 'WebP boss smoothing layer is missing');
must(!bossV62.includes('setInterval('), 'WebP boss animation regressed to interval-based frame stepping');
must(multiV62.includes('mp-damage-pop-v62') && multiV62.includes('mp-attack-flash-v62') && multiV62.includes('data-combat-seq'), 'Multiplayer battle motion hooks are missing');
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
for (const file of ['frontend/src/styles/app.css','frontend/src/styles/ui-v32.css','frontend/src/styles/ui-v34.css','frontend/src/styles/responsive-v93.css']) {
  must(!read(file).includes('multi-toolbar-v25') && !read(file).includes('multi-toolbar-v26'), `Retired multiplayer toolbar CSS remains in ${file}`);
}
must(!exists('frontend/public/assets/ui/brand/solvox-logo-v84.svg') && !exists('frontend/src/styles/solvox-brand-v84.css') && !exists('frontend/src/styles/brand-v83.css'), 'Retired V83/V84 brand assets/styles remain');
must(exists('frontend/public/assets/ui/brand/solvox-logo-v89.png'), 'V89 logo asset is missing');

console.log('V61 QA STATIC + REGRESSION PASS');
console.log('V62 QA MOTION + MULTIPLAYER PASS');
console.log('Home: cinematic overlay, original assets, clean sidebar, brighter background');
console.log('Battle: one dedicated V43 stylesheet, full-width HUD, continuous question/hint/keypad dock, real attack-distance calculation');
console.log('Cleanup: legacy V23/V24 layout roots removed from app/ui-v42, dead Battle helper/prop removed');
console.log('Content: bilingual i18n, profile API, multiplayer hint tracking, Traveler player pack, Wolf + Wraith + Equation Drake WebP boss packs');
