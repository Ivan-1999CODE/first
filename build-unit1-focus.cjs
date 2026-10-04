const fs=require('fs');
module.exports=function build(){
 const d=require('./assets/day1-focus-data.cjs');
 let runtime=fs.readFileSync('assets/day1-2-runtime.js','utf8').replace('const tabs=','let tabs=').replace('load();render();appearance();','');
 const code=Object.entries(d).map(([k,v])=>`const ${k}=${JSON.stringify(v).replace(/</g,'\\u003c')};`).join('\n')+'\n'+fs.readFileSync('assets/day1-2-scenes.js','utf8')+'\n'+fs.readFileSync('assets/day1-2-reply.js','utf8')+'\n'+runtime+'\n'+fs.readFileSync('assets/day1-focus.js','utf8')+'\n'+fs.readFileSync('assets/day1-homework.js','utf8')+'\nload();render();appearance();';
 const css=['assets/day1-2.css','assets/speaking-focus.css','assets/day1-2-reply.css','assets/day1-focus.css','assets/day1-homework.css'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
 const html=fs.readFileSync('travel-english-unit14-travel-questions.html','utf8')
 .replace(/<title>[\s\S]*?<\/title>/,'<title>Travel Lab｜第一天：分輪聚焦問路</title>')
 .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${d.course.description}">`)
 .replace(/<style id="day14-styles">[\s\S]*?<\/style>/,()=>`<style id="day1-styles">${css}</style>`)
 .replace(/<script id="day14-app">[\s\S]*?<\/script>/,()=>`<script id="day1-app">${code}</script>`)
 .replace(/ aria-current="page"/g,'').replace('href="travel-english.html"','href="travel-english.html" aria-current="page"')
 .replaceAll('第 14 天的七部分課程','第 1 天的七部分課程').replaceAll('>DAY 14<','>DAY 1<').replace(/第 14 天：[^<]*<\/footer>/,'第 1 天：分輪聚焦問路</footer>');
 fs.writeFileSync('travel-english.html',html);
 require('./sync-lesson-controls.cjs')('travel-english.html');
 console.log('Built Day 1 focus: 13 phrases / 3 rounds (4, 5, 4).');
};
if(require.main===module)module.exports();
