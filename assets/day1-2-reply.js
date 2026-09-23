// Match the shared workshop card used by Days 3–6; retain Day 1–2 data and navigation.
function replyCard(r){
 return `<div class="workshop-picker" role="group" aria-label="選擇問答情境">${replies.map((q,i)=>btn(`${i+1}. ${esc(q.name)}`,`data-reply="${i}"`,`aria-pressed="${reply===i}"`)).join('')}</div>
 <section class="panel workshop-card" aria-labelledby="workshopHeading">
 <div class="workshop-card-top"><h2 id="workshopHeading" tabindex="-1">${esc(r.name)}</h2><span class="workshop-count">${reply+1} / ${replies.length}</span></div>
 <div class="workshop-body"><div class="workshop-question">
 <div class="workshop-role"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="25" cy="20" r="10"/><path d="M7 57v-9c0-18 36-18 36 0v9M41 8h18v16H47l-6 6V8"/><path d="M46 14h8m-8 5h5"/></svg><span>${esc(course.replyRole)}問你</span></div>
 ${audio(r.line)}${transcript(r.line,r.zh)}<p class="fine">聽懂問題就好，不必背誦對方的台詞。</p>
 </div><div class="workshop-answer"><p class="eyebrow">YOUR TURN / 換你回答</p><h3>先試著說，不急著看答案。</h3><p class="task">${esc(r.task)}</p>${hint(r.words,r.answer)}
 <div class="workshop-remix"><h3>換成你的答案</h3><p>${esc(r.change)}</p>${hint(r.changeWords,r.changeAnswer)}</div>
 <p class="fine">單字或短句都可以，說得通即可；這裡不錄音，也不自動評分。</p></div></div>
 <div class="lesson-footer">${btn('← 上一組',`data-reply="${reply-1}"`,reply===0?'disabled':'')}${reply<replies.length-1?btn('下一組 →',`data-reply="${reply+1}"`):btn('進入互動流程 →','data-page="2"')}</div></section>`;
}
