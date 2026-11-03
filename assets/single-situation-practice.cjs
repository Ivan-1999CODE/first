const {lessons,day0}=require('./single-situation-prompts.cjs');
const hash=x=>require('node:crypto').createHash('sha256').update(x).digest('hex').slice(0,12);
module.exports=function singleSituations(d){
 for(const [ri,r]of d.rounds.entries()){
  const key=r.key||`day${d.course.day}-${d.language||'en'}-${r.id}`;
  const base=[...new Map((r.flowIds||[ri]).flatMap(fi=>d.flows[fi].steps).map(s=>[s.answer,s])).values()];
  const specs=d.course.day===0?day0[r.id]:lessons[d.course.day>=12?12:d.course.day]?.[r.displayLabel||r.id];
  if(!specs?.length)throw Error('Missing single situations: '+key);
  r.retiredSayPrompts=[...new Map([...(r.retiredSayPrompts||[]),...r.sayPrompts].map(p=>[p.id,p])).values()];
  r.sayPrompts=specs.map(spec=>{
   if(!Number.isInteger(spec.ref)||!base[spec.ref])throw Error('Expected one mainline answer: '+key);
   const s=base[spec.ref];
   return {id:key+'-single-situation-v2-'+hash(spec.label+'|'+s.answer),mode:'scenario',singleUtterance:true,label:spec.label,prompt:spec.prompt,sentences:[s.answer],answer:s.answer,answerZh:s.answerZh,words:s.words||s.label,explanation:'這是一句參考說法。表達這個需求即可，不必逐字相同。'};
  });
 }
 return d;
};
