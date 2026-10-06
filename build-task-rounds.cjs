const fs=require('fs');
const read=file=>fs.readFileSync(file,'utf8');
function buildDay(day){
 const japanese=day===0;
 if(![0,...Array.from({length:13},(_,i)=>i+2)].includes(day))throw Error('Day must be 0 or 2–14.');
 const d=day===0?require('./assets/day0-expanded.cjs'):day===2?require('./assets/day2-expanded.cjs'):require('./assets/curriculum-rounds.cjs').make(day);
 require('./assets/listening-preview.cjs').addListeningPreview(d);
 const file=d.file||(japanese?'travel-japanese-day0-directions.html':'travel-english-unit2-shopping.html');
 const title=`第 ${day} 天：${d.course.title}・分任務練習`;
 let runtime=read('assets/day1-2-runtime.js').replace('const tabs=','let tabs=').replace('load();render();appearance();','');
 if(japanese){runtime=runtime.replaceAll('英文','日文').replaceAll('lang="en"','lang="ja"');runtime=runtime.replace('${esc(en)}</p><p>${esc(zh)}','${esc(en)}</p>${reading(en)}<p>${esc(zh)}').replace('${esc(answer)}</p>${audio(answer)}','${esc(answer)}</p>${reading(answer)}${audio(answer)}');
  const manifest=JSON.parse(read('assets/day0-audio/manifest.json'));
  const timings=JSON.parse(read('assets/day0-audio/timings.json'));
  const followReadings=require('./assets/day0-follow-readings.cjs');
  d.day0Timings=Object.fromEntries(Object.entries(manifest).map(([text,name])=>{
   const entry=timings[text],hash=require('crypto').createHash('sha256').update(fs.readFileSync('assets/day0-audio/'+name)).digest('hex');
   if(!entry||entry.sha256!==hash)throw Error('Audio/timing mismatch: '+text);
   return [text,entry.cues.map(c=>{if(!followReadings[c.text])throw Error('Missing follow-along reading: '+c.text);return {...c,romaji:followReadings[c.text]};})];
  }));
  d.day0Audio=Object.fromEntries(Object.entries(manifest).map(([text,name])=>[text,'data:audio/mpeg;base64,'+fs.readFileSync('assets/day0-audio/'+name).toString('base64')]));
 }
 if(!japanese)d.lessonArtwork=require('./assets/course-illustrations.cjs').forLesson(day,d.rounds,d.course.replyRole);
 else d.studyArtwork=require('./assets/course-illustrations.cjs').forLesson(day,d.rounds,d.course.replyRole);
 const data=Object.entries(d).map(([k,v])=>`const ${k}=${JSON.stringify(v).replace(/</g,'\\u003c')};`).join('\n');
 const code=[data,runtime,japanese?read('assets/day0-extra.js'):'',read('assets/task-rounds.js'),read('assets/task-rounds-expanded.js'),japanese?read('assets/day0-library.js'):read('assets/illustrated-lessons.js'),read('assets/study-library.js'),'load();render();appearance();',japanese?read('assets/day0-audio.js'):''].join('\n');
 const css=['assets/day1-2.css','assets/speaking-focus.css','assets/task-rounds.css',...japanese?['assets/day0-follow.css','assets/day0-library.css']:['assets/illustrated-lessons.css'],'assets/study-library.css'].map(read).join('\n');
 let html=read('assets/task-rounds-template.html')
  .replace(/<title>[\s\S]*?<\/title>/,`<title>Travel Lab｜${title}</title>`)
  .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${d.course.description}">`)
  .replace('<!-- TASK_STYLES -->',()=>`<style id="day${day}-styles">${css}</style>`)
  .replace('<!-- TASK_APP -->',()=>`<script id="day${day}-app">${code}</script>`)
  .replace(/<script id="lesson-controls">[\s\S]*?<\/script>\s*/g,'')
  .replace(/ aria-current="page"/g,'').replace(`href="${file}"`,`href="${file}" aria-current="page"`)
  .replaceAll('第 14 天的七部分課程',`第 ${day} 天的七部分課程`).replaceAll('>DAY 14<',`>DAY ${day}<`)
  .replace('第 14 天：旅途中問清楚：Where、When、Who',title);
 if(!japanese)html=html.replace('<html ','<html data-illustrated="true" ').replace('</body>',()=>`<script id="lesson-controls">\n${read('assets/lesson-controls.js')}</script>\n</body>`);
 fs.writeFileSync(file,html);
 require('./sync-appearance.cjs')(file);
 console.log(`Built ${file}: ${d.rounds.length} rounds / ${d.phrases.length} phrases / ${d.replies.length} listening exchanges.`);
}
module.exports={buildDay};
if(require.main===module){const requested=process.argv.slice(2).map(Number);for(const day of requested.length?requested:[0,...Array.from({length:13},(_,i)=>i+2)])buildDay(day);}
