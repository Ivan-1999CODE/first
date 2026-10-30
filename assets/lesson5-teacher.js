// Day 5 teacher cards use the same authored lines and event handlers.
const d5TeacherCues = {
 'micro-en-d5-directions-and-distance-v1-0': '學生問博物館怎麼走後，你再指路。',
 'micro-en-d5-directions-and-distance-v1-1': '學生問遠不遠後，再告訴他步行時間。',
 'micro-en-d5-merged-day5-taxi-trip-v1-0': '先問學生是否要搭計程車。',
 'micro-en-d5-merged-day5-taxi-trip-v1-1': '學生決定搭車後，再問目的地。',
 'micro-en-d5-merged-day5-taxi-trip-v1-2': '目的地已確認；等學生問車程，再回答。',
 'micro-en-d5-merged-day5-taxi-trip-v1-3': '學生問車資後，再回答預估金額。',
 'micro-en-d5-driver-and-pickup-v1-0': '學生確認你是不是預約司機後，再回應。',
 'micro-en-d5-driver-and-pickup-v1-1': '確認身分後，再問學生在哪裡等車。',
 'micro-en-d5-dropoff-and-stop-v1-0': '車還沒到入口；先問學生是否在這裡下車。',
 'micro-en-d5-dropoff-and-stop-v1-1': '到了入口後，等學生請你停車，再回應。'
};
const d5BaseTeacherGuide = dgLessonTeacherGuide;
dgLessonTeacherGuide = function(p, r, steps) {
 const wrapper = document.createElement('div');
 wrapper.innerHTML = d5BaseTeacherGuide(p, r, steps);
 const guide = wrapper.querySelector('.dg-teacher');
 const summary = guide.querySelector(':scope > summary').outerHTML;
 const opening = guide.querySelector('.dg-teacher-start').outerHTML;
 const notes = guide.querySelector(':scope > details:last-child').outerHTML;
 guide.classList.add('d5-teacher-guide');
 guide.innerHTML = `${summary}
  <div class="d5-teacher-intro"><strong>老師扮演${esc(r.role || course.replyRole)}</strong><span>${esc(p.first)}先開口 · 共 ${steps.length} 句</span></div>
  <div class="d5-teacher-cards">${steps.map((s, i) => `
   <article class="teacher-card d5-teacher-step" data-teacher-step="${i}" data-teacher-step-id="${esc(s.id)}">
    <div class="d5-teacher-card-head"><span class="d5-teacher-order" aria-label="第 ${i + 1} 句">${String(i + 1).padStart(2, '0')}</span><h3>${s.askFirst ? '先聽學生，再回這句' : i === 0 ? '老師先開口' : '老師接著問'}</h3></div>
    <p class="d5-teacher-trigger">${esc(d5TeacherCues[s.id] || s.task)}</p>
    <div class="d5-teacher-speech">
     <p class="d5-teacher-say-label">老師說 · ${esc(s.role || r.role || course.replyRole)}</p>
     <p class="en d5-teacher-line" lang="en">${esc(s.line)}</p>
     <p class="d5-teacher-translation">${esc(s.zh)}</p>
     <div class="d5-teacher-audio">${audio(s.line)}</div>
    </div>
   </article>`).join('')}</div>
  <div class="d5-teacher-extras">${opening}${notes}</div>`;
 // The separate student-help disclosure is preserved, including its hint IDs.
 return wrapper.innerHTML;
};
