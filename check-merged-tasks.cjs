// Independent regression checks for true task merges. The approved pre-merge
// curriculum is the contract: grouping must not silently add or remove language.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const curriculum=require('./assets/micro-curriculum.cjs');
const DAYS=[2,3,5,6,7,8,9,10,11];
const unique=values=>[...new Set(values)];
const sorted=values=>unique(values).sort();
const exchange=step=>JSON.stringify([step.answer,step.line,step.askFirst]);
const translation=step=>JSON.stringify([step.answer,step.answerZh,step.line,step.zh,step.askFirst]);
const primary=(data,round)=>data.flows[round.flowIds[0]].steps;
const previews=round=>[round.variation,...(round.additionalVariations||[])].filter(Boolean);
const allSteps=(data,round)=>[...round.flowIds.flatMap(index=>data.flows[index].steps),...previews(round).flatMap(v=>v.steps)];
const historicalKeys=data=>unique([data.previousFocusKey,data.previousLesson?.key,...(data.previousLesson?.legacyKeys||[]),...(data.course.legacyKeys||[])].filter(Boolean));
function equivalentSequence(actual,expected,label){
 const wanted=expected.map(exchange),found=actual.map(exchange);
 assert.deepEqual(sorted(found),sorted(wanted),label+': all distinct original exchanges remain');
 let cursor=0;
 for(const item of found){
  const index=wanted.indexOf(item,cursor);
  assert(index>=0,label+': preserve source order; only exact duplicate exchanges may be skipped');
  cursor=index+1;
 }
}
function approvedBaseline(day,directory=path.resolve('tmp/merged-before')){
 const baseline=curriculum.make(day,{merge:false});
 assert(!baseline.mergedVersion&&!baseline.course.mergedTasks,'make(day,{merge:false}) must return the approved separate-task data');
 // The Day 2 deletion approval supersedes its earlier eight-task snapshot.
 // Keep that old snapshot intact for history and compare like revisions only.
 const snapshot=path.join(directory,day===2?'day2-clothing-removed-v3.json':`day${day}.json`);
 if(fs.existsSync(snapshot)){
  const frozen=JSON.parse(fs.readFileSync(snapshot,'utf8'));
  const content=JSON.parse(JSON.stringify(baseline));
  // Day 7 only adds the newly approved grouping metadata to its unchanged
  // eight source tasks. Still compare every authored exchange to the snapshot.
  if(day===7&&!frozen.course.taskGroups){
   delete content.course.taskGroups;
   content.course.description=frozen.course.description;
   content.rounds.forEach((round,index)=>round.chapter=frozen.rounds[index].chapter);
  }
  assert.deepEqual(content,frozen,`Day ${day}: approved pre-merge content changed compared with the frozen snapshot`);
  return baseline;
 }
 return baseline;
}
function verifyMerged(data,before=approvedBaseline(data.course.day)){
 const day=before.course.day,label=`Day ${day}`,oldGroups=before.course.taskGroups;
 assert(oldGroups?.some(g=>g.roundIds.length>1),label+': baseline must have a real merge');
 assert.equal(data.mergedVersion,1);assert.equal(data.course.mergedTasks,true);
 assert.equal(data.course.id,`travel-lab-en-day${day}-merged-v${day===2?2:1}`);
 assert.equal(data.previousFocusKey,before.course.id);
 assert.deepEqual(data.course.legacyKeys,[],'Old answers belong in history, not automatic migration');
 for(const key of [before.course.id,...historicalKeys(before)])assert(historicalKeys(data).includes(key),label+': missing historical key '+key);
 assert.equal(data.rounds.length,oldGroups.length,label+': one complete task per approved group');
 assert.equal(data.course.taskGroups,undefined,'True merged tasks replace the old chapter/subround container');
 assert.equal(new Set(data.rounds.map(r=>r.id)).size,data.rounds.length);
 assert.equal(new Set(data.rounds.map(r=>r.key)).size,data.rounds.length);
 const report={day,tasks:data.rounds.length,sourceTasks:before.rounds.length,groups:[],speaking:0,listening:0,quizzes:0};
 const seenSourceIds=[];
 for(const [groupIndex,group]of oldGroups.entries()){
  const sourceIds=group.roundIds,sources=sourceIds.map(id=>before.rounds.find(r=>r.id===id));
  assert(sources.every(Boolean));const id=sourceIds.join(''),round=data.rounds[groupIndex];
  assert.equal(round.id,id,label+': merged task ID follows original source labels');
  assert.deepEqual(round.sourceIds,sourceIds,label+'/'+id+': retain original group membership and order');
  seenSourceIds.push(...round.sourceIds);
  if(sourceIds.length===1)assert.equal(round.key,sources[0].key,'Singleton keeps its stable task key');
  else assert(!sources.some(r=>r.key===round.key),'Merged answer must not reuse a former partial-task key');
  const main=primary(data,round),expected=sources.flatMap(r=>primary(before,r));
  equivalentSequence(main,expected,label+'/'+id+' primary');
  if(sourceIds.length>1){
   let sceneSource;
   for(const step of main){
    assert(sourceIds.includes(step.sourceTaskId),label+'/'+id+': step belongs to a retained source');
    if(step.sourceTaskId!==sceneSource)assert(step.sceneTitle&&step.sceneContext,label+'/'+id+': explicit scene context at each source boundary');
    sceneSource=step.sourceTaskId;
   }
  }
  const oldSteps=sources.flatMap(r=>allSteps(before,r)),newSteps=allSteps(data,round);
  for(const field of ['answer','line'])assert.deepEqual(sorted(newSteps.map(s=>s[field])),sorted(oldSteps.map(s=>s[field])),label+'/'+id+': exact '+(field==='answer'?'spoken':'heard')+' sentence set');
  const knownTranslations=new Set(oldSteps.map(translation));
  for(const step of newSteps){
   assert(knownTranslations.has(translation(step)),label+'/'+id+': English, meaning and speaking order must come from a taught source exchange');
   assert(step.valid?.length&&step.valid.every(index=>step.objects?.[index]),label+'/'+id+': valid scene choices');
  }
  const phraseList=round.phraseIds.map(pid=>data.phrases.find(p=>p.id===pid));assert(phraseList.every(Boolean));
  const firstPhrases=(round.primaryPhraseIds||round.phraseIds).map(pid=>data.phrases.find(p=>p.id===pid));
  assert.deepEqual(sorted(firstPhrases.map(p=>p.en)),sorted(main.map(s=>s.answer)));
  for(const phrase of sources.flatMap(r=>r.phraseIds.map(pid=>before.phrases.find(p=>p.id===pid)))){
   if(phrase.illustratedOptions){
    const kept=phraseList.find(p=>p.en===phrase.en);assert(kept,'Keep illustrated food sentence');
    assert.deepEqual(kept.illustratedOptions,phrase.illustratedOptions);assert.deepEqual(kept.substitutions,phrase.substitutions);
   }
  }
  const taughtSay=new Set([...phraseList.map(p=>p.en),...previews(round).flatMap(v=>v.steps.map(s=>s.answer))]);
  const taughtHear=new Set([...round.hearLines.map(p=>p.en),...previews(round).flatMap(v=>v.steps.map(s=>s.line))]);
  for(const step of newSteps){assert(taughtSay.has(step.answer),'Untaught speaking sentence: '+step.answer);assert(taughtHear.has(step.line),'Untaught listening sentence: '+step.line);}
  for(const step of main)assert(round.replyIds.some(index=>exchange(data.replies[index])===exchange(step)),label+'/'+id+': every main exchange has a short practice entry');
  for(const index of round.replyIds){const reply=data.replies[index];assert(taughtSay.has(reply.answer)&&taughtHear.has(reply.line),'Short reply uses taught language');}
  assert.equal(round.pairIds.length,round.flowIds.length,label+'/'+id+': whole-task live practice matches each whole-task flow');
  for(const [index,flowIndex]of round.flowIds.entries()){
   const flow=data.flows[flowIndex],pair=data.pairs[round.pairIds[index]];
   assert.equal(pair.answer,flow.steps.map(s=>s.answer).join(' '));assert.equal(pair.goals.length,flow.steps.length);
   assert.deepEqual(pair.cards.map(card=>card.slice(1)),flow.steps.map(s=>[s.line,s.zh]));
  }
  for(const source of sources.filter(r=>r.variationMode==='core')){
   const expectedAlt=sources.flatMap(r=>r===source?r.variation.steps:primary(before,r));
   const matching=round.flowIds.slice(1).map(index=>data.flows[index].steps).filter(steps=>JSON.stringify(sorted(steps.map(exchange)))===JSON.stringify(sorted(expectedAlt.map(exchange))));
   assert(matching.length,label+'/'+id+': source '+source.id+' core alternative remains a complete merged path');
   equivalentSequence(matching[0],expectedAlt,label+'/'+id+' complete alternative');
  }
  const variationList=previews(round);assert.equal(round.missionIds.length,variationList.length,'Every displayed variation has its own practice');
  for(const [index,variation]of variationList.entries()){
   const mission=data.missions[round.missionIds[index]];
   assert.equal(mission.answer,variation.steps.map(s=>s.answer).join(' '));assert.equal(mission.task,variation.task);
  }
  const completeAnswer=main.map(s=>s.answer).join(' ');
  assert.equal(round.checkpoint.answer,completeAnswer);assert.equal(round.home.answer,completeAnswer);
  assert.equal(round.checkpoint.task,data.flows[round.flowIds[0]].context);assert.equal(round.home.task,round.checkpoint.task);
  const quizzes=round.home.quizzes||[round.home.quiz];assert(Array.isArray(quizzes)&&quizzes.length,'Combined homework retains source listening prompts');
  assert.deepEqual(sorted(quizzes.map(q=>JSON.stringify([q.line,q.zh]))),sorted(sources.flatMap(r=>(r.home.quizzes||[r.home.quiz]).map(q=>JSON.stringify([q.line,q.zh])))),label+'/'+id+': preserve all distinct homework listening prompts');
  assert.deepEqual(round.home.quiz,quizzes[0]);
  for(const q of quizzes){assert(taughtHear.has(q.line));assert(q.options[q.correct]);}
  report.quizzes+=quizzes.length;report.groups.push({id,sourceIds,mainSteps:main.length,variations:variationList.length,flowPaths:round.flowIds.length});
 }
 assert.deepEqual(seenSourceIds,oldGroups.flatMap(g=>g.roundIds),'No approved deletion revived and no surviving task omitted');
 for(const [field,collection]of [['phraseIds','phrases'],['replyIds','replies'],['flowIds','flows'],['missionIds','missions'],['pairIds','pairs']]){
  const owned=data.rounds.flatMap(r=>r[field]);assert.equal(new Set(owned).size,owned.length,field+': no accidental task sharing');
  assert.equal(owned.length,data[collection].length,field+': no orphaned previous source task records');
 }
 const total=data.rounds.flatMap(r=>allSteps(data,r));report.speaking=sorted(total.map(s=>s.answer)).length;report.listening=sorted(total.map(s=>s.line)).length;
 return report;
}
module.exports={DAYS,approvedBaseline,verifyMerged};
if(require.main===module){
 const selected=process.argv.find(x=>x.startsWith('--only='));const days=selected?selected.slice(7).split(',').map(Number):DAYS;
 assert(days.length&&days.every(day=>DAYS.includes(day)),'Select merged days: '+DAYS.join(','));
 const baselineArg=process.argv.find(x=>x.startsWith('--baseline-dir='));const baselineDir=baselineArg?path.resolve(baselineArg.slice(15)):path.resolve('tmp/merged-before');
 const reports=days.map(day=>{const r=verifyMerged(curriculum.make(day),approvedBaseline(day,baselineDir));console.log(`PASS merged Day ${day}: ${r.sourceTasks} source rounds → ${r.tasks} tasks; all ${r.speaking} spoken / ${r.listening} heard sentences and ${r.quizzes} listening prompts retained`);return r;});
 fs.mkdirSync(path.resolve('tmp/merged-task-qa'),{recursive:true});fs.writeFileSync(path.resolve('tmp/merged-task-qa/data-report.json'),JSON.stringify(reports,null,2));
}
