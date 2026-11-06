// Replace only Task B's repeated waiting path. Keep the main path and all
// other tasks' IDs/array positions, and give the new dialogue fresh records.
const clone = value => JSON.parse(JSON.stringify(value));
module.exports = function readyToOrder(d) {
 const r = d.rounds.find(r => r.key === 'micro-en-d6-more-time-to-choose-v1');
 if (!r) throw Error('Missing Day 6 Task B');
 const key = r.key + '-ready-order-v1';
 const oldFlow = d.flows[r.flowIds[1]], oldPair = d.pairs[r.pairIds[1]], oldMission = d.missions[r.missionIds[0]];
 d.day6ReadyOrder = {retiredFlowId:oldFlow.id, retiredPairId:oldPair.id, retiredMissionId:oldMission.id};
 const context = '你已經看好菜單，決定點雞肉三明治。店員先問準備好了嗎；先表示可以開始點餐，等店員問想要什麼，再說出餐點。';
 const ready = {...clone(d.flows[r.flowIds[0]].steps[0]), id:key+'-ready', label:'表示準備好點餐',
  answer:"Yes, I'm ready to order.", answerZh:'是的，我準備好點餐了。',
  task:'你已選好想吃的餐點。店員問準備好了嗎，先表示可以開始點餐。',
  words:'yes / ready / order', valid:[1], effect:'✓ 你已表示可以開始點餐，接著聽店員問想要什麼。'};
 const order = {...clone(d.flows[d.rounds.find(r=>r.id==='A').flowIds[0]].steps[1]), id:key+'-meal',
  line:'What would you like?', zh:'你想要什麼？',
  task:'店員接著問你想要什麼。你已選好雞肉三明治，告訴店員你的選擇。',
  askFirst:false, effect:'✓ 已把雞肉三明治加入這次的訂單。'};
 const steps = [ready,order], answer = steps.map(s=>s.answer).join(' '), answerZh = steps.map(s=>s.answerZh).join(' '), words = steps.map(s=>s.words).join(' / ');
 r.name = '還沒選好，或開始點餐';
 r.goal = '還沒決定時請多一點時間；已經選好時先表示準備好了，再回答店員、點出餐點。兩個情境分開練。';
 r.bridge = '兩個情境分開練：還沒選好時請多一點時間；選好後先回答準備好了，再點雞肉三明治。';
 r.coreNote = 'Yes, I\'m ready to order. 是準備好的回答；接著聽懂 What would you like?，再用任務 A 學過的句子點餐。一個人還沒選好時，仍可把 we 換成 I。';
 r.variation = {task:context, steps:clone(steps)};
 d.flows[r.flowIds[1]] = {...clone(oldFlow), id:key, name:'B｜選好了，開始點餐', desc:context, context,
  summary:'你先表示準備好了，再回答店員、點出雞肉三明治。收起提示，試著把這段對話接一次。', sceneTitle:'選好了，開始點餐', steps};
 d.pairs[r.pairIds[1]] = {...clone(oldPair), id:key+'-live', name:'B｜和老師練：選好了，開始點餐',
  first:'老師', opening:ready.zh, start:ready.line, next:'老師先問準備好了嗎，等學生回答後再問想要什麼；學生接著點雞肉三明治。',
  objects:context, tags:context, goals:steps.map(s=>s.label), cards:steps.map(s=>['請學生'+s.label,s.line,s.zh]), words, answer, answerZh};
 d.missions[r.missionIds[0]] = {...clone(oldMission), id:key+'-mission', name:'B｜準備好後開始點餐', task:context, words, answer, answerZh};
 r.alternativeCheckpoint = {...clone(r.checkpoint), task:context, words, answer, answerZh,
  skills:steps.map(s=>({id:s.id+'-skill',text:'我能完成「'+s.label+'」這段對話。'}))};
 for (const s of steps) {
  const p = {id:s.id+'-phrase', use:s.label, en:s.answer, zh:s.answerZh};
  d.phrases.push(p); r.phraseIds.push(p.id);
  r.replyIds.push(d.replies.length);
  d.replies.push({...clone(s), id:s.id+'-reply', name:s.label, listen:'先聽店員，再依本次已選好餐點的情境回答。',
   options:s.objects.map(o=>o[1]), correct:s.valid[0], why:s.zh, change:'收起提示，再接一次。', changeWords:s.words, changeAnswer:s.answer});
  if (!r.hearLines.some(p=>p.en===s.line)) r.hearLines.push({en:s.line,zh:s.zh,sources:['② 短對話','③ 開始點餐','⑤ 真人接話']});
  d.answerTranslations[s.answer] = s.answerZh;
 }
 d.answerTranslations[answer] = answerZh;
 // This older question remains available in Part 2, but no longer names a
 // separate Part 3/5 waiting path.
 const earlierQuestion = r.hearLines.find(p=>p.en==='May I take your order?');
 if (earlierQuestion) earlierQuestion.sources = ['② 短對話'];
 const note = d.changeNotes.find(n=>n.id===r.id);
 if (note) Object.assign(note,{name:r.name,change:'保留還沒選好時請多給時間的情境；另一情境改成表示準備好了，再回應店員並點雞肉三明治。',speaking:[...d.flows[r.flowIds[0]].steps,...steps].map(s=>s.answer),listening:r.hearLines.map(p=>p.en),variation:context});
 for (const entry of [['ready','準備好的'],['order','點餐'],['would like','想要'],['chicken sandwich','雞肉三明治']]) {
  if (!r.words.some(([word])=>word===entry[0])) r.words.push(entry);
 }
 return d;
};
