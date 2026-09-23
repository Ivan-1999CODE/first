const fs=require('fs');
const target='travel-english-unit9-reservations.html';
let html=fs.readFileSync('travel-english-unit3-airport.html','utf8');
html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>Travel Lab｜第九天：預訂位置，還有景點買票</title>')
 .replace(/<meta name="description"[^>]*>/,'<meta name="description" content="第九天旅遊英文：餐廳訂位與景點購票，七部分互動教材、訂位卡、入場票、師生共練及進步自評。">')
 .replace('aria-label="第三天課程"','aria-label="第九天課程"').replace('DAY 03','DAY 09')
 .replace(/<footer class="bottom"><div>[\s\S]*?<\/div>/,'<footer class="bottom"><div><a href="index.html">全部課程</a><a href="travel-english-unit8-hotel.html">Day 08 · 飯店入住</a><span>Day 09 · 訂位與買票</span></div>')
 .replace(/<script>[\s\S]*?<\/script>/,()=>'<script>\n'+['day9.js','day9-scenes.js','day9-runtime.js'].map(f=>fs.readFileSync('assets/'+f,'utf8')).join('\n')+'\n</script>')
 .replace('</head>',()=>'<style id="day9-styles">\n'+['day7.css','day9.css'].map(f=>fs.readFileSync('assets/'+f,'utf8')).join('\n')+'\n</style></head>');
html=html.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/,block=>block.replace(/ aria-current="page"/g,'').replace('href="'+target+'"','href="'+target+'" aria-current="page"'));
html=html.replace(/(<button[^>]*id="large"[^>]*>[\s\S]*?<\/button>)/,'$1<button id="themeToggle" type="button" aria-label="切換為深色模式" aria-pressed="false">☾ 深色</button>');
html=html.replace(/<button[^>]*id="export"[^>]*>[\s\S]*?<\/button>/g,'');
html=html.replace(/<p[^>]*id="storageNotice"[^>]*>[\s\S]*?<\/p>/,'<p id="storageNotice" class="main-note" role="status" hidden>此瀏覽器目前無法保存，關閉後將不保留本次紀錄；仍可繼續練習。</p>');
html=html.replace('<head>','<head><script data-theme-init>try{document.documentElement.dataset.theme=localStorage.getItem("travel-lab-theme")==="dark"?"dark":"light";document.documentElement.dataset.textSize=localStorage.getItem("travel-lab-text-size")==="large"?"large":"standard";}catch{document.documentElement.dataset.theme="light";}</script>');
html=html.replace('</body>',()=>'<script data-theme-controls>'+fs.readFileSync('assets/day7-theme.js','utf8')+'</script></body>');
fs.writeFileSync(target,html);
console.log('Built Day 09: embedded data, interactions, styles and SVG.');
require('./sync-unit14-links.cjs')();

// Preserve the Day 13 entry after rebuilding this unit.
require('./sync-unit13-links.cjs')();

// Keep the newest lesson reachable after rebuilding an earlier unit.
require('./sync-unit11-links.cjs')();

// Preserve the Day 12 navigation when rebuilding a lesson.
require('./sync-unit12-links.cjs')();

// Preserve the shared student speaking cue after each rebuild.
require('./sync-speaking-focus.cjs')(target);

// Keep shared translation and speech controls in rebuilt lessons.
require('./sync-lesson-controls.cjs')();
