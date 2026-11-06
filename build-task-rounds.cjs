const fs=require('fs');
const read=file=>fs.readFileSync(file,'utf8');
function buildDay(day){
 const japanese=day===0;
 if(![0,...Array.from({length:13},(_,i)=>i+2)].includes(day))throw Error('Day must be 0 or 2–14.');
 const d=day===0?require('./assets/micro-day0.cjs').make('ja'):require('./assets/micro-curriculum.cjs').make(day);
 if(day===2)d.day2Practice=require('./assets/day2-part03.cjs')(d);
 if(day===8)d.hotelIntegration=require('./assets/day8-integration-data.cjs')(d);
 if(day===6)d.foodArtwork='data:image/png;base64,'+fs.readFileSync('assets/illustrations/day6-steak-eggs-atlas.png').toString('base64');
 // Canonical task data already contains every taught reply and translation.
 const file=d.file||(japanese?'travel-japanese-day0-directions.html':'travel-english-unit2-shopping.html');
 const title=`${d.course.dayLabel||'第 '+day+' 天'}：${d.course.title}・分任務練習`;
 let runtime=read('assets/day1-2-runtime.js').replace('const tabs=','let tabs=').replace('const hint=','let hint=').replace('load();render();appearance();','');
 if(japanese){runtime=runtime.replaceAll('英文','日文').replaceAll('lang="en"','lang="ja"');runtime=runtime.replace('${esc(en)}</p><p>${esc(zh)}','${esc(en)}</p>${reading(en)}<p>${esc(zh)}').replace('${audio(answer)}<p class="fine">','${reading(answer)}${audio(answer)}<p class="fine">');
  require('./assets/day0-learning-build.cjs')(d);
 }
 if(!japanese)d.lessonArtwork=require('./assets/course-illustrations.cjs').forLesson(d.course.day,d.rounds,d.course.replyRole);
 else d.studyArtwork=require('./assets/course-illustrations.cjs').forLesson(day,d.rounds,d.course.replyRole);
 const data=Object.entries(d).map(([k,v])=>`const ${k}=${JSON.stringify(v).replace(/</g,'\\u003c')};`).join('\n');
 const code=[data,runtime,read('assets/flow-guidance.js'),japanese?read('assets/day0-extra.js'):'',read('assets/task-rounds.js'),read('assets/task-rounds-expanded.js'),japanese?read('assets/day0-library.js'):read('assets/illustrated-lessons.js'),read('assets/study-library.js'),read('assets/dialogue-preview.js'),read('assets/micro-lessons.js'),japanese?read('assets/day0-practical.js'):'',japanese?require('./assets/day0-guided-build.cjs').runtime('ja'):'',japanese?read('assets/day0-numbers.js'):'',japanese?read('assets/day0-primer.js'):'',d.course.mergedTasks?read('assets/merged-lessons.js'):'',...japanese?[]:['assets/lesson-navigation.js','assets/lesson-guided-pages.js','assets/lesson-guided-study.js','assets/lesson-guided-scene.js','assets/lesson-guided.js'].map(read),read('assets/say-practice.js'),'load();render();appearance();',japanese?read('assets/day0-audio.js'):'',japanese?read('assets/day0-glossary.js'):''].join('\n');
 const css=['assets/day1-2.css','assets/speaking-focus.css','assets/task-rounds.css',...japanese?['assets/day0-follow.css','assets/day0-library.css','assets/day0-glossary.css','assets/day0-practical.css','assets/day0-primer.css']:['assets/illustrated-lessons.css'],'assets/study-library.css','assets/flow-guidance.css','assets/micro-lessons.css','assets/dialogue-preview.css','assets/say-practice.css',...d.course.mergedTasks?['assets/merged-lessons.css']:[]].map(read).join('\n');
 let html=read('assets/task-rounds-template.html')
  .replace(/<title>[\s\S]*?<\/title>/,`<title>Travel Lab｜${title}</title>`)
  .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${d.course.description}">`)
  .replace('<!-- TASK_STYLES -->',()=>`<style id="day${day}-styles">${css}</style>`)
  .replace('<!-- TASK_APP -->',()=>`<script id="day${day}-app">${code}</script>`)
  .replace(/<script id="lesson-controls">[\s\S]*?<\/script>\s*/g,'')
  .replace(/ aria-current="page"/g,'').replace(`href="${file}"`,`href="${file}" aria-current="page"`)
  .replaceAll('第 14 天的七部分課程',`第 ${d.course.day} 天的七部分課程`).replaceAll('>DAY 14<',`>DAY ${d.course.day}<`)
  .replace('第 14 天：旅途中問清楚：Where、When、Who',title);
 if(!japanese)html=html.replace('<html ','<html data-illustrated="true" ').replace('</body>',()=>`<script id="lesson-controls">\n${read('assets/lesson-controls.js')}</script>\n</body>`);
 if(d.rescueVersion){
  html=html.replace('load();render();appearance();',()=>read('assets/travel-rescue.js')+'\nload();render();appearance();');
  html=html.replace('</head>',()=>'<style id="travel-rescue-styles">'+read('assets/travel-rescue.css')+'</style></head>');
 }
 if(day===6)html=html.replace('load();render();appearance();',()=>read('assets/day6-drinks.js')+'\n'+read('assets/day6-ready-order.js')+'\nload();render();appearance();');
 if(japanese)html=html.replace('</head>',()=>`<style id="day0-guided-styles">${require('./assets/day0-guided-build.cjs').styles()}</style></head>`);
 fs.writeFileSync(file,html);
 require('./sync-appearance.cjs')(file);
 if(!japanese){
  const guidedCss=read('assets/day1-guided.css').replaceAll('day1-guided','lesson-guided')+'\n'+read('assets/lesson-guided.css')+'\n'+read('assets/lesson5-hierarchy.css')+'\n'+[...(day===5?['assets/lesson5-map.css']:[]),'assets/lesson5-flow.css'].map(read).join('\n')+'\n'+read('assets/lesson5-teacher.css');
  fs.writeFileSync(file,read(file).replace('</head>',()=>`<style id="lesson-guided-styles">\n${guidedCss}\n</style>\n</head>`));
  fs.writeFileSync(file,read(file).replace('load();render();appearance();',()=>[...(day===5?['assets/lesson5-map.js','assets/lesson5-flow.js']:['assets/lesson-focus-flow.js']),'assets/lesson5-teacher.js','assets/lesson5-hierarchy.js'].map(read).join('\n')+'\nload();render();appearance();'));
  if(day===8){
   const integrated=read(file).replace('</head>',()=>`<style id="day8-integration-styles">\n${read('assets/day8-integration.css')}\n${read('assets/integrated-completion.css')}\n</style>\n</head>`).replace('</body>',()=>`<script id="day8-integration">\n${read('assets/integrated-completion.js')}\n${read('assets/day8-complete.js')}
${read('assets/day8-integration.js')}\nrender();\n</script>\n</body>`);
   fs.writeFileSync(file,integrated);
  }
  // Install after topic-specific presentation overrides; keep the shared lesson
  // state and the separate hotel integration's state owners unchanged.
  fs.writeFileSync(file,read(file).replace('load();render();appearance();',()=>read('assets/interactive-flow.js')+'\n'+read('assets/interactive-task-scenes.js')+'\n'+read('assets/interactive-choice-art.js')+'\nload();render();appearance();').replace('</head>',()=>'<style id="interactive-flow-styles">'+read('assets/interactive-flow.css')+'\n'+read('assets/interactive-task-scenes.css')+'\n'+read('assets/interactive-redesign.css')+'</style></head>'));
  if(day===2)fs.writeFileSync(file,read(file).replace('load();render();appearance();',()=>read('assets/day2-part03.js')+'\nload();render();appearance();').replace('</head>',()=>'<style id="day2-part03-styles">'+read('assets/day2-part03.css')+'</style></head>'));
  require('./install-chapter-integration.cjs')(file,d);
  fs.writeFileSync(file,read(file).replace('</head>',()=>'<style id="lesson-navigation-styles">'+read('assets/lesson-navigation.css')+'</style></head>'));
  require('./install-task-completion.cjs')(file);
  require('./build-pwa.cjs')();
 }
 console.log(`Built ${file}: ${d.rounds.length} rounds / ${d.phrases.length} phrases / ${d.replies.length} listening exchanges.`);
}
function buildRescue(){for(const day of [12,13,14])buildDay(day);require('./sync-rescue-links.cjs')();require('./build-pwa.cjs')();}
module.exports={buildDay,buildRescue};
if(require.main===module){
 const requested=process.argv.slice(2).map(Number),days=requested.length?requested:[0,...Array.from({length:13},(_,i)=>i+2)];
 for(const day of days.filter(n=>n<12||n>14))buildDay(day);
 if(days.some(n=>n>=12&&n<=14))buildRescue();
 if(!requested.length)require('./build-korean-day0.cjs').build();
}
