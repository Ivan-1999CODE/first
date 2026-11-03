const fs=require('fs');
const target='travel-english-unit12-how.html';
const oldLink=/<a\b[^>]*href="(?:\.\/)?travel-english-unit(?:12-how|13-why-which|14-travel-questions)\.html"[^>]*>[\s\S]*?<\/a>/g;
function updateHtml(file,html){
 const active=/^travel-english-unit(?:12|13|14)-/.test(file);
 return html.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/g,block=>{
  let inserted=false;
  return block.replace(oldLink,()=>{
   if(inserted)return '';inserted=true;
   return `<a tabindex="0" href="${target}"${active?' aria-current="page"':''}><strong>第 12～14 課整合</strong><small>突發狀況與求助</small></a>`;
  }).replace(/(<span class="unit-menu-current">)[\s\S]*?(<\/span>)/,(all,start,end)=>active?start+'第 12～14 課整合 · 突發狀況與求助'+end:all);
 });
}
function sync(){
 for(const file of [...fs.readdirSync('.').filter(f=>/^travel-(?:english.*|(?:japanese|korean)-day0-directions)\.html$/.test(f)),'assets/task-rounds-template.html']){
  const old=fs.readFileSync(file,'utf8'),updated=updateHtml(file,old);if(old!==updated)fs.writeFileSync(file,updated);
 }
 const old=fs.readFileSync('index.html','utf8');let inserted=false;
 const updated=old.replace(oldLink,()=>{
  if(inserted)return '';inserted=true;
  return `<a href="./${target}">UNIT 12–14：旅行出狀況，我能開口求助 ↗<small>三課整合：景點關閉改行程、趕不上集合、包包遺失。說清問題、問到辦法，再確認下一步。</small></a>`;
 }).replace(/\n[ \t]+(?=\r?\n)/g,'\n');
 if(old!==updated)fs.writeFileSync('index.html',updated);
}
module.exports=sync;module.exports.updateHtml=updateHtml;
if(require.main===module)sync();
