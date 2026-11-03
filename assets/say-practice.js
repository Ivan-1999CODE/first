// Shared Part 4, including Day 1 and the Japanese/Korean introductory lessons.
const sayIndexes = new Map();
const sayRound = () => typeof currentRound === 'function' ? currentRound() : activeRound();
for (const r of rounds) for (const p of [...r.sayPrompts,...r.retiredSayPrompts||[]]) {
 fields.push(p.id);
 state.answers[p.id] = '';
}
function sayHint(p) {
 const lang = typeof language === 'string' ? language : 'en';
 const name = lang === 'ja' ? '日文' : lang === 'ko' ? '韓文' : '英文';
 return `<div class="say-hint"><div class="say-hint-tabs" role="group" aria-label="提示程度">${['自己說','關鍵字',p.mode==='scenario'?'參考說法':'看整句'].map((label,i)=>btn(label,`data-say-support="${i}"`,`aria-pressed="${i===0}"`)).join('')}</div>
 <div class="say-hint-stage">
  <div class="say-hint-pane say-self" data-say-pane="0" aria-hidden="false"><p>用你記得的${name}說就可以。</p></div>
  <div class="say-hint-pane say-keywords" data-say-pane="1" aria-hidden="true" hidden inert><p>${esc(p.words)}</p></div>
  <div class="say-hint-pane say-reference" data-say-pane="2" aria-hidden="true" hidden inert><p class="en" lang="${lang}">${esc(p.answer)}</p>${audio(p.answer)}<p>${esc(p.answerZh)}</p>${p.explanation?`<p class="fine">${esc(p.explanation)}</p>`:''}</div>
 </div></div>`;
}
missionPage = function() {
 const r = sayRound(), index = sayIndexes.get(r.id) || 0, p = r.sayPrompts[index];
 const scenario=p.mode==='scenario',unit=scenario?'個情境':'句';
 const records = [...r.missionIds.map(i=>({...missions[i],field:'mission-'+missions[i].id})),...(r.retiredSayPrompts||[]).map(s=>({name:s.prompt,field:s.id}))].filter(m=>state.answers[m.field]);
 return `<section class="say-practice" data-say-scenarios="${scenario}" aria-label="${scenario?'看情境，自己選用':'看中文，自己說'}">
  <header><h2>${scenario?'看情境，自己選用':'看中文，自己說'}</h2><p>${scenario?'選一個小情境，想想需要表達什麼，用一句話說出來。':'一次說一句。先看中文開口，卡住再看提示；說完就可以換下一句。'}</p></header>
  <nav class="tabs say-picker" aria-label="${scenario?'選擇小情境':'選擇練習句'}">${r.sayPrompts.map((s,i)=>btn(scenario?(i+1)+' · '+esc(s.label):'第 '+(i+1)+' 句',`data-say-index="${i}"`,`aria-pressed="${i===index}"`)).join('')}</nav>
  <section class="panel dg-panel dg-task-panel say-card" data-say-id="${esc(p.id)}" data-say-mode="${p.mode}">
   <p class="eyebrow">${index+1} / ${r.sayPrompts.length} · ${scenario?'一個需求，說一句':p.mode==='swap'?'換一個詞':'練原句'}</p>
   ${scenario?'<p class="fine">看情境，選一句學過的說法。</p>':p.mode==='swap'?`<p class="fine">原來的意思：${esc(p.baseZh)}</p>`:'<p class="fine">這一句沿用第二部分學過的說法。</p>'}
   <h3 class="task say-prompt" tabindex="-1">${esc(p.prompt)}</h3>${sayHint(p)}
   <details class="say-note"><summary>記下自己的說法（選填）</summary>${field(p.id,scenario?'這個情境，我的說法':'這一句，我的說法')}</details>
   <p class="fine">意思表達清楚即可，不必逐字相同。第五部分再和老師接話。</p>
  </section>
  <div class="lesson-footer">${btn('← 上一'+unit,`data-say-index="${index-1}"`,index===0?'disabled':'')}${index<r.sayPrompts.length-1?btn('下一'+unit+' →',`data-say-index="${index+1}"`):btn('到第五部分，和老師練 →','data-page="4"')}</div>
  ${records.length?`<details class="panel say-old-records"><summary>改版前第四部分的作答</summary><p>舊題紀錄保留，與目前練習分開。</p>${records.map(m=>`<h3>${esc(m.name)}</h3><div class="readonly">${esc(state.answers[m.field])}</div>`).join('')}</details>`:''}
 </section>`;
};
document.addEventListener('click', event => {
 const support = event.target.closest('button[data-say-support]');
 if (support && !support.disabled) {
  const box = support.closest('.say-hint'), level = Number(support.dataset.saySupport);
  if (!box || ![0,1,2].includes(level)) return;
  stopAudio();
  box.querySelectorAll('[data-say-support]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.saySupport)===level)));
  box.querySelectorAll('[data-say-pane]').forEach(pane=>{
   const hidden = Number(pane.dataset.sayPane)!==level;
   pane.hidden=hidden;pane.inert=hidden;pane.setAttribute('aria-hidden',String(hidden));
  });
  return;
 }
 const b = event.target.closest('button[data-say-index]');
 if (!b || b.disabled || page !== 3) return;
 const n = Number(b.dataset.sayIndex), r = sayRound();
 if (!Number.isInteger(n) || !r.sayPrompts[n]) return;
 stopAudio(); sayIndexes.set(r.id,n); render();
 document.querySelector('.say-prompt')?.focus({preventScroll:true});
});
