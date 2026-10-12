import React,{useEffect,useState} from 'react';
import HomeMenu from './components/HomeMenu';
import Battle from './components/Battle';
import Evaluation from './components/Evaluation';
import ProfilePanel from './components/ProfilePanel';
import Feedback from './components/Feedback';
import Multiplayer from './components/Multiplayer';
import ModeSelect from './components/ModeSelect';
import ChapterSelect from './components/ChapterSelect';
import SinglePlayerCharacterSelect from './components/SinglePlayerCharacterSelect';
import Settings from './components/Settings';
import AboutDevelopers from './components/AboutDevelopers';
import Tutorial from './components/Tutorial';
import SolvoxBrandLogo from './components/SolvoxBrandLogo';
import PixelIcon from './components/PixelIcon';
import {LEVELS, isUnlocked} from './data/levels';
import {T} from './services/i18n';
import {summarizePerformance} from './services/evaluation';
import {GAME_META} from './config/game';

const STORAGE='solvox.progress.v1';
const PLAYER_STORAGE='solvox.singlePlayer.character.v1';
const PLAYER_LOCK_STORAGE='solvox.singlePlayer.characterLocked.v1';
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
  const [state,setState]=useState(load),[screen,setScreen]=useState('home'),[level,setLevel]=useState(1),[playerId,setPlayerId]=useState(()=>localStorage.getItem(PLAYER_STORAGE)||'traveler'),[playerSelectionLocked,setPlayerSelectionLocked]=useState(()=>localStorage.getItem(PLAYER_LOCK_STORAGE)==='1'),[battleSession,setBattleSession]=useState(0),[evaluation,setEvaluation]=useState(null),[feedback,setFeedback]=useState(false),[settings,setSettings]=useState(false),[profileOpen,setProfileOpen]=useState(false),[tutorialOpen,setTutorialOpen]=useState(false),[lang,setLang]=useState(()=>localStorage.getItem('solvox.lang')||localStorage.getItem('numericore.lang')||localStorage.getItem('aljabarmaster.lang')||'id');
  const t=(k,vars)=>{let value=T[lang]?.[k] ?? T.id?.[k] ?? k; if(vars) Object.entries(vars).forEach(([name,val])=>{value=value.replaceAll(`{${name}}`,String(val))}); return value;};
  useEffect(()=>{save(state);},[state]);
  useEffect(()=>{ document.documentElement.lang=lang==='en'?'en':'id'; },[lang]);
  useEffect(()=>{ localStorage.setItem(PLAYER_STORAGE,playerId); },[playerId]);
  const reset=()=>{
    if(!confirm(t('resetConfirm')))return;
    const next={...DEFAULT,profile:{...DEFAULT.profile,createdAt:Date.now()}};
    save(next);
    LEGACY_STORAGES.forEach((key)=>localStorage.removeItem(key));
    localStorage.removeItem(PLAYER_LOCK_STORAGE);
    localStorage.setItem(PLAYER_STORAGE,'traveler');
    setState(next);
    setPlayerSelectionLocked(false);
    setPlayerId('traveler');
    setLevel(1);
    setEvaluation(null);
    setFeedback(false);
    setSettings(false);
    setProfileOpen(false);
    setTutorialOpen(false);
    setScreen('home');
  };
  const allChaptersCompleted=normalizeCompleted(state.completedLevels).length===LEVELS.length;
  const launchBattle=(chapterId)=>{
    setLevel(chapterId);
    setBattleSession(v=>v+1);
    setScreen('battle');
  };
  const selectChapter=(id)=>{
    const chapterId=Number(id);
    if(!Number.isInteger(chapterId)||chapterId<1||chapterId>LEVELS.length)return;
    if(!isUnlocked(state, chapterId))return;
    // Character choice is a one-time campaign decision, made on Chapter 1.
    // It becomes available again only after the entire campaign is cleared.
    if(chapterId===1&&(!playerSelectionLocked||allChaptersCompleted)){
      setLevel(1);
      setScreen('character');
      return;
    }
    if(!playerSelectionLocked){
      // Guard imported/legacy progress where later chapters are unlocked but
      // the one-time character choice was never committed.
      setLevel(1);
      setScreen('character');
      return;
    }
    launchBattle(chapterId);
  };
  const start=(id, nextPlayerId=playerId)=>{
    const chapterId=Number(id);
    if(chapterId!==1||!Number.isInteger(chapterId)||chapterId<1||chapterId>LEVELS.length)return;
    const selected=nextPlayerId||'traveler';
    // Completing the full campaign and choosing a new Chapter 1 character
    // starts a fresh run, so the new choice stays locked for that run.
    if(allChaptersCompleted)setState(current=>({...current,completedLevels:[]}));
    setPlayerId(selected);
    localStorage.setItem(PLAYER_LOCK_STORAGE,'1');
    setPlayerSelectionLocked(true);
    launchBattle(chapterId);
  };
  const complete=(result)=>{const id=level; const won=result.won!==false; const completed=new Set(normalizeCompleted(state.completedLevels)); if(won)completed.add(id); const run={level:id,chapterId:id,...result,mastery:summarizePerformance(result).mastery,ts:Date.now()}; const next={...state,completedLevels:normalizeCompleted([...completed]),playerEXP:state.playerEXP+(won?100:20),playerName:state.profile?.name||state.playerName,analytics:[...(state.analytics||[]),run]}; setState(next); setEvaluation(result);};
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
    {screen!=='battle'&&screen!=='home'&&screen!=='modes'&&screen!=='chapters'&&screen!=='character'&&screen!=='about'&&<header className="global-bar"><div className="global-brand"><SolvoxBrandLogo compact/><span className="global-brand-copy"><b>{t('online')}</b><small>{t('subtitle')}</small></span></div><nav className="global-actions" aria-label={lang==='en'?'Game options':'Pengaturan game'}><button className="global-action" title={t('feedback')} aria-label={t('feedback')} onClick={()=>setFeedback(true)}><PixelIcon name="feedback" size={17}/><span>{t('feedback')}</span></button><button className="global-action" title={t('settingsTitle')} aria-label={t('settingsTitle')} onClick={()=>setSettings(true)}><PixelIcon name="gear" size={17}/><span>{t('settingsTitle')}</span></button></nav></header>}
    {screen==='home'&&<HomeMenu t={t} onMain={()=>setScreen('modes')} onTutorial={()=>setTutorialOpen(true)} onSettings={()=>setSettings(true)} onFeedback={()=>setFeedback(true)} onProfile={()=>setProfileOpen(true)}/>} 
    {screen==='modes'&&<ModeSelect lang={lang} t={t} onBack={()=>setScreen('home')} onSingle={()=>setScreen('chapters')} onMulti={()=>setScreen('multi')}/>} 
    {screen==='chapters'&&<ChapterSelect progress={state} lang={lang} t={t} onBack={()=>setScreen('modes')} onSelectChapter={selectChapter}/>}
    {screen==='character'&&<SinglePlayerCharacterSelect levelId={level} playerId={playerId} lang={lang} t={t} onPlayerChange={setPlayerId} onBack={()=>setScreen('chapters')} onStart={start}/>}
    {screen==='battle'&&<Battle key={`chapter-${level}-session-${battleSession}`} levelId={level} playerId={playerId} lang={lang} t={t} onComplete={complete} onBack={()=>setScreen('chapters')}/>} 
    {screen==='multi'&&<Multiplayer lang={lang} t={t} playerName={state.profile?.name||state.playerName} onBack={()=>setScreen('modes')}/>} 
    {evaluation&&<Evaluation result={evaluation} onClose={finishEval} onRematch={rematch} onNext={goNext} nextLevel={evaluation.won&&Number(evaluation.chapterId||level)<LEVELS.length?Number(evaluation.chapterId||level)+1:null} t={t} lang={lang}/>} 
    {feedback&&<Feedback lang={lang} t={t} onClose={()=>setFeedback(false)}/>}
    {settings&&<Settings lang={lang} t={t} onClose={()=>setSettings(false)} onReset={reset} onChangeLang={changeLang} onAboutUs={()=>{setSettings(false);setScreen('about')}}/>}
    {screen==='about'&&<AboutDevelopers lang={lang} t={t} onBack={()=>setScreen('home')}/>}
    {profileOpen&&<ProfilePanel progress={state} profile={state.profile} onClose={()=>setProfileOpen(false)} onSave={saveProfile} t={t} lang={lang}/>}
    {tutorialOpen&&<Tutorial t={t} onClose={()=>setTutorialOpen(false)}/>} 
  </div>
}
