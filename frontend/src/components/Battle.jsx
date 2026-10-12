import { getPlayerAsset } from '../data/playerAssets';
import React, { useEffect, useRef, useState } from 'react';
import ArenaBackground from './ArenaBackground';
import BattleQuestionPanel from './BattleQuestionPanel';
import CombatStage from './CombatStage';
import HitEffect from './HitEffect';
import { generateQuestions, SAFE_QUESTION } from '../data/questions';
import { evaluateSolvoxChapter } from '../services/solvoxEvaluation';
import { LEVELS } from '../data/levels';
import { PLAYER } from '../data/player';
import { getBoss } from '../data/bosses';
import { getBossImpactMs, getBossPreviewSrc, getBossSequenceDurationMs } from '../data/bossAssets';
import PixelIcon from './PixelIcon';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';
import { playSound } from '../services/sound';
import { findFeedbackBankMatch, getFeedbackFallback } from '../data/feedbackBank';
import { singlePlayerSaves } from '../services/singlePlayerSaves';

/**
 * Normalise algebra answers so keyboard symbols and typed Unicode variants
 * compare consistently before the battle engine resolves an attempt.
 */
const normalizeAnswer = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/×/g, '*')
    .replace(/·/g, '*')
    .replace(/−|–|—/g, '-')
    .replace(/[²]/g, '^2')
    .replace(/[³]/g, '^3')
    .replace(/\s+/g, '')
    .trim();

export default function Battle({ levelId, playerId = 'traveler', saveId = '', lang, t, onComplete, onSaveUpdated, onBack }) {
  const boss = getBoss(levelId);
  const bossAttackImpactMs = getBossImpactMs(boss.spriteId, 'attack', 360);
  const bossDieDurationMs = getBossSequenceDurationMs(boss.spriteId, 'die');
  const playerAsset = getPlayerAsset(playerId);
  const playerDieDurationMs = (playerAsset.sequences.die?.frames?.length || 1) * (playerAsset.sequences.die?.step || 175);
  const meta = LEVELS.find((entry) => entry.id === levelId) || LEVELS[0];

  /* ----------------------------- Battle state ----------------------------- */
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [hp, setHp] = useState(PLAYER.stats.hp);
  const [enemyHp, setEnemyHp] = useState(boss.hp);
    const [currentHints, setCurrentHints] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [round, setRound] = useState(1);
  const [impact, setImpact] = useState(null);
  const [impactAmount, setImpactAmount] = useState(0);
  const [impactTheme, setImpactTheme] = useState('player');
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [startedAt, setStartedAt] = useState(Date.now());
  const [questionLogs, setQuestionLogs] = useState([]);
  const [keypadVisible, setKeypadVisible] = useState(() => {
    const value = localStorage.getItem('solvox.keypad');
    const legacy = localStorage.getItem('numericore.keypad');
    return value !== null
      ? value !== '0'
      : legacy !== null
        ? legacy !== '0'
        : localStorage.getItem('aljabarmaster.keypad') !== '0';
  });

  const combatRef = useRef(null);
  const endedRef = useRef(false);
  const timersRef = useRef(new Set());
  const questionAttemptRef = useRef({
    wrongAttempts: 0,
    answers: [],
    feedbackBankHistory: [],
    startedAt: Date.now(),
  });

  /* ----------------------------- Small helpers ---------------------------- */
  const later = (callback, delay) => {
    const timerId = window.setTimeout(() => {
      timersRef.current.delete(timerId);
      callback();
    }, delay);

    timersRef.current.add(timerId);
    return timerId;
  };

  const finish = (result) => {
    if (endedRef.current) return;

    endedRef.current = true;
    const completion={
      ...result,
      chapterId: levelId,
      questionLogs: result.questionLogs || questionLogs,
      questionSource: 'local',
      totalQuestions: questions.length || 10,
      maxHp: PLAYER.stats.hp,
      playerCharacter: playerAsset.id,
      nextHp: result.nextHp ?? hp,
    };
    if(saveId){
      const clientRunId=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;
      singlePlayerSaves.finishRun(saveId,levelId,{
        outcome:completion.won?'win':'lose',clientRunId,correct:completion.correct,
        answered:completion.questionLogs?.length||0,
        hintsUsed:completion.hints||0,durationSec:completion.timeSec||0,
      }).then((saved)=>{
        if(saved.ok&&saved.data?.save)onSaveUpdated?.(saved.data.save);
      }).catch(()=>{});
    }
    onComplete(completion);
  };

  const showImpact = (side, amount, theme) => {
    setImpact(side);
    setImpactAmount(amount);
    setImpactTheme(theme);
    later(() => setImpact(null), 650);
  };

  /* --------------------------- Reset on chapter --------------------------- */
  useEffect(() => {
    const now = Date.now();

    endedRef.current = false;
    setIdx(0);
    setAnswer('');
    setBusy(false);
    setHp(PLAYER.stats.hp);
    setEnemyHp(boss.hp);
        setCurrentHints(0);
    setAttempts(0);
    setCorrect(0);
    setFeedback(null);
    setRound(1);
    setImpact(null);
    setImpactAmount(0);
    setImpactTheme('player');
    setQuestionStartedAt(now);
    setStartedAt(now);
    setQuestionLogs([]);
    setLoadError('');
    questionAttemptRef.current = {
      wrongAttempts: 0,
      answers: [],
      feedbackBankHistory: [],
      startedAt: now,
    };
  }, [levelId, boss.hp]);

  /* ---------------------------- Question loading ------------------------- */
  useEffect(() => {
    let alive = true;

    setLoading(true);
    setLoadError('');

    try {
      const localQuestions = generateQuestions(levelId, 10, lang);

      if (!Array.isArray(localQuestions) || localQuestions.length < 10) {
        throw new Error('local question pack is incomplete');
      }

      if (alive) setQuestions(localQuestions);
    } catch (error) {
      console.warn(
        '[Battle] local question generation failed; using safe fallback',
        error,
      );

      if (alive) {
        setQuestions([SAFE_QUESTION[lang] || SAFE_QUESTION.id]);
        setLoadError(t('questionFallback'));
      }
    } finally {
      if (alive) setLoading(false);
    }

    return () => {
      alive = false;
    };
  }, [levelId, lang]);

  /* ---------------------------- Persistence / UI -------------------------- */
  useEffect(() => {
    localStorage.setItem('solvox.keypad', keypadVisible ? '1' : '0');
  }, [keypadVisible]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    const now = Date.now();

    setAnswer('');
    setFeedback(null);
    setBusy(false);
    setAttempts(0);
    setCurrentHints(0);
    setQuestionStartedAt(now);
    questionAttemptRef.current = {
      wrongAttempts: 0,
      answers: [],
      feedbackBankHistory: [],
      startedAt: now,
    };

    window.requestAnimationFrame(() => {
      document.querySelector('.battle-answer-input')?.focus();
    });
  }, [idx]);

  /* ------------------------------- Hint ----------------------------------- */
  const useHint = () => {
    const hintCost = [5, 10, 15][currentHints] ?? 15;
    if (busy || currentHints >= 3 || hp <= hintCost) return;

    setCurrentHints((value) => value + 1);
    setHp((value) => Math.max(1, value - hintCost));
    playSound('hint');

    // Keep the learning feedback visible while the player uses a hint and retries.
  };

  /* ----------------------------- Answer flow ------------------------------ */
  const submit = () => {
    if (busy || !answer.trim() || endedRef.current) return;

    const now = Date.now();
    const elapsed = Math.max(1, Math.round((now - questionStartedAt) / 1000));
    const tracker = questionAttemptRef.current;
    const normalized = normalizeAnswer(answer);
    const acceptedAnswers = (Array.isArray(q.answer) ? q.answer : [q.answer]).map(normalizeAnswer);
    const correctAnswer = Array.isArray(q.answer) ? String(q.answer[0]) : String(q.answer);
    const isCorrect = acceptedAnswers.includes(normalized);
    const attemptNow = attempts + 1;
    const history = [...(tracker.answers || []), answer];

    tracker.answers = history;
    tracker.wrongAttempts = (tracker.wrongAttempts || 0) + (isCorrect ? 0 : 1);

    setAttempts(attemptNow);
    const bankMatch = isCorrect ? null : findFeedbackBankMatch(q.id ?? idx + 1, answer, lang);
    const learningFeedback = String(q.feedback || q.explanation || '').trim();
    const fallbackFeedback = getFeedbackFallback(lang, attemptNow);
    const bankAwareFeedback = isCorrect
      ? learningFeedback
      : String(bankMatch?.feedback || fallbackFeedback || t('tryAgain')).trim();

    if (!isCorrect) {
      tracker.feedbackBankHistory = [
        ...(tracker.feedbackBankHistory || []),
        {
          answer,
          matched: !!bankMatch,
          row: bankMatch?.id ?? null,
          code: bankMatch?.code ?? null,
          errorType: bankMatch?.errorType ?? null,
        },
      ];
    }

    const baseFeedback = {
      type: isCorrect ? 'correct' : 'wrong',
      title: isCorrect ? t('correct') : t('wrong'),
      message: isCorrect ? t('attackReady') : bankAwareFeedback,
      errorTag: isCorrect ? null : (bankMatch?.errorType || q.errorTag),
      explanation: bankAwareFeedback || `${correctAnswer}`,
      nextStep: isCorrect
        ? t('feedbackNextStep')
        : attemptNow < 3
          ? t('feedbackRetryPrompt')
          : t('recommendReview'),
      feedbackBankMatched: !!bankMatch,
      feedbackBankCode: bankMatch?.code || null,
      feedbackBankRow: bankMatch?.id || null,
    };
    setFeedback(baseFeedback);
    playSound(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      handleCorrectAnswer({ elapsed, attemptNow, history, tracker });
      return;
    }

    handleWrongAnswer({ elapsed, attemptNow, history, tracker, feedbackUsed: bankAwareFeedback, bankMatch });
  };

  const handleCorrectAnswer = ({ elapsed, attemptNow, history, tracker }) => {
    const correctNow = correct + 1;

    setCorrect(correctNow);
    setBusy(true);
    combatRef.current?.playerAttack();
    playSound('playerAttack');

    later(() => {
      const nextEnemyHp = Math.max(0, enemyHp - 28);
      const log = {
        idx,
        questionId: q.id ?? idx + 1,
        text: q.text,
        concept: q.concept,
        errorTag: q.errorTag,
        feedback: q.feedback,
        correct: true,
        answer,
        correctAnswer: q.answer,
        attempts: attemptNow,
        wrongAttempts: tracker.wrongAttempts,
        timeSec: elapsed,
        hintsUsed: currentHints,
        hintMaxUsed: currentHints,
        answerHistory: history,
        feedbackBankHistory: [...(tracker.feedbackBankHistory || [])],
        feedbackBankMatched: (tracker.feedbackBankHistory || []).some((entry) => entry.matched),
        firstAttemptCorrect: tracker.wrongAttempts === 0,
        explanation: q.explanation,
      };
      const logs = [...questionLogs, log];

      setEnemyHp(nextEnemyHp);
      setQuestionLogs(logs);
      combatRef.current?.bossHurt();

      const last = idx === questions.length - 1;
      const won = nextEnemyHp <= 0 || (last && correctNow >= 7 && hp > 0);

      later(() => {
        if (nextEnemyHp <= 0) combatRef.current?.bossDie();

        if (nextEnemyHp <= 0 || last) {
          playSound(won ? 'victory' : 'defeat');
          finish({
            accuracy: questions.length
              ? Math.round((correctNow / questions.length) * 100)
              : 0,
            attempts: logs.reduce((sum, item) => sum + item.attempts, 0),
            hints: logs.reduce((sum, item) => sum + item.hintsUsed, 0),
            timeSec: Math.round((Date.now() - startedAt) / 1000),
            correct: correctNow,
            won,
            nextEnemyHp,
            nextHp: hp,
            completionReason: nextEnemyHp <= 0 ? 'boss-defeated' : 'chapter-complete',
            questionLogs: logs,
            chapterEvaluation: evaluateSolvoxChapter({ chapterId: levelId, totalQuestions: questions.length, questionLogs: logs, won, nextHp: hp, nextEnemyHp: nextEnemyHp, lang }),
          });
          return;
        }

        setIdx((value) => value + 1);
        setRound((value) => value + 1);
        setBusy(false);
      }, nextEnemyHp <= 0 ? bossDieDurationMs + 140 : 220);
    }, 380);
  };

  const handleWrongAnswer = ({ elapsed, attemptNow, history, tracker, feedbackUsed, bankMatch }) => {
    const nextHp = Math.max(0, hp - 8);

    setHp(nextHp);
    setBusy(true);
    combatRef.current?.bossAttack();
    playSound(Number(levelId) === 1 ? 'chapter1BossAttack' : 'attack');

    later(() => {
      showImpact('player', 8, 'boss');
      if (nextHp <= 0) combatRef.current?.playerDie();
      else combatRef.current?.playerHurt();

      const last = idx === questions.length - 1;
      const log = {
        idx,
        questionId: q.id ?? idx + 1,
        text: q.text,
        concept: q.concept,
        errorTag: q.errorTag,
        feedback: feedbackUsed,
        correct: false,
        answer,
        correctAnswer: q.answer,
        attempts: attemptNow,
        wrongAttempts: tracker.wrongAttempts,
        timeSec: elapsed,
        hintsUsed: currentHints,
        hintMaxUsed: currentHints,
        answerHistory: history,
        feedbackBankHistory: [...(tracker.feedbackBankHistory || [])],
        feedbackBankMatched: (tracker.feedbackBankHistory || []).some((entry) => entry.matched),
        feedbackBankCode: bankMatch?.code || [...(tracker.feedbackBankHistory || [])].reverse().find((entry) => entry.matched)?.code || null,
        feedbackBankRow: bankMatch?.id || [...(tracker.feedbackBankHistory || [])].reverse().find((entry) => entry.matched)?.row || null,
        unregisteredFeedbackAnswer: bankMatch ? null : answer,
        firstAttemptCorrect: false,
        explanation: feedbackUsed || q.explanation,
      };

      if (attemptNow >= 3 || nextHp <= 0) {
        const logs = [...questionLogs, log];
        setQuestionLogs(logs);

        later(() => {
          if (nextHp <= 0 || last) {
            playSound(nextHp <= 0 ? 'defeat' : 'menu');
            finish({
              accuracy: questions.length
                ? Math.round((correct / questions.length) * 100)
                : 0,
              attempts: logs.reduce((sum, item) => sum + item.attempts, 0),
              hints: logs.reduce((sum, item) => sum + item.hintsUsed, 0),
              timeSec: Math.round((Date.now() - startedAt) / 1000),
              correct,
              won: false,
              nextEnemyHp: enemyHp,
              nextHp,
              completionReason: nextHp <= 0 ? 'player-defeated' : 'question-failed',
              questionLogs: logs,
              chapterEvaluation: evaluateSolvoxChapter({ chapterId: levelId, totalQuestions: questions.length, questionLogs: logs, won: false, nextHp, nextEnemyHp: enemyHp, lang }),
            });
            return;
          }

          setIdx((value) => value + 1);
          setRound((value) => value + 1);
          setBusy(false);
        }, nextHp <= 0 ? playerDieDurationMs + 140 : (attemptNow >= 3 ? 3000 : 2600));
        return;
      }

      setBusy(false);
      setAnswer('');
      window.requestAnimationFrame(() => {
        document.querySelector('.battle-answer-input')?.focus();
      });
    }, bossAttackImpactMs);
  };

  const q = questions[idx] || SAFE_QUESTION[lang] || SAFE_QUESTION.id;
  const maxEnemy = boss.hp;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <h2>{t('generatingQuestions')}</h2>
        <p>{t('freshPack')}</p>
        </div>
    );
  }

  return (
    <div className="battle-page battle-reference">
      <div className="battle-world">
        <ArenaBackground levelId={levelId} />

        <div className={`battle-ui${feedback?.type === 'wrong' ? ' has-feedback' : ''}`}> 
          {/* Top HUD */}
          <div className="battle-top-rail">
            <button
              className="battle-home-back"
              onClick={onBack}
              aria-label={t('backToMap')}
              title={t('backToMap')}
            >
              <SolvoxUtilityArt name="back" size={28} className="solvox-back-art" />
            </button>

            <div className="hp-card hp-player">
              <div className="hp-card-head">
                <span className="hp-avatar">
                  <img src={playerAsset.portrait} alt="" />
                </span>
                <span className="hp-copy">
                  <small>{t('player')}</small>
                  <b>{hp} / {PLAYER.stats.hp}</b>
                </span>
                <span className="hp-percent">
                  {Math.max(0, Math.round((hp / PLAYER.stats.hp) * 100))}%
                </span>
              </div>
              <div className="hp-track" aria-label={`${hp}/${PLAYER.stats.hp} HP`}>
                <span style={{ width: `${Math.max(0, (hp / PLAYER.stats.hp) * 100)}%` }} />
              </div>
              <div className="hp-footer">
                <span>{hp <= 0 ? t('defeated') : t('readyStatus')}</span>
                <span><img src="/assets/ui/reference/heart-icon.png" alt="" /> HP</span>
              </div>
            </div>

            <div className="stage-crown">
              <span>
                <PixelIcon name="crown" size={12} />
                {lang === 'en' ? meta.chapterEn : meta.chapter} - {t('stage')} 1
              </span>
              <b>{lang === 'en' ? meta.titleEn : meta.title}</b>
            </div>

            <div className="hp-card hp-boss">
              <div className="hp-card-head">
                <span className="hp-avatar boss">
                  {boss.renderer === 'webp' ? (
                    <img src={getBossPreviewSrc(boss.spriteId)} alt="" />
                  ) : (
                    <span className="hp-skull"><PixelIcon name="skull" size={17} /></span>
                  )}
                </span>
                <span className="hp-copy">
                  <small>{lang === 'en' ? boss.nameEn : boss.name}</small>
                  <b>{enemyHp} / {maxEnemy}</b>
                </span>
                <span className="hp-percent">
                  {Math.max(0, Math.round((enemyHp / maxEnemy) * 100))}%
                </span>
              </div>
              <div className="hp-track" aria-label={`${enemyHp}/${maxEnemy} HP`}>
                <span style={{ width: `${Math.max(0, (enemyHp / maxEnemy) * 100)}%` }} />
              </div>
              <div className="hp-footer">
                <span>{enemyHp <= 0 ? t('defeated') : t('boss')}</span>
                <span>ENEMY HP</span>
              </div>
            </div>
          </div>

          {loadError && (
            <div className="question-fallback-banner">
              <PixelIcon name="warning" size={14} />
              <span>{loadError}</span>
            </div>
          )}

          {feedback?.type === 'wrong' && (
            <aside className="battle-mistake-banner" role="alert" aria-live="polite">
              <span className="battle-mistake-icon" aria-hidden="true">
                <PixelIcon name="warning" size={15} />
              </span>
              <div className="battle-mistake-copy">
                <div className="battle-mistake-heading">
                  <b>{feedback.title}</b>
                  <span>{t('questionNumber')} {q.id ?? idx + 1}</span>
                </div>
                <p>{feedback.message}</p>
              </div>
              {feedback.errorTag && <em className="battle-mistake-tag">{feedback.errorTag}</em>}
            </aside>
          )}

          {/* The arena stays separate so fighter animations never affect the deck layout. */}
          <div className="battle-reference-arena">
            <CombatStage
              ref={combatRef}
              levelId={levelId}
              playerId={playerId}
              onHit={() => showImpact('boss', 28, 'player')}
            />
          </div>

          <BattleQuestionPanel
            q={{ ...q, attempts }}
            levelId={levelId}
            meta={meta}
            lang={lang}
            t={t}
            round={round}
            totalRounds={questions.length}
            idx={idx}
            answer={answer}
            setAnswer={setAnswer}
            busy={busy}
            submit={submit}
            hintsUsed={currentHints}
            hintsLeft={Math.max(0, 3 - currentHints)}
            hintCost={[5, 10, 15][currentHints] ?? 15}
            currentHp={hp}
            useHint={useHint}
            keypadVisible={keypadVisible}
            onToggleKeypad={() => setKeypadVisible((value) => !value)}
          />

          <div className="battle-reference-footer" aria-hidden="true" />
          <HitEffect side={impact} amount={impactAmount} theme={impactTheme} />
        </div>
      </div>
    </div>
  );
}
