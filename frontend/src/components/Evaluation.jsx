import React, { useEffect, useMemo, useState } from 'react';
import { classifyMastery, summarizePerformance } from '../services/evaluation';
import { evaluateSolvoxChapter } from '../services/solvoxEvaluation';
import PixelIcon from './PixelIcon';
import {apiJson} from '../services/api';

function buildStrengths(summary, t) {
  const strengths = [];
  if (summary.accuracy >= 85) strengths.push(t('evalStrengthAccuracy'));
  if (summary.firstAttemptRate >= 70) strengths.push(t('evalStrengthFirstTry'));
  if (summary.avgTimePerAnsweredQuestion > 0 && summary.avgTimePerAnsweredQuestion <= 30) strengths.push(t('evalStrengthPace'));
  if (summary.hintsUsed === 0) strengths.push(t('evalStrengthIndependence'));
  if (summary.completionRate >= 90) strengths.push(t('evalStrengthCompletion'));
  if (!strengths.length) strengths.push(t('evalStrengthPersistence'));
  return strengths.slice(0, 3);
}

function buildAdvice(summary, t) {
  const advice = summary.weakConcepts.map(item => `${item.concept} — ${item.accuracy}%`);
  if (!advice.length) advice.push(summary.mastery >= 85 ? t('evalAdviceChallenge') : t('evalAdviceReview'));
  if (summary.hintsUsed >= 2) advice.push(t('evalAdviceHints'));
  if (summary.retryQuestions >= 2) advice.push(t('evalAdviceRetries'));
  return advice.slice(0, 2);
}

export default function Evaluation({ result, onClose, onRematch, onNext, nextLevel, t, lang }) {
  const summary = useMemo(() => summarizePerformance(result), [result]);
  const solvoxEvaluation = useMemo(() => result.chapterEvaluation || evaluateSolvoxChapter({ ...result, ...summary }), [result, summary]);
  const cls = classifyMastery(summary.mastery).key;
  const [expanded, setExpanded] = useState(null);
  const labels = {
    excellent: t('masteryExcellent'),
    good: t('masteryGood'),
    practice: t('masteryPractice'),
    reinforce: t('masteryReinforce'),
  };
  const strengths = useMemo(() => buildStrengths(summary, t), [summary, t]);
  const advice = useMemo(() => buildAdvice(summary, t), [summary, t]);
  const statusText = result.won ? t('levelClear') : t('levelNotCleared');
  const outcomeNote = result.won ? t('evaluationWinNote') : t('evaluationLoseNote');

  useEffect(() => {
    apiJson('/api/evaluation', {
      method: 'POST',
      body: JSON.stringify({
        chapterId: result.chapterId,
        won: !!result.won,
        mastery: summary.mastery,
        performance: summary,
        questionLogs: result.questionLogs || [],
        completionReason: result.completionReason || '',
        ts: Date.now(),
      }),
    }).catch(() => {});
  }, [result, summary]);

  return (
    <div className="modal-backdrop">
      <div className={`eval-card eval-card-detailed eval-card--detailed ${result.won ? 'win' : 'loss'}`}>
        <header className="eval-summary">
          <div className="eval-summary-copy">
            <div className="eyebrow">{t('evaluation')}</div>
            <h2>{statusText}</h2>
            <p>{outcomeNote}</p>
          </div>
          <div className="eval-score">
            <div className="eval-score-number">{summary.mastery}</div>
            <span>{labels[cls]}</span>
            <div className="eval-accuracy-bar" aria-label={`${summary.accuracy}% ${t('accuracy')}`}>
              <i style={{ width: `${summary.accuracy}%` }} />
            </div>
            <small>{summary.accuracy}% {t('accuracy')}</small>
          </div>
        </header>

        <section className="eval-summary-block">
          <div className="eval-section-title"><PixelIcon name="spark" size={16} /><h3>{t('evalStrengthsTitle')}</h3></div>
          <div className="eval-bullets">{strengths.map((text, index) => <p key={`s-${index}`}>• {text}</p>)}</div>
        </section>

        <section className="eval-summary-block">
          <div className="eval-section-title"><PixelIcon name="hint" size={16} /><h3>{t('evalAdviceTitle')}</h3></div>
          <div className="eval-bullets">{advice.map((text, index) => <p key={`a-${index}`}>• {text}</p>)}</div>
        </section>

        <section className="eval-metrics" aria-label={t('evaluationEvidence')}>
          {[
            [t('accuracy'), `${summary.accuracy}%`],
            [t('firstAttempt'), `${summary.firstAttemptRate}%`],
            [t('time'), `${summary.totalTime}s`],
            [t('attempt'), summary.totalAttempts],
            [t('hints'), summary.hintsUsed],
            [t('hpRemaining'), `${summary.hpRemaining}/${summary.maxHp}`],
          ].map(([label, value]) => (
            <div key={label} className="eval-metric"><span>{label}</span><b>{value}</b></div>
          ))}
        </section>

        <section className="eval-recommendation">
          <div className="eval-recommendation-icon"><PixelIcon name="spark" size={18} /></div>
          <div><span>{t('studyRecommendation')}</span><strong>{solvoxEvaluation.title}</strong><p>{solvoxEvaluation.message}</p></div>
        </section>

        <section className="eval-review">
          <div className="eval-review-head">
            <div>
              <div className="eyebrow">{t('chapterReport')}</div>
              <h3>{t('evalDetailsTitle')}</h3>
            </div>
            <span>{summary.answeredQuestions}/{summary.totalQuestions}</span>
          </div>

          <div className="eval-accordion">
            {result.questionLogs?.length ? result.questionLogs.map((item, index) => (
              <details key={`${item.idx}-${index}`} open={expanded === index} onToggle={(event) => setExpanded(event.currentTarget.open ? index : null)} className={`eval-detail ${item.correct ? 'ok' : 'bad'}`}>
                <summary>
                  <span className="eval-detail-status"><PixelIcon name={item.correct ? 'check' : 'close'} size={14} /></span>
                  <div>
                    <b>{t('questionNumber')} {item.questionId ?? index + 1} · {item.concept}</b>
                    <small>{item.timeSec}s • {t('attempt')}: {item.attempts} • {t('hints')}: {item.hintsUsed || 0}</small>
                  </div>
                  <span className="eval-detail-chevron">⌄</span>
                </summary>
                <div className="eval-detail-body">
                  <div className="eval-question-full"><span>{t('question')}</span><p>{item.text}</p></div>
                  <div className="eval-answer-grid">
                    <div><span>{t('yourAnswer')}</span><b>{Array.isArray(item.answer) ? item.answer.join(', ') : item.answer || '—'}</b></div>
                    <div><span>{t('expected')}</span><b>{Array.isArray(item.correctAnswer) ? item.correctAnswer.join(', ') : item.correctAnswer}</b></div>
                  </div>
                  {item.feedback && <div className="eval-feedback"><span>{t('learningFeedback')}</span><p>{item.feedback}</p></div>}
                  {item.explanation && <div className="eval-explanation"><span>{t('explanation')}</span><p>{item.explanation}</p></div>}
                  {item.answerHistory?.length > 1 && <div className="eval-history"><span>{t('answerHistory')}</span><p>{item.answerHistory.join(' → ')}</p></div>}
                </div>
              </details>
            )) : <div className="empty-review">{t('noQuestionLogs')}</div>}
          </div>
        </section>

        <p className="eval-note">{t('masteryNote')}</p>
        <div className="eval-actions">
          <button className="secondary-btn" onClick={onClose}>{t('backToMap')}</button>
          <button className="secondary-btn rematch-btn" onClick={onRematch}><PixelIcon name="retry" size={15} /><span>{t('rematch')}</span></button>
          {nextLevel && <button className="primary-btn" onClick={() => onNext(nextLevel)}>{t('nextChapter')} →</button>}
        </div>
      </div>
    </div>
  );
}
