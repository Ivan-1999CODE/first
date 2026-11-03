// Part 2 teaches language and turn-taking; Part 4 selects language for a need.
const {lessons,day0}=require('./situation-prompts.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const hash=x=>require('node:crypto').createHash('sha256').update(x).digest('hex').slice(0,12);
const unique=(xs,key)=>[...new Map(xs.map(x=>[key(x),x])).values()];
module.exports=function prepareLearning(d){
 if(d.course.day>=12&&!d.rescueVersion)return d;
 if(d.learningPracticeVersion===1)return d;
 d.learningPracticeVersion=1;d.course.labels[3]='看情境，自己選用';
 for(const [ri,r]of d.rounds.entries()){
  const key=r.key||`day${d.course.day}-${d.language||'en'}-${r.id}`;
  const core=(r.flowIds||[ri]).flatMap(fi=>d.flows[fi].steps);
  const base=unique(core,s=>s.answer);
  const variants=[r.variation,...r.additionalVariations||[]].filter(Boolean);
  const candidates=[...core,...variants.flatMap(v=>v.steps.map(s=>({...s,sceneContext:s.sceneContext||v.task})))];
  r.studyChanges=clone(r.sayVocabulary||[]);
  // Ice and sugar are already taught as distinct needs; show their useful link.
  if(d.course.day===6&&r.id==='DRINKS'){
   r.studyChanges=[['No ice','不加冰','Less ice','少冰',0,2],['No sugar','不加糖','Less sugar','少糖',1,3]].map(([from,fz,to,tz,a,b])=>({from:[from,fz],to:[to,tz],baseAnswer:base[a].answer,baseZh:base[a].answerZh,answer:base[b].answer,answerZh:base[b].answerZh,label:base[b].label}));
  }
  if(d.course.day===0&&d.language==='ko'&&r.id==='C'){
   r.studyChanges=[{from:['카드로','用信用卡'],to:['현금으로','用現金'],baseAnswer:base[1].answer,baseZh:base[1].answerZh,answer:base[2].answer,answerZh:base[2].answerZh,label:'選擇付款方式'}];
  }
  for(const change of r.studyChanges){
   if(!candidates.some(s=>s.answer===change.answer)){
    const original=core.find(s=>s.answer===change.baseAnswer);
    if(!original)throw Error('No source for substitution: '+key);
    candidates.push({...clone(original),answer:change.answer,answerZh:change.answerZh,words:change.to[0],task:`${change.answerZh} 用這次的需求開口，再聽對方回覆。`,sceneContext:undefined});
   }
  }
  // A complete alternative reply belongs with the basic language, not swaps.
  const own=()=>new Set(r.phraseIds.map(id=>(typeof id==='number'?d.phrases[id]:d.phrases.find(p=>p.id===id)).en));
  for(const s of unique(candidates,s=>s.answer))if(!own().has(s.answer)&&!r.studyChanges.some(c=>c.answer===s.answer)){
   const p={id:key+'-study-'+hash(s.answer),use:s.label||'依需要回應',en:s.answer,zh:s.answerZh};
   d.phrases.push(p);r.phraseIds.push(p.id);
  }
  const taughtReplies=new Set(r.replyIds.map(i=>JSON.stringify([d.replies[i].answer,d.replies[i].line,!!d.replies[i].askFirst])));
  for(const s of candidates){
   const signature=JSON.stringify([s.answer,s.line,!!s.askFirst]);
   if(taughtReplies.has(signature))continue;
   taughtReplies.add(signature);
   const id=key+'-study-reply-'+hash(signature);
   r.replyIds.push(d.replies.length);
   d.replies.push({...clone(s),id,name:(s.label||'練習接話')+' · '+s.answerZh,listen:'依這次的需求接話；熟悉後再收起提示。',options:(s.objects||[]).map(o=>o[1]),correct:s.valid?.[0]||0,why:s.zh,change:'同一組問答再練一次，試著少看提示。',changeWords:s.words,changeAnswer:s.answer});
  }
  r.studyChanges=unique(r.studyChanges,c=>c.baseAnswer+'|'+c.answer);
  r.studyChanges.forEach(c=>{c.id=c.id||key+'-word-'+hash(c.answer);});
  r.sayVocabulary=clone(r.studyChanges);
  r.practiceChanges=r.studyChanges.map(c=>({task:'先認識可以替換的詞，再到後面的短對話練習。',word:c.from[0]+' → '+c.to[0],wordZh:c.from[1]+' → '+c.to[1],en:c.answer,zh:c.answerZh}));
  // Keep the previous scenario IDs available for saved-answer migration.
  if(r.sayPrompts.every(p=>p.mode==='scenario'))continue;
  const specs=d.course.day===0?day0(r.id):lessons[d.course.day]?.[r.displayLabel||r.id];
  if(!specs?.length)throw Error('Missing authored situations: '+key);
  r.retiredSayPrompts=unique([...(r.retiredSayPrompts||[]),...clone(r.sayPrompts)],p=>p.id);
  r.sayPrompts=specs.map((spec,i)=>{
   const selected=spec.refs.map(n=>{if(!base[n])throw Error('Invalid situation reference: '+key+'/'+n);return base[n];});
   const sentences=selected.map(s=>s.answer);
   return {id:key+'-situation-v1-'+i,mode:'scenario',label:spec.label,prompt:spec.prompt,sentences,answer:sentences.join(' '),answerZh:selected.map(s=>s.answerZh).join(' '),words:selected.map(s=>s.words||s.label).join(' / '),explanation:'這是一種可用的說法。依情境選擇需要的句子；意思清楚即可，不必逐字相同。'};
  });
 }
 return require('./single-situation-practice.cjs')(d);
};
