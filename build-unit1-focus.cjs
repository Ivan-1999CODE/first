const fs=require('fs');
module.exports=function build(){
 const d=require('./assets/day1-focus-data.cjs');
 require('./assets/phrase-substitutions.cjs').addSubstitutions(d);
 require('./assets/listening-preview.cjs').addListeningPreview(d);
 require('./assets/english-answer-translations.cjs').addAnswerTranslations(d);
 d.studyArtwork=require('./assets/course-illustrations.cjs').forLesson(1,d.rounds,d.course.replyRole);
 let runtime=fs.readFileSync('assets/day1-2-runtime.js','utf8').replace('const tabs=','let tabs=').replace('const hint=','let hint=').replace('load();render();appearance();','');
 const code=Object.entries(d).map(([k,v])=>`const ${k}=${JSON.stringify(v).replace(/</g,'\\u003c')};`).join('\n')+'\n'+fs.readFileSync('assets/day1-2-scenes.js','utf8')+'\n'+fs.readFileSync('assets/day1-2-reply.js','utf8')+'\n'+runtime+'\n'+fs.readFileSync('assets/flow-guidance.js','utf8')+'\n'+fs.readFileSync('assets/day1-focus.js','utf8')+'\n'+fs.readFileSync('assets/day1-homework.js','utf8')+'\n'+fs.readFileSync('assets/study-library.js','utf8')+'\n'+fs.readFileSync('assets/day1-micro.js','utf8')+'\n'+['assets/dialogue-preview.js','assets/day1-guided-pages.js','assets/day1-guided-study.js','assets/day1-capstone.js','assets/day1-guided.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+'\nload();render();appearance();';
 const css=['assets/day1-2.css','assets/speaking-focus.css','assets/day1-2-reply.css','assets/day1-focus.css','assets/day1-homework.css','assets/study-library.css','assets/flow-guidance.css','assets/dialogue-preview.css'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
 const html=fs.readFileSync('assets/task-rounds-template.html','utf8')
 .replace(/<title>[\s\S]*?<\/title>/,'<title>Travel Lab｜第一天：問路與求助</title>')
 .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${d.course.description}">`)
 .replace('<!-- TASK_STYLES -->',()=>`<style id="day1-styles">${css}</style>`)
 .replace('<!-- TASK_APP -->',()=>`<script id="day1-app">${code}</script>`)
 .replace(/ aria-current="page"/g,'').replace('href="travel-english.html"','href="travel-english.html" aria-current="page"')
 .replaceAll('第 14 天的七部分課程','第 1 天：A、B、C 任務練習與整合挑戰').replaceAll('>DAY 14<','>DAY 1<').replace(/第 14 天：[^<]*<\/footer>/,'第 1 天：問路與求助</footer>');
 fs.writeFileSync('travel-english.html',html);
 // This pilot builds Day 1 only; do not sync or rewrite the other lessons.
 const controls=fs.readFileSync('assets/lesson-controls.js','utf8');
 fs.writeFileSync('travel-english.html',html.replace('</body>',()=>'<script id="lesson-controls">\n'+controls+'</script>\n</body>'));
 require('./sync-appearance.cjs')('travel-english.html');
 // Keep the Day 1 presentation after shared appearance rules without changing other lessons.
 const styled=fs.readFileSync('travel-english.html','utf8').replace('</head>',()=>'<style id="day1-guided-styles">\n'+['assets/day1-guided.css','assets/day1-capstone.css'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+'\n</style>\n</head>');
 fs.writeFileSync('travel-english.html',styled);
 require('./build-pwa.cjs')();
 console.log('Built Day 1 focus: '+d.phrases.length+' phrases / '+d.rounds.length+' rounds.');
};
if(require.main===module)module.exports();
