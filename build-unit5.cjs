// Keep the fifth lesson portable: embed its source and the existing course shell.
const fs=require('fs');
let html=fs.readFileSync('travel-english-unit3-airport.html','utf8');
html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>Travel Lab｜第五天：城市移動</title>')
 .replace(/<meta name="description"[^>]*>/,'<meta name="description" content="第五天旅遊英文：問路、搭計程車與 Uber。七個部分，地圖聽力、時間車資、口說與雙人任務。">')
 .replace('aria-label="第三天課程"','aria-label="第五天課程"').replace('<span class="day">DAY 03</span>','<span class="day">DAY 05</span>')
 .replace(/<footer class="bottom"><div>[\s\S]*?<\/div>/,'<footer class="bottom"><div><a href="index.html">全部課程</a><a href="travel-english-unit3-airport.html">Day 03 · 機場</a><a href="travel-english-unit4-transit.html">Day 04 · 搭車</a><span>Day 05 · 城市移動</span></div>')
 .replace(/<script>[\s\S]*?<\/script>/,()=>'<script>\n'+fs.readFileSync('assets/day5.js','utf8')+'\n'+fs.readFileSync('assets/day5-scenes.js','utf8')+'\n</script>');
html=html.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/,block=>block.replace(/ aria-current="page"/g,'').replace('href="travel-english-unit5-getting-around.html"','href="travel-english-unit5-getting-around.html" aria-current="page"'));
const css=`
/* Day 05: map and ride details share the existing course typography. */
.city-hero{background:#e5ece6;border-radius:28px;padding:20px;min-width:0}
.city-map{position:relative;width:100%;max-width:550px;margin:auto;isolation:isolate}
.city-map svg{width:100%;height:auto}
.map-pin{position:absolute;transform:translate(-50%,-30%);border-radius:13px;background:#fff;color:#1d1d1f;box-shadow:0 4px 12px #25493518;padding:9px 13px;min-width:62px;text-align:center;font-weight:700;line-height:1.2;font-size:1.1rem}
.map-pin small{display:block;font-weight:500;font-size:.65rem;margin-top:4px}.map-pin:active{transform:translate(-50%,-30%) scale(.97)}
.static-pin{font-size:1rem;min-width:80px;padding:10px}
.map-caption{margin:10px 0 0;line-height:1.6}.city-hero .map-caption{font-size:.63rem}
.ride-card{display:flex;align-items:center;gap:12px;margin-top:16px;background:white;border-radius:18px;padding:18px;box-shadow:0 6px 20px #26422c0a}
.ride-card small,.ride-card strong,.ride-card span:not(.ride-icon):not(.ride-pill){display:block}
.ride-card small{font-size:.58rem;color:#6c7370;letter-spacing:.1em}.ride-card strong{font-size:1.1rem}.ride-card div>span{font-size:.7rem;color:#68716b}
.ride-icon{width:40px;height:40px;display:grid;place-items:center;background:#edf3ed;border-radius:12px;color:#386344;font-size:1.7rem;flex-shrink:0}
.ride-pill{margin-left:auto;font-size:.53rem;background:#eaf2ff;color:#0056ac;padding:7px;border-radius:20px;white-space:nowrap}
.trip-strip{display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap;padding:18px;background:#edf4ed;border-radius:14px;margin-bottom:20px;font-size:.87rem}
.saved-answer{white-space:pre-wrap;overflow-wrap:anywhere}.hero-copy h1 span{color:#607968}
@media(max-width:640px){.city-hero{padding:16px}.ride-card{padding:14px}.ride-pill{display:none}.map-pin{min-width:48px;padding:8px;font-size:.95rem}.static-pin{min-width:66px}.hero-copy h1{font-size:2.4rem}}
@media(prefers-reduced-motion:reduce){.map-pin:active{transform:translate(-50%,-30%)}}
@media(prefers-contrast:more){.map-pin,.ride-card,.trip-strip{border:1px solid currentColor}}
`;
html=html.replace('</head>','<style id="day5-styles">'+css+fs.readFileSync('assets/day5-scenes.css','utf8')+'</style></head>');
fs.writeFileSync('travel-english-unit5-getting-around.html',html);
console.log('Built standalone Day 05 HTML.');

// Keep the Day 10 navigation entry when rebuilding older units.
require('./sync-unit10-links.cjs')();

// Preserve the Day 13 entry after rebuilding this unit.
require('./sync-unit13-links.cjs')();

// Keep the newest lesson reachable after rebuilding an earlier unit.
require('./sync-unit11-links.cjs')();

// Preserve the Day 12 navigation when rebuilding a lesson.
require('./sync-unit12-links.cjs')();

// Preserve the shared student speaking cue after each rebuild.
require('./sync-speaking-focus.cjs')('travel-english-unit5-getting-around.html');

// Keep shared translation and speech controls in rebuilt lessons.
require('./sync-lesson-controls.cjs')();
