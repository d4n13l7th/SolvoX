import React,{useEffect,useMemo,useState} from 'react';
import {classifyMastery,summarizePerformance} from '../services/evaluation';
import { evaluateSolvoxChapter } from '../services/solvoxEvaluation';
import PixelIcon from './PixelIcon';
import {apiUrl} from '../config';

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

// The adaptive next step. This was part of the V35 learning map; the V105
// restructure dropped it, which silently removed the one line that told the
// player what to actually DO next. Kept as its own row so the guidance stays
// visible next to the advice bullets.
function buildNextAction(summary, t) {
  if (summary.weakConcepts.length) return t('evaluationActionReview');
  return summary.mastery >= 85 ? t('evaluationActionChallenge') : t('evaluationActionPractice');
}

export default function Evaluation({result,onClose,onRematch,onNext,nextLevel,t,lang}){
  const summary=useMemo(()=>summarizePerformance(result),[result]);
  const solvoxEvaluation=useMemo(()=>result.chapterEvaluation || evaluateSolvoxChapter({...result, ...summary}),[result,summary]);
  const cls=classifyMastery(summary.mastery).key;
  const [expanded,setExpanded]=useState(null);
  const strengths=useMemo(()=>buildStrengths(summary,t),[summary,t]);
  const advice=useMemo(()=>buildAdvice(summary,t),[summary,t]);
  const nextAction=useMemo(()=>buildNextAction(summary,t),[summary,t]);
  useEffect(()=>{
    fetch(apiUrl('/api/evaluation'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      chapterId:result.chapterId,
      won:!!result.won,
      mastery:summary.mastery,
      performance:summary,
      questionLogs:result.questionLogs||[],
      completionReason:result.completionReason||'',
      ts:Date.now()
    })}).catch(()=>{});
  },[result,summary]);
  const labels={excellent:t('masteryExcellent'),good:t('masteryGood'),practice:t('masteryPractice'),reinforce:t('masteryReinforce')};
  const statusText=result.won?t('levelClear'):t('levelNotCleared');
  const outcomeNote=result.won?t('evaluationWinNote'):t('evaluationLoseNote');
  return <div className="modal-backdrop modal-backdrop-v26">
    <div className={`eval-card eval-card-detailed eval-card-v26 eval-card-v105 ${result.won?'win':'loss'}`}>
      <header className="eval-summary-v105">
        <div className="eval-summary-copy-v105">
          <div className="eyebrow">{t('evaluation')}</div>
          <h2>{statusText}</h2>
          <p>{outcomeNote}</p>
        </div>
        <div className="eval-score-v105">
          <div className="eval-score-number-v105">{summary.mastery}</div>
          <span>{labels[cls]}</span>
          <div className="eval-accuracy-bar-v105" aria-label={`${summary.accuracy}% ${t('accuracy')}`}><i style={{width:`${summary.accuracy}%`}}/></div>
          <small>{summary.accuracy}% {t('accuracy')}</small>
        </div>
      </header>

      <section className="eval-summary-block-v105">
        <div className="eval-section-title-v105"><PixelIcon name="spark" size={16}/><h3>{t('evalStrengthsTitle')}</h3></div>
        <div className="eval-bullets-v105">{strengths.map((text,index)=><p key={`s-${index}`}>• {text}</p>)}</div>
      </section>

      <section className="eval-summary-block-v105">
        <div className="eval-section-title-v105"><PixelIcon name="hint" size={16}/><h3>{t('evalAdviceTitle')}</h3></div>
        <div className="eval-next-action-v105">
          <span>{t('evaluationAction')}</span>
          <strong>{nextAction}</strong>
        </div>
        <div className="eval-bullets-v105">{advice.map((text,index)=><p key={`a-${index}`}>• {text}</p>)}</div>
      </section>

      <section className="eval-metrics-v105" aria-label={t('evaluationEvidence')}>
        {[
          [t('accuracy'),`${summary.accuracy}%`],
          [t('firstAttempt'),`${summary.firstAttemptRate}%`],
          [t('time'),`${summary.totalTime}s`],
          [t('avgQuestionTime'),`${summary.avgTimePerAnsweredQuestion}s`],
          [t('attempt'),summary.totalAttempts],
          [t('retries'),summary.retryQuestions],
          [t('hints'),summary.hintsUsed],
          [t('hpRemaining'),`${summary.hpRemaining}/${summary.maxHp}`],
        ].map(([label,value])=><div key={label} className="eval-metric-v105"><span>{label}</span><b>{value}</b></div>)}
      </section>

      <section className="eval-recommendation-v105">
        <div className="eval-recommendation-icon"><PixelIcon name="spark" size={18}/></div>
        <div><span>{t('studyRecommendation')}</span><strong>{solvoxEvaluation.title}</strong><p>{solvoxEvaluation.message}</p></div>
      </section>

      <section className="eval-review-v105">
        <div className="eval-review-head-v105">
          <div>
            <div className="eyebrow">{t('chapterReport')}</div>
            <h3>{t('evalDetailsTitle')}</h3>
          </div>
          <span>{summary.answeredQuestions}/{summary.totalQuestions}</span>
        </div>

        <div className="eval-accordion-v105">
          {result.questionLogs?.length ? result.questionLogs.map((item,index)=>(
            <details key={`${item.idx}-${index}`} open={expanded===index} onToggle={event=>setExpanded(event.currentTarget.open?index:null)} className={`eval-detail-v105 ${item.correct?'ok':'bad'}`}>
              <summary>
                <span className="eval-detail-status-v105"><PixelIcon name={item.correct?'check':'close'} size={14}/></span>
                <div>
                  <b>{t('questionNumber')} {item.questionId ?? index+1} · {item.concept}</b>
                  <small>{item.timeSec}s • {t('attempt')}: {item.attempts} • {t('hints')}: {item.hintsUsed||0}</small>
                </div>
                <span className="eval-detail-chevron-v105">⌄</span>
              </summary>
              <div className="eval-detail-body-v105">
                <div className="eval-question-full-v105"><span>{t('question')}</span><p>{item.text}</p></div>
                <div className="eval-answer-grid-v105">
                  <div><span>{t('yourAnswer')}</span><b>{Array.isArray(item.answer)?item.answer.join(', '):item.answer||'—'}</b></div>
                  <div><span>{t('expected')}</span><b>{Array.isArray(item.correctAnswer)?item.correctAnswer.join(', '):item.correctAnswer}</b></div>
                </div>
                {item.feedback&&<div className="eval-feedback-v105"><span>{t('learningFeedback')}</span><p>{item.feedback}</p></div>}
                {item.explanation&&<div className="eval-explanation-v105"><span>{t('explanation')}</span><p>{item.explanation}</p></div>}
                {item.answerHistory?.length>1&&<div className="eval-history-v105"><span>{t('answerHistory')}</span><p>{item.answerHistory.join(' → ')}</p></div>}
              </div>
            </details>
          )) : <div className="empty-review-v26">{t('noQuestionLogs')}</div>}
        </div>
      </section>

      <p className="eval-note">{t('masteryNote')}</p>
      <div className="eval-actions eval-actions-v26">
        <button className="secondary-btn" onClick={onClose}>{t('backToMap')}</button>
        <button className="secondary-btn rematch-btn-v26" onClick={onRematch}><PixelIcon name="retry" size={15}/><span>{t('rematch')}</span></button>
        {nextLevel&&<button className="primary-btn" onClick={()=>onNext(nextLevel)}>{t('nextChapter')} →</button>}
      </div>
    </div>
  </div>;
}
