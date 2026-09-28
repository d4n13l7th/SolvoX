const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

export function deriveProfile(progress={}){
  const runs=Array.isArray(progress.analytics)?progress.analytics:[];
  const completed=new Set((progress.completedLevels||[]).map(Number));
  const totalRuns=runs.length;
  const wins=runs.filter(r=>r.won).length;
  const losses=runs.filter(r=>!r.won).length;
  const draws=0;
  const questions=runs.reduce((sum,r)=>sum+(Array.isArray(r.questionLogs)?r.questionLogs.length:Number(r.totalQuestions)||0),0);
  const correct=runs.reduce((sum,r)=>sum+(Number(r.correct)||0),0);
  const timeSec=runs.reduce((sum,r)=>sum+(Number(r.timeSec)||0),0);
  const accuracy=questions?Math.round(correct/questions*100):0;
  const avgTime=questions?Math.round(timeSec/questions*10)/10:0;
  const masteryScores=runs.map(r=>Number(r.mastery)||0).filter(Boolean);
  const bestMastery=masteryScores.length?Math.max(...masteryScores):0;
  const bestAccuracy=runs.length?Math.max(...runs.map(r=>Number(r.accuracy)||0)):0;
  const conceptStats={};
  runs.forEach(run=>{
    (run.questionLogs||[]).forEach(q=>{
      const c=q.concept||'—';
      const bucket=conceptStats[c]||(conceptStats[c]={answered:0,correct:0,wrong:0});
      bucket.answered+=1; bucket.correct+=q.correct?1:0; bucket.wrong+=q.correct?0:1;
    });
  });
  const concepts=Object.entries(conceptStats).map(([concept,v])=>({...v,concept,accuracy:Math.round(v.correct/Math.max(1,v.answered)*100)}));
  const weakest=concepts.slice().sort((a,b)=>a.accuracy-b.accuracy || b.wrong-a.wrong)[0]||null;
  const strongest=concepts.slice().sort((a,b)=>b.accuracy-a.accuracy || b.correct-a.correct)[0]||null;
  const exp=Math.max(0,Number(progress.playerEXP)||0);
  const level=Math.max(1,Math.floor(exp/100)+1);
  const nextExp=level*100;
  const currentLevelExp=exp-(level-1)*100;
  const rank=level>=10?'Silver':level>=6?'Bronze': 'Novice';
  const rankScore=level>=10?'II':level>=6?'III':'I';
  const achievementChecks=[
    {id:'first-clear',label:'First Chapter Clear',ok:wins>=1},
    {id:'ten-questions',label:'10 Soal Terjawab',ok:questions>=10},
    {id:'sharp',label:'Accuracy 80%',ok:bestAccuracy>=80},
    {id:'boss',label:'Boss Defeated',ok:runs.some(r=>r.won && (Number(r.nextEnemyHp)||0)<=0)},
    {id:'campaign',label:'Campaign Complete',ok:completed.size>=5},
  ];
  const recent=runs.slice().sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,6);
  return {runs,totalRuns,wins,losses,draws,questions,correct,timeSec,accuracy,avgTime,bestMastery,bestAccuracy,concepts,weakest,strongest,completedCount:completed.size,totalChapters:5,exp,level,nextExp,currentLevelExp,rank,rankScore,achievements:achievementChecks,recent};
}
