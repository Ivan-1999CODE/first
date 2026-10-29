// Presentation for the existing Day 2–14 task curriculum. All task IDs,
// answer fields, checks and quiz handlers continue to use their original keys.
function dgLessonInventory() {
 return `<details class="panel inventory dg-teacher-notes">
  <summary>原有句表：老師需要時再查</summary>
  <p>這裡保留原課的其他說法，供老師挑選延伸；使用前先教，再加入練習。</p>
  <div class="inventory-scroll"><table><thead><tr><th>用途</th><th>說法</th><th>意思</th></tr></thead><tbody>
   ${originalPhrases.map(p => `<tr><td>${esc(p.use || '延伸說法')}</td><td lang="${language}">${esc(p.en)}</td><td>${esc(p.zh)}</td></tr>`).join('')}
  </tbody></table></div>
  ${typeof legacyFile === 'string' ? `<p><a href="${esc(legacyFile)}">查看改版前的完整教材 →</a></p>` : ''}
 </details>`;
}

function dgLessonRoundCard(r) {
 return `<section class="panel dg-panel">
  <p class="eyebrow">任務 ${esc(taskLabel(r))} · ${r.phraseIds.length} 個主要說法</p>
  <h2>${esc(r.name)}</h2><p>${esc(r.goal)}</p>
  <p class="fine">${roundsDone.includes(r.id) ? '✓ 師生已確認熟悉，作為下次上課的進度參考' : '可以帶著提示反覆練習'}</p>
  ${btn(`先試任務 ${esc(taskLabel(r))} →`, `data-before-round="${rounds.indexOf(r)}"`)}
 </section>`;
}

function dgLessonOverview() {
 // Keep authored chapter descriptions available without another permanent
 // layer of task navigation above the student's first attempt.
 if (!course.mergedTasks && microGroups.length) {
  return microGroups.map((g, i) => `<section class="task-chapter" data-chapter="${esc(g.id)}">
   <header><p class="eyebrow">第 ${i + 1} 章</p><h2>${esc(g.name)}</h2><p>${esc(g.description)}</p></header>
   <div class="cards">${g.roundIds.map(id => dgLessonRoundCard(rounds.find(r => r.id === id))).join('')}</div>
  </section>`).join('');
 }
 return `<div class="cards">${rounds.map(dgLessonRoundCard).join('')}</div>`;
}

intro = function() {
 const r = activeRound(), c = r.entryCheckpoint || r.checkpoint;
 return `<section class="dg-lesson-cover" aria-labelledby="dg-lesson-title">
  <div class="dg-cover-copy">
   <p class="eyebrow">第 ${course.day} 天 · 今日主題</p>
   <h1 id="dg-lesson-title">${esc(course.title)}</h1>
  </div>
  <div class="dg-cover-art dg-course-art">${course.art}</div>
 </section>
 <section class="panel dg-panel dg-task-panel before-panel dg-quick-start">
  <p class="dg-role">你先說</p><h2>任務 ${esc(taskLabel(r))}：先試一句</h2>
  <p class="task">${esc(c.task)}</p>
  <details class="dg-entry-note"><summary>記下第一次的說法（選填）</summary>
   ${field((r.entryCheckpoint ? 'entry-before-' : 'before-') + r.id, '第一次的嘗試')}
   <p class="fine">⑥ 會回到這一道題，和現在的說法比較。</p>
  </details>
 </section>
 <details class="panel dg-overview">
  <summary>任務概覽與入口 · ${rounds.map(x => esc(taskLabel(x))).join('、')}</summary>
  <h2>一個任務，一路練到會用</h2>
  <p>② 學本任務句子 → ③ 按順序接話 → ④ 用已學句子練 → ⑤ 真人接話 → ⑥ 看進步 → ⑦ 回家再練。</p>
  <p>同一段可以重來，也可以分幾次完成。老師依當天進度手動選擇任務；課程中途也能直接做本任務收尾。</p>
  ${dgLessonOverview()}
 </details>
 <details class="panel dg-teacher-notes">
  <summary>老師看：怎麼分堂與收尾</summary>
  <p>01～07 都依右上角選定的任務練習。先熟悉其中幾句，再接著往下；各任務有自己的進步紀錄與課後練習，可以分幾堂課完成。</p>
  <p>看過句卡、點完流程、勾完目標，都不會自動判定學會。以學生是否知道何時用、能接住回話並表達意思為準；不要求逐字背誦。</p>
 </details>
 ${dgLessonInventory()}`;
};

function dgLessonSceneHeading(s) {
 if (!s || !(s.sceneTitle || s.sceneContext)) return '';
 return `<header class="merged-scene-heading">
  <h3>${esc(s.sceneTitle || '接著練習')}</h3>
  ${s.sceneContext ? `<p>${esc(s.sceneContext)}</p>` : ''}
  <p class="fine">${esc(s.role || activeRound().role || course.replyRole)}與我接話；接著沿用已學句子。</p>
 </header>`;
}

function dgLessonTeacherCards(p) {
 return p.cards.map(([trigger, line, zh]) => `<div class="teacher-card" data-teacher-card>
  <b>${esc(trigger)} →</b><p class="en" lang="${language}">${esc(line)}</p>
  <p>${esc(zh)}</p>${audio(line)}
 </div>`).join('');
}

function dgLessonTeacherGuide(p, r, steps) {
 const merged = course.mergedTasks;
 return `<details class="teacher dg-teacher">
  <summary>老師引導（共看，非私密）</summary>
  <details class="dg-teacher-start"><summary>先確認起點</summary>
   <p>${esc(p.first)}先說：「${esc(p.opening)}」</p>
   ${p.start ? `<p class="en" lang="${language}">${esc(p.start)}</p>${audio(p.start)}` : '<p>先等待學生開口。</p>'}
  </details>
  <p class="hint">${esc(p.tags)}</p>
  <h3>${merged ? '依順序接話' : '老師沿用本任務的回話'}</h3>
  <p class="fine">依已學順序接話；遇到情境轉換，先讀中文條件，已說過的起始問題不必重問。</p>
  ${merged ? steps.map((s, i) => `${dgLessonSceneHeading(s)}<div class="teacher-card" data-teacher-step="${i}">
   <p class="eyebrow">${i + 1} · ${esc(s.role || r.role || course.replyRole)}</p>
   <b>${esc(s.askFirst ? s.task : '老師先說，讓學生回答')} →</b>
   <p class="en" lang="${language}">${esc(s.line)}</p><p>${esc(s.zh)}</p>${audio(s.line)}
  </div>`).join('') : dgLessonTeacherCards(p)}
  <details><summary>學生卡住了</summary>
   <p>先問：「現在想讓對方知道什麼？」接受單字或短句，再用關鍵字協助。</p>
   ${merged ? steps.map((s, i) => `<section class="merged-student-cue">
    <h4>${i + 1}. ${esc(s.task)}</h4>${guidedHint(s.words, s.answer, s.answerZh, 'pair-step-' + p.id + '-' + i)}
   </section>`).join('') : ''}
   ${merged ? '' : guidedHint(p.words, p.answer, p.answerZh, 'pair-' + p.id)}
  </details>
  <details><summary>帶領小提醒與完整條件</summary>
   <p>${esc(p.tags)}</p>
   <p>回應以學生實際說法為準，已說清楚的資訊不必重問。不同條件分次練，肯定與拒絕不當作同時發生；短答能傳達正確資訊，就可以繼續接話。</p>
  </details>
 </details>`;
}

pairPage = function() {
 const p = pairs[pair], r = activeRound();
 const steps = flows[r.flowIds[r.pairIds.indexOf(pair)] ?? r.flowIds[0]].steps;
 const scenes = steps.filter(s => s.sceneTitle || s.sceneContext);
 return dgTaskTabs(pairs, 'pair', pair, r.pairIds) + `
 <div class="dg-grid dg-pair-grid">
  <section class="panel dg-panel dg-task-panel">
   <p class="dg-role">${esc(p.first)}先說</p><h2>${esc(p.name)}</h2>
   <div class="dg-situation">${esc(p.objects)}</div>
   <p class="task dg-opening">「${esc(p.opening)}」</p>
   <p class="fine">${esc(p.openingNote || '請用自己的英文表達，不必逐字翻譯。')}</p>
   <div class="dg-note"><h3>接著怎麼做</h3><p>${esc(p.next)}</p></div>
   ${scenes.length ? `<details class="merged-scene-plan"><summary>這個任務的情境順序</summary>${scenes.map(dgLessonSceneHeading).join('')}</details>` : ''}
   <p class="fine">${esc(p.role)}</p>
  </section>
  <section class="panel dg-panel dg-goals">
   <div class="section-title"><h2>這次要完成的事</h2>
    <span id="pairProgress">${state.checks[p.id].filter(Boolean).length} / ${p.goals.length} 項已做到</span>
   </div>
   ${p.goals.map((g, i) => check(`data-pair-check="${p.id}:${i}"`, g, state.checks[p.id][i])).join('')}
   <p class="fine">老師依實際表達勾選，也能取消。先沿用本任務順序，熟悉後再收起提示。</p>
   ${dgLessonTeacherGuide(p, r, steps)}
   <details class="dg-pair-note"><summary>記下一句真正用到的英文</summary>
    ${field('note-' + p.id, '記下一句真正用到的英文')}
   </details>
   <p class="fine">師生共看同一個畫面，自然接話；勾選記錄溝通目標，不是自動評分。</p>
  </section>
 </div>`;
};

function dgLessonRating(s) {
 const level = state.ratings[s.id] || 0;
 return `<div class="rating" data-level="${level}">
  <h3>${esc(s.text || s.label)}</h3>
  <div class="meter" aria-label="${ratingNames[level]}">${[1, 2, 3].map(n => `<span class="${level >= n ? (level === 3 ? 'green' : 'yellow') : ''}"></span>`).join('')}</div>
  <p>${ratingNames[level]}</p>
  <div class="actions">${[1, 2, 3].map(n => btn(ratingNames[n], `data-rating="${s.id}:${n}"`, `aria-pressed="${level === n}"`)).join('')}</div>
 </div>`;
}

progressCard = function(r) {
 const c = r.entryCheckpoint || r.checkpoint;
 const beforeKey = (r.entryCheckpoint ? 'entry-before-' : 'before-') + r.id;
 const afterKey = (r.entryCheckpoint ? 'entry-after-' : 'after-') + r.id;
 return `<section class="checkpoint-card dg-review-card" data-review-task="${r.id}">
  <div class="dg-grid dg-checkpoint-task">
   <section class="panel dg-panel dg-task-panel">
    <p class="dg-role">你再說一次</p><h2>任務 ${esc(taskLabel(r))}：回到同一題</h2>
    <p class="task">${esc(c.task)}</p>
    ${guidedHint(c.words, c.answer, c.answerZh, 'progress-' + r.id)}
   </section>
   <section class="panel dg-panel dg-answer-panel">
    ${field(afterKey, '現在的我')}
    <div class="dg-before-record"><h3>這個任務，第一次的我</h3>
     <div class="readonly">${state.answers[beforeKey] ? esc(state.answers[beforeKey]) : '這道題還沒有課前紀錄，照樣可以試著說。'}</div>
    </div>
   </section>
  </div>
  ${r.entryCheckpoint && (state.answers['before-' + r.id] || state.answers['after-' + r.id]) ? `<details class="panel dg-previous-checkpoint"><summary>原長題的作答紀錄</summary><p>${esc(r.checkpoint.task)}</p><h3>原來的課前回答</h3><div class="readonly">${esc(state.answers['before-' + r.id] || '未填寫')}</div><h3>原來的課後回答</h3><div class="readonly">${esc(state.answers['after-' + r.id] || '未填寫')}</div></details>` : ''}
  ${r.alternativeCheckpoint ? `<section class="panel dg-panel dg-alternative">${microAlternative(r, 'after')}</section>` : ''}
  <section class="panel dg-panel dg-assessment">
   <h2>這次需要多少協助？</h2>
   <div class="dg-grid dg-ratings">${r.checkpoint.skills.map(dgLessonRating).join('')}</div>
   <div class="dg-ready-check">
    ${check(`data-round-ready="${r.id}"`, '師生確認：不用完整範例，也能用本任務句子接話並完成任務', roundsDone.includes(r.id))}
    <p class="fine">可先看少量關鍵字，不要求逐字一樣。這個勾選由師生判斷，可取消，只作為進度參考；點完流程不會自動勾選。</p>
   </div>
   <div class="actions">${btn(`再練任務 ${esc(taskLabel(r))} 的同一段`, `data-repeat-round="${rounds.indexOf(r)}"`)}</div>
  </section>
 </section>`;
};

progressPage = function() {
 return reviewScope() + selectedReviewRounds().map(progressCard).join('') + `
 <section class="panel dg-panel dg-feedback-note"><h2>師生一起說一句回饋</h2>
  <p>這次哪一句比較能自己說？下次還要再練哪一段？</p>
 </section>` + microLegacyRecords();
};

function dgLessonHomeListening(r) {
 const questions = r.home.quizzes || [r.home.quiz];
 return questions.map((q, index) => {
  const selected = quizChoices[q.id];
  return `<section class="dg-home-quiz merged-home-question" data-home-question="${esc(q.id)}">
   <h3 class="task">${questions.length > 1 ? (index + 1) + '. ' : ''}${esc(q.question || q.task)}</h3>
   ${audio(q.line)}${transcript(q.line, q.zh)}
   <div class="actions dg-quiz-options">${q.options.map((o, i) => btn(esc(o), course.mergedTasks ? `data-merged-quiz="${r.id}:${index}:${i}"` : `data-task-quiz="${r.id}:${i}"`, `aria-pressed="${selected === i}"`)).join('')}</div>
   <div role="status">${selected !== undefined ? `<p class="feedback ${selected === q.correct ? '' : 'retry'}">${selected === q.correct ? '✓ ' + esc(q.feedback || q.why) : '再聽一次，也可以展開文字與中文後重選。'}</p>` : ''}</div>
  </section>`;
 }).join('');
}

homeCard = function(r) {
 const h = r.home, flags = state.taskHome[r.id];
 return `<section class="scoped-home dg-home-card" data-review-task="${r.id}">
  <div class="dg-meta-row"><p class="eyebrow">任務 ${esc(taskLabel(r))} · 只用已學說法</p>
   <h2>${esc(r.name)}：回家再練同一段</h2>
  </div>
  <div class="dg-grid dg-home-grid">
   <section class="panel dg-panel dg-listen-panel">
    <p class="dg-role">1. 聽熟悉的回覆</p>
    ${dgLessonHomeListening(r)}
    ${check(`data-task-home="${r.id}:listen"`, '我已練習本任務的聽力題', flags.listen)}
   </section>
   <section class="panel dg-panel dg-task-panel">
    <p class="dg-role">2. 同樣句子，大聲說</p><p class="task">${esc(h.task)}</p>
    ${guidedHint(h.words, h.answer, h.answerZh, 'home-' + r.id)}
    <details class="dg-home-note"><summary>記下自己的說法（選填）</summary>
     ${field('home-' + r.id, '記下自己的說法（選填）')}
    </details>
    ${check(`data-task-home="${r.id}:spoken"`, '我已收起提示，再大聲說一次', flags.spoken)}
    <p class="fine" id="home-progress-${r.id}">已練習 ${Object.values(flags).filter(Boolean).length} / 2 項；這是練習紀錄，不是評分。</p>
   </section>
  </div>
  ${r.alternativeCheckpoint ? `<section class="panel dg-panel dg-alternative">${microAlternative(r, 'home')}</section>` : ''}
 </section>`;
};

homePage = function() {
 const r = activeRound();
 return reviewScope() + selectedReviewRounds().map(homeCard).join('') + `
 <section class="panel dg-panel dg-home-next">
  <h2>下次從哪裡接著練？</h2>
  <div class="actions">${btn(`再練任務 ${esc(taskLabel(r))}`, `data-repeat-round="${taskRound}"`)}
   ${btn('回到本任務的進步紀錄', 'data-page="5"')}
  </div>
  <p class="fine">由老師依當天進度選擇任務，各任務可以分幾堂課完成；右上角的任務按鈕可以隨時切換。</p>
  <p class="fine">先練本任務的聽力題，再把同樣句子說出口；想多練就重來。</p>
 </section>`;
};
