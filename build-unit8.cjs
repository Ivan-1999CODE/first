const fs=require('fs');
let html=fs.readFileSync('travel-english-unit3-airport.html','utf8');
html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>Travel Lab｜第八天：飯店入住與客房服務</title>')
 .replace(/<meta name="description"[^>]*>/,'<meta name="description" content="第八天旅遊英文：飯店入住、加毛巾與客房送餐。七部分互動教學、分層提示、師生任務與進步自評。">')
 .replace('aria-label="第三天課程"','aria-label="第八天課程"').replace('<span class="day">DAY 03</span>','<span class="day">DAY 08</span>')
 .replace(/<footer class="bottom"><div>[\s\S]*?<\/div>/,'<footer class="bottom"><div><a href="index.html">全部課程</a><a href="travel-english-unit7-fitting.html">Day 07 · 尺寸與試穿</a><span>Day 08 · 飯店入住與客房服務</span></div>')
 .replace(/<script>[\s\S]*?<\/script>/,()=>'<script>\n'+['day8.js','day8-scenes.js','day8-runtime.js'].map(f=>fs.readFileSync('assets/'+f,'utf8')).join('\n')+'\n</script>')
 .replace('</head>',()=>'<style id="day8-styles">\n'+['day7.css','day8.css'].map(f=>fs.readFileSync('assets/'+f,'utf8')).join('\n')+'\n</style></head>');
const link='<a href="travel-english-unit8-hotel.html" aria-current="page"><strong>第 8 天</strong><small>入住與客房服務</small></a>';
html=html.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/,block=>{block=block.replace(/ aria-current="page"/g,'');return block.includes('travel-english-unit8-hotel.html')?block.replace('href="travel-english-unit8-hotel.html"','href="travel-english-unit8-hotel.html" aria-current="page"'):block.replace('</div></div></nav>',link+'</div></div></nav>');});
html=html.replace(/(<button[^>]*id="large"[^>]*>[\s\S]*?<\/button>)/,'$1<button id="themeToggle" type="button" aria-label="切換為深色模式" aria-pressed="false">☾ 深色</button>');
html=html.replace('<head>','<head><script data-theme-init>try{document.documentElement.dataset.theme=localStorage.getItem("travel-lab-theme")==="dark"?"dark":"light";}catch{document.documentElement.dataset.theme="light";}</script>');
html=html.replace('</body>',()=>'<script data-theme-controls>'+fs.readFileSync('assets/day7-theme.js','utf8')+'</script></body>');
fs.writeFileSync('travel-english-unit8-hotel.html',html);
console.log('Built Day 08: standalone hotel lesson, embedded styles, scripts and illustrations.');

// Keep the Day 10 navigation entry when rebuilding older units.
require('./sync-unit10-links.cjs')();

// Preserve the Day 13 entry after rebuilding this unit.
require('./sync-unit13-links.cjs')();

// Keep the newest lesson reachable after rebuilding an earlier unit.
require('./sync-unit11-links.cjs')();

// Preserve the Day 12 navigation when rebuilding a lesson.
require('./sync-unit12-links.cjs')();

// Preserve the shared student speaking cue after each rebuild.
require('./sync-speaking-focus.cjs')('travel-english-unit8-hotel.html');

// Keep shared translation and speech controls in rebuilt lessons.
require('./sync-lesson-controls.cjs')();
