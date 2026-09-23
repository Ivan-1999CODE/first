const fs=require('fs');
const target='travel-english-unit11-what.html';
function sync(){
 if(!fs.existsSync(target))return;
 const link='<a href="'+target+'"><strong>第 11 天</strong><small>What：認識旅伴、安排一天</small></a>';
 for(const file of fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f))){
  const original=fs.readFileSync(file,'utf8');
  const html=original.replace(/<nav class="day-switcher"[\s\S]*?<\/nav>/g,block=>{
   block=block.replace(/<a\b[^>]*href="(?:\.\/)?travel-english-unit11-what\.html"[^>]*>[\s\S]*?<\/a>/g,'');
   block=block.replace('</div></div></nav>',(file===target?link.replace('<a ','<a aria-current="page" '):link)+'</div></div></nav>');
   return block.replace(/(<div class="day-switcher-links">)([\s\S]*?)(<\/div>)/,(_,start,content,end)=>{
    const links=content.match(/<a\b[^>]*>[\s\S]*?<\/a>/g)||[];
    links.sort((a,b)=>Number(a.match(/第 (\d+) 天/)?.[1]||0)-Number(b.match(/第 (\d+) 天/)?.[1]||0));
    return start+links.join('')+end;
   });
  });
  if(html!==original)fs.writeFileSync(file,html);
 }
 const index=fs.readFileSync('index.html','utf8');
 if(!index.includes(target))fs.writeFileSync('index.html',index.replace('</main>','  <a href="./'+target+'">UNIT 11：What：認識旅伴、安排一天 ↗<small>問興趣、看天氣、選活動、約時間。兩段連動情境、師生共練與進步自評。</small></a>\n  </main>'));
}
module.exports=sync;
if(require.main===module)sync();
