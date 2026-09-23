const fs=require('fs');
const lessons=require('./assets/day1-2-data.cjs');
const template=fs.readFileSync('travel-english-unit14-travel-questions.html','utf8');
const css=fs.readFileSync('assets/day1-2.css','utf8')+'\n'+fs.readFileSync('assets/speaking-focus.css','utf8')+'\n'+fs.readFileSync('assets/day1-2-reply.css','utf8');
for(const d of lessons){
 const day=d.course.day,file=day===1?'travel-english.html':'travel-english-unit2-shopping.html';
 const data=Object.entries(d).map(([k,v])=>`const ${k}=${JSON.stringify(v).replace(/</g,'\\u003c')};`).join('\n');
 const code=[data,fs.readFileSync('assets/day1-2-scenes.js','utf8'),fs.readFileSync('assets/day1-2-reply.js','utf8'),fs.readFileSync('assets/day1-2-runtime.js','utf8')].join('\n');
 let html=template.replace(/<title>[\s\S]*?<\/title>/,`<title>Travel Lab｜第 ${day} 天：${d.course.title}</title>`)
 .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${d.course.description}">`)
 .replace(/<style id="day14-styles">[\s\S]*?<\/style>/,()=>`<style id="day${day}-styles">${css}</style>`)
 .replace(/<script id="day14-app">[\s\S]*?<\/script>/,()=>`<script id="day${day}-app">${code}</script>`)
 .replace(/ aria-current="page"/g,'').replace(`href="${file}"><strong>`,`href="${file}" aria-current="page"><strong>`)
 .replace(/第 14 天的七部分課程/g,`第 ${day} 天的七部分課程`).replace(/>DAY 14</g,`>DAY ${day}<`)
 .replace('第 14 天：旅途中問清楚：Where、When、Who',`第 ${day} 天：${d.course.title}`);
 fs.writeFileSync(file,html);
 console.log(`Built ${file}: ${d.phrases.length} phrases, ${d.replies.length} replies, ${d.flows.length} flows.`);
}

// Keep shared translation and speech controls in rebuilt lessons.
require('./sync-lesson-controls.cjs')();
