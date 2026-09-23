const fs=require('fs');
let html=fs.readFileSync('travel-english-unit3-airport.html','utf8');
html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>Travel Lab｜第六天：點餐與詢價</title>')
 .replace(/<meta name="description"[^>]*>/,'<meta name="description" content="第六天旅遊英文：詢問推薦、價格與點餐。七個部分，咖啡廳與預算餐廳互動，先聽、開口、操作菜單。">')
 .replace('aria-label="第三天課程"','aria-label="第六天課程"').replace('<span class="day">DAY 03</span>','<span class="day">DAY 06</span>')
 .replace(/<footer class="bottom"><div>[\s\S]*?<\/div>/,'<footer class="bottom"><div><a href="index.html">全部課程</a><a href="travel-english-unit5-getting-around.html">Day 05 · 城市移動</a><span>Day 06 · 點餐與詢價</span></div>')
 .replace(/<script>[\s\S]*?<\/script>/,()=>'<script>\n'+fs.readFileSync('assets/day6.js','utf8')+'\n</script>')
 .replace('</head>','<style id="day6-styles">\n'+fs.readFileSync('assets/day6.css','utf8')+'\n</style></head>');
const link='<a href="travel-english-unit6-ordering.html" aria-current="page"><strong>第 6 天</strong><small>點餐與詢價</small></a>';
html=html.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/,block=>{block=block.replace(/ aria-current="page"/g,'');return block.includes('travel-english-unit6-ordering.html')?block.replace('href="travel-english-unit6-ordering.html"','href="travel-english-unit6-ordering.html" aria-current="page"'):block.replace('</div></div></nav>',link+'</div></div></nav>');});
fs.writeFileSync('travel-english-unit6-ordering.html',html);
console.log('Built Day 06: embedded JavaScript, styles and SVG artwork.');

// Keep the Day 10 navigation entry when rebuilding older units.
require('./sync-unit10-links.cjs')();

// Preserve the Day 13 entry after rebuilding this unit.
require('./sync-unit13-links.cjs')();

// Keep the newest lesson reachable after rebuilding an earlier unit.
require('./sync-unit11-links.cjs')();

// Preserve the Day 12 navigation when rebuilding a lesson.
require('./sync-unit12-links.cjs')();

// Preserve the shared student speaking cue after each rebuild.
require('./sync-speaking-focus.cjs')('travel-english-unit6-ordering.html');

// Keep shared translation and speech controls in rebuilt lessons.
require('./sync-lesson-controls.cjs')();
