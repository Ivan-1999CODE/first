// Day 1 presentation only. Stable task IDs, answer fields and saved records
// continue to use the existing micro-lesson runtime.
function dgTaskTabs(items, key, current, ids) {
 return ids.length > 1 ? tabs(items, key, current) : '';
}

intro = function() {
 const r = currentRound();
 return `<section class="dg-lesson-cover" aria-labelledby="dg-lesson-title">
  <div class="dg-cover-copy">
   <p class="eyebrow">第 1 天 · 今日主題</p>
   <h1 id="dg-lesson-title">問路與求助</h1>
   <p class="dg-introduction">從問路到求助，依序練習 A、B、C。</p>
  </div>
  <div class="dg-cover-art" role="img" aria-label="拿著地圖的旅客向路人問路，準備找到想去的地方。">
   <svg class="dg-cover-map" viewBox="0 0 360 150" aria-hidden="true" focusable="false">
    <rect class="dg-cover-map-paper" x="64" y="14" width="230" height="120" rx="24"/>
    <path class="dg-cover-street" d="M115 20v108M227 20v108M70 85h216"/>
    <rect class="dg-cover-block" x="142" y="32" width="52" height="27" rx="7"/>
    <rect class="dg-cover-block" x="143" y="105" width="52" height="15" rx="5"/>
    <path class="dg-cover-pin" d="M258 51s-13-12-13-21a13 13 0 0 1 26 0c0 9-13 21-13 21z"/>
    <circle cx="258" cy="30" r="4" class="dg-cover-pin-center"/>
   </svg>
   <img class="dg-cover-person dg-cover-guide" src="${studyArtwork.images.guide}" alt="" width="640" height="640">
   <span class="dg-cover-question" aria-hidden="true">?</span>
   <img class="dg-cover-person dg-cover-traveler" src="${studyArtwork.images.asker}" alt="" width="640" height="640">
  </div>
 </section>
 <div class="dg-grid dg-intro-grid before-panel">
  <section class="panel dg-panel dg-task-panel">
   <p class="dg-role">你先說</p>
   <h2>任務 ${r.id}：先試著說</h2>
   <p class="task">${esc(r.checkpoint.task)}</p>
   <p class="dg-note">先口頭試說，再記下原本的說法；⑥ 會回到完全相同的題目。沒有填寫也可以練習。</p>
  </section>
  <section class="panel dg-panel dg-answer-panel">
   ${field('before-'+r.id, '這一輪，第一次的嘗試')}
   <p class="fine">每個小任務都有自己的開始與收尾。一堂課只完成一輪也可以，下次接著練。</p>
  </section>
 </div>
 <details class="panel dg-overview">
  <summary>任務概覽與入口 · A、B、C，反覆用到會</summary>
  <h2>一輪一個小循環</h2>
  <p>② 學本輪句子 → ③ 原句操作 → ④ 只換一個條件 → ⑤ 真人接話 → ⑥ 看進步 → ⑦ 回家再練。</p>
  <p>同一段可以重來。老師依當天進度手動選 A、B 或 C；課程中途也能直接做本輪收尾。</p>
  <div class="cards">${rounds.map((x, i) => `<section class="panel dg-panel">
   <p class="eyebrow">任務 ${x.id} · ${x.phraseIds.length} 個核心說法</p>
   <h2>${esc(x.name)}</h2><p>${esc(x.goal)}</p>
   <p class="fine">${roundsDone.includes(x.id) ? '✓ 師生已確認熟悉，作為下次上課的進度參考' : '尚未確認熟悉，可反覆練習'}</p>
   ${btn(`先試任務 ${x.id} →`, `data-before-round="${i}"`)}
  </section>`).join('')}</div>
 </details>
 <details class="panel dg-teacher-notes">
  <summary>老師看：怎麼分堂與收尾</summary>
  <p>A 完整練問路、確認方向與道謝；B 完整練請指路、問公車與道謝；C 練請重說與指地圖。01～07 依當天進度手動選 A、B 或 C；各任務都有自己的回顧與課後練習，也可以分幾堂課完成。老師確認各任務都教完後，再從課程選單手動進入 08「整合挑戰」。</p>
  <p>看過句卡、點完流程、勾完目標，都不會自動判定學會。以學生是否知道何時用、能接住回話並表達意思為準；不要求逐字背誦。</p>
 </details>`;
};

missionPage = function() {
 const m = missions[mission], r = currentRound();
 return dgTaskTabs(missions, 'mission', mission, r.missionIds)+`
 <div class="dg-grid dg-mission-grid">
  <section class="panel dg-panel dg-task-panel">
   <p class="dg-role">你來說</p><h2>${esc(m.name)}</h2>
   <p class="task">${esc(m.task)}</p>
   ${guidedHint(m.words, m.answer, m.answerZh, 'mission-'+m.id)}
  </section>
  <section class="panel dg-panel dg-answer-panel">
   ${field('mission-'+m.id, '我的說法')}
   <div class="dg-note"><strong>一起核對</strong><p>${esc(m.check)}</p></div>
   <p class="fine">先說，再記下自己的版本。不需要重走完整流程。</p>
  </section>
 </div>`;
};

function dgTeacherGuide(p) {
 return `<details class="teacher dg-teacher">
  <summary>老師引導（共看，非私密）</summary>
  <details class="dg-teacher-start"><summary>先確認起點</summary>
   <p>${esc(p.first)}先說：「${esc(p.opening)}」</p>
   ${p.start ? `<p class="en" lang="en">${esc(p.start)}</p>${audio(p.start)}` : '<p>先等待學生開口。</p>'}
  </details>
  <p class="hint">${esc(p.tags)}</p>
  <h3>聽到學生……你可以接</h3>
  <p class="fine">找符合當下的一張，不必逐卡照念。</p>
  ${p.cards.map(([trigger, line, zh]) => `<div class="teacher-card">
   <b>${esc(trigger)} →</b><p class="en" lang="en">${esc(line)}</p>
   <p>${esc(zh)}</p>${audio(line)}
  </div>`).join('')}
  <details><summary>學生卡住了</summary>
   <p>先問：「現在想讓對方知道什麼？」接受單字或短句，再用關鍵字協助。</p>
   ${guidedHint(p.words, p.answer, p.answerZh, 'pair-'+p.id)}
  </details>
  <details><summary>帶領小提醒與完整條件</summary>
   <p>${esc(p.tags)}。回應以學生實際說法為準，已說清楚的資訊不必重問。請留空間讓學生先開口，短答能傳達正確資訊，就可以繼續接話。</p>
  </details>
 </details>`;
}

pairPage = function() {
 const p = pairs[pair], r = currentRound();
 return dgTaskTabs(pairs, 'pair', pair, r.pairIds)+`
 <div class="dg-grid dg-pair-grid">
  <section class="panel dg-panel dg-task-panel">
   <p class="dg-role">${esc(p.first)}先說</p><h2>${esc(p.name)}</h2>
   <div class="dg-situation">${esc(p.objects)}</div>
   <p class="task dg-opening">「${esc(p.opening)}」</p>
   <p class="fine">${esc(p.openingNote || "請用自己的英文表達，不必逐字翻譯。")}</p>
   <div class="dg-note"><h3>接著怎麼做</h3><p>${esc(p.next)}</p></div>
   <p class="fine">${esc(p.role)}</p>
  </section>
  <section class="panel dg-panel dg-goals">
   <div class="section-title"><h2>這次要完成的事</h2>
    <span id="pairProgress">${state.checks[p.id].filter(Boolean).length} / ${p.goals.length} 項已做到</span>
   </div>
   ${p.goals.map((g, i) => check(`data-pair-check="${p.id}:${i}"`, g, state.checks[p.id][i])).join('')}
   <p class="fine">完成目標：把以上溝通需求說清楚。老師依實際表達勾選，也能取消。</p>
   ${dgTeacherGuide(p)}
   <details class="dg-pair-note"><summary>記下一句真正用到的英文</summary>
    ${field('note-'+p.id, '記下一句真正用到的英文')}
   </details>
   <p class="fine">師生共看同一個畫面，自然接話；目標不必依清單順序完成。</p>
  </section>
 </div>`;
};

// Keep the legacy function available without exposing mixed-review controls.
// Parts 06 and 07 always render the manually selected round below.
reviewScope = function() {
 return '';
};

function dgRating(s) {
 const level = state.ratings[s.id] || 0;
 return `<div class="rating" data-level="${level}">
  <h3>${esc(s.text || s.label)}</h3>
  <div class="meter" aria-label="${ratingNames[level]}">${[1, 2, 3].map(n => `<span class="${level >= n ? (level === 3 ? 'green' : 'yellow') : ''}"></span>`).join('')}</div>
  <p>${ratingNames[level]}</p>
  <div class="actions">${[1, 2, 3].map(n => btn(ratingNames[n], `data-rating="${s.id}:${n}"`, `aria-pressed="${level === n}"`)).join('')}</div>
 </div>`;
}

progressCard = function(r) {
 const c = r.checkpoint;
 return `<section class="checkpoint-card dg-review-card" data-review-task="${r.id}">
  <div class="dg-grid dg-checkpoint-task">
   <section class="panel dg-panel dg-task-panel">
    <p class="dg-role">你再說一次</p><h2>任務 ${r.id}：回到同一題</h2>
    <p class="task">${esc(c.task)}</p>
    ${guidedHint(c.words, c.answer, c.answerZh, 'progress-'+r.id)}
   </section>
   <section class="panel dg-panel dg-answer-panel">
    ${field('after-'+r.id, '現在的我')}
    <div class="dg-before-record"><h3>這一輪，第一次的我</h3>
     <div class="readonly">${state.answers['before-'+r.id] ? esc(state.answers['before-'+r.id]) : '這一輪還沒有課前紀錄；照樣可以說說看，不補造第一次的答案。'}</div>
    </div>
   </section>
  </div>
  <section class="panel dg-panel dg-assessment">
   <h2>這次需要多少協助？</h2>
   <div class="dg-grid dg-ratings">${c.skills.map(dgRating).join('')}</div>
   <div class="dg-ready-check">
    ${check(`data-round-ready="${r.id}"`, '師生確認：不用完整範例，也能用本輪句子接話並完成任務', roundsDone.includes(r.id))}
    <p class="fine">可先看少量關鍵字，不要求逐字一樣。這個勾選由師生判斷，可取消，只作為進度參考；點完流程不會自動勾選，也不影響各輪或整合挑戰的入口。</p>
   </div>
   <div class="actions">${btn(`再練任務 ${r.id} 的同一段`, `data-repeat-round="${rounds.indexOf(r)}"`)}</div>
  </section>
 </section>`;
};

progressPage = function() {
 return progressCard(currentRound())+`
 <section class="panel dg-panel dg-feedback-note"><h2>師生一起說一句回饋</h2>
  <p>這次哪一句比較能自己說？下次還要再練哪一段？</p>
 </section>`+microLegacyRecords();
};

homeCard = function(r) {
 const h = r.home, flags = state.taskHome[r.id];
 return `<section class="scoped-home dg-home-card" data-review-task="${r.id}">
  <div class="dg-meta-row"><p class="eyebrow">任務 ${r.id} · 只用本輪句子</p>
   <h2>${esc(r.name)}：回家再練同一段</h2>
  </div>
  <div class="dg-grid dg-home-grid">
   <section class="panel dg-panel dg-listen-panel">
    <p class="dg-role">1. 聽熟悉的回覆</p>
    ${homeListening(r)}
    ${check(`data-task-home="${r.id}:listen"`, '我已練習本任務的聽力題', flags.listen)}
   </section>
   <section class="panel dg-panel dg-task-panel">
    <p class="dg-role">2. 同樣句子，大聲說</p><p class="task">${esc(h.task)}</p>
    ${guidedHint(h.words, h.answer, h.answerZh, 'home-'+r.id)}
    <details class="dg-home-note"><summary>記下自己的說法（選填）</summary>
     ${field('home-'+r.id, '記下自己的說法（選填）')}
    </details>
    ${check(`data-task-home="${r.id}:spoken"`, '我已收起提示，再大聲說一次', flags.spoken)}
    <p class="fine" id="home-progress-${r.id}">已練習 ${Object.values(flags).filter(Boolean).length} / 2 項；這是練習紀錄，不是評分。</p>
   </section>
  </div>
 </section>`;
};

homePage = function() {
 const r = currentRound();
 return homeCard(r)+`
 <section class="panel dg-panel dg-home-next">
  <h2>下次從哪裡接著練？</h2>
  <div class="actions">${btn(`再練任務 ${r.id}`, `data-repeat-round="${focusRound}"`)}
   ${rounds.map((x, i) => x.id === r.id ? '' : btn(`下次試任務 ${x.id} →`, `data-before-round="${i}"`)).join('')}
  </div>
  <p class="fine">由老師依當天進度選擇任務，各輪可以分幾堂課完成；右上角的任務按鈕可以隨時切換。</p>
  <p class="fine">先練本任務的聽力題，再把同樣句子說出口；想多練就重來。</p>
 </section>`;
};
