const fs=require('fs');
const target='travel-english-unit13-why-which.html';
function sync(){
 if(!fs.existsSync(target))return;
 const link='<a href="'+target+'"><strong>第 13 天</strong><small>一起決定去哪裡</small></a>';
 for(const file of fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f))){
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/g,block=>{
   block=block.replace(/<a\b[^>]*href="(?:\.\/)?travel-english-unit13-why-which\.html"[^>]*>[\s\S]*?<\/a>/g,'');
   return block.replace('</div></div></nav>',(file===target?link.replace('<a ','<a aria-current="page" '):link)+'</div></div></nav>');
  });
  if(html!==fs.readFileSync(file,'utf8'))fs.writeFileSync(file,html);
 }
 const index=fs.readFileSync('index.html','utf8');
 if(!index.includes(target))fs.writeFileSync('index.html',index.replace('</main>','  <a href="./'+target+'">UNIT 13：一起決定去哪裡 · Why／Which ↗<small>和旅伴選景點、說理由、提建議，一起安排一個下午。七部分互動、師生共練與進步自評。</small></a>\n  </main>'));
}
module.exports=sync;
if(require.main===module)sync();
