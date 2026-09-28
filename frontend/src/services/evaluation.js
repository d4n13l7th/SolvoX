const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

export function normalizeTimeEfficiency(seconds, target = 55){
  const sec = Math.max(0, Number(seconds) || 0);
  if (sec <= target) return 100;
  return clamp(100 - ((sec - target) * 1.1));
}

export function summarizePerformance(result = {}){
  const logs = Array.isArray(result.questionLogs) ? result.questionLogs : [];
  const totalQuestions = Math.max(1, Number(result.totalQuestions) || logs.length || 10);
  const bossHpRemaining = Math.max(0, Number(result.nextEnemyHp) || 0);
  const outcome = result.won ? 'won' : (Number(result.nextHp ?? 0) <= 0 ? 'player-defeated' : (result.completionReason || 'unfinished'));
  const answeredQuestions = logs.length;
  const correctQuestions = logs.filter(item => item.correct).length;
  const wrongQuestions = logs.filter(item => !item.correct).length;
  const firstAttemptCorrect = logs.filter(item => item.correct && !(Number(item.wrongAttempts) > 0)).length;
  const retryQuestions = logs.filter(item => Number(item.wrongAttempts) > 0).length;
  const hintsUsed = logs.reduce((sum, item) => sum + (Number(item.hintsUsed) || 0), 0);
  const totalAttempts = logs.reduce((sum, item) => sum + Math.max(1, Number(item.attempts) || 1), 0);
  const totalTime = Math.max(0, Number(result.timeSec) || logs.reduce((sum, item) => sum + (Number(item.timeSec) || 0), 0));
  const accuracy = totalQuestions ? Math.round(correctQuestions / totalQuestions * 100) : 0;
  const firstAttemptRate = answeredQuestions ? Math.round(firstAttemptCorrect / answeredQuestions * 100) : 0;
  const retryRate = answeredQuestions ? Math.round(retryQuestions / answeredQuestions * 100) : 0;
  const avgTimePerAnsweredQuestion = answeredQuestions ? Math.round((logs.reduce((sum, item) => sum + (Number(item.timeSec) || 0), 0) / answeredQuestions) * 10) / 10 : 0;
  const maxHp = Math.max(1, Number(result.maxHp) || 100);
  const hpRemaining = Math.max(0, Number(result.nextHp ?? maxHp));
  const damageTaken = Math.max(0, maxHp - hpRemaining);
  const completionRate = totalQuestions ? Math.round(answeredQuestions / totalQuestions * 100) : 0;
  const timeEfficiency = normalizeTimeEfficiency(avgTimePerAnsweredQuestion || totalTime / Math.max(1, answeredQuestions));
  const hintEfficiency = clamp(100 - hintsUsed * 15);
  const retryEfficiency = clamp(100 - retryQuestions * 8);
  const consistency = answeredQuestions ? Math.round(((correctQuestions + firstAttemptCorrect) / (answeredQuestions * 2)) * 100) : 0;
  const cts = Math.round((firstAttemptRate * .55) + (consistency * .45));
  const mastery = Math.round(
    clamp(accuracy) * .40 +
    clamp(firstAttemptRate) * .15 +
    clamp(timeEfficiency) * .15 +
    clamp(retryEfficiency) * .10 +
    clamp(hintEfficiency) * .10 +
    clamp(cts) * .10
  );

  const conceptStats = {};
  const errorStats = {};
  logs.forEach(item => {
    const concept = item.concept || '—';
    const errorTag = item.errorTag || '—';
    if (!conceptStats[concept]) conceptStats[concept] = { concept, answered: 0, correct: 0, wrong: 0, retries: 0 };
    conceptStats[concept].answered += 1;
    conceptStats[concept].correct += item.correct ? 1 : 0;
    conceptStats[concept].wrong += item.correct ? 0 : 1;
    conceptStats[concept].retries += Number(item.wrongAttempts) || 0;
    if (!errorStats[errorTag]) errorStats[errorTag] = 0;
    if (item.wrongAttempts || !item.correct) errorStats[errorTag] += Math.max(1, Number(item.wrongAttempts) || 0);
  });

  const conceptList = Object.values(conceptStats)
    .map(item => ({...item, accuracy: item.answered ? Math.round(item.correct / item.answered * 100) : 0}))
    .sort((a,b) => (a.accuracy - b.accuracy) || (b.retries - a.retries));
  const weakConcepts = conceptList.filter(item => item.accuracy < 70 || item.retries > 0).slice(0, 3);
  const errorList = Object.entries(errorStats).filter(([,count]) => count > 0).sort((a,b) => b[1] - a[1]).slice(0, 3);

  return {
    totalQuestions,
    answeredQuestions,
    unansweredQuestions: Math.max(0, totalQuestions - answeredQuestions),
    correctQuestions,
    wrongQuestions,
    accuracy,
    firstAttemptCorrect,
    firstAttemptRate,
    retryQuestions,
    retryRate,
    hintsUsed,
    totalAttempts,
    totalTime,
    avgTimePerAnsweredQuestion,
    completionRate,
    maxHp,
    hpRemaining,
    damageTaken,
    timeEfficiency: Math.round(timeEfficiency),
    hintEfficiency: Math.round(hintEfficiency),
    retryEfficiency: Math.round(retryEfficiency),
    cts,
    mastery,
    conceptList,
    weakConcepts,
    errorList,
    bossHpRemaining,
    outcome,
    completionReason: result.completionReason || outcome
  };
}

export function computeMastery(input){
  if (input && input.totalQuestions !== undefined && input.questionLogs) return summarizePerformance(input).mastery;
  const accuracy = clamp(input?.accuracy);
  const timeEfficiency = clamp(input?.timeEfficiency);
  const retries = Math.max(0, Number(input?.retries) || 0);
  const hints = Math.max(0, Number(input?.hints) || 0);
  const cts = clamp(input?.cts ?? 75);
  return Math.round(accuracy * .40 + timeEfficiency * .20 + clamp(100 - retries * 10) * .15 + clamp(100 - hints * 20) * .15 + cts * .10);
}

export function classifyMastery(m){
  if(m>=85) return {key:'excellent',tone:'great'};
  if(m>=70) return {key:'good',tone:'good'};
  if(m>=50) return {key:'practice',tone:'warn'};
  return {key:'reinforce',tone:'danger'};
}
