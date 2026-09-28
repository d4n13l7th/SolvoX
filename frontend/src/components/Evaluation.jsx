import React,{useEffect,useMemo} from 'react';
import {classifyMastery,summarizePerformance} from '../services/evaluation';
import { evaluateSolvoxChapter } from '../services/solvoxEvaluation';
import PixelIcon from './PixelIcon';
import {apiUrl} from '../config';

export default function Evaluation({result,onClose,onRematch,onNext,nextLevel,t,lang}){
  const summary=useMemo(()=>summarizePerformance(result),[result]);
  const solvoxEvaluation=useMemo(()=>result.chapterEvaluation || evaluateSolvoxChapter({...result, ...summary}),[result,summary]);
  const cls=classifyMastery(summary.mastery).key;
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
    <div className={`eval-card eval-card-detailed eval-card-v26 ${result.won?'win':'loss'}`}>
      <div className="eval-hero-v26">
        <div className="medal medal-v27"><PixelIcon name={result.won?'trophy':'skull'} size={48}/></div>
        <div className="eyebrow">{t('evaluation')}</div>
        <h2>{statusText}</h2>
        <p>{outcomeNote}</p>
      </div>

      <div className="mastery-score-row"><div className="big-score">{summary.mastery}</div><div><strong>{labels[cls]}</strong><small>{t('masteryFromActualRun')}</small></div></div>

      <div className="metrics metrics-six">
        <span>{t('accuracy')}<b>{summary.accuracy}%</b></span>
        <span>{t('firstAttempt')}<b>{summary.firstAttemptRate}%</b></span>
        <span>{t('time')}<b>{summary.totalTime}s</b></span>
        <span>{t('attempt')}<b>{summary.totalAttempts}</b></span>
        <span>{t('hints')}<b>{summary.hintsUsed}</b></span>
        <span>{t('hpRemaining')}<b>{summary.hpRemaining}/{summary.maxHp}</b></span>
      </div>

      <div className="eval-observations eval-observations-v26">
        <div><span>{t('answered')}</span><b>{summary.answeredQuestions}/{summary.totalQuestions}</b></div>
        <div><span>{t('wrongQuestions')}</span><b>{summary.wrongQuestions}</b></div>
        <div><span>{t('retries')}</span><b>{summary.retryQuestions}</b></div>
        <div><span>{t('damageTaken')}</span><b>{summary.damageTaken} HP</b></div>
        <div><span>{t('avgQuestionTime')}</span><b>{summary.avgTimePerAnsweredQuestion}s</b></div>
        <div><span>{t('completion')}</span><b>{summary.completionRate}%</b></div>
      </div>

      <div className="eval-recommendation-v34 solvox-evaluation-card">
        <div className="eval-recommendation-icon"><PixelIcon name="spark" size={20}/></div>
        <div>
          <span>{solvoxEvaluation.title}</span>
          <strong>{solvoxEvaluation.message}</strong>
          <small>{solvoxEvaluation.source}</small>
        </div>
      </div>

      <div className="eval-recommendation-v34">
        <div className="eval-recommendation-icon"><PixelIcon name={summary.mastery>=70?'spark':'hint'} size={20}/></div>
        <div>
          <span>{t('studyRecommendation')}</span>
          <strong>{summary.weakConcepts.length ? summary.weakConcepts.map(x=>x.concept).join(' • ') : (summary.mastery>=85 ? t('recommendChallenge') : t('recommendReview'))}</strong>
          <small>{summary.hintsUsed>0 ? t('recommendHintIndependence') : t('recommendKeepGoing')}</small>
        </div>
      </div>

      <div className="eval-learning-map-v35">
        <div><span>{t('evaluationEvidence')}</span><strong>{summary.accuracy}% {t('accuracy')} • {summary.firstAttemptRate}% {t('firstAttempt')} • {summary.hintsUsed} {t('hints')}</strong></div>
        <div><span>{t('evaluationAction')}</span><strong>{summary.weakConcepts.length ? t('evaluationActionReview') : (summary.mastery>=85 ? t('evaluationActionChallenge') : t('evaluationActionPractice'))}</strong></div>
        <div><span>{t('evaluationProcess')}</span><strong>{summary.retryQuestions} {t('retries')} • {summary.avgTimePerAnsweredQuestion}s / {t('avgQuestionTime')}</strong></div>
      </div>

      <div className="eval-grid">
        <div><h3>{t('mostMistakes')}</h3>{summary.errorList.length?summary.errorList.map(([key,count])=><p key={key}>• {key} — <b>{count}</b></p>):<p>{t('noMistakes')}</p>}</div>
        <div><h3>{t('possibleForgotten')}</h3>{summary.weakConcepts.length?summary.weakConcepts.map(x=><p key={x.concept}>• {x.concept} — <b>{x.accuracy}%</b>{x.retries?` • ${x.retries} retry`:''}</p>):<p>{t('noForgotten')}</p>}</div>
      </div>

      <div className="question-review">
        <div className="question-review-header-v26"><h3>{t('chapterReport')}</h3><span>{({ 'boss-defeated':t('reasonBossDefeated'), 'chapter-complete':t('reasonChapterComplete'), 'question-failed':t('reasonQuestionFailed'), 'player-defeated':t('reasonPlayerDefeated') }[result.completionReason]) || t('chapterComplete')}</span></div>
        {result.questionLogs?.length ? result.questionLogs.map((x,i)=><div className={`review-row ${x.correct?'ok':'bad'}`} key={`${x.idx}-${i}`}>
          <div><b>{i+1}. {x.concept}</b><small>{x.timeSec}s • {t('attempt')}: {x.attempts} • {t('wrongAttempts')}: {x.wrongAttempts||0} • {t('hints')}: {x.hintsUsed||0}</small><small>{x.answerHistory?.length?`${t('answerHistory')}: ${x.answerHistory.join(' → ')}`:''}</small><small>{t('expected')}: <strong>{x.correctAnswer}</strong></small></div>
          <span className={x.correct?'review-ok-v27':'review-bad-v27'}><PixelIcon name={x.correct?'check':'close'} size={15}/></span>
        </div>) : <div className="empty-review-v26">{t('noQuestionLogs')}</div>}
      </div>

      <p className="eval-note">{t('masteryNote')}</p>
      <div className="eval-actions eval-actions-v26">
        <button className="secondary-btn" onClick={onClose}>{t('backToMap')}</button>
        <button className="secondary-btn rematch-btn-v26" onClick={onRematch}><PixelIcon name="retry" size={15}/><span>{t('rematch')}</span></button>
        {nextLevel&&<button className="primary-btn" onClick={()=>onNext(nextLevel)}>{t('nextChapter')} →</button>}
      </div>
    </div>
  </div>;
}
