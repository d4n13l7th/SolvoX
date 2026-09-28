const QuestionGenerator = require('./question-generator');
const levels = {
  1: { title:'Gerbang Suku Sejenis', titleEn:'Like-Term Gate', icon:'🔢', difficulty:'Pemula', difficultyEn:'Beginner', theme:'algebra' },
  2: { title:'Pabrik Pangkat', titleEn:'Power Factory', icon:'✖️', difficulty:'Menengah', difficultyEn:'Intermediate', theme:'multiply' },
  3: { title:'Ruang Persamaan', titleEn:'Equation Chamber', icon:'gear', difficulty:'Lanjutan', difficultyEn:'Advanced', theme:'equation' },
  4: { title:'Kuil Pecahan', titleEn:'Fraction Temple', icon:'📊', difficulty:'Sulit', difficultyEn:'Advanced', theme:'fraction' },
  5: { title:'Benteng Bayangan — FINAL BOSS', titleEn:'Shadow Fortress — FINAL BOSS', icon:'👑', difficulty:'Boss', difficultyEn:'Boss', theme:'mixed' }
};
function fallbackGenerate(levelId,count=10,lang='id'){const list=QuestionGenerator.generate(Number(levelId),count,lang);if(!list||list.length<count)throw new Error(`Fallback generator failed for chapter ${levelId}`);return list;}
module.exports = Object.assign({}, levels, { fallbackGenerate });
