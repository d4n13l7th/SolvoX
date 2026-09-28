export const LEVELS = [
  { id:1, chapter:'CHAPTER 1', chapterEn:'CHAPTER 1', title:'Gerbang Suku Sejenis', titleEn:'Like-Term Gate', difficulty:'Pemula', difficultyEn:'Beginner', theme:'algebra', accent:'#4de7ff', art:'/assets/ui/chapters/chapter-1.png' },
  { id:2, chapter:'CHAPTER 2', chapterEn:'CHAPTER 2', title:'Pabrik Pangkat', titleEn:'Power Factory', difficulty:'Menengah', difficultyEn:'Intermediate', theme:'multiply', accent:'#8b7cff', art:'/assets/ui/chapters/chapter-2.png' },
  { id:3, chapter:'CHAPTER 3', chapterEn:'CHAPTER 3', title:'Ruang Persamaan', titleEn:'Equation Chamber', difficulty:'Lanjutan', difficultyEn:'Advanced', theme:'equation', accent:'#ffb86b', art:'/assets/ui/chapters/chapter-3.png' },
  { id:4, chapter:'CHAPTER 4', chapterEn:'CHAPTER 4', title:'Kuil Pecahan', titleEn:'Fraction Temple', difficulty:'Sulit', difficultyEn:'Advanced', theme:'fraction', accent:'#ff7bcb', art:'/assets/ui/chapters/chapter-4.png' },
  { id:5, chapter:'CHAPTER 5', chapterEn:'CHAPTER 5', title:'Benteng Bayangan — FINAL BOSS', titleEn:'Shadow Fortress — FINAL BOSS', difficulty:'Boss', difficultyEn:'Boss', theme:'mixed', accent:'#b55cff', art:'/assets/ui/chapters/chapter-5.png' }
];
export function isUnlocked(progress, levelId){ const p = new Set((progress?.completedLevels||[]).map(Number)); return levelId===1 || p.has(levelId-1); }
