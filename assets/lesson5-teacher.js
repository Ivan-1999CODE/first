// Shared by Days 1–11, promoted from the Day 5 pilot. DOM order follows
// authored dialogue; the original content and saved identifiers stay intact.
const d5ChatSections = {
 'micro-en-d5-directions-and-distance-v1-0': '問路線',
 'micro-en-d5-directions-and-distance-v1-1': '問遠近',
 'micro-en-d5-merged-day5-taxi-trip-v1-0': '決定搭車',
 'micro-en-d5-merged-day5-taxi-trip-v1-1': '告訴司機目的地',
 'micro-en-d5-merged-day5-taxi-trip-v1-2': '目的地已確認 · 問車程',
 'micro-en-d5-merged-day5-taxi-trip-v1-3': '問車資',
 'micro-en-d5-driver-and-pickup-v1-0': '確認預約司機',
 'micro-en-d5-driver-and-pickup-v1-1': '說明等車位置',
 'micro-en-d5-dropoff-and-stop-v1-0': '還沒到入口',
 'micro-en-d5-dropoff-and-stop-v1-1': '已到入口 · 可以停車'
};
function d5ChatMessage(s, r, speaker) {
 const student = speaker === 'student';
 const line = student ? s.answer : s.line;
 const meaning = student ? s.answerZh : s.zh;
 const role = student ? '學生 · 旅客' : `老師 · ${s.role || r.role || course.replyRole}`;
 return `<article class="d5-chat-message" data-speaker="${speaker}" aria-label="${esc(role)}">
  <p class="d5-chat-role">${esc(role)}</p>
  <div class="d5-chat-bubble">
   <p class="d5-chat-en" lang="en">${esc(line)}</p>
   <p class="d5-chat-zh">${esc(meaning)}</p>
   <div class="d5-chat-audio">${audio(line)}</div>
  </div>
 </article>`;
}
const d5BaseTeacherGuide = typeof dgLessonTeacherGuide === 'function' ? dgLessonTeacherGuide : dgTeacherGuide;
function d5TeacherGuide(p, r, steps, prelude) {
 const wrapper = document.createElement('div');
 wrapper.innerHTML = d5BaseTeacherGuide(p, r, steps);
 const guide = wrapper.querySelector('.dg-teacher');
 const summary = guide.querySelector(':scope > summary').outerHTML;
 const opening = guide.querySelector('.dg-teacher-start').outerHTML;
 const notes = guide.querySelector(':scope > details:last-child').outerHTML;
 // Day 1 originally nested this disclosure inside the teacher guide.
 const help = Array.from(guide.children).find(el => el.tagName === 'DETAILS' && el.querySelector('summary')?.textContent === '學生卡住了');
 if (help) { help.classList.add('teacher', 'dg-student-help'); guide.after(help); }
 guide.classList.add('d5-teacher-guide');
 guide.innerHTML = `${summary}
  <div class="d5-teacher-intro"><strong>${esc(p.first)}先開口</strong><span>${steps.length} 段對話 · 由上往下看</span></div>
  <p class="d5-chat-note">老師在左，學生在右；學生句子是參考說法。</p>
  <div class="d5-teacher-chat" aria-label="師生接話順序">${prelude ? `<section class="d5-chat-exchange" data-chat-prelude>
   <h3 class="d5-chat-divider"><span>開場 · 先聽懂，再指出位置</span></h3>
   ${d5ChatMessage(prelude, r, 'teacher')}
   <p class="d5-chat-context">${esc(prelude.task)}</p>
  </section>` : ''}${steps.map((s, i) => `
   <section class="d5-chat-exchange" data-teacher-step="${i}" data-teacher-step-id="${esc(s.id)}">
    <h3 class="d5-chat-divider"><span>${String(i + 1).padStart(2, '0')} · ${esc(d5ChatSections[s.id] || s.label)}</span></h3>
    ${s.sceneTitle || s.sceneContext ? `<p class="d5-chat-context">${s.sceneTitle ? `<strong>${esc(s.sceneTitle)}</strong>` : ''}${s.sceneContext ? `<span>${esc(s.sceneContext)}</span>` : ''}</p>` : ''}
    ${(s.askFirst ? ['student', 'teacher'] : ['teacher', 'student']).map(speaker => d5ChatMessage(s, r, speaker)).join('')}
   </section>`).join('')}</div>
  <div class="d5-teacher-extras">${opening}${notes}</div>`;
 // The separate student-help disclosure is preserved, including its hint IDs.
 return wrapper.innerHTML;
}
if (typeof dgLessonTeacherGuide === 'function') {
 dgLessonTeacherGuide = d5TeacherGuide;
} else {
 dgTeacherGuide = function(p) {
  const r = currentRound(), f = flows[rounds.indexOf(r)];
  return d5TeacherGuide(p, r, f.steps, f.prelude);
 };
}
