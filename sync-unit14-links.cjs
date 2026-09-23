const fs=require('fs');
const target='travel-english-unit14-travel-questions.html';
function sync(){
 if(!fs.existsSync(target))return;
 const link='<a href="'+target+'"><strong>第 14 天</strong><small>問地點、時間與人物</small></a>';
 for(const file of fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f))){
  const original=fs.readFileSync(file,'utf8');
  const html=original.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/g,block=>{
   block=block.replace(/<a\b[^>]*href="(?:\.\/)?travel-english-unit14-travel-questions\.html"[^>]*>[\s\S]*?<\/a>/g,'');
   return block.replace('</div></div></nav>',(file===target?link.replace('<a ','<a aria-current="page" '):link)+'</div></div></nav>');
  });
  if(html!==original)fs.writeFileSync(file,html);
 }
 const index=fs.readFileSync('index.html','utf8');
 if(!index.includes(target))fs.writeFileSync('index.html',index.replace('</main>','  <a href="./'+target+'">UNIT 14：旅途中問清楚 ↗<small>Where、When、Who：問地點、時間與人物，完成半日遊集合卡，練習行程變更後重新確認。</small></a>\n  </main>'));
}
module.exports=sync;
if(require.main===module)sync();
