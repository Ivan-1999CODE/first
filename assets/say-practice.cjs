// Part 4 practises one Chinese meaning at a time. Dialogue data and its saved
// mission answers remain intact; the new prompts have their own stable keys.
const clone = value => JSON.parse(JSON.stringify(value));
const signature = value => require('node:crypto').createHash('sha256').update(value).digest('hex').slice(0, 12);
const normal = value => value.toLocaleLowerCase();

function integrateShoppingBag(d) {
 if (d.course.day !== 2 || !d.course.mergedTasks) return;
 const r = d.rounds.find(r => r.name === '付款與袋子');
 if (!r || r.bagMainline) return;
 const source = d.flows[r.flowIds[0]], alternative = r.additionalVariations.find(v => v.steps.some(s => s.answer === 'Yes, please.'));
 const yes = clone(alternative.steps.find(s => s.answer === 'Yes, please.'));
 const id = r.key + '-accept-bag-mainline-v1';
 const context = '商品與金額已確認。先問能不能刷卡；店員只收現金，你改付現金。這次沒有自備袋子，店員問時回答需要袋子。';
 yes.id = id + '-bag'; yes.label = '需要袋子，禮貌接受';
 yes.task = '你沒有自備袋子，告訴店員需要袋子。';
 yes.sceneTitle = '付款後，需要袋子'; yes.sceneContext = '這次沒有自備袋子。';
 const steps = source.steps.map(s => s.answer === 'No, thank you.' ? yes : clone(s));
 d.flows.push({...clone(source), id, name:'B｜付款後，需要袋子', context, desc:context, steps});
 r.flowIds.push(d.flows.length - 1);
 source.name = 'B｜付款後，不需要袋子';
 const phrase = {id:id+'-phrase',use:yes.label,en:yes.answer,zh:yes.answerZh};
 d.phrases.push(phrase); r.phraseIds.push(phrase.id); r.primaryPhraseIds.push(phrase.id);
 d.replies.push({...yes,id:id+'-reply',name:yes.label,listen:'聽到袋子的問題，依自己的需要回答。',options:yes.objects.map(o=>o[1]),correct:yes.valid[0],why:yes.zh,change:'同一句再說一次。',changeWords:yes.words,changeAnswer:yes.answer});
 r.replyIds.push(d.replies.length - 1); r.primaryReplyIds.push(d.replies.length - 1);
 const originalPair = d.pairs[r.pairIds[0]], answer = steps.map(s=>s.answer).join(' '), answerZh = steps.map(s=>s.answerZh).join(' ');
 originalPair.name = 'B｜和老師練：不需要袋子';
 const p = {...clone(originalPair),id:id+'-live',name:'B｜和老師練：需要袋子',objects:context,tags:context,
  next:'先問刷卡、改付現金，再依這次需要袋子的情況回答；一次只選一種袋子回答。',
  goals:steps.map(s=>s.label),cards:steps.map(s=>[s.askFirst?'學生'+s.label+'後':'請學生'+s.label,s.line,s.zh]),
  words:steps.map(s=>s.words).join(' / '),answer,answerZh};
 d.pairs.push(p); r.pairIds.push(d.pairs.length - 1);
 d.answerTranslations[answer] = answerZh;
 d.answerTranslations[yes.answer] = yes.answerZh;
 r.bagMainline = true;
 r.bridge = '先學付款，再學「需要／不需要袋子」兩種回答。第三、第五部分分情境練；每次只選符合需要的一句。';
 r.coreNote = 'No, thank you. 和 Yes, please. 是兩種完整回答，分別學習，不當作換字。';
}

function wordPairs(d, r) {
 const day = Number(d.course.day), lang = d.language || 'en';
 if (day === 0) {
  const pairs = lang === 'ja' ? {
   B:[['二つ','一つ','兩個','一個']], C:[['カード','現金','刷卡','現金']], F:[['二人','一人','兩位','一位']], G:[['店内','持ち帰り','內用','外帶']], J:[['左','右','左邊','右邊']]
  } : {B:[['두 개','한 개','兩個','一個']],C:[['카드','현금','刷卡','現金']],F:[['두 명','한 명','兩位','一位']],J:[['왼쪽','오른쪽','左邊','右邊']]};
  return (pairs[r.id] || []).map(([from,to,fromZh,toZh])=>({from:[from,fromZh],to:[to,toZh]}));
 }
 if (day >= 12) return [{A:['five','eight','5','8'],B:['station','café','車站','咖啡廳'],C:['black','blue','黑色','藍色']}[r.id]].filter(Boolean).map(([from,to,fromZh,toZh])=>({from:[from,fromZh],to:[to,toZh]}));
 return r.variationVocabulary || [];
}

function addSayPractice(d) {
 if (d.sayPracticeVersion && d.rounds.every(r=>r.sayPrompts)) return d;
 integrateShoppingBag(d);
 d.sayPracticeVersion = 1;
 d.course.labels[3] = '看中文，自己說';
 for (const [roundIndex,r] of d.rounds.entries()) {
  const flowIds = r.flowIds || [roundIndex];
  const primary = d.flows[flowIds[0]].steps;
  const allSteps = flowIds.flatMap(i=>d.flows[i].steps);
  const variants = [r.variation,...r.additionalVariations||[]].flatMap(v=>v?.steps||[]);
  // Day 1's authored substitution is separate from its flow data.
  for (const p of r.practiceChanges || []) if (p.en) variants.push({answer:p.en,answerZh:p.zh,words:p.word});
  const pairs = wordPairs(d,r), used = new Set(), prompts = [];
  const add = (base,changed,pair) => {
   const step = changed || base;
   if (used.has(step.answer)) return;
   used.add(step.answer);
   const words = changed ? pair.to[0] : base.words;
   const key = 'say-v1-' + (r.key || 'day'+d.course.day+'-'+r.id) + '-' + signature(base.answer+'|'+step.answer);
   prompts.push({id:key,mode:changed?'swap':'repeat',prompt:step.practicePrompt||step.answerZh,answer:step.answer,answerZh:step.answerZh,
    words:words && words !== step.answer ? words : '回想第二部分的原句。',
    baseAnswer:base.answer,baseZh:base.answerZh,
    ...(changed?{from:pair.from,to:pair.to}:{}),
    label:base.label || base.task || '練習這一句'});
   d.answerTranslations ||= {}; d.answerTranslations[step.answer] = step.answerZh;
  };
  for (const base of primary) {
   const swaps = [];
   for (const pair of pairs) {
    const from = pair.from[0],to = pair.to[0],at = normal(base.answer).indexOf(normal(from));
    // A whole response replacement is not a vocabulary substitution.
    if (at < 0 || /[.!?。！？]/.test(from)) continue;
    const target = base.answer.slice(0,at)+to+base.answer.slice(at+from.length);
    const changed = variants.find(s=>normal(s.answer)===normal(target));
    if (changed && changed.answer !== base.answer) swaps.push([changed,pair]);
   }
   if (swaps.length) for (const [changed,pair] of swaps) add(base,changed,pair);
   else add(base);
  }
  // Alternative mainline responses (such as accepting a bag) remain separate
  // original-sentence prompts, not a pretend word substitution.
  for (const base of allSteps) if (!primary.some(s=>s.answer===base.answer)) add(base);
  r.sayPrompts = prompts;
  r.sayVocabulary = prompts.filter(p=>p.mode==='swap');
  r.practiceChanges = prompts.filter(p=>p.mode==='swap').map(p=>({task:'④ 看中文，說出換字後的這一句。',word:p.from[0]+' → '+p.to[0],wordZh:p.from[1]+' → '+p.to[1],en:p.answer,zh:p.answerZh}));
 }
 return d;
}
module.exports = {addSayPractice};
