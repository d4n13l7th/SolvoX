const express=require('express');
const http=require('http');
const path=require('path');
const os=require('os');
const crypto=require('crypto');
const fs=require('fs');
const {Server}=require('socket.io');
const questions=require('./questions');

const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:true,credentials:false},transports:['websocket','polling']});

// REST CORS: needed when the frontend is hosted apart from this server (e.g.
// static frontend on Vercel). Socket.IO handles its own CORS above.
const ALLOWED_ORIGINS=(process.env.CORS_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
app.use((req,res,next)=>{
  const origin=req.headers.origin;
  if(origin&&(ALLOWED_ORIGINS.length===0||ALLOWED_ORIGINS.includes(origin))){
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
  }
  if(req.method==='OPTIONS')return res.sendStatus(204);
  next();
});
const PORT=process.env.PORT||3000;
const rooms=new Map();
const ROOM_GRACE_MS=30000;
const TURN_MS=45000;
const TOTAL_QUESTIONS=10;
const DAMAGE_PER_CORRECT=20;

const CHARACTERS={
  mage:{id:'mage',name:'Arcane Mage',icon:'pixelMage',hp:100,color:'#8b5cf6'},
  ninja:{id:'ninja',name:'Shadow Ninja',icon:'pixelNinja',hp:100,color:'#334155'},
  robot:{id:'robot',name:'Byte Robot',icon:'pixelRobot',hp:100,color:'#06b6d4'},
  elf:{id:'elf',name:'Forest Elf',icon:'pixelElf',hp:100,color:'#22c55e'},
  hero:{id:'hero',name:'Sky Hero',icon:'pixelHero',hp:100,color:'#3b82f6'},
  dragon:{id:'dragon',name:'Dragon Knight',icon:'pixelDragon',hp:100,color:'#ef4444'}
};
function cleanName(v,fallback='Player'){return String(v||fallback).trim().slice(0,18)||fallback;}
function cleanLevel(v){const n=Number(v);return questions[n]?n:1;}
function cleanToken(v){return String(v||'').trim().slice(0,80);}
function makeCode(){let code;do code='AJM-'+Math.random().toString(36).slice(2,6).toUpperCase();while(rooms.has(code));return code;}
function makeToken(){return crypto.randomBytes(18).toString('hex');}
function normalizeAnswer(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,'').replace(/×/g,'*').replace(/−/g,'-').replace(/²/g,'^2').replace(/^x=/,'').replace(/^ans(?:wer)?=/,'');}
function isCorrect(q,value){const given=normalizeAnswer(value);const accepted=(q.acceptedAnswers||[q.answer]).map(normalizeAnswer);return accepted.includes(given);}
function sanitizeQuestion(q){if(!q)return null;return {id:q.id,context:q.context,text:q.text,explanation:q.explanation,concept:q.concept,hints:q.hints||[],difficulty:q.difficulty};}
function sanitizeReviewQuestion(q){if(!q)return null;return {id:q.id,context:q.context,text:q.text,answer:q.answer,explanation:q.explanation,concept:q.concept};}
function publicRoom(room){
  const currentTurn=room.turnToken?room.players.find(p=>p.token===room.turnToken):null;
  return {code:room.code,status:room.status,mode:room.mode,levelId:room.levelId,questionIndex:room.questionIndex,totalQuestions:room.totalQuestions,round:room.round,startedAt:room.startedAt||null,turnStartedAt:room.turnStartedAt,turnDuration:TURN_MS,currentTurnToken:room.turnToken||null,currentTurnName:currentTurn?.name||null,players:room.players.map(p=>({id:p.id,token:p.token,name:p.name,character:p.character,ready:p.ready,hp:p.hp,connected:p.connected,score:p.score,correct:p.correct,answered:p.answered||0,hintsUsed:p.hintsUsed||0,turnAnswer:room.turnAnswers?.[p.token]?.submitted||false})),question:room.started?sanitizeQuestion(room.questions[room.questionIndex]):null,answered:Object.fromEntries(Object.entries(room.turnAnswers||{}).map(([id,v])=>[id,{correct:v.correct,submitted:v.submitted}])),winner:room.winner,lang:room.lang||'id',questionSource:room.questionSource||'fallback',statusKey:room.statusKey||'WAITING',statusName:room.statusName||null,finishSummary:room.finishSummary||null,decisiveQuestion:room.status==='finished'?room.decisiveQuestion:null,combatEvent:room.combatEvent||null};
}
function broadcast(room,event='room:update'){io.to(room.code).emit(event,publicRoom(room));}
function clearTimer(room){if(room.timer)clearTimeout(room.timer);room.timer=null;}
function freshQuestions(levelId,lang){
  return {questions:questions.fallbackGenerate(levelId,TOTAL_QUESTIONS,lang),source:'local'};
}

const DATA_DIR=path.join(__dirname,'..','data');
const MATCH_LOG=path.join(DATA_DIR,'multiplayer.jsonl');
function appendJsonLine(file,payload){fs.mkdirSync(DATA_DIR,{recursive:true});fs.appendFileSync(file,JSON.stringify(payload)+'\n');}
function readJsonLines(file){if(!fs.existsSync(file))return [];return fs.readFileSync(file,'utf8').split(/\r?\n/).filter(Boolean).map(line=>{try{return JSON.parse(line)}catch{return null}}).filter(Boolean);}
function recordFinishedMatch(room){if(room.recorded||!room.startedAt||room.players.length<2)return;room.recorded=true;const winnerToken=room.winner;const finishedAt=Date.now();room.players.forEach(player=>{const answered=Math.max(0,Number(player.answered)||0);const correct=Math.max(0,Number(player.correct)||0);appendJsonLine(MATCH_LOG,{type:'multiplayer_match',ts:new Date(finishedAt).toISOString(),matchId:room.code,levelId:room.levelId,mode:room.mode,player:player.name,opponent:room.players.find(p=>p.token!==player.token)?.name||'—',answered,correct,accuracy:answered?Math.round(correct/answered*100):0,score:Number(player.score)||0,hpRemaining:Number(player.hp)||0,wins:winnerToken===player.token?1:0,draw:winnerToken==='draw'?1:0,losses:winnerToken!==player.token&&winnerToken!=='draw'?1:0,durationSec:Math.max(0,Math.round((finishedAt-room.startedAt)/1000)),totalQuestions:room.totalQuestions,hintsUsed:Number(player.hintsUsed)||0,decisiveQuestion:room.decisiveQuestion?.id||null,decisiveConcept:room.decisiveQuestion?.concept||null});});}
async function startBattle(room){
  if(room.generating)return;
  room.generating=true;room.status='generating';room.statusKey='GENERATING_QUESTIONS';room.statusName=null;broadcast(room,'game:generating');
  const pack=freshQuestions(room.levelId,room.lang);
  room.questions=pack.questions;room.questionSource=pack.source;room.generating=false;room.status='battle';room.started=true;room.startedAt=Date.now();room.recorded=false;room.questionIndex=0;room.round=1;room.turnAnswers={};room.turnToken=room.mode==='score'?null:room.players[0].token;room.turnStartedAt=Date.now();room.winner=null;room.players.forEach(p=>{p.hp=100;p.score=0;p.correct=0;p.answered=0;p.hintsUsed=0;p.ready=true;p.lastMistake=null;p.hintLevels=[];});room.mode==='score'?scheduleScoreRound(room):scheduleTurn(room);broadcast(room,'game:start');
}
function scheduleTurn(room){clearTimer(room);room.timer=setTimeout(()=>advanceTurn(room,true),TURN_MS+250);}
function scheduleScoreRound(room){clearTimer(room);room.timer=setTimeout(()=>advanceScoreRound(room,true),TURN_MS+250);}
function clearTurnAnswers(room){room.turnAnswers={};}
function advanceTurn(room,timeout=false){
  if(!rooms.has(room.code)||room.status!=='battle')return;
  clearTimer(room);
  const p=room.players.find(x=>x.token===room.turnToken);
  if(timeout&&!room.turnAnswers[p?.token]){room.turnAnswers[p.token]={submitted:true,correct:false,timeout:true,answer:''};room.statusKey='TURN_TIMEOUT';room.statusName=p?.name||null;}
  const idx=room.players.findIndex(x=>x.token===room.turnToken);
  if(idx<room.players.length-1){room.turnToken=room.players[idx+1].token;room.turnStartedAt=Date.now();room.statusKey='TURN_CHANGED';room.statusName=room.players[idx+1].name;broadcast(room,'turn:next');room.combatEvent=null;scheduleTurn(room);return;}
  resolveRound(room);
}
function advanceScoreRound(room,timeout=false){
  if(!rooms.has(room.code)||room.status!=='battle'||room.mode!=='score')return;
  clearTimer(room);
  if(timeout){for(const p of room.players){if(!room.turnAnswers[p.token])room.turnAnswers[p.token]={submitted:true,correct:false,timeout:true,answer:''};}room.statusKey='TIME_UP';}
  const p1=room.players[0],p2=room.players[1];
  const both=room.turnAnswers[p1.token]?.submitted&&room.turnAnswers[p2.token]?.submitted;
  if(!timeout&&!both)return;
  room.statusName=null;
  setTimeout(()=>{
    if(!rooms.has(room.code)||room.status!=='battle')return;
    if(room.questionIndex>=room.questions.length-1){finishRoom(room);return;}
    room.questionIndex++;room.round++;room.turnAnswers={};room.turnStartedAt=Date.now();room.statusKey='NEW_ROUND';broadcast(room,'round:next');scheduleScoreRound(room);
  },700);
}
function resolveRound(room){
  const p1=room.players[0],p2=room.players[1];
  const a1=room.turnAnswers[p1.token],a2=room.turnAnswers[p2.token];
  const q=room.questions[room.questionIndex];
  if(a1?.correct){p1.score=(p1.score||0)+1;p1.correct+=1;p2.hp=Math.max(0,p2.hp-DAMAGE_PER_CORRECT);room.decisiveQuestion=sanitizeReviewQuestion(q);room.combatEvent={token:p1.token,target:p2.token,damage:DAMAGE_PER_CORRECT,seq:Date.now(),kind:'hit'};}
  if(a2?.correct){p2.score=(p2.score||0)+1;p2.correct+=1;p1.hp=Math.max(0,p1.hp-DAMAGE_PER_CORRECT);room.decisiveQuestion=sanitizeReviewQuestion(q);room.combatEvent={token:p2.token,target:p1.token,damage:DAMAGE_PER_CORRECT,seq:Date.now()+1,kind:'hit'};}
  if(!a1?.correct&&a1?.submitted){p1.lastMistake={questionIndex:room.questionIndex,concept:q?.concept||'—',answer:a1.answer,correctAnswer:q?.answer,explanation:q?.explanation};}
  if(!a2?.correct&&a2?.submitted){p2.lastMistake={questionIndex:room.questionIndex,concept:q?.concept||'—',answer:a2.answer,correctAnswer:q?.answer,explanation:q?.explanation};}
  room.statusKey=(!a1?.correct&&!a2?.correct)?'BOTH_WRONG':'ROUND_RESOLVED';
  broadcast(room,'round:resolved');
  setTimeout(()=>{
    if(!rooms.has(room.code)||room.status!=='battle')return;
    if(room.questionIndex>=room.questions.length-1||p1.hp<=0||p2.hp<=0){finishRoom(room);return;}
    room.questionIndex++;room.round++;clearTurnAnswers(room);room.turnToken=p1.token;room.turnStartedAt=Date.now();room.statusKey='NEW_ROUND';room.combatEvent=null;broadcast(room,'round:next');scheduleTurn(room);
  },1000);
}
function finishRoom(room,winnerOverride=null){
  clearTimer(room);room.status='finished';room.turnStartedAt=null;
  if(winnerOverride)room.winner=winnerOverride;
  else if(room.mode==='score'){
    if(room.players[0].score!==room.players[1].score) room.winner=room.players[0].score>room.players[1].score?room.players[0].token:room.players[1].token;
    else if((room.players[0].hintsUsed||0)!==(room.players[1].hintsUsed||0)) room.winner=(room.players[0].hintsUsed||0)<(room.players[1].hintsUsed||0)?room.players[0].token:room.players[1].token;
    else room.winner='draw';
  } else {
    if(room.players[0].hp!==room.players[1].hp) room.winner=room.players[0].hp>room.players[1].hp?room.players[0].token:room.players[1].token;
    else if((room.players[0].hintsUsed||0)!==(room.players[1].hintsUsed||0)) room.winner=(room.players[0].hintsUsed||0)<(room.players[1].hintsUsed||0)?room.players[0].token:room.players[1].token;
    else if((room.players[0].score||0)!==(room.players[1].score||0)) room.winner=room.players[0].score>room.players[1].score?room.players[0].token:room.players[1].token;
    else room.winner='draw';
  }
  const winner=room.players.find(p=>p.token===room.winner);
  const tieBreak=(room.winner!=='draw' && room.players[0].hintsUsed!==room.players[1].hintsUsed && ((room.mode==='score'&&room.players[0].score===room.players[1].score)||(room.mode==='turn'&&room.players[0].hp===room.players[1].hp)));
  room.finishSummary={};
  room.players.forEach(p=>{
    const opponent=room.players.find(x=>x.token!==p.token); const en=room.lang==='en';
    if(room.winner==='draw') room.finishSummary[p.token]=en?`Match finished! It is a draw. Final results and hint usage are equal (${p.hintsUsed||0}).`:`Pertandingan Selesai! Seri. Hasil akhir dan jumlah hint sama (${p.hintsUsed||0}).`;
    else if(p.token===room.winner) room.finishSummary[p.token]=tieBreak?(en?`Match finished! You win the tie-break by using fewer hints (${p.hintsUsed||0} vs ${opponent?.hintsUsed||0}). Review the explanation below.`:`Pertandingan Selesai! Kamu menang pada tie-break karena menggunakan hint lebih sedikit (${p.hintsUsed||0} vs ${opponent?.hintsUsed||0}). Lihat pembahasan di bawah.`):(en?`Match finished! You win ${room.mode==='score'?`${p.score||0} points`:`with ${p.hp||0} HP remaining`}. Review the deciding question below.`:`Pertandingan Selesai! Kamu menang ${room.mode==='score'?`${p.score||0} poin`:`dengan ${p.hp||0} HP tersisa`}. Lihat soal penentunya di bawah.`);
    else {
      const diff=room.mode==='score'?Math.abs((winner?.score||0)-(p.score||0)):Math.abs((winner?.hp||0)-(p.hp||0));
      const q=p.lastMistake?{id:p.lastMistake.questionIndex+1,text:room.questions[p.lastMistake.questionIndex]?.text,concept:p.lastMistake.concept,answer:p.lastMistake.correctAnswer,explanation:p.lastMistake.explanation}:room.decisiveQuestion;
      room.finishSummary[p.token]=q?(en?`Match finished! You lost by ${room.mode==='score'?`${diff} point${diff===1?'':'s'}`:`${diff} HP`} because of a mistake on Question ${q.id} (${q.concept}). Click View Solution to review the key and steps.`:`Pertandingan Selesai! Kamu kalah ${room.mode==='score'?`${diff} poin`:`${diff} HP`} dari lawan karena keliru di Soal No. ${q.id} (${q.concept}). Klik Lihat Pembahasan untuk melihat kunci dan langkahnya.`):(en?`Match finished! Your opponent had the stronger final result. Review the explanation to reinforce the concepts you need most.`:`Pertandingan Selesai! Lawan memiliki hasil akhir lebih tinggi. Lihat pembahasan untuk memperkuat konsep yang perlu kamu latih.`);
    }
  });
  room.statusKey=room.winner==='draw'?'DRAW':'MATCH_FINISHED'; room.combatEvent=null; recordFinishedMatch(room); broadcast(room,'game:finished');
}

function findPlayer(room,socket){return room?.players.find(p=>p.id===socket.id||(socket.data.playerToken&&p.token===socket.data.playerToken));}
function rebindSocket(room,player,socket){player.id=socket.id;player.connected=true;if(player.disconnectTimer)clearTimeout(player.disconnectTimer);player.disconnectTimer=null;socket.join(room.code);socket.data.roomCode=room.code;socket.data.playerToken=player.token;}

const FRONTEND_DIST=path.join(__dirname,'..','frontend','dist');
app.use(express.json({limit:'128kb'}));
app.use(express.static(FRONTEND_DIST));
app.post('/api/questions/generate',(req,res)=>{
  const chapterId=cleanLevel(req.body?.chapterId);const lang=req.body?.lang==='en'?'en':'id';
  try{const pack=freshQuestions(chapterId,lang);res.json({ok:true,chapterId,lang,totalQuestions:pack.questions.length,source:pack.source,questions:pack.questions});}
  catch(e){res.status(500).json({ok:false,message:'Question generation failed'});}
});
app.post('/api/feedback',(req,res)=>{try{const d=path.join(__dirname,'..','data');fs.mkdirSync(d,{recursive:true});fs.appendFileSync(path.join(d,'feedback.jsonl'),JSON.stringify({type:'feedback',ts:new Date().toISOString(),...req.body})+'\n');res.json({ok:true});}catch(e){res.status(500).json({ok:false,message:'Feedback gagal disimpan'});}});
app.post('/api/evaluation',(req,res)=>{try{const d=path.join(__dirname,'..','data');fs.mkdirSync(d,{recursive:true});fs.appendFileSync(path.join(d,'evaluation.jsonl'),JSON.stringify({type:'evaluation',ts:new Date().toISOString(),...req.body})+'\n');res.json({ok:true});}catch(e){res.status(500).json({ok:false,message:'Evaluasi gagal disimpan'});}});
app.get('/api/player-profile',(req,res)=>{try{const name=String(req.query.name||'').trim().toLowerCase();if(!name)return res.json({ok:true,player:null});const rows=readJsonLines(MATCH_LOG).filter(r=>String(r.player||'').trim().toLowerCase()===name);if(!rows.length)return res.json({ok:true,player:null});const matches=rows.length;const wins=rows.reduce((n,r)=>n+(Number(r.wins)||0),0);const draws=rows.reduce((n,r)=>n+(Number(r.draw)||0),0);const losses=rows.reduce((n,r)=>n+(Number(r.losses)||0),0);const answered=rows.reduce((n,r)=>n+(Number(r.answered)||0),0);const correct=rows.reduce((n,r)=>n+(Number(r.correct)||0),0);const totalScore=rows.reduce((n,r)=>n+(Number(r.score)||0),0);const totalTime=rows.reduce((n,r)=>n+(Number(r.durationSec)||0),0);const totalHints=rows.reduce((n,r)=>n+(Number(r.hintsUsed)||0),0);const accuracy=answered?Math.round(correct/answered*100):0;const avgScore=matches?Math.round(totalScore/matches):0;const avgDuration=matches?Math.round(totalTime/matches):0;const avgHints=matches?Math.round(totalHints/matches*10)/10:0;res.json({ok:true,player:{name:rows[rows.length-1].player,matches,wins,draws,losses,answered,correct,accuracy,avgScore,avgDuration,totalHints,avgHints,lastPlayed:rows.map(r=>r.ts).sort().slice(-1)[0]}});}catch(e){res.status(500).json({ok:false,message:'Profil pemain gagal dimuat'});}});
app.get('/api/dashboard',(req,res)=>{try{const limit=Math.max(1,Math.min(100,Number(req.query.limit)||30));const rows=readJsonLines(MATCH_LOG);const players=new Map();for(const row of rows){const key=String(row.player||'Player').trim().toLowerCase()||'player';const item=players.get(key)||{name:row.player,matches:0,wins:0,draws:0,losses:0,totalCorrect:0,totalAnswered:0,totalScore:0,totalAccuracy:0,totalHints:0,lastPlayed:row.ts};item.matches++;item.wins+=row.wins||0;item.draws+=row.draw||0;item.losses+=row.losses||0;item.totalCorrect+=row.correct||0;item.totalAnswered+=row.answered||0;item.totalScore+=row.score||0;item.totalAccuracy+=row.accuracy||0;item.totalHints+=row.hintsUsed||0;if(new Date(row.ts)>new Date(item.lastPlayed))item.lastPlayed=row.ts;players.set(key,item);}const leaderboard=[...players.values()].map(item=>({...item,accuracy:item.matches?Math.round(item.totalAccuracy/item.matches):0,avgScore:item.matches?Math.round(item.totalScore/item.matches):0,answerRate:item.totalAnswered?Math.round(item.totalCorrect/item.totalAnswered*100):0,avgHints:item.matches?Math.round(item.totalHints/item.matches*10)/10:0})).sort((a,b)=>(b.matches-a.matches)||(b.accuracy-a.accuracy)).slice(0,limit);res.json({ok:true,summary:{matches:Math.floor(rows.length/2),playerEntries:rows.length,uniquePlayers:players.size,totalAnswered:rows.reduce((n,x)=>n+(x.answered||0),0),avgAccuracy:rows.length?Math.round(rows.reduce((n,x)=>n+(x.accuracy||0),0)/rows.length):0,totalHints:rows.reduce((n,x)=>n+(x.hintsUsed||0),0)},players:leaderboard,recent:rows.slice(-limit).reverse()});}catch(e){res.status(500).json({ok:false,message:'Dashboard gagal dimuat'});}});
app.get('/health',(req,res)=>res.json({ok:true,rooms:rooms.size,transport:'socket.io',turnDuration:TURN_MS,questionsPerChapter:TOTAL_QUESTIONS,questionEngine:'local'}));
app.get('/api/characters',(req,res)=>res.json(Object.values(CHARACTERS)));
app.get('/api/levels',(req,res)=>res.json(Object.entries(questions).filter(([id])=>/^\d+$/.test(id)).map(([id,q])=>({id:Number(id),title:q.title,titleEn:q.titleEn,icon:q.icon,difficulty:q.difficulty,totalQuestions:TOTAL_QUESTIONS}))));
app.get('/api/lan',(req,res)=>res.json({port:PORT,hostnames:lanAddresses().map(ip=>`http://${ip}:${PORT}`)}));

io.on('connection',socket=>{
  socket.emit('server:info',{turnMs:TURN_MS,roomGraceMs:ROOM_GRACE_MS,questionsPerChapter:TOTAL_QUESTIONS,protocol:'turn-based'});
  socket.on('room:create',({name,character='mage',levelId=1,token,lang='id',mode='turn'}={})=>{
    const playerToken=cleanToken(token)||makeToken();const code=makeCode();const level=cleanLevel(levelId);
    const room={code,hostToken:playerToken,mode:mode==='score'?'score':'turn',status:'waiting',statusKey:'WAITING_PLAYER',levelId:level,lang:lang==='en'?'en':'id',questions:[],questionIndex:0,totalQuestions:TOTAL_QUESTIONS,round:0,turnAnswers:{},turnToken:null,turnStartedAt:null,winner:null,started:false,generating:false,questionSource:'fallback',timer:null,startedAt:null,recorded:false,players:[{id:socket.id,token:playerToken,name:cleanName(name,'Player 1'),character:CHARACTERS[character]?character:'mage',ready:false,hp:100,connected:true,score:0,correct:0,answered:0,hintsUsed:0,hintLevels:[],lastMistake:null,disconnectTimer:null}]};
    rooms.set(code,room);socket.join(code);socket.data.roomCode=code;socket.data.playerToken=playerToken;socket.emit('room:created',publicRoom(room));
  });
  socket.on('room:join',({code,name,character='ninja',token}={})=>{
    const room=rooms.get(String(code||'').trim().toUpperCase());if(!room)return socket.emit('room:error',{code:'ROOM_NOT_FOUND'});const playerToken=cleanToken(token);const existing=playerToken?room.players.find(p=>p.token===playerToken):null;if(existing){rebindSocket(room,existing,socket);broadcast(room);return socket.emit('room:reconnected',publicRoom(room));}
    if(room.players.length>=2)return socket.emit('room:error',{code:'ROOM_FULL'});if(room.status!=='waiting')return socket.emit('room:error',{code:'ROOM_STARTED'});const newToken=playerToken||makeToken();room.players.push({id:socket.id,token:newToken,name:cleanName(name,'Player 2'),character:CHARACTERS[character]?character:'ninja',ready:false,hp:100,connected:true,score:0,correct:0,answered:0,hintsUsed:0,hintLevels:[],lastMistake:null,disconnectTimer:null});socket.join(room.code);socket.data.roomCode=room.code;socket.data.playerToken=newToken;broadcast(room);
  });
  socket.on('player:ready',async({ready=true}={})=>{const room=rooms.get(socket.data.roomCode);if(!room)return;const p=findPlayer(room,socket);if(!p)return;p.ready=!!ready;if(room.players.length===2&&room.players.every(x=>x.ready&&x.connected))await startBattle(room);else broadcast(room);});
  socket.on('player:update',({name,character}={})=>{const room=rooms.get(socket.data.roomCode);if(!room||room.status!=='waiting')return;const p=findPlayer(room,socket);if(!p)return;if(name!==undefined)p.name=cleanName(name,p.name);if(character&&CHARACTERS[character])p.character=character;broadcast(room);});
  socket.on('turn:hint',()=>{
    const room=rooms.get(socket.data.roomCode);if(!room||room.status!=='battle'||room.mode!=='turn')return;
    const p=findPlayer(room,socket);if(!p||p.token!==room.turnToken)return;
    if((p.hintsUsed||0)>=2)return socket.emit('hint:result',{ok:false,code:'HINT_LIMIT'});
    const q=room.questions[room.questionIndex];if(!q?.hints?.length)return;
    const level=Math.min((p.hintsUsed||0)+1,q.hints.length);p.hintsUsed=(p.hintsUsed||0)+1;p.hintLevels=p.hintLevels||[];p.hintLevels.push(level);
    socket.emit('hint:result',{ok:true,level,text:q.hints[level-1],remaining:Math.max(0,2-p.hintsUsed)});
    broadcast(room,'turn:hint-used');
  });
  socket.on('answer:submit',({answer}={})=>{
    const room=rooms.get(socket.data.roomCode);if(!room||room.status!=='battle')return;const p=findPlayer(room,socket);if(!p||!p.connected)return;const q=room.questions[room.questionIndex];if(!q)return;
    if(room.mode==='turn'){
      if(p.token!==room.turnToken)return socket.emit('answer:result',{correct:false,code:'NOT_YOUR_TURN'});
      if(room.turnAnswers[p.token]?.submitted)return;
      const value=String(answer||'').trim();if(!value)return;const correct=isCorrect(q,value);p.answered=(p.answered||0)+1;if(!correct)p.lastMistake={questionIndex:room.questionIndex,concept:q.concept||'—',answer:value,correctAnswer:q.answer,explanation:q.explanation};if(correct)p.score=(p.score||0)+1;room.turnAnswers[p.token]={submitted:true,correct,answer:value,timeout:false};if(correct)room.combatEvent={token:p.token,target:room.players.find(x=>x.token!==p.token)?.token,damage:DAMAGE_PER_CORRECT,seq:Date.now(),kind:'hit'};room.statusKey=correct?'TURN_CORRECT':'TURN_WRONG';room.statusName=p.name;socket.emit('answer:result',{correct,explanation:q.explanation,correctAnswer:q.answer});broadcast(room,'turn:answer');
      setTimeout(()=>{if(rooms.has(room.code)&&room.status==='battle')advanceTurn(room,false);},700);
      return;
    }
    // Score Duel: both players get the same question and the full timer independently. No speed advantage.
    if(room.mode==='score'){
      if(room.turnAnswers[p.token]?.submitted)return;
      const value=String(answer||'').trim();if(!value)return;const correct=isCorrect(q,value);p.answered=(p.answered||0)+1;if(!correct)p.lastMistake={questionIndex:room.questionIndex,concept:q.concept||'—',answer:value,correctAnswer:q.answer,explanation:q.explanation};room.turnAnswers[p.token]={submitted:true,correct,answer:value,timeout:false};if(correct){p.score+=100;p.correct+=1;room.combatEvent={token:p.token,target:room.players.find(x=>x.token!==p.token)?.token,damage:10,seq:Date.now(),kind:'hit'};}room.statusKey=correct?'SCORE_CORRECT':'SCORE_WRONG';room.statusName=p.name;socket.emit('answer:result',{correct,explanation:q.explanation,correctAnswer:q.answer});broadcast(room,'score:answer');
      if(room.turnAnswers[room.players[0].token]?.submitted&&room.turnAnswers[room.players[1].token]?.submitted)advanceScoreRound(room,false);
    }
  });
  socket.on('rematch',async()=>{const room=rooms.get(socket.data.roomCode);if(!room||room.players.length!==2)return;room.status='waiting';room.started=false;room.startedAt=null;room.questions=[];room.questionIndex=0;room.round=0;room.turnAnswers={};room.turnToken=null;room.turnStartedAt=null;room.winner=null;room.recorded=false;room.statusKey='REMATCH_READY';room.players.forEach(p=>{p.ready=false;p.hp=100;p.score=0;p.correct=0;p.answered=0;p.hintsUsed=0;p.hintLevels=[];p.lastMistake=null;});broadcast(room,'rematch:ready');});
  socket.on('room:leave',()=>leaveRoom(socket,true));socket.on('disconnect',()=>leaveRoom(socket,false));
});
function leaveRoom(socket,explicit){const code=socket.data.roomCode;if(!code)return;const room=rooms.get(code);if(!room)return;const p=room.players.find(x=>x.id===socket.id||x.token===socket.data.playerToken);if(!p)return;if(explicit){room.players=room.players.filter(x=>x.token!==p.token);if(room.players.length===0){clearTimer(room);rooms.delete(code);return;}if(room.status==='battle')finishRoom(room,room.players[0].token);else{room.players[0].ready=false;broadcast(room,'player:left');}return;}p.connected=false;p.id='disconnected:'+p.token.slice(0,8);p.ready=false;room.statusKey='DISCONNECTED';broadcast(room,'player:disconnected');p.disconnectTimer=setTimeout(()=>{if(!rooms.has(code))return;const current=rooms.get(code);const idx=current.players.findIndex(x=>x.token===p.token);if(idx>=0)current.players.splice(idx,1);if(current.players.length===0){clearTimer(current);rooms.delete(code);}else{current.status='waiting';current.started=false;current.players[0].ready=false;current.statusKey='WAITING_PLAYER';broadcast(current,'player:left');}},ROOM_GRACE_MS);}
function lanAddresses(){const nets=os.networkInterfaces(),out=[];for(const name of Object.keys(nets))for(const net of nets[name]||[])if(net.family==='IPv4'&&!net.internal)out.push(net.address);return out;}
function sendSpa(req,res){return res.sendFile(path.join(FRONTEND_DIST,'index.html'));}
app.get(['/','/index.html','/game.html'],sendSpa);
app.get(/^(?!\/api(?:\/|$)).*/,sendSpa);
server.listen(PORT,'0.0.0.0',()=>{console.log(`\nSolvox berjalan di port ${PORT}`);console.log(`Local : http://localhost:${PORT}`);for(const ip of lanAddresses())console.log(`LAN   : http://${ip}:${PORT}`);console.log(`Question engine: local deterministic generator | ${TOTAL_QUESTIONS} questions per chapter`);console.log(`Multiplayer: turn-based ${TURN_MS/1000}s per player, ${TOTAL_QUESTIONS} questions, reconnect ${ROOM_GRACE_MS/1000}s.`);});
