// A single authored exchange supplies Parts 2, 3, 5, 6 and 7.
// Part 4 may only use its explicitly taught variation.
const clone=value=>JSON.parse(JSON.stringify(value));
function compile(base,tasks){
 const d=clone(base),old=clone(base),lang=d.language||'en',prefix=`micro-${lang}-d${d.course.day}`;
 if(!Array.isArray(tasks)||!tasks.length)throw Error('Missing small tasks');
 d.microVersion=1;
 d.previousFocusKey=old.course.id;
 d.previousLesson={key:old.course.id,legacyKeys:[...new Set([...(old.course.legacyKeys||[]),old.previousLesson?.key,...(old.previousLesson?.legacyKeys||[])].filter(Boolean))],missions:old.missions,pairs:old.pairs};
 d.originalPhrases=[...new Map([...old.phrases,...(old.support||[]),...old.rounds.flatMap(r=>r.advanced||[])].map(p=>[p.en,p])).values()];
 d.course.id=`travel-lab-${lang}-day${d.course.day}-micro-v1`;
 d.course.legacyKeys=[];
 d.course.revisedConversations=true;
 d.course.description=`每次只練 1～2 個核心說法，${tasks.length} 個小任務可分堂完成；同樣的對話反覆用到會，每輪各自回顧。`;
 d.course.labels=['這一輪：先試著說','這一輪：句子與短對話','這一輪：跟著做','這一輪：只換一個條件','這一輪：和老師練','這一輪：看看進步','這一輪：課後再練'];
 d.rounds=[];d.phrases=[];d.replies=[];d.flows=[];d.missions=[];d.pairs=[];d.quizzes=[];d.reviewTasks=[];d.support=[];
 d.answerTranslations={};d.course.skills=[];
 d.changeNotes=[];
 const meaning=(answer,zh)=>{if(!answer||!zh)throw Error(`Missing translation: ${answer}`);d.answerTranslations[answer]=zh;};
 const normalizeStep=(s,index,key)=>{
  for(const field of ['line','zh','task','answer','answerZh'])if(typeof s[field]!=='string'||!s[field].trim())throw Error(`${key}/${index}: missing ${field}`);
  if(!s.objects?.length||!s.valid?.length||s.valid.some(i=>!s.objects[i]))throw Error(`${key}/${index}: invalid choices`);
  meaning(s.answer,s.answerZh);
  if(s.when)throw Error(`${key}/${index}: hidden branches must be taught as explicit variations`);
  return {...clone(s),id:`${key}-${index}`,label:s.label||s.task,words:s.words||s.answer,askFirst:s.askFirst===true,effect:s.effect||'✓ 已更新任務卡；用同一句再練一次也可以。'};
 };
 const keys=new Set(),roundIds=new Set();
 for(const [i,spec] of tasks.entries()){
  if(keys.has(spec.key))throw Error('Duplicate task: '+spec.key);keys.add(spec.key);
  if(!spec.context||!spec.changeNote||!spec.variation?.task)throw Error('Incomplete task: '+spec.key);
  if(spec.steps.length<1||(!spec.isMerged&&spec.steps.length>2))throw Error('Each unmerged task needs 1–2 exchanges: '+spec.key);
  const id=spec.id||String.fromCharCode(65+i),key=`${prefix}-${spec.key}-v1`;
  if(!/^[A-Z][A-Z0-9]*$/.test(id)||roundIds.has(id))throw Error('Invalid or duplicate round id: '+id);
  roundIds.add(id);
  const steps=spec.steps.map((s,j)=>normalizeStep(s,j,key));
  const changes=spec.variation.steps.map((s,j)=>normalizeStep(s,j,key+'-change'));
  if(!spec.isMerged&&changes.length!==steps.length)throw Error('Variation cannot add a new exchange: '+spec.key);
  const answer=steps.map(s=>s.answer).join(' '),answerZh=steps.map(s=>s.answerZh).join(' ');
  const changeAnswer=changes.map(s=>s.answer).join(' '),changeZh=changes.map(s=>s.answerZh).join(' ');
  meaning(answer,answerZh);meaning(changeAnswer,changeZh);
  const words=steps.map(s=>s.words).join(' / ');
  const checkpoint={task:spec.context,words,answer,answerZh,review:'只看本輪目標：能否用已學的說法完成這段溝通？',skills:steps.map((s,j)=>({id:`${key}-skill-${j}`,text:`我能完成「${s.label.replace(/[。.]$/,'')}」這段對話。`}))};
  const r={id,key,name:spec.name,goal:spec.goal||spec.context,role:spec.role||old.course.replyRole,phraseIds:[],replyIds:[],flowIds:[d.flows.length],missionIds:[d.missions.length],pairIds:[d.pairs.length],reuse:[],words:spec.words||[],bridge:`本輪每次練 ${steps.length} 個說法，後面的操作與真人接話都用這一組。`,listen:'對方回話先聽懂即可，不要求背誦。',checkpoint,variation:{task:spec.variation.task,steps:changes},hearLines:[],variationMode:spec.variationMode||'change',coreNote:spec.coreNote||spec.extraNotes||'',chapter:spec.chapter||null};
  if(spec.sourceIds)Object.assign(r,{sourceIds:clone(spec.sourceIds),merged:!!spec.isMerged});
  steps.forEach((s,j)=>{
   const phrase={id:`${key}-phrase-${j}`,use:s.label,en:s.answer,zh:s.answerZh};
   if(s.foodKind){
    phrase.illustratedOptions=clone(require('./day6-food-options.cjs')[s.foodKind]);
    phrase.substitutions=[{target:s.answer.replace(', please.',''),options:phrase.illustratedOptions.map(o=>[o.en,o.zh])}];
   }
   d.phrases.push(phrase);r.phraseIds.push(phrase.id);
   r.replyIds.push(d.replies.length);
   d.replies.push({...s,id:`${key}-reply-${j}`,name:s.label,listen:'認出這段已學過的話，再練自己的句子。',options:s.objects.map(x=>x[1]),correct:s.valid[0],why:s.zh,change:'同一段再說一次，試著少看一層提示。',changeWords:s.words,changeAnswer:s.answer});
   if(!r.hearLines.some(p=>p.en===s.line))r.hearLines.push({en:s.line,zh:s.zh,sources:['② 短對話','③ 操作','⑤ 真人接話'],...s.role?{role:s.role}:{}});
  });
  d.flows.push({id:key,name:`${id}｜${spec.name}`,desc:spec.context,context:spec.context,summary:'用剛才同樣的說法，再把這個小任務說一次；還不熟就重練。',sceneTitle:spec.name,sceneIcon:spec.icon||old.flows[0]?.sceneIcon||'🧭',generic:true,steps});
  d.missions.push({id:key+'-change',name:`${id}｜${r.variationMode==='repeat'?'收起提示，再說一次':r.variationMode==='core'?'練另一段已學對話':'只換一個條件'}`,task:spec.variation.task,words:changes.map(s=>s.words).join(' / '),answer:changeAnswer,answerZh:changeZh,check:'有用第二部分已學的說法，完成這段溝通嗎？不必逐字一樣。'});
  const first=steps[0];
  d.pairs.push({id:key+'-live',name:`${id}｜和老師再練同一段`,role:`學生扮演情境中的旅客，老師當${r.role}；師生共看畫面。`,first:first.askFirst?'學生':'老師',opening:first.askFirst?first.answerZh:first.zh,start:first.askFirst?'':first.line,next:'依序完成本輪的短對話。老師沿用剛才聽過的回話，學生可看關鍵字；熟悉後再收起提示。',objects:spec.context,goals:steps.map(s=>s.label),tags:spec.context,cards:steps.map(s=>[s.askFirst?`學生${s.label}後`:`接著請學生${s.label}`,s.line,s.zh]),words,answer,answerZh});
  r.primaryPhraseIds=[...r.phraseIds];
  r.primaryReplyIds=[...r.replyIds];
  if(r.variationMode==='core'){
   for(const [j,s]of changes.entries()){
    if(!r.phraseIds.some(id=>d.phrases.find(p=>p.id===id)?.en===s.answer)){
     const p={id:key+'-alternative-phrase-'+j,use:s.label,en:s.answer,zh:s.answerZh};d.phrases.push(p);r.phraseIds.push(p.id);
    }
    if(!r.hearLines.some(p=>p.en===s.line))r.hearLines.push({en:s.line,zh:s.zh,sources:['② 短對話','③ 另一情境','⑤ 真人接話'],...s.role?{role:s.role}:{}});
    if(!steps.some(x=>x.answer===s.answer&&x.line===s.line)){
     r.replyIds.push(d.replies.length);d.replies.push({...s,id:key+'-alternative-reply-'+j,name:s.label+'（另一種回答）',listen:'同樣先教，再練習。',options:s.objects.map(x=>x[1]),correct:s.valid[0],why:s.zh,change:'收起提示，重複這段已學的接話。',changeWords:s.words,changeAnswer:s.answer});
    }
   }
   r.flowIds.push(d.flows.length);
   d.flows.push({id:key+'-alternative',name:`${id}｜另一個已學情境`,desc:spec.variation.task,context:spec.variation.task,summary:'這個情境使用第二部分已教過的說法；再練一次，試著少看提示。',sceneTitle:spec.name,sceneIcon:spec.icon||old.flows[0]?.sceneIcon||'🧭',generic:true,steps:changes});
   const firstChange=changes[0],changeWords=changes.map(s=>s.words).join(' / ');
   r.pairIds.push(d.pairs.length);
   d.pairs.push({id:key+'-alternative-live',name:`${id}｜和老師練另一個已學情境`,role:`學生扮演旅客，老師當${r.role}。`,first:firstChange.askFirst?'學生':'老師',opening:firstChange.askFirst?firstChange.answerZh:firstChange.zh,start:firstChange.askFirst?'':firstChange.line,next:'沿用第二部分已教過的這組問答。兩種情境分次練，不把不同回答連著說。',objects:spec.variation.task,goals:changes.map(s=>s.label),tags:spec.variation.task,cards:changes.map(s=>[s.askFirst?`學生${s.label}後`:`請學生${s.label}`,s.line,s.zh]),words:changeWords,answer:changeAnswer,answerZh:changeZh});
   r.alternativeCheckpoint={...clone(checkpoint),task:spec.variation.task,words:changeWords,answer:changeAnswer,answerZh:changeZh};
   r.bridge=`本輪有 ${r.phraseIds.length} 種說法；每個情境只用 ${steps.length} 句，兩種情境分次練。`;
  }
  if(spec.additionalVariations?.length){
   r.additionalVariations=spec.additionalVariations.map((v,j)=>{
    if(!v.task||!v.steps?.length||(!spec.isMerged&&v.steps.length>2))throw Error('Invalid extra variation: '+spec.key);
    const extraKey=key+'-additional-change-'+j,extraSteps=v.steps.map((s,k)=>normalizeStep(s,k,extraKey));
    const extraAnswer=extraSteps.map(s=>s.answer).join(' '),extraZh=extraSteps.map(s=>s.answerZh).join(' ');
    meaning(extraAnswer,extraZh);
    const missionId=d.missions.length;
    r.missionIds.push(missionId);
    d.missions.push({id:extraKey,name:`${id}｜${v.condition||'再換一個條件'}`,task:v.task,words:extraSteps.map(s=>s.words).join(' / '),answer:extraAnswer,answerZh:extraZh,check:'沿用第二部分先看過的這組對話，依本次條件回答。'});
    return {task:v.task,steps:extraSteps,missionId};
   });
  }
  const qstep=steps.find(s=>s.line.length>8)||steps[0],distractor=steps.find(s=>s.zh!==qstep.zh)?.zh||'請你改天再來。';
  const quiz={id:key+'-listen',line:qstep.line,zh:qstep.zh,question:'這句已學過的回話，意思是什麼？',task:'聽懂本輪的回話',options:[qstep.zh,distractor],correct:0,feedback:qstep.zh,why:qstep.zh};
  r.home={quiz,task:spec.context,words,answer,answerZh};
  if(spec.homeQuizSteps){
   r.home.quizzes=spec.homeQuizSteps.map((s,j)=>({...quiz,id:key+'-listen-'+j,line:s.line,zh:s.zh,options:[s.zh,s.distractor],feedback:s.zh,why:s.zh}));
   r.home.quiz=r.home.quizzes[0];
  }
  if(spec.isMerged)r.bridge=`同一個任務包含 ${r.phraseIds.length} 個主要說法；先一起看過，再依示範順序反覆接話。`;
  d.quizzes.push(...r.home.quizzes||[quiz]);d.course.skills.push(...checkpoint.skills);d.rounds.push(r);
  d.changeNotes.push({id,name:spec.name,change:spec.changeNote,speaking:steps.map(s=>s.answer),listening:steps.map(s=>s.line),variation:spec.variation.task});
 }
 Object.assign(d.course,{task:d.rounds[0].checkpoint.task,words:d.rounds[0].checkpoint.words,answer:d.rounds[0].checkpoint.answer,review:d.rounds[0].checkpoint.review});
 Object.assign(d,{homeTask:d.rounds[0].home.task,homeWords:d.rounds[0].home.words,homeAnswer:d.rounds[0].home.answer});
 if(tasks.some(t=>t.chapter)){
  const groups=new Map();
  tasks.forEach((t,i)=>{const c=t.chapter||{id:'single-'+d.rounds[i].id,name:d.rounds[i].name,order:i,position:0,description:d.rounds[i].goal};if(!groups.has(c.id))groups.set(c.id,{...c,roundIds:[]});groups.get(c.id).roundIds.push(d.rounds[i].id);});
  d.course.taskGroups=[...groups.values()].sort((a,b)=>a.order-b.order).map(g=>({...g,roundIds:g.roundIds.sort((a,b)=>(tasks[d.rounds.findIndex(r=>r.id===a)].chapter?.position||0)-(tasks[d.rounds.findIndex(r=>r.id===b)].chapter?.position||0))}));
  d.course.description=`${d.course.taskGroups.length} 個章節，每章分小輪反覆練習；一輪熟悉後再往下，回顧只包含已學內容。`;
 }
 if(tasks.some(t=>t.variationMode==='repeat'))d.course.labels[3]='這一輪：用已學的句子練';
 return d;
}
// Display letters follow the current task order. Keep IDs and storage keys
// stable so renaming a task never moves a student's answers to another task.
function labelTasks(data){
 data.rounds.forEach((round,index)=>{
  round.displayLabel=String.fromCharCode(65+index);
  for(const [ids,items]of [['flowIds','flows'],['missionIds','missions'],['pairIds','pairs']]){
   for(const id of round[ids]){
    const item=data[items][id],prefix=round.id+'｜';
    if(item.name.startsWith(prefix))item.name=round.displayLabel+'｜'+item.name.slice(prefix.length);
   }
  }
 });
 return require('./entry-checkpoints.cjs').addEntryCheckpoints(data);
}
function make(day,options={}){
 const base=day===2?require('./day2-expanded.cjs'):require('./curriculum-rounds.cjs').make(day);
 const group=day<=6?'2-6':day<=10?'7-10':'11-14';
 let tasks=require(`./micro-days-${group}.cjs`)[day](clone(base));
 if(day>=2&&day<=6)tasks=require('./approved-task-edits.cjs')(day,tasks);
 if(day===7)tasks=require('./approved-task-edits-day7.cjs')(tasks);
 if(day===8)tasks=require('./approved-task-edits-day8.cjs')(day,tasks);
 if(day===9)tasks=require('./approved-task-edits-day9.cjs')(day,tasks);
 if(day===10)tasks=require('./approved-task-edits-day10.cjs')(day,tasks);
 if(day===11)tasks=require('./approved-task-edits-day11.cjs')(day,tasks);
 const d=compile(base,tasks);
 if(day>=2&&day<=6){d.previousFocusKey=`travel-lab-en-day${day}-micro-v1`;d.course.id=`travel-lab-en-day${day}-micro-v2`;d.course.revision='approved-edits-2026-10';}
 if(day===2){
  d.previousLesson.legacyKeys=[...new Set([d.previousFocusKey,...d.previousLesson.legacyKeys])];
  d.previousFocusKey=d.course.id;d.course.id='travel-lab-en-day2-micro-v3';d.course.revision='day2-clothing-removed-v3';
  const removed=new Set(['I’m looking for a T-shirt.','I’d like the blue T-shirt.','Do you have this in medium?','Can I try it on?']);
  d.originalPhrases=d.originalPhrases.filter(phrase=>!removed.has(phrase.en));
 }
 if(day===5||day===6){d.previousLesson.legacyKeys=[...new Set([d.previousFocusKey,...d.previousLesson.legacyKeys])];d.previousFocusKey=d.course.id;d.course.id=`travel-lab-en-day${day}-micro-v3`;d.course.revision='restored-variations-v3';}
 if(day===9){d.previousFocusKey=d.course.id;d.course.id='travel-lab-en-day9-micro-v2';d.course.revision='approved-day9-groups-v2';}
 if(day===10){d.previousFocusKey=d.course.id;d.course.id='travel-lab-en-day10-micro-v2';d.course.revision='approved-day10-groups-v2';d.course.title='禮貌請求與婉拒邀請';}
 if(day===11){d.previousFocusKey=d.course.id;d.course.id='travel-lab-en-day11-micro-v2';d.course.revision='approved-day11-groups-v2';}
 if(options.merge===false)return d;
 const mergedSpecs=require('./merge-approved-tasks.cjs')(day,tasks);
 if(!mergedSpecs)return labelTasks(d);
 const combined=compile(base,mergedSpecs);
 combined.mergedVersion=1;
 combined.previousFocusKey=d.course.id;
 combined.previousLesson={...clone(d.previousLesson),legacyKeys:[...new Set([d.previousFocusKey,...d.previousLesson.legacyKeys])].filter(Boolean)};
 combined.originalPhrases=clone(d.originalPhrases);
 combined.course.title=d.course.title;
 combined.course.id=`travel-lab-en-day${day}-merged-v1`;
 combined.course.mergedTasks=true;
 combined.course.revision='approved-merged-tasks-v1';
 if(day===2){
  combined.course.id='travel-lab-en-day2-merged-v2';combined.course.revision='day2-clothing-removed-v2';
  combined.previousLesson.legacyKeys=[...new Set(['travel-lab-en-day2-merged-v1',...combined.previousLesson.legacyKeys])];
 }
 delete combined.course.taskGroups;
 combined.course.description=`${combined.rounds.length} 個完整任務；同任務的句子一起學，依序接話並反覆練習，再回顧同一組內容。`;
 combined.course.labels=['這個任務：先試著說','這個任務：句子與對話','這個任務：完整接話','這個任務：練已學變化','這個任務：和老師練','這個任務：看看進步','這個任務：課後再練'];
 return labelTasks(combined);
}
module.exports={compile,make};
