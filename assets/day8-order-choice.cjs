// Add a taught refusal and situational selection to Task E only.
const clone=value=>JSON.parse(JSON.stringify(value));
module.exports=function addOrderChoice(d){
 const r=d.rounds.find(r=>r.key==='micro-en-d8-merged-day8-room-service-order-v1');
 if(!r)throw Error('Missing Day 8 room-service task');
 const key=r.key+'-decline',base=d.flows[r.flowIds[0]];
 const source=r.additionalVariations.flatMap(v=>v.steps).find(s=>s.answer==='No, thank you.');
 const decline={...clone(source),id:key+'-reply',name:'暫時不訂餐',label:'禮貌婉拒訂餐',task:'你 10 分鐘後要出門，送餐需要 20 分鐘。你決定這次不訂，禮貌回應飯店人員。',sceneTitle:'準備出門，這次不訂',sceneContext:'餐點總共 20 美元，但你 10 分鐘後就要出門，送餐需要 20 分鐘；訂單尚未確認。',change:'同一段再說一次，試著少看一層提示。',changeWords:'no / thank you',changeAnswer:'No, thank you.'};
 const phrase={id:key+'-phrase',use:'禮貌婉拒訂餐',en:decline.answer,zh:decline.answerZh};
 d.phrases.push(phrase);r.phraseIds.push(phrase.id);
 r.replyIds.push(d.replies.length);d.replies.push({...decline,options:decline.objects.map(x=>x[1]),correct:decline.valid[0],why:decline.zh});
 d.answerTranslations[decline.answer]=decline.answerZh;
 r.bridge='先練點餐、問總價與送餐時間，再分開練確認訂餐和禮貌婉拒；每次依情境選一種決定。';
 const context='你打電話詢問總匯三明治，飯店已知道房號，訂單尚未確認。你 10 分鐘後要出門；問完得知總價 20 美元、送餐約 20 分鐘，因此最後決定這次不訂。';
 const steps=base.steps.map((s,i)=>({...clone(s),id:key+'-step-'+i}));
 steps[0].sceneContext='你想詢問總匯三明治，但 10 分鐘後要出門；先說餐點並問總價，還沒確認訂單。';
 steps[steps.length-1]={...decline,id:key+'-step-'+(steps.length-1)};
 const flow={...clone(base),id:key,name:'E｜準備出門，這次不訂',context,desc:context,steps};
 r.flowIds.push(d.flows.length);d.flows.push(flow);
 const p=clone(d.pairs[r.pairIds[0]]);
 Object.assign(p,{id:key+'-live',name:'E｜和老師練：準備出門',objects:context,tags:context,goals:steps.map(s=>s.label),words:steps.map(s=>s.words).join(' / '),answer:steps.map(s=>s.answer).join(' '),answerZh:steps.map(s=>s.answerZh).join(' '),cards:steps.map(s=>[s.askFirst?'學生'+s.label+'後':'請學生'+s.label,s.line,s.zh])});
 r.pairIds.push(d.pairs.length);d.pairs.push(p);
 // Register the old fields so loading/saving the new questions retains them.
 r.retiredSayPrompts=clone(r.sayPrompts);
 const scenarios=[
  {id:'information',label:'資訊還不清楚',prompt:'你想在房間吃一份總匯三明治。菜單沒有寫含服務費的總價，你也不知道多久會送到；你想先了解這些資訊，再決定是否訂餐。你會怎麼開口？',words:'club sandwich / in total / how long',answer:'I’d like a club sandwich, please. How much is it in total? How long will it take?',answerZh:'我想要一份總匯三明治。總共多少錢？需要等多久？',sentences:['I’d like a club sandwich, please.','How much is it in total?','How long will it take?'],explanation:'可以分成幾句，說明想吃什麼，再問總價與等候時間。還沒取得資訊，不必先確認訂單。'},
  {id:'leaving',label:'準備出門',prompt:'你原本想訂總匯三明治。飯店告訴你總共 20 美元，約 20 分鐘送到，但你還有 10 分鐘就得出門。對方現在詢問是否送出訂單，你會怎麼回應？',words:'yes / no / please / thank you',answer:'No, thank you.',answerZh:'不用了，謝謝。',sentences:['No, thank you.'],explanation:'餐點來不及在你出門前送到，可以禮貌表示這次不訂。不必加上尚未學過的理由。'},
  {id:'staying',label:'今晚留在房間',prompt:'你想在房間吃總匯三明治，預算是 30 美元，今晚也沒有外出安排。飯店告訴你總共 20 美元，約 20 分鐘送到，現在詢問是否送出訂單。你會怎麼回應？',words:'yes / no / please / thank you',answer:'Yes, please.',answerZh:'好，麻煩你。',sentences:['Yes, please.'],explanation:'價格在預算內，時間也允許，可以確認訂餐。若你有其他考量，也可以說明自己的決定；由老師一起核對意思。'}
 ];
 r.sayPrompts=scenarios.map(s=>({...s,id:r.key+'-scenario-v1-'+s.id,mode:'scenario'}));
 r.sayVocabulary=[];r.practiceChanges=[];
 return d;
};
