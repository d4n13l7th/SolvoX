import React,{useEffect,useState} from 'react';
import HomeMenu from './components/HomeMenu';
import Battle from './components/Battle';
import Evaluation from './components/Evaluation';
import ProfilePanel from './components/ProfilePanel';
import Feedback from './components/Feedback';
import Multiplayer from './components/Multiplayer';
import ModeSelect from './components/ModeSelect';
import ChapterSelect from './components/ChapterSelect';
import Settings from './components/Settings';
import { SolvoxUtilityArt } from './components/SolvoxUtilityArt';
import SolvoxBrandLogo from './components/SolvoxBrandLogo';
import {LEVELS} from './data/levels';
import {T} from './services/i18n';
import {summarizePerformance} from './services/evaluation';
import {GAME_META} from './config/game';

const STORAGE='solvox.progress.v1';
const LEGACY_STORAGES=['numericore.v35.progress','aljabarmaster.v34.progress','aljabarmaster.v33.progress','aljabarmaster.v32.progress','aljabarmaster.v31.progress','aljabarmaster.v30.progress','aljabarmaster.v29.progress','aljabarmaster.v28.progress','aljabarmaster.v23.progress','aljabarmaster.v20.progress','aljabarmaster.v16final.progress'];
const DEFAULT={playerName:'Player',playerEXP:0,completedLevels:[],analytics:[],profile:{name:'Player',avatar:'pixelNinja',createdAt:Date.now()}};
function normalizeCompleted(raw){
  const set=new Set((Array.isArray(raw)?raw:[]).map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=LEVELS.length));
  const result=[];
  for(let id=1;id<=LEVELS.length;id++){ if(set.has(id)) result.push(id); else break; }
  return result;
}
function sanitizeState(raw){const base={...DEFAULT,...(raw||{})};const cleanBase={...base};delete cleanBase.activityLogs;const profile={...DEFAULT.profile,...(cleanBase.profile||{}),name:String(cleanBase.profile?.name||cleanBase.playerName||'Player').trim().slice(0,18)||'Player'};return {...cleanBase,playerName:profile.name,profile,completedLevels:normalizeCompleted(cleanBase.completedLevels),playerEXP:Number(cleanBase.playerEXP)||0,analytics:Array.isArray(cleanBase.analytics)?cleanBase.analytics:[]};}
function load(){try{const current=localStorage.getItem(STORAGE);if(current)return sanitizeState(JSON.parse(current));for(const key of LEGACY_STORAGES){const legacy=localStorage.getItem(key);if(legacy)return sanitizeState(JSON.parse(legacy));}return {...DEFAULT}}catch{return {...DEFAULT}}}
function save(s){localStorage.setItem(STORAGE,JSON.stringify(s))}
export default function App(){
  const [state,setState]=useState(load),[screen,setScreen]=useState('home'),[level,setLevel]=useState(1),[battleSession,setBattleSession]=useState(0),[evaluation,setEvaluation]=useState(null),[feedback,setFeedback]=useState(false),[settings,setSettings]=useState(false),[profileOpen,setProfileOpen]=useState(false),[lang,setLang]=useState(()=>localStorage.getItem('solvox.lang')||localStorage.getItem('numericore.lang')||localStorage.getItem('aljabarmaster.lang')||'id');
  const t=(k,vars)=>{let value=T[lang]?.[k] ?? T.id?.[k] ?? k; if(vars) Object.entries(vars).forEach(([name,val])=>{value=value.replaceAll(`{${name}}`,String(val))}); return value;};
  useEffect(()=>save(state),[state]);
  useEffect(()=>{ document.documentElement.lang=lang==='en'?'en':'id'; },[lang]);
  const reset=()=>{if(confirm(t('resetConfirm'))){setState({...DEFAULT,profile:{...DEFAULT.profile,createdAt:Date.now()}});localStorage.removeItem(STORAGE);setScreen('home')}};
  const start=(id)=>{const completed=new Set(normalizeCompleted(state.completedLevels));const open=id===1||completed.has(id-1);if(!open)return;setLevel(id);setBattleSession(v=>v+1);setScreen('battle')};
  const complete=(result)=>{const id=level; const won=result.won!==false; const completed=new Set(normalizeCompleted(state.completedLevels)); if(won)completed.add(id); const run={level:id,chapterId:id,...result,mastery:summarizePerformance(result).mastery,ts:Date.now()}; const next={...state,completedLevels:normalizeCompleted([...completed]),playerEXP:state.playerEXP+(won?100:20),playerName:state.profile?.name||state.playerName,analytics:[...(state.analytics||[]),run]};setState(next);setEvaluation(result);};
  const finishEval=()=>{setEvaluation(null);setScreen('chapters')};
  const goNext=(nextId)=>{
    setEvaluation(null);
    if(!nextId){setScreen('chapters');return;}
    // The Next Chapter button is rendered only after a successful completion,
    // so do not re-check stale state here. This avoids the post-level dead-end bug.
    setLevel(Number(nextId));
    setBattleSession(v=>v+1);
    setScreen('battle');
  };
  const rematch=()=>{const sameLevel=Number(evaluation?.chapterId||level);setEvaluation(null);setLevel(sameLevel);setBattleSession(v=>v+1);setScreen('battle')};
  const changeLang=(next)=>setLang(v=>{const n=next|| (v==='id'?'en':'id');localStorage.setItem('solvox.lang',n);return n});
  const saveProfile=(profile)=>{const clean={...state.profile,...profile,name:String(profile?.name||state.profile?.name||'Player').trim().slice(0,18)||'Player'};setState(v=>({...v,profile:clean,playerName:clean.name}));setProfileOpen(false)};
  return <div className={`app-shell ${screen==='battle'?'battle-active':''}`}>
    {screen!=='battle'&&screen!=='home'&&screen!=='modes'&&screen!=='chapters'&&<header className="global-bar global-bar-v27"><div className="global-brand-v89"><SolvoxBrandLogo compact/><span><b>ONLINE</b><small>{t('subtitle').toUpperCase()}</small></span></div><div className="top-actions"><button className="icon-action-v27" title={t('feedback')} onClick={()=>setFeedback(true)}><SolvoxUtilityArt name="feedback" size={30}/></button><button className="icon-action-v27" title={t('settingsHint')} onClick={()=>setSettings(true)}><SolvoxUtilityArt name="settings" size={30}/></button></div></header>}
    {screen==='home'&&<HomeMenu t={t} onMain={()=>setScreen('modes')} onSettings={()=>setSettings(true)} onFeedback={()=>setFeedback(true)} onProfile={()=>setProfileOpen(true)}/>} 
    {screen==='modes'&&<ModeSelect lang={lang} t={t} onBack={()=>setScreen('home')} onSingle={()=>setScreen('chapters')} onMulti={()=>setScreen('multi')}/>} 
    {screen==='chapters'&&<ChapterSelect progress={state} lang={lang} t={t} onBack={()=>setScreen('modes')} onStart={start}/>}
    {screen==='battle'&&<Battle key={`chapter-${level}-session-${battleSession}`} levelId={level} lang={lang} t={t} onComplete={complete} onBack={()=>setScreen('chapters')}/>} 
    {screen==='multi'&&<Multiplayer lang={lang} t={t} playerName={state.profile?.name||state.playerName} onBack={()=>setScreen('modes')}/>} 
    {evaluation&&<Evaluation result={evaluation} onClose={finishEval} onRematch={rematch} onNext={goNext} nextLevel={evaluation.won&&Number(evaluation.chapterId||level)<LEVELS.length?Number(evaluation.chapterId||level)+1:null} t={t} lang={lang}/>} 
    {feedback&&<Feedback lang={lang} t={t} onClose={()=>setFeedback(false)}/>}
    {settings&&<Settings lang={lang} t={t} onClose={()=>setSettings(false)} onReset={reset} onChangeLang={changeLang}/>}
    {profileOpen&&<ProfilePanel progress={state} profile={state.profile} onClose={()=>setProfileOpen(false)} onSave={saveProfile} t={t} lang={lang}/>} 
  </div>
}
