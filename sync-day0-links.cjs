const fs=require('fs');
const lessons=[['travel-japanese-day0-directions.html','日文'],['travel-korean-day0-directions.html','韓文']];
function updateHtml(file,html){
 return html.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/g,block=>{
  let next=block.replace(/<a\b[^>]*href="(?:\.\/)?travel-(?:japanese|korean)-day0-directions\.html"[^>]*>[\s\S]*?<\/a>/g,'');
  const links=lessons.filter(([name])=>fs.existsSync(name)||name===file).map(([name,label])=>`<a tabindex="0" href="${name}"${file===name?' aria-current="page"':''}><strong>第 0 天・${label}</strong><small>${label}旅行實用會話</small></a>`).join('');
  next=next.replace('<div class="day-switcher-links">','<div class="day-switcher-links">'+links);
  const current=next.match(/<a\b[^>]*aria-current="page"[^>]*>([\s\S]*?)<\/a>/)?.[1];
  if(current){const label=current.replace(/<\/strong>\s*<small>/,' · ').replace(/<[^>]+>/g,'');next=next.replace(/(<span class="unit-menu-current">)[\s\S]*?(<\/span>)/,(_,a,b)=>a+label+b);}
  return next;
 });
}
function sync(){
 for(const file of [...fs.readdirSync('.').filter(f=>/^travel-(?:english.*|(?:japanese|korean)-day0-directions)\.html$/.test(f)),'assets/task-rounds-template.html']){
  const old=fs.readFileSync(file,'utf8'),updated=updateHtml(file,old);if(old!==updated)fs.writeFileSync(file,updated);
 }
 const old=fs.readFileSync('index.html','utf8');
 let updated=old.replace(/\s*<a href="\.\/travel-(?:japanese|korean)-day0-directions\.html">[\s\S]*?<\/a>/g,'');
 const cards=lessons.filter(([name])=>fs.existsSync(name)).map(([name,label])=>`    <a href="./${name}">DAY 00：第 0 天・${label}旅行實用會話 ↗<small>6 個主題、10 個小任務。從問價開始，練購物、點餐與找路；可選${label==='日文'?'五十音':'韓文字母與拼讀'}入門。</small></a>`).join('\n');
 updated=updated.replace('    <a href="./travel-english.html">',cards+'\n    <a href="./travel-english.html">');
 if(old!==updated)fs.writeFileSync('index.html',updated);
}
module.exports=sync;module.exports.updateHtml=updateHtml;
if(require.main===module)sync();
