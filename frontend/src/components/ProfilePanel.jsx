import React,{useEffect,useMemo,useState} from 'react';
import {SolvoxUtilityArt} from './SolvoxUtilityArt';
import {deriveProfile} from '../services/profile';
import {apiUrl} from '../config';

function fmtTime(seconds){
  const s=Math.max(0,Number(seconds)||0);
  if(s<60)return `${Math.round(s)}s`;
  const m=Math.floor(s/60); const r=Math.round(s%60);
  if(m<60)return `${m}m ${r}s`;
  return `${Math.floor(m/60)}h ${m%60}m`;
}

export default function ProfilePanel({progress,profile,onClose,onSave,t,lang}){
  const stats=useMemo(()=>deriveProfile(progress),[progress]);
  const [name,setName]=useState(profile?.name||progress.playerName||'Player');
  const [mp,setMp]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{const onKey=e=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[onClose]);
  useEffect(()=>{
    let alive=true;
    const lookupName=String(profile?.name||progress.playerName||'Player').trim();
    setLoading(true);
    fetch(apiUrl(`/api/player-profile?name=${encodeURIComponent(lookupName)}`))
      .then(r=>r.ok?r.json():Promise.reject())
      .then(data=>{if(alive)setMp(data?.player||null)})
      .catch(()=>{if(alive)setMp(null)})
      .finally(()=>{if(alive)setLoading(false)});
    return()=>{alive=false};
  },[name]);
  const mpMatches=Number(mp?.matches)||0;
  const totalMatches=stats.totalRuns+mpMatches;
  const totalWins=stats.wins+(Number(mp?.wins)||0);
  const totalLosses=stats.losses+(Number(mp?.losses)||0);
  const totalAnswered=stats.questions+(Number(mp?.answered)||0);
  const totalCorrect=stats.correct+(Number(mp?.correct)||0);
  const combinedAccuracy=totalAnswered?Math.round(totalCorrect/totalAnswered*100):stats.accuracy;
  const save=()=>onSave({...profile,name:name.trim()||'Player'});
  return <div className="profile-overlay-v28" role="dialog" aria-modal="true">
    <div className="profile-panel-v28">
      <div className="profile-panel-head-v28 utility-profile-head dashboard-head-v93">
        <div className="dashboard-head-copy-v93"><div className="eyebrow">{t('dashboard')}</div><h2>{t('profileTitle')}</h2><p>{t('profileDescription')}</p></div>
        <button className="profile-close-v28 profile-close-btn-v96" type="button" onClick={onClose}><SolvoxUtilityArt name="close" size={18} className="profile-close-art-v96" /></button>
      </div>
      <div className="profile-hero-v28">
        <div className="profile-avatar-xl-v28 profile-avatar-text-v101" aria-hidden="true">S</div>
        <div className="profile-identity-v28">
          <label>{t('name')}<input value={name} maxLength={18} onChange={e=>setName(e.target.value)}/></label>
          <div className="profile-level-line-v28"><span>Lv. {stats.level}</span><span>{stats.rank} {stats.rankScore}</span></div>
          <div className="profile-xp-track-v28"><i style={{width:`${Math.round(stats.currentLevelExp/100*100)}%`}}/></div>
          <small>{stats.currentLevelExp}/{100} EXP • {stats.exp} total EXP</small>
        </div>
        <div className="profile-actions-v28"><button className="primary-btn-v28" onClick={save}>{t('save')}</button></div>
      </div>

      <div className="profile-grid-v28">
        <section className="profile-card-v28 profile-stats-v28">
          <div className="profile-card-title-v28"><span className="profile-card-mark-v101" aria-hidden="true">STAT</span><span>{t('lifetimeStats')}</span></div>
          <div className="profile-stat-grid-v28">
            <div><small>{t('matchesPlayed')}</small><b>{totalMatches}</b></div>
            <div><small>{t('wins')}</small><b className="good">{totalWins}</b></div>
            <div><small>{t('losses')}</small><b className="bad">{totalLosses}</b></div>
            <div><small>{t('accuracy')}</small><b>{combinedAccuracy}%</b></div>
            <div><small>{t('questionsAnswered')}</small><b>{totalAnswered}</b></div>
            <div><small>{t('bestAccuracy')}</small><b>{stats.bestAccuracy}%</b></div>
          </div>
        </section>
        <section className="profile-card-v28 profile-progress-v28">
          <div className="profile-card-title-v28"><span className="profile-card-mark-v101" aria-hidden="true">MAP</span><span>{t('adventureProgress')}</span></div>
          <div className="campaign-progress-big-v28"><div className="campaign-ring-v28" style={{'--progress':stats.completedCount/5*100}}><b>{stats.completedCount}</b><small>/ {stats.totalChapters}</small></div><div><strong>{t('chaptersClearedLabel')}</strong><p>{stats.completedCount===5?(t('campaignComplete')):t('chaptersRemaining',{count:5-stats.completedCount})}</p></div></div>
          <div className="profile-progress-bar-v28"><i style={{width:`${stats.completedCount/5*100}%`}}/></div>
        </section>
      </div>

      <div className="profile-grid-v28">
        <section className="profile-card-v28">
          <div className="profile-card-title-v28"><span className="profile-card-mark-v101" aria-hidden="true">LEARN</span><span>{t('learningSnapshot')}</span></div>
          <div className="learning-pair-v28">
            <div><small>{t('strongestConcept')}</small><strong>{stats.strongest?.concept||'—'}</strong>{stats.strongest&&<span>{stats.strongest.accuracy}% accuracy</span>}</div>
            <div><small>{t('revisitConcept')}</small><strong>{stats.weakest?.concept||'—'}</strong>{stats.weakest&&<span>{stats.weakest.accuracy}% accuracy</span>}</div>
          </div>
        </section>
        <section className="profile-card-v28">
          <div className="profile-card-title-v28"><span className="profile-card-mark-v101" aria-hidden="true">VS</span><span>{t('multiplayerRecord')}</span></div>
          {loading?<p className="profile-muted-v28">{t('loading')}</p>:mp?<div className="profile-mp-grid-v28"><div><small>{t('matchesPlayed')}</small><b>{mpMatches}</b></div><div><small>{t('wins')}</small><b className="good">{mp.wins||0}</b></div><div><small>{t('losses')}</small><b className="bad">{mp.losses||0}</b></div><div><small>{t('avgAccuracy')}</small><b>{mp.accuracy||0}%</b></div></div>:<p className="profile-muted-v28">{t('noMultiplayerRecords')}</p>}
        </section>
      </div>

      <div className="profile-grid-v28 profile-bottom-grid-v28">
        <section className="profile-card-v28">
          <div className="profile-card-title-v28"><span className="profile-card-mark-v101" aria-hidden="true">AWD</span><span>{t('achievements')}</span></div>
          <div className="achievement-list-v28">{stats.achievements.map(a=><div key={a.id} className={a.ok?'earned':''}><span className="achievement-icon-v28 profile-mark-status-v101" aria-hidden="true">{a.ok?'✓':'•'}</span><span>{a.label}</span></div>)}</div>
        </section>
        <section className="profile-card-v28">
          <div className="profile-card-title-v28"><span className="profile-card-mark-v101" aria-hidden="true">LOG</span><span>{t('recentRuns')}</span></div>
          <div className="recent-run-list-v28">{stats.recent.length?stats.recent.map((r,i)=><div className="recent-run-v28" key={`${r.ts}-${i}`}><span className={`${r.won?'run-win':'run-loss'} profile-mark-status-v101`} aria-hidden="true">{r.won?'✓':'×'}</span><div><b>Chapter {r.chapterId||r.level||'—'}</b><small>{r.accuracy||0}% • {fmtTime(r.timeSec)} • {r.won?(t('victory')):(t('defeat'))}</small></div><strong>{r.won?'+100 EXP':'+20 EXP'}</strong></div>):<p className="profile-muted-v28">{t('noCompletedRuns')}</p>}</div>
        </section>
      </div>
    </div>
  </div>;
}
