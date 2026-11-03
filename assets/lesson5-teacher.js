// Shared by the English lessons. Keep the authored speaking order in a compact
// chat, with a separate disclosure for each learner cue.
function d5TeacherLine(s, speaker) {
 const student = speaker === 'student';
 return `<p class="d5-script-line" data-speaker="${speaker}">
  <span class="d5-script-role">${student ? 'Student' : 'Teacher'}</span>
  <span class="d5-script-en d5-chat-bubble">${esc(student ? s.answer : s.line)}</span>
 </p>`;
}
function d5TeacherGuide(p, r, steps, prelude) {
 return `<details class="teacher dg-teacher d5-teacher-guide">
  <summary>導師提示</summary>
  <div class="d5-teacher-script" lang="en" dir="ltr" aria-label="Conversation reference">
   ${prelude ? `<div class="d5-script-exchange" data-teacher-prelude>${d5TeacherLine(prelude, 'teacher')}</div>` : ''}
   ${steps.map((s, i) => `<div class="d5-script-exchange" data-teacher-step="${i}" data-teacher-step-id="${esc(s.id)}">
    ${(s.askFirst ? ['student', 'teacher'] : ['teacher', 'student']).map(speaker => d5TeacherLine(s, speaker)).join('')}
   </div>`).join('')}
  </div>
 </details>
 <section class="dg-student-help d5-student-hints" aria-label="學生提示">
  <h3>學生提示</h3>
  ${steps.map((s, i) => `<details class="d5-student-hint" data-student-step="${i}">
   <summary>${i + 1}. ${esc(s.task || s.label)}</summary>
   ${guidedHint(s.words, s.answer, s.answerZh, 'pair-step-' + p.id + '-' + i)}
  </details>`).join('')}
 </section>`;
}
if (typeof dgLessonTeacherGuide === 'function') {
 dgLessonTeacherGuide = d5TeacherGuide;
} else {
 dgTeacherGuide = function(p) {
  const r = currentRound(), f = flows[rounds.indexOf(r)];
  return d5TeacherGuide(p, r, f.steps, f.prelude);
 };
}
