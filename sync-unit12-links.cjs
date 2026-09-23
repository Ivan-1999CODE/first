const fs=require('fs');
const target='travel-english-unit12-how.html';
function sync(){
 if(!fs.existsSync(target))return;
 const link='<a href="'+target+'"><strong>第 12 天</strong><small>How 旅遊問句工具箱</small></a>';
 for(const file of fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f))){
  const original=fs.readFileSync(file,'utf8');
  const html=original.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/g,block=>{
   block=block.replace(/<a\b[^>]*href="(?:\.\/)?travel-english-unit12-how\.html"[^>]*>[\s\S]*?<\/a>/g,'');
   const ownLink=file===target?link.replace('<a ','<a aria-current="page" '):link;
   const later=block.match(/<a\b[^>]*><strong>第 (1[3-9]|[2-9]\d) 天<\/strong>/);
   return later?block.slice(0,later.index)+ownLink+block.slice(later.index):block.replace('</div></div></nav>',ownLink+'</div></div></nav>');
  });
  if(html!==original)fs.writeFileSync(file,html);
 }
 const index=fs.readFileSync('index.html','utf8');
 if(!index.includes(target))fs.writeFileSync('index.html',index.replace('</main>','  <a href="./'+target+'">UNIT 12：How 旅遊問句工具箱 ↗<small>和旅伴安排一天出遊：提議活動、問清交通與時間、確認張數和票價。七部分互動與延伸補充。</small></a>\n  </main>'));
}
module.exports=sync;
if(require.main===module)sync();
