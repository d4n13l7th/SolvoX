/**
 * SOLVOX-backed question generator for multiplayer/server consumers.
 * The pool is fixed to the same 50 source questions used by Single Player.
 */
const packId = require('./solvoxQuestions.json');
const packEn = require('./solvoxQuestions.en.json');

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generate(levelId, count = 10, lang = 'id') {
  const chapterId = Number(levelId);
  const size = Math.max(1, Number(count) || 10);
  const pack = lang === 'en' ? packEn : packId;
  const chapterQuestions = pack.filter((question) => question.chapterId === chapterId);
  return shuffle(chapterQuestions).slice(0, Math.min(size, chapterQuestions.length));
}

module.exports = { generate };
