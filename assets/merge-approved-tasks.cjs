// Turn the approved chapter groups into actual tasks. English stays authored in
// the source tasks; this layer only joins their flows and preserves variations.
const clone=value=>JSON.parse(JSON.stringify(value));
const contexts=require('./merged-task-contexts.cjs');
const distinct=(items,key)=>[...new Map(items.map(item=>[key(item),item])).values()];
const exchangeKey=s=>JSON.stringify([s.role,s.answer,s.answerZh,s.line,s.zh,!!s.askFirst]);

function mergeApprovedTasks(day,tasks){
 const sources=tasks.map((task,index)=>({...clone(task),id:task.id||String.fromCharCode(65+index)}));
 const groups=new Map();
 sources.forEach((task,index)=>{
  const chapter=task.chapter||{id:'single-'+task.id,name:task.name,order:index,position:0};
  if(!groups.has(chapter.id))groups.set(chapter.id,{chapter,members:[]});
  groups.get(chapter.id).members.push(task);
 });
 if(![...groups.values()].some(g=>g.members.length>1))return null;
 return [...groups.values()].sort((a,b)=>a.chapter.order-b.chapter.order).map(({chapter,members})=>{
  members.sort((a,b)=>(a.chapter?.position||0)-(b.chapter?.position||0));
  const sourceIds=members.map(t=>t.id);
  if(members.length===1){const task={...members[0],sourceIds};delete task.chapter;return task;}
  const guide=contexts[day]?.[chapter.id];
  if(!guide)throw Error('Missing merged task context: '+day+'/'+chapter.id);
  const annotate=(task,steps,variant=false)=>steps.map((step,index)=>({
   ...clone(step),role:step.role||task.role,sourceTaskId:task.id,
   ...index===0?{sceneTitle:guide.segments[task.id].title,sceneContext:variant?task.variation.task:guide.segments[task.id].context}:{}
  }));
  const joinSteps=(alternativeId=null)=>{
   const seen=new Set(),result=[];
   for(const task of members){
    const alternative=task.id===alternativeId;
    const pending=annotate(task,alternative?task.variation.steps:task.steps,alternative);
    let scene=pending[0];
    for(const step of pending){
     const signature=exchangeKey(step);
     if(seen.has(signature))continue;
     seen.add(signature);
     if(scene){step.sceneTitle=scene.sceneTitle;step.sceneContext=scene.sceneContext;scene=null;}
     result.push(step);
    }
   }
   return result;
  };
  const scopedVariations=members.flatMap(task=>[
   {sourceId:task.id,mode:task.variationMode||'change',condition:task.variation.condition||guide.segments[task.id].title,task:task.variation.task,steps:annotate(task,task.variation.steps,true)},
   ...(task.additionalVariations||[]).map(v=>({...clone(v),sourceId:task.id,steps:v.steps.map((s,i)=>({...clone(s),role:s.role||task.role,sourceTaskId:task.id,...i===0?{sceneTitle:v.condition||guide.segments[task.id].title,sceneContext:v.task}:{}}))}))
  ]);
  const core=members.filter(t=>t.variationMode==='core');
  if(core.length>1)throw Error('Explicit combined context needed for multiple core branches: '+chapter.id);
  let variation,variationMode='change',extras;
  if(core.length){
   const task=core[0];
   // Currently the seat choice is the sole merged core branch. Keep the full
   // check-in flow in both paths while changing only its taught seat answer.
   if(day!==3||task.id!=='B')throw Error('Missing combined core context: '+chapter.id);
   variation={condition:task.variation.condition,task:guide.context.replaceAll('靠走道','靠窗'),steps:joinSteps(task.id)};
   variationMode='core';extras=scopedVariations.filter(v=>!(v.sourceId===task.id&&v.mode==='core'));
  }else{
   [variation,...extras]=scopedVariations;
  }
  const steps=joinSteps();
  const homeQuizSteps=distinct(members.map(task=>{
   const step=task.steps.find(s=>s.line.length>8)||task.steps[0];
   return {...clone(step),sourceTaskId:task.id,distractor:task.steps.find(s=>s.zh!==step.zh)?.zh||'請你改天再來。'};
  }),s=>JSON.stringify([s.line,s.zh]));
  return {
   id:sourceIds.join(''),key:'merged-'+chapter.id,name:chapter.name,
   sourceIds,sourceKeys:members.map(t=>t.key),isMerged:true,
   context:guide.context,goal:guide.context,role:[...new Set(members.map(t=>t.role).filter(Boolean))].join('／'),
   steps,variation,variationMode,additionalVariations:extras,
   coreNote:core.map(t=>t.coreNote||'').filter(Boolean).join(' '),
   words:distinct(members.flatMap(t=>t.words||[]),v=>JSON.stringify(v)),
   homeQuizSteps,
   changeNote:`原任務 ${sourceIds.join('＋')} 的句子合為同一個任務，示範、操作、真人接話與回顧使用完整內容；原有變化依各自條件保留。`,
   icon:members[0].icon
  };
 });
}
module.exports=mergeApprovedTasks;
