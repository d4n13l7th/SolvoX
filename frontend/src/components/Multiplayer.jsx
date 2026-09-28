import React,{useEffect,useMemo,useState} from 'react';
import {io} from 'socket.io-client';
import CharacterPicker,{MULTIPLAYER_CHARACTERS} from './CharacterPicker';
import PixelIcon from './PixelIcon';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';
import {GAME_META} from '../config/game';

function findCharacter(id){return MULTIPLAYER_CHARACTERS.find(x=>x.id===id)||MULTIPLAYER_CHARACTERS[0];}

export default function Multiplayer({lang,onBack,t,playerName=''} ){
  const [socket]=useState(()=>io({autoConnect:false}));
  const [battleMode,setBattleMode]=useState('turn');
  const [name,setName]=useState(playerName||'Player');
  const [char,setChar]=useState('mage');
  const [level,setLevel]=useState(1);
  const [code,setCode]=useState('');
  const [room,setRoom]=useState(null);
  const [error,setError]=useState('');
  const [answer,setAnswer]=useState('');
  const [seconds,setSeconds]=useState(45);
  const [answerInfo,setAnswerInfo]=useState(null);
  const [hintInfo,setHintInfo]=useState(null);
  const [showMatchReview,setShowMatchReview]=useState(false);
  const [dashboard,setDashboard]=useState(null);
  const [dashboardLoading,setDashboardLoading]=useState(false);

  const loadDashboard=()=>{
    setDashboardLoading(true);
    fetch('/api/dashboard?limit=20').then(r=>r.ok?r.json():Promise.reject()).then(data=>setDashboard(data)).catch(()=>setDashboard(null)).finally(()=>setDashboardLoading(false));
  };
  useEffect(()=>{if(playerName)setName(playerName)},[playerName]);
  useEffect(()=>{loadDashboard();},[]);
  useEffect(()=>{
    socket.connect();
    const events=['room:created','room:update','game:start','game:generating','turn:next','turn:answer','turn:hint-used','round:resolved','round:next','score:answer','game:finished','rematch:ready','player:left','player:disconnected','room:reconnected'];
    const handler=r=>{setRoom(r);if(r?.status==='finished')setTimeout(loadDashboard,250)};
    events.forEach(e=>socket.on(e,handler));
    socket.on('answer:result',x=>{setAnswerInfo(x);setAnswer('')});
    socket.on('hint:result',x=>{if(x?.ok)setHintInfo(x)});
    socket.on('room:error',x=>setError(x?.code||'ROOM_ERROR'));
    return()=>socket.disconnect();
  },[socket]);
  useEffect(()=>{
    if(!room)return;
    setAnswerInfo(null);
    setHintInfo(null);
    setAnswer('');
  },[room?.questionIndex,room?.turnToken]);
  useEffect(()=>{
    if(!room||room.status!=='battle')return setSeconds(45);
    const started=room.turnStartedAt||Date.now();
    const duration=(room.turnDuration||45000);
    const tick=()=>setSeconds(Math.max(0,Math.ceil((duration-(Date.now()-started))/1000)));
    tick();const id=setInterval(tick,250);return()=>clearInterval(id);
  },[room?.status,room?.turnStartedAt,room?.questionIndex,room?.turnToken]);

  const me=useMemo(()=>room?.players?.find(p=>p.id===socket.id)||room?.players?.find(p=>p.token===localStorage.getItem('solvox.mpToken')||localStorage.getItem('numericore.mpToken')||localStorage.getItem('aljabarmaster.mpToken')),[room,socket]);
  const current=room?.currentTurnToken===me?.token;
  const errText={ROOM_NOT_FOUND:t('roomNotFound'),ROOM_FULL:t('roomFull'),ROOM_STARTED:t('roomStarted'),ROOM_CODE:t('roomCodeRule'),ROOM_ERROR:t('roomError')}[error];
  const statusText=()=>{
    if(!room)return '';
    const map={WAITING_PLAYER:t('waitingPlayer'),WAITING:t('waitingReady'),GENERATING_QUESTIONS:t('generatingMatch'),READY_TO_BATTLE:t('battleReady'),TURN_CHANGED:room.currentTurnToken===me?.token?t('turnYour'):t('turnOpponent'),TURN_TIMEOUT:t('timeUp'),TURN_CORRECT:t('correct'),TURN_WRONG:t('wrong'),BOTH_WRONG:t('bothMissed'),ROUND_RESOLVED:t('roundResolved'),NEW_ROUND:t('newRound'),MATCH_FINISHED:t('matchFinished'),DRAW:t('draw'),REMATCH_READY:t('rematchReady'),DISCONNECTED:t('disconnect')};
    return map[room.statusKey]||t('waiting');
  };
  const winnerName=room?.winner&&room.winner!=='draw'?room.players?.find(p=>p.token===room.winner)?.name:null;

  const create=()=>{setError('');setAnswerInfo(null);const tok=localStorage.getItem('solvox.mpToken')||localStorage.getItem('numericore.mpToken')||localStorage.getItem('aljabarmaster.mpToken')||'';socket.emit('room:create',{name,character:char,levelId:level,lang,mode:battleMode,token:tok})};
  const join=()=>{setError('');if(!/^AJM-[A-Z0-9]{4}$/.test(code.trim().toUpperCase())){setError('ROOM_CODE');return}const tok=localStorage.getItem('solvox.mpToken')||localStorage.getItem('numericore.mpToken')||localStorage.getItem('aljabarmaster.mpToken')||'';socket.emit('room:join',{code:code.trim().toUpperCase(),name,character:char,lang,token:tok})};
  const ready=()=>socket.emit('player:ready',{ready:true});
  const submit=()=>{if(!answer.trim())return;if(room?.mode==='turn'&&!current)return;socket.emit('answer:submit',{answer})};
  const useTurnHint=()=>{if(!room||room.status!=='battle'||room.mode!=='turn'||!current||!room.question?.hints?.length)return;socket.emit('turn:hint')};
  const changeMyCharacter=(next)=>{setChar(next);if(room?.status==='waiting')socket.emit('player:update',{character:next,name})};

  const myStats=dashboard?.players?.find(p=>String(p.name).trim().toLowerCase()===String(name).trim().toLowerCase());
  const bestAccuracy=Math.max(...(dashboard?.players||[]).map(p=>p.accuracy||0),0);
  const totalWins=(dashboard?.players||[]).reduce((n,p)=>n+(p.wins||0),0);
  const badges=[
    myStats?.matches>=1&&'FIRST MATCH',
    myStats?.accuracy>=80&&'SHARP MIND',
    myStats?.wins>=3&&'ARENA VETERAN',
    myStats?.avgScore>=700&&'COMBO MASTER'
  ].filter(Boolean);

  return <div className="multi-page multi-page-v26 multiplayer-v93">
    <div className="multi-home-bg-v93" aria-hidden="true">
      <video autoPlay loop muted playsInline preload="metadata" poster="/assets/home/home-background-v83-poster.jpg">
        <source src="/assets/home/home-background-v83.mp4" type="video/mp4" />
      </video>
    </div>
    <div className="multi-ambient-v26" aria-hidden="true"><span/><i/><b/></div>
    <div className="multi-header multi-header-v26">
      <button className="multi-back-btn-v27" onClick={onBack}><SolvoxUtilityArt name="back" size={28} className="solvox-back-art" /><span className="solvox-back-label-v82">{t('back')}</span></button>
      <div><div className="eyebrow">{GAME_META.title.toUpperCase()}</div><h1>{t('battleWithFriend')}</h1><p>{t('arenaTip')}</p></div>
      <div className="status-dot status-dot-v27"><i/> {t('online')}</div>
    </div>
    {errText&&<div className="error-banner">{errText}</div>}

    {!room&&<>
      <div className="multi-grid multi-grid-v26">
        <div className="multi-card multi-card-v26 host-card-v26">
          <div className="player-slot-label"><span>{t('player1')}</span><b>{t('host')}</b></div>
          <h2><PixelIcon name="sword" size={18}/><span>{t('createArena')}</span></h2>
          <p className="card-subtitle-v26">{t('createArenaDesc')}</p>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t('name')}/>
          <select value={level} onChange={e=>setLevel(Number(e.target.value))}>{[1,2,3,4,5].map(x=><option key={x} value={x}>Chapter {x}{x===5?' • '+t('finalBoss'):''}</option>)}</select>
          <div className="mode-choice mode-choice-v26"><button className={battleMode==='turn'?'active':''} onClick={()=>setBattleMode('turn')}>{t('turnBased')}</button><button className={battleMode==='score'?'active':''} onClick={()=>setBattleMode('score')}>{t('scoreDuel')}</button></div>
          <p className="mode-desc">{battleMode==='turn'?t('turnBasedDesc'):t('scoreDuelDesc')}</p><div className="tiebreak-note-v34"><PixelIcon name="hint" size={14}/><span>{t('tieBreakHintRule')}</span></div>
          <div className="picker-title-v26"><strong>{t('yourFighter')}</strong><span>{t('characterSelect')}</span></div>
          <CharacterPicker value={char} onChange={setChar} compact t={t}/>
          <button className="primary-btn primary-btn-v26" onClick={create}>{t('create')}</button>
        </div>

        <div className="multi-card multi-card-v26 join-card-v26">
          <div className="player-slot-label"><span>{t('player2')}</span><b>{t('challenger')}</b></div>
          <h2>🔗 {t('joinArena')}</h2>
          <p className="card-subtitle-v26">{t('joinArenaDesc')}</p>
          <input value={code} maxLength={8} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,''))} placeholder="AJM-XXXX"/>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t('name')}/>
          <div className="picker-title-v26"><strong>{t('yourFighter')}</strong><span>{t('characterSelect')}</span></div>
          <CharacterPicker value={char} onChange={setChar} compact t={t}/>
          <button className="primary-btn primary-btn-v26" onClick={join}>{t('join')}</button>
        </div>
      </div>

      <div className="dashboard-card-v25 dashboard-card-v26">
        <div className="dashboard-head-v25 dashboard-head-v26"><div><div className="eyebrow">{t('dashboard')}</div><h2>{t('dashboardHint')}</h2></div><div className="dashboard-spark-v26"><PixelIcon name="crown" size={24}/></div></div>
        {dashboardLoading&&!dashboard?<div className="dashboard-empty-v25">{t('loading')}</div>:dashboard?.summary?.playerEntries? <>
          <div className="dashboard-hero-row-v26">
            <div className="dashboard-identity-v26"><div className="dashboard-avatar-v26">{String(name||'P').slice(0,1).toUpperCase()}</div><div><span>{t('dashboardPlayer')}</span><strong>{name}</strong><small>{badges.length?badges.join(' • '):t('dashboardMomentum')}</small></div></div>
            <div className="dashboard-best-v26"><span>{t('dashboardTopAccuracy')}</span><b>{bestAccuracy}%</b><small>{totalWins} {t('wins')}</small></div>
          </div>
          <div className="dashboard-metrics-v25 dashboard-metrics-v26">
            <div><span>{t('matchesPlayed')}</span><b>{myStats?.matches||0}</b></div>
            <div><span>{t('avgAccuracy')}</span><b>{myStats?.accuracy||0}%</b></div>
            <div><span>{t('wins')}</span><b>{myStats?.wins||0}</b></div>
            <div><span>{t('dashboardTotalScore')}</span><b>{myStats?.avgScore||0}</b></div>
            <div><span>{t('avgHints')}</span><b>{myStats?.avgHints||0}</b></div>
          </div>
          <div className="dashboard-table-wrap-v25 dashboard-table-wrap-v26"><table><thead><tr><th>#</th><th>{t('player')}</th><th>{t('matchesPlayed')}</th><th>{t('avgAccuracy')}</th><th>{t('wins')}</th><th>{t('draws')}</th><th>{t('losses')}</th><th>{t('avgHints')}</th></tr></thead><tbody>{dashboard.players.map((p,i)=><tr key={p.name}><td><span className={`rank-chip-v26 rank-${i+1}`}>{i+1}</span></td><td><strong>{p.name}</strong></td><td>{p.matches}</td><td>{p.accuracy}%</td><td>{p.wins}</td><td>{p.draws}</td><td>{p.losses}</td><td>{p.avgHints||0}</td></tr>)}</tbody></table></div>
        </> : <div className="dashboard-empty-v25 dashboard-empty-v26"><div><PixelIcon name="chart" size={28}/></div><b>{t('dashboardEmpty')}</b><span>{t('startMatchForStats')}</span></div>}
      </div>
    </>}

    {room&&<div className="room-card multi-room-v23 multi-room-v26">
      <div className="room-top room-top-v26"><div><div className="eyebrow">{room.mode==='turn'?t('turnBased'):t('scoreDuel')}</div><div className="room-code">{room.code}</div></div><div className="match-meta">{t('questionSource')}: {room.questionSource}</div></div>
      <div className="players players-v26">{room.players?.map((p,index)=>{
        const c=findCharacter(p.character);
        return <div className={`p-card p-card-v26 ${p.token===me?.token?'mine':''}`} key={p.token} style={{'--fighter-accent':c.accent,'--attack-distance':index===0?'56px':'-56px'}}>
          <div className="player-number-v26">{index===0?t('player1'):t('player2')}</div><div className="p-avatar p-avatar-v26"><PixelIcon name={c.icon} size={28}/></div><b>{p.name}</b><span>{room.mode==='turn'?`${p.hp} HP`:p.score+' '+t('score')}</span><small>{p.ready?t('ready'):t('waiting')}</small>
          {p.token===me?.token&&room.status==='waiting'&&<CharacterPicker value={p.character} onChange={changeMyCharacter} compact t={t}/>}
        </div>;
      })}</div>
      <div className="room-status room-status-v26">{statusText()}</div>
      {room.status==='waiting'&&<button className="primary-btn primary-btn-v26 wide-action-v26" onClick={ready}><PixelIcon name="check" size={16}/><span>{t('ready')}</span></button>}
      {room.status==='generating'&&<div className="match-loading">✨ {t('generatingMatch')}</div>}
      {room.status==='battle'&&room.question&&<div className="mp-battle-v23 mp-battle-v26"><div className="mp-arena-v34">{room.players?.map((p,index)=>{const c=findCharacter(p.character);const active=room.mode==='turn'&&room.currentTurnToken===p.token;const attacking=room.combatEvent&&room.combatEvent.token===p.token;const targetHit=room.combatEvent&&room.combatEvent.target===p.token;return <div className={`mp-fighter-v34 ${index===0?'left':'right'} ${active?'is-active':''} ${attacking?'is-attacking':''} ${targetHit?'is-hit':''}`} key={p.token} style={{'--fighter-accent':c.accent,'--attack-distance':index===0?'56px':'-56px'}} data-combat-seq={room.combatEvent?.seq||''}><div className="mp-fighter-name">{p.name}</div><div className="mp-fighter-sprite"><span className="mp-fighter-glow-v62" aria-hidden="true"/><PixelIcon name={c.icon} size={58}/>{attacking&&<span className="mp-attack-flash-v62" aria-hidden="true"/>}{targetHit&&<span className="mp-damage-pop-v62" aria-hidden="true">-{room.combatEvent?.damage||0}</span>}</div><div className="mp-hp-mini"><i style={{width:`${p.hp}%`}}/></div><small>{p.hp} HP</small></div>})}<div className="mp-clash-v34"><span>VS</span><i/></div></div><div className="turn-strip turn-strip-v26"><span>{t('round')} {room.round}/10</span><b>{room.mode==='turn'?(current?t('turnYour'):t('turnOpponent')):seconds+'s'}</b><span>{seconds}s</span></div><div key={`question-${room.questionIndex}-${room.round}`} className="mp-question mp-question-v26"><div className="mp-question-badge-v26">{room.mode==='turn'?(current?t('yourTurn'):t('opponent')):t('scoreDuelBadge')}</div><p>{room.question.context}</p><h2>{room.question.text}</h2><label><input value={answer} disabled={room.mode==='turn'&&!current} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder={t('answerPlaceholder')}/><button onClick={submit} disabled={!answer.trim()||(room.mode==='turn'&&!current)}><PixelIcon name="sword" size={15}/><span>{t('answer')}</span></button></label><div className="mp-question-tools-v34">{room.mode==='turn'&&<button className="mp-hint-btn-v34" onClick={useTurnHint} disabled={!current||seconds<=0||!room.question?.hints?.length||Number(me?.hintsUsed||0)>=2}><PixelIcon name="hint" size={14}/><span>{t('hint')}</span><small>{Math.max(0,2-(me?.hintsUsed||0))}</small></button>}<span>{room.mode==='turn'?(current?t('turnTimer')+': '+seconds+'s':t('notYourTurn')):t('scoreDuel')}</span></div>{hintInfo&&current&&<div className="mp-hint-panel-v34"><PixelIcon name="hint" size={14}/><div><strong>{t('hint')} {hintInfo.level}</strong><p>{hintInfo.text}</p></div></div>}
          {answerInfo&&<div className={`mp-answer-info ${answerInfo.correct?'ok':'bad'}`}>{answerInfo.correct?'✓ '+t('correct'):'✕ '+t('wrong')}<br/><b>{answerInfo.explanation}</b></div>}</div></div>}
      {room.status==='finished'&&<div className="match-result match-result-v26"><div className="result-emblem-v26"><PixelIcon name={winnerName?'trophy':'star'} size={48}/></div><h2>{winnerName?`${winnerName} — ${t('matchFinished')}`:t('draw')}</h2><p>{room.players?.map(p=>`${p.name}: ${room.mode==='turn'?p.hp+' HP':' '+p.score+' '+t('score')} • ${p.hintsUsed||0} ${t('hints')}`).join(' • ')}</p><div className="match-pedagogy-v34">{room.finishSummary?.[me?.token]||statusText()}</div><div className="match-result-actions-v34"><button className="secondary-btn" onClick={()=>setShowMatchReview(v=>!v)}><PixelIcon name="book" size={14}/><span>{showMatchReview?t('close'):t('viewSolution')}</span></button><button className="primary-btn primary-btn-v26" onClick={()=>socket.emit('rematch')}><PixelIcon name="retry" size={16}/><span>{t('rematch')}</span></button></div>{showMatchReview&&room.decisiveQuestion&&<div className="match-review-v34"><span>{t('questionReview')}</span><h3>{room.decisiveQuestion.text}</h3><b>{t('expected')}: {room.decisiveQuestion.answer}</b><p>{room.decisiveQuestion.explanation}</p><small>{room.decisiveQuestion.concept}</small></div>}</div>}
    </div>}
  </div>;
}
