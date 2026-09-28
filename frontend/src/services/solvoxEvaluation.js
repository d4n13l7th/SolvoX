/**
 * SOLVOX chapter evaluation rules.
 *
 * These messages are intentionally kept close to the source document so the
 * chapter report remains traceable to the supplied evaluation framework.
 */
const SIGN_SWITCH = [3, 4, 8, 9, 10];
const INVERSE_OPERATION = [13, 14, 15, 19];
const SIGN_RULES = [12, 16, 19, 20];
const ORDER_OF_OPERATIONS = [21, 22, 23, 25, 26, 27, 28];
const DISTRIBUTIVE = [24, 29, 30];
const GROUPING = [31, 32, 33, 34, 35, 36, 38, 40];
const MINUS_PARENTHESES = [39];
const FRACTION_CONFUSION = [37];
const CONTEXT_OVERLOAD = [41, 43, 47];
const SPECIAL_FORMULA = [44, 49];

const CHAPTER_RULES = {
  1: {
    title: 'Penjumlahan dan Pengurangan',
    master: 'Luar biasa! Kamu sudah sangat menguasai konsep dasar perpindahan ruas untuk operasi penjumlahan dan pengurangan. Kamu siap melaju ke babak berikutnya tanpa hambatan!',
    signSwitch: 'Kamu masih sering tertukar tanda saat memindahkan angka melewati tanda sama dengan (=). Ingat aturan emas: Positif (+) berpindah menjadi Negatif (-), dan Negatif (-) berpindah menjadi Positif (+).',
    hintDependence: 'Hasilmu bagus, tetapi kamu masih ragu-ragu menentukan langkah pertama. Coba latih kepercayaan dirimu untuk langsung mengisolasi variabel di ruas kiri sebelum membuka Hint!',
    remedial: 'Kamu masih kesulitan memisahkan angka dari variabel. Disarankan untuk mengulang Level 1-1 sampai 1-5 dan perhatikan baik-baik perubahan tanda pada kartu petunjuk!',
  },
  2: {
    title: 'Perkalian dan Pembagian',
    master: 'Sempurna! Kamu memahami bahwa koefisien variabel bertindak sebagai pengali atau pembagi. Manipulasi aljabarmu sangat tajam!',
    inverse: 'Perhatikan bentuk perkalian dan pembagian! Jika variabel dibagi oleh suatu angka (misal x/a), maka untuk memindahkannya kamu harus mengalikannya, bukan menguranginya.',
    signs: 'Perhitungannya sudah hampir benar, tapi tandanya keliru! Ingat: Pembagian/perkalian dengan tanda sama menghasilkan positif (+ × + = +, - × - = +), sedangkan tanda berbeda menghasilkan negatif (+ × - = -, - × + = -).',
    remedial: 'Kamu perlu melatih kembali konsep perkalian/pembagian aljabar. Coba ingat kembali bahwa 4x artinya 4 × x, sehingga untuk mencari x angkanya harus dibagi!',
  },
  3: {
    title: 'Operasi Campuran',
    master: 'Hebat! Kamu paham urutan pemindahan aljabar: hilangkan konstanta (penjumlahan/pengurangan) terlebih dahulu, baru selesaikan koefisien (perkalian/pembagian)!',
    order: 'Urutan langkahmu kurang tepat! Aturan Operasi Campuran: Selesaikan penjumlahan/pengurangan di luar kurung terlebih dahulu, baru lakukan perkalian/pembagian untuk melepaskan variabel.',
    distributive: 'Hati-hati saat membuka tanda kurung! Angka di depan kurung harus dikalikan ke semua suku di dalam kurung. Contoh: -2(x + 3) menjadi -2x - 6 (bukan +6).',
    pacing: 'Logika aljabarmu sudah benar, tetapi kamu masih membutuhkan waktu lama untuk menyederhanakan persamaan. Yuk, latihan lagi agar refleks aljabarmu makin cepat!',
  },
  4: {
    title: 'Variabel di Kedua Ruas',
    master: 'Luar biasa! Kamu sudah menguasai konsep keseimbangan dua ruas. Kemampuan analisis aljabarmu berada di tingkat mahir!',
    grouping: 'Ingat, kamu hanya bisa mengoperasikan suku sejenis! Kumpulkan semua yang punya variabel x di ruas kiri, dan semua angka tanpa x di ruas kanan sebelum dihitung.',
    minusParentheses: 'Waspada dengan tanda negatif di depan kurung! Tanda minus sebelum kurung akan membalikkan semua tanda suku di dalam kurung: -(2x + 5) berubah menjadi -2x - 5.',
    fractions: 'Saat menghadapi variabel berbentuk pecahan di kedua ruas, samakan penyebutnya terlebih dahulu sebelum dikurangkan, atau kalikan seluruh ruas dengan KPK penyebutnya!',
  },
  5: {
    title: 'Soal Cerita Etnomatematika',
    master: 'Selamat! Kamu tidak hanya jago aljabar, tapi juga bijak memahami penerapan matematika dalam budaya Nusantara! Kamu adalah Pendekar Matematika Sejati!',
    modeling: 'Kemampuan aljabarmu bagus, tapi kamu perlu mengasah pemodelan soal cerita. Tentukan dulu apa yang menjadi variabel x (hal yang ditanyakan), lalu susun persamaannya kalimat demi kalimat!',
    context: 'Jangan fokus pada panjang cerita indahnya, fokuslah pada hubungan angka-angkanya! Cari kata kunci seperti \'lebih mahal\' (+), \'potongan/diskon\' (-), \'dua kali\' (2x), atau \'diberikan\' (-/+).',
    special: 'Ingat kembali rumus dasar pendukungnya! Untuk keliling persegipanjang rumusnya adalah 2(p+l), dan untuk piring cadangan gabungkan pecahan 1/4 x + x = 5/4 x.',
  },
};


const CHAPTER_RULES_EN = {
  1: {
    title: 'Addition and Subtraction',
    master: 'Excellent! You have mastered the basic concept of moving terms across the equals sign for addition and subtraction. You are ready for the next stage!',
    signSwitch: 'You still mix up signs when moving numbers across the equals sign (=). Remember: Positive (+) becomes Negative (-), and Negative (-) becomes Positive (+).',
    hintDependence: 'Your result is strong, but you still hesitate on the first step. Practice isolating the variable on the left before opening a hint.',
    remedial: 'You are still having trouble separating constants from variables. Review Chapter 1 and watch the sign changes in each hint.',
  },
  2: {
    title: 'Multiplication and Division',
    master: 'Perfect! You understand that a variable coefficient acts as a multiplier or divisor. Your algebra manipulation is sharp!',
    inverse: 'Watch the multiplication and division forms. If a variable is divided by a number (for example x/a), moving it requires multiplication, not subtraction.',
    signs: 'Your calculation is close, but the sign is wrong. Remember: matching signs give a positive result, while different signs give a negative result.',
    remedial: 'Practice algebraic multiplication and division again. Remember that 4x means 4 × x, so finding x requires division.',
  },
  3: {
    title: 'Mixed Operations',
    master: 'Great job! You understand the algebra sequence: remove constants with addition/subtraction first, then solve the coefficient with multiplication/division.',
    order: 'Your step order needs attention. Solve addition/subtraction around the variable first, then use multiplication/division to isolate it.',
    distributive: 'Be careful when opening parentheses! The number in front must be multiplied by every term inside. Example: -2(x + 3) becomes -2x - 6.',
    pacing: 'Your algebra logic is on track, but simplifying still takes time. Practice a few more rounds to build faster algebraic reflexes.',
  },
  4: {
    title: 'Variables on Both Sides',
    master: 'Excellent! You have mastered the balance between both sides of an equation. Your algebra analysis is at an advanced level!',
    grouping: 'Remember to combine like terms only. Put all x-terms on one side and constants on the other before calculating.',
    minusParentheses: 'Watch the negative sign before parentheses. A minus sign flips every sign inside: -(2x + 5) becomes -2x - 5.',
    fractions: 'When variables appear as fractions on both sides, use a common denominator first or multiply the whole equation by the least common multiple.',
  },
  5: {
    title: 'Ethnomathematics Story Problems',
    master: 'Congratulations! You not only understand algebra, but also how mathematics applies to cultural contexts across the Indonesian archipelago. You are a true Math Champion!',
    modeling: 'Your algebra is good, but strengthen your story-problem modeling. First identify what x represents, then build the equation step by step.',
    context: 'Do not get distracted by the length of the story. Focus on the relationships between the numbers. Look for clues such as “more expensive,” “discount,” “twice,” or “given away.”',
    special: 'Review the supporting formulas. For a rectangle, the perimeter formula is 2(p+l), and for the spare-plate problem combine 1/4x + x = 5/4x.',
  },
};

const idsOf = (logs, predicate) => logs.filter(predicate).map((log) => Number(log.questionId ?? log.idx + 1));
const hits = (ids, set) => ids.some((id) => set.includes(id));

export function evaluateSolvoxChapter(result = {}) {
  const chapterId = Number(result.chapterId);
  const lang = result.lang === 'en' ? 'en' : 'id';
  const rules = (lang === 'en' ? CHAPTER_RULES_EN : CHAPTER_RULES)[chapterId];
  if (!rules) return { category: 'unknown', title: '', message: '', source: 'EVALUASI SOAL SOLVOX.docx' };

  const logs = Array.isArray(result.questionLogs) ? result.questionLogs : [];
  const total = Math.max(1, Number(result.totalQuestions) || 10);
  const answered = logs.length;
  const correct = logs.filter((item) => item.correct).length;
  const accuracy = Math.round((correct / total) * 100);
  const hintsUsed = logs.reduce((sum, item) => sum + (Number(item.hintsUsed) || 0), 0);
  const avgTime = answered ? logs.reduce((sum, item) => sum + (Number(item.timeSec) || 0), 0) / answered : 0;
  const wrongIds = idsOf(logs, (item) => !item.correct);
  const hintHeavyRatio = logs.length ? logs.filter((item) => Number(item.hintsUsed) >= 2).length / logs.length : 0;
  const accuracyHigh = accuracy >= 70;

  if ((chapterId === 1 && accuracy === 100 && hintsUsed === 0) ||
      (chapterId === 2 && accuracy === 100 && hintsUsed === 0 && avgTime <= 15) ||
      (chapterId === 3 && accuracy === 100 && !hits(wrongIds, ORDER_OF_OPERATIONS.concat(DISTRIBUTIVE))) ||
      (chapterId === 4 && accuracy === 100) ||
      (chapterId === 5 && accuracy === 100)) {
    return { category: 'master', title: 'Master', message: rules.master, source: 'EVALUASI SOAL SOLVOX.docx' };
  }

  if (chapterId === 1 && hits(wrongIds, SIGN_SWITCH)) {
    return { category: 'sign-switch', title: 'Misconception: Sign Switch', message: rules.signSwitch, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (chapterId === 2 && hits(wrongIds, INVERSE_OPERATION)) {
    return { category: 'inverse-operation', title: 'Misconception: Inverse Operation', message: rules.inverse, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (chapterId === 2 && hits(wrongIds, SIGN_RULES)) {
    return { category: 'sign-rules', title: 'Sign Rules Error', message: rules.signs, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (chapterId === 3 && hits(wrongIds, ORDER_OF_OPERATIONS)) {
    return { category: 'order-of-operations', title: 'Misconception: Order of Operations', message: rules.order, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (chapterId === 3 && hits(wrongIds, DISTRIBUTIVE)) {
    return { category: 'distributive-property', title: 'Distributive Property Error', message: rules.distributive, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (chapterId === 4 && hits(wrongIds, MINUS_PARENTHESES)) {
    return { category: 'minus-parentheses', title: 'Minus-Parentheses Mistake', message: rules.minusParentheses, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (chapterId === 4 && hits(wrongIds, FRACTION_CONFUSION)) {
    return { category: 'fraction-confusion', title: 'Fraction Confusion', message: rules.fractions, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (chapterId === 4 && hits(wrongIds, GROUPING)) {
    return { category: 'grouping-like-terms', title: 'Grouping Like Terms', message: rules.grouping, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (chapterId === 5 && hits(wrongIds, SPECIAL_FORMULA)) {
    return { category: 'special-formula', title: 'Special Formula Error', message: rules.special, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (chapterId === 5 && hits(wrongIds, CONTEXT_OVERLOAD)) {
    return { category: 'context-overload', title: 'Context Overload', message: rules.context, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (chapterId === 5 && accuracy < 80) {
    return { category: 'mathematical-modeling', title: 'Mathematical Modeling', message: rules.modeling, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (chapterId === 3 && accuracy >= 70 && avgTime >= 45 && hintsUsed > 0) {
    return { category: 'pacing', title: 'Pacing Issue', message: rules.pacing, source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (accuracyHigh && hintHeavyRatio >= 0.5) {
    return { category: 'hint-dependence', title: 'Over-reliance on Scaffolding', message: rules.hintDependence || (lang === 'en' ? 'Use hints only when needed so your first step becomes more independent.' : 'Gunakan Hint secukupnya agar langkah pertama semakin mandiri.'), source: 'EVALUASI SOAL SOLVOX.docx' };
  }
  if (accuracy < 60 && logs.some((item) => Number(item.hintsUsed) >= 3 || Number(item.hintsUsed) >= 2)) {
    return { category: 'remedial', title: 'Need Remedial', message: rules.remedial || (lang === 'en' ? 'Review this chapter and pay attention to the sign changes in the hints.' : 'Ulangi bab ini dan perhatikan perubahan tanda pada kartu petunjuk.'), source: 'EVALUASI SOAL SOLVOX.docx' };
  }

  return {
    category: result.won ? 'progress' : 'review',
    title: result.won ? 'Keep Building' : 'Need Review',
    message: result.won ? (lang === 'en' ? 'Use the error patterns you found to strengthen your next steps.' : 'Gunakan pola kesalahan yang muncul untuk memperkuat langkah berikutnya.') : (lang === 'en' ? 'Review the questions you missed and use the per-question feedback before playing again.' : 'Review kembali soal yang salah dan manfaatkan feedback per-soal sebelum bertanding lagi.'),
    source: 'EVALUASI SOAL SOLVOX.docx'
  };
}

export { CHAPTER_RULES };
