// Embed shared interaction in sources and standalone HTML; safe to rerun.
const fs=require('fs');
const data=require('./assets/phrase-workshop-data.cjs');
const runtime=fs.readFileSync('assets/phrase-workshop.js','utf8');
const files={3:'travel-english-unit3-airport.html',4:'travel-english-unit4-transit.html',5:'travel-english-unit5-getting-around.html',6:'travel-english-unit6-ordering.html'};
for(const day of [3,4,5,6]){
 const file=day<5?files[day]:`assets/day${day}.js`;
 let source=fs.readFileSync(file,'utf8');
 source=source.replace(/\/\/ BEGIN PHRASE WORKSHOP[\s\S]*?\/\/ END PHRASE WORKSHOP\r?\n/,'');
 source=source.replace('function phrasePage(){','function phraseLibrary(){');
 if(day<5)source=source.replace('<p class="muted">${p[2]}</p>','<details class="reveal"><summary>看中文意思</summary><p>${p[2]}</p></details>');
 if(day===6){
  source=source.replace('${restaurantPractice()}','${restaurantExtras()}');
  if(!source.includes('function restaurantExtras(){'))source=source.replace('function restaurantPractice(){','function restaurantExtras(){return `<section class="panel before-panel"><h2>延伸閱讀：客人提問與店員接話</h2><p>留意角色；每個小情境都可以單獨練習。</p>${restaurantExchanges.map(x=>`<details class="reveal"><summary>${x.title}</summary>${x.lines.map(([role,en,zh])=>`<p><strong>${role}</strong>：${zh}</p><p class="quote" lang="en">${en}</p><button data-workshop-say="${esc(en)}">▶ 聽發音</button>`).join(\'\')}<p class="fine">${x.note}</p></details>`).join(\'\')}</section>`;}\nfunction restaurantPractice(){');
 }
 const block='// BEGIN PHRASE WORKSHOP\n'+runtime+'\nconst phraseWorkshopConfig='+JSON.stringify(data[day],null,2)+';\nconst phraseWorkshop=createPhraseWorkshop(phraseWorkshopConfig);\nfunction phrasePage(){return phraseWorkshop.render();}\n// END PHRASE WORKSHOP\n';
 source=source.replace('function phraseLibrary(){',block+'function phraseLibrary(){');
 if(!source.includes('phraseWorkshop.handle(d)'))source=source.replace('const d=b.dataset;','const d=b.dataset;if(phraseWorkshop.handle(d))return;');
 fs.writeFileSync(file,source);
 if(day>=5){
  let html=fs.readFileSync(files[day],'utf8');
  const scenes=day===5?'\n'+fs.readFileSync('assets/day5-scenes.js','utf8'):'';
  html=html.replace(/<script>[\s\S]*?<\/script>/,()=>'<script>\n'+source+scenes+'\n</script>');
  fs.writeFileSync(files[day],html);
 }
 console.log(`Day ${day}: two modes, ${data[day].replies.length} reply scenarios.`);
}

// Keep shared translation and speech controls in rebuilt lessons.
require('./sync-lesson-controls.cjs')();
