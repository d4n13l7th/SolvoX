/**
 * Shared game rules for the Solvox Worker + Durable Object.
 *
 * Ported verbatim from backend/server.js so single player, the old Express server
 * and the new Cloudflare runtime all grade answers and shape payloads identically.
 */
import packId from './data/solvoxQuestions.json';
import packEn from './data/solvoxQuestions.en.json';

export const ROOM_GRACE_MS = 30000;
export const TURN_MS = 45000;
export const TOTAL_QUESTIONS = 10;
export const DAMAGE_PER_CORRECT = 20;

export const CHARACTERS = {
  mage: { id: 'mage', name: 'Arcane Mage', icon: 'pixelMage', hp: 100, color: '#8b5cf6' },
  ninja: { id: 'ninja', name: 'Shadow Ninja', icon: 'pixelNinja', hp: 100, color: '#334155' },
  robot: { id: 'robot', name: 'Byte Robot', icon: 'pixelRobot', hp: 100, color: '#06b6d4' },
  elf: { id: 'elf', name: 'Forest Elf', icon: 'pixelElf', hp: 100, color: '#22c55e' },
  hero: { id: 'hero', name: 'Sky Hero', icon: 'pixelHero', hp: 100, color: '#3b82f6' },
  dragon: { id: 'dragon', name: 'Dragon Knight', icon: 'pixelDragon', hp: 100, color: '#ef4444' },
};

export const LEVELS = {
  1: { title: 'Gerbang Suku Sejenis', titleEn: 'Like-Term Gate', icon: '\u{1F522}', difficulty: 'Pemula', difficultyEn: 'Beginner', theme: 'algebra' },
  2: { title: 'Pabrik Pangkat', titleEn: 'Power Factory', icon: '\u2716\uFE0F', difficulty: 'Menengah', difficultyEn: 'Intermediate', theme: 'multiply' },
  3: { title: 'Ruang Persamaan', titleEn: 'Equation Chamber', icon: '\u2699\uFE0F', difficulty: 'Lanjutan', difficultyEn: 'Advanced', theme: 'equation' },
  4: { title: 'Kuil Pecahan', titleEn: 'Fraction Temple', icon: '\uD83D\uDCCA', difficulty: 'Sulit', difficultyEn: 'Advanced', theme: 'fraction' },
  5: { title: 'Benteng Bayangan \u2014 FINAL BOSS', titleEn: 'Shadow Fortress \u2014 FINAL BOSS', icon: '\uD83D\uDC91', difficulty: 'Boss', difficultyEn: 'Boss', theme: 'mixed' },
};

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function cleanName(v, fallback = 'Player') {
  return String(v || fallback).trim().slice(0, 18) || fallback;
}

export function cleanLevel(v) {
  const n = Number(v);
  return LEVELS[n] ? n : 1;
}

export function cleanToken(v) {
  return String(v || '').trim().slice(0, 80);
}

export function normalizeAnswer(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\u00D7/g, '*')
    .replace(/\u2212/g, '-')
    .replace(/\u00B2/g, '^2')
    .replace(/^x=/, '')
    .replace(/^ans(?:wer)?=/, '');
}

export function isCorrect(q, value) {
  const given = normalizeAnswer(value);
  const accepted = (q.acceptedAnswers || [q.answer]).map(normalizeAnswer);
  return accepted.includes(given);
}

export function sanitizeQuestion(q) {
  if (!q) return null;
  return {
    id: q.id,
    context: q.context,
    text: q.text,
    explanation: q.explanation,
    concept: q.concept,
    hints: q.hints || [],
    difficulty: q.difficulty,
  };
}

export function sanitizeReviewQuestion(q) {
  if (!q) return null;
  return {
    id: q.id,
    context: q.context,
    text: q.text,
    answer: q.answer,
    explanation: q.explanation,
    concept: q.concept,
  };
}

export function listLevels() {
  return Object.entries(LEVELS).map(([id, q]) => ({
    id: Number(id),
    title: q.title,
    titleEn: q.titleEn,
    icon: q.icon,
    difficulty: q.difficulty,
    totalQuestions: TOTAL_QUESTIONS,
  }));
}

export function freshQuestions(levelId, lang) {
  const chapterId = Number(levelId);
  const pack = lang === 'en' ? packEn : packId;
  const pool = pack.filter((question) => question.chapterId === chapterId);
  const questions = shuffle(pool).slice(0, Math.min(TOTAL_QUESTIONS, pool.length));
  if (!questions.length) throw new Error(`Fallback generator failed for chapter ${chapterId}`);
  return { questions, source: 'local' };
}
