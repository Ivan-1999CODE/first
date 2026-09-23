const fs=require('fs');
const target='travel-english-unit10-kind-words.html';
function sync(){
 if(!fs.existsSync(target))return;
 const link='<a href="'+target+'"><strong>第 10 天</strong><small>請求、婉拒與道歉</small></a>';
 for(const file of fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f))){
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/g,block=>{
   block=block.replace(/<a\b[^>]*href="(?:\.\/)?travel-english-unit10-kind-words\.html"[^>]*>[\s\S]*?<\/a>/g,'');
   return block.replace('</div></div></nav>',(file===target?link.replace('<a ','<a aria-current="page" '):link)+'</div></div></nav>');
  });
  if(html!==fs.readFileSync(file,'utf8'))fs.writeFileSync(file,html);
 }
 const index=fs.readFileSync('index.html','utf8');
 if(!index.includes(target))fs.writeFileSync('index.html',index.replace('</main>','  <a href="./'+target+'">UNIT 10：請求東西、婉拒與道歉 ↗<small>說出需要、清楚拒絕，也能為小意外道歉與補救。七部分互動、師生共練與進步自評。</small></a>\n  </main>'));
}
const syncWithLaterUnits=()=>{sync();require('./sync-unit14-links.cjs')();};
module.exports=syncWithLaterUnits;
if(require.main===module)syncWithLaterUnits();
