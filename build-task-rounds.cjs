const fs=require('fs');
const read=file=>fs.readFileSync(file,'utf8');
function buildDay(day){
 const japanese=day===0;
 if(![0,...Array.from({length:13},(_,i)=>i+2)].includes(day))throw Error('Day must be 0 or 2–14.');
 const d=day===0?require('./assets/micro-day0.cjs').make('ja'):require('./assets/micro-curriculum.cjs').make(day);
 if(day===6)d.foodArtwork='data:image/png;base64,'+fs.readFileSync('assets/illustrations/day6-steak-eggs-atlas.png').toString('base64');
 // Canonical task data already contains every taught reply and translation.
 const file=d.file||(japanese?'travel-japanese-day0-directions.html':'travel-english-unit2-shopping.html');
 const title=`第 ${day} 天：${d.course.title}・分任務練習`;
 let runtime=read('assets/day1-2-runtime.js').replace('const tabs=','let tabs=').replace('const hint=','let hint=').replace('load();render();appearance();','');
 if(japanese){runtime=runtime.replaceAll('英文','日文').replaceAll('lang="en"','lang="ja"');runtime=runtime.replace('${esc(en)}</p><p>${esc(zh)}','${esc(en)}</p>${reading(en)}<p>${esc(zh)}').replace('${audio(answer)}<p class="fine">','${reading(answer)}${audio(answer)}<p class="fine">');
  require('./assets/day0-learning-build.cjs')(d);
 }
 if(!japanese)d.lessonArtwork=require('./assets/course-illustrations.cjs').forLesson(day,d.rounds,d.course.replyRole);
 else d.studyArtwork=require('./assets/course-illustrations.cjs').forLesson(day,d.rounds,d.course.replyRole);
 const data=Object.entries(d).map(([k,v])=>`const ${k}=${JSON.stringify(v).replace(/</g,'\\u003c')};`).join('\n');
 const code=[data,runtime,read('assets/flow-guidance.js'),japanese?read('assets/day0-extra.js'):'',read('assets/task-rounds.js'),read('assets/task-rounds-expanded.js'),japanese?read('assets/day0-library.js'):read('assets/illustrated-lessons.js'),read('assets/study-library.js'),read('assets/dialogue-preview.js'),read('assets/micro-lessons.js'),japanese?read('assets/day0-numbers.js'):'',japanese?read('assets/day0-practical.js'):'',japanese?read('assets/day0-primer.js'):'',d.course.mergedTasks?read('assets/merged-lessons.js'):'',...japanese?[]:['assets/lesson-guided-pages.js','assets/lesson-guided-study.js','assets/lesson-guided-scene.js','assets/lesson-guided.js'].map(read),'load();render();appearance();',japanese?read('assets/day0-audio.js'):'',japanese?read('assets/day0-glossary.js'):''].join('\n');
 const css=['assets/day1-2.css','assets/speaking-focus.css','assets/task-rounds.css',...japanese?['assets/day0-follow.css','assets/day0-library.css','assets/day0-glossary.css','assets/day0-practical.css','assets/day0-primer.css']:['assets/illustrated-lessons.css'],'assets/study-library.css','assets/flow-guidance.css','assets/micro-lessons.css','assets/dialogue-preview.css',...d.course.mergedTasks?['assets/merged-lessons.css']:[]].map(read).join('\n');
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
 if(!japanese){
  const guidedCss=read('assets/day1-guided.css').replaceAll('day1-guided','lesson-guided')+'\n'+read('assets/lesson-guided.css')+(day===5?'\n'+['assets/lesson5-hierarchy.css','assets/lesson5-map.css','assets/lesson5-flow.css','assets/lesson5-teacher.css'].map(read).join('\n'):'');
  fs.writeFileSync(file,read(file).replace('</head>',()=>`<style id="lesson-guided-styles">\n${guidedCss}\n</style>\n</head>`));
  if(day===5)fs.writeFileSync(file,read(file).replace('load();render();appearance();',()=>['assets/lesson5-map.js','assets/lesson5-flow.js','assets/lesson5-teacher.js','assets/lesson5-hierarchy.js'].map(read).join('\n')+'\nload();render();appearance();'));
  require('./build-pwa.cjs')();
 }
 console.log(`Built ${file}: ${d.rounds.length} rounds / ${d.phrases.length} phrases / ${d.replies.length} listening exchanges.`);
}
module.exports={buildDay};
if(require.main===module){const requested=process.argv.slice(2).map(Number);for(const day of requested.length?requested:[0,...Array.from({length:13},(_,i)=>i+2)])buildDay(day);if(!requested.length)require('./build-korean-day0.cjs').build();}
