const fs=require('fs');
function sync(){
 const target='travel-japanese-day0-directions.html';if(!fs.existsSync(target))return;
 const link=`<a href="${target}"><strong>第 0 天</strong><small>日文問路與購物</small></a>`;
 for(const file of fs.readdirSync('.').filter(f=>/^(travel-english.*|travel-japanese-day0-directions)\.html$/.test(f))){
  const old=fs.readFileSync(file,'utf8');
  const updated=old.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/g,block=>block.replace(/<a\b[^>]*href="(?:\.\/)?travel-japanese-day0-directions\.html"[^>]*>[\s\S]*?<\/a>/g,'').replace('<div class="day-switcher-links">','<div class="day-switcher-links">'+(file===target?link.replace('<a ','<a aria-current="page" '):link)));
  if(old!==updated)fs.writeFileSync(file,updated);
 }
 const old=fs.readFileSync('index.html','utf8');
 if(!old.includes(target))fs.writeFileSync('index.html',old.replace('    <a href="./travel-english.html">',`    <a href="./${target}">DAY 00：第零天・日文問路與購物 ↗<small>4 個小任務、14 個實用說法。練問路、求助、問價錢與付款。</small></a>\n    <a href="./travel-english.html">`));
}
module.exports=sync;
if(require.main===module)sync();
