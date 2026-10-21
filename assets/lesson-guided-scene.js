// Days 2–14 presentation layer. Keep the existing flow gates, choices,
// conditional steps, save keys and free-response mission fields intact.
function dgActiveScene(f, index) {
 return f.steps.slice(0, index + 1).reverse().find(s => s.sceneTitle || s.sceneContext);
}

function dgFlowContext(f, index) {
 const scene = dgActiveScene(f, index);
 const title = scene?.sceneTitle || f.sceneTitle || f.name;
 const context = scene?.sceneContext || f.context;
 return `<div class="dg-scene-context">
  <h3>${esc(title)}</h3>${context ? `<p>${esc(context)}</p>` : ''}
  ${scene?.sceneContext && f.context !== scene.sceneContext ? `<details class="dg-full-context"><summary>完整任務情境</summary><p>${esc(f.context)}</p></details>` : ''}
 </div>`;
}

function dgFlowConfirm(t, student) {
 // Keep both IDs in the DOM: the original change handler restores focus to
 // the checkbox that was used, even when its role becomes the previous turn.
 const first = t.askFirst ? 'spoken' : 'heard';
 const current = student ? 'spoken' : 'heard';
 const other = student ? 'heard' : 'spoken';
 const values = {heard, spoken};
 const labels = {
  spoken: t.askFirst ? '我說好了，聽對方回應 →' : '我說好了，接著點選 →',
  heard: t.askFirst ? '我已聽完，或已讀完文字 →' : '我已聽完，換我回答 →'
 };
 const previous = other === first;
 return `<div class="dg-turn-confirm">
  ${check(`id="${current}"`, labels[current], values[current])}
  <div class="dg-repeat-confirm" ${previous ? '' : 'hidden'}>
   ${check(`id="${other}"`, other === 'spoken' ? '已開口（取消可重說）' : '已聽／讀完（取消可重聽）', values[other], !previous)}
  </div>
 </div>`;
}

scenePage = function() {
 const f = flows[flow], r = activeRound();
 const picker = dgTaskTabs(flows, 'start', flow, r.flowIds);
 if (finished) {
  const resolved = f.steps.map((_, i) => lessonStep(f, i, id => history[f.steps.findIndex(s => s.id === id)]));
  return picker + `<div class="dg-grid dg-completion">
   <section class="panel dg-panel">
    <p class="dg-role">✓ 本任務流程完成</p><h1 class="dg-task">${esc(f.summary)}</h1>
    <p>${esc(f.name)}</p>
    <details class="dg-completed-review"><summary>回看這次用過的句子</summary>
     <div class="dg-completed-lines">${resolved.map(t => `<p class="dg-en" lang="${language}">${esc(t.answer)}</p>`).join('')}</div>
    </details>
    <div class="actions">${btn('收起提示再練一次', `data-start="${flow}"`)}${btn('進入第 04 部分 →', 'data-page="3"', 'class="primary"')}</div>
    <p class="fine">完成標記會保留；是否熟悉，仍由師生在第六部分確認。</p>
   </section>
   <section class="panel dg-panel"><h2>這次完成的事</h2>${sceneState()}</section>
  </div>`;
 }
 const t = currentStep(), student = t.askFirst ? !spoken : heard;
 const counterpart = t.role || dgActiveScene(f, turn)?.role || r.role || course.replyRole;
 const confirmed = heard && spoken;
 const feedbackText = confirmed ? '選一個符合剛才對話的選項。' : student ? '先開口並勾選，依順序完成對話後再點選。' : '先聽懂並勾選，依順序完成對話後再點選。';
 return picker + `<div class="dg-grid scene-grid task-scene dg-flow-grid">
  <section class="panel dg-panel dg-speaker flow-turn turn-current ${student ? '' : 'dg-listener'}" aria-label="當前對話">
   <div class="dg-role-row"><p class="dg-role">${student ? '你 · 旅客' : '對方 · ' + esc(counterpart)}</p><span class="fine">對話 ${turn + 1} / ${f.steps.length}</span></div>
   <h1 class="dg-task">${student ? esc(t.task) : '聽聽' + esc(counterpart) + '怎麼說'}</h1>
   ${student ? guidedHint(t.words, t.answer, t.answerZh, 'flow-' + f.id + '-' + turn) : dgListening(t, counterpart)}
   ${dgFlowConfirm(t, student)}
   <div class="dg-flow-back">${btn('← 上一句', 'data-act="back"', turn === 0 ? 'disabled' : '')}${btn('重新開始本任務', `data-start="${flow}"`, 'class="dg-quiet"')}</div>
  </section>
  <section class="panel dg-panel scene-board" aria-label="情境操作">
   <div class="dg-role-row"><h2>${confirmed ? '現在，點選符合情境的物件' : '看情境，完成對話後點選'}</h2></div>
   ${dgFlowContext(f, turn)}
   ${f.generic ? '' : sceneState()}
   <div class="objects">${t.objects.map(([, label], i) => btn(`${objectArt(t, i)}<span class="dg-object-label">${esc(label)}${choice === i ? accepted(t, i) ? ' ✓' : ' · 再試一次' : ''}</span>`, `data-choice="${i}"`, `class="object ${choice === i && !accepted(t, i) ? 'dg-choice-wrong' : ''}" aria-pressed="${choice === i}" ${confirmed ? '' : 'disabled'}`)).join('')}</div>
   <div id="flowFeedback" class="dg-feedback" role="status">${feedback ? `<p class="feedback ${accepted(t, choice) ? '' : 'retry'}">${esc(feedback)}</p>` : `<p class="fine">${feedbackText}</p>`}</div>
   <div class="dg-flow-actions">${btn(turn === f.steps.length - 1 ? '完成這段對話 →' : '接著，說下一句 →', 'data-act="next"', `class="primary" ${canNext() ? '' : 'disabled'}`)}</div>
   ${f.generic ? `<details class="dg-scene-progress"><summary>查看任務進度</summary>${sceneState()}</details>` : ''}
  </section>
 </div>`;
};

missionPage = function() {
 const m = missions[mission], r = activeRound();
 return dgTaskTabs(missions, 'mission', mission, r.missionIds) + `<div class="dg-grid dg-mission-grid">
  <section class="panel dg-panel dg-task-panel">
   <p class="dg-role">你來說</p><h2>${esc(m.name)}</h2><p class="task">${esc(m.task)}</p>
   ${guidedHint(m.words, m.answer, m.answerZh, 'mission-' + m.id)}
  </section>
  <section class="panel dg-panel dg-answer-panel">
   ${field('mission-' + m.id, '我的說法')}
   <div class="dg-note"><strong>一起核對</strong><p>${esc(m.check)}</p></div>
   <p class="fine">先說，再記下自己的版本。不需要重走完整流程。</p>
  </section>
 </div>`;
};
