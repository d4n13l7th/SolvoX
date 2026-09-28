/**
 * Question source facade. The old random generator has been removed; every
 * chapter now uses the fixed SOLVOX pack supplied for the game.
 */
import { SOLVOX_QUESTIONS, SOLVOX_TOTAL_QUESTIONS, getSolvoxQuestions } from './solvoxQuestions';
import { SOLVOX_QUESTIONS_EN } from './solvoxQuestions.en';

export function generateQuestions(levelId, count = 10, _lang = 'id') {
  return getSolvoxQuestions(levelId, count, _lang);
}

export const SAFE_QUESTION = {
  id: SOLVOX_QUESTIONS[0],
  en: { ...SOLVOX_QUESTIONS[0], ...SOLVOX_QUESTIONS_EN[1], originalId: SOLVOX_QUESTIONS[0].id, source: SOLVOX_QUESTIONS[0].source },
};

export { SOLVOX_QUESTIONS, SOLVOX_TOTAL_QUESTIONS };
