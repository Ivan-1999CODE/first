const fs=require('fs');
const source=fs.readFileSync('assets/lesson-controls.js','utf8');
module.exports=function sync(file){
 const files=file?[file]:fs.readdirSync('.').filter(f=>/^travel-english(?:-unit.*)?\.html$/.test(f));
 for(const name of files){
  let html=fs.readFileSync(name,'utf8');
  html=html.replace(/<script id="lesson-controls">[\s\S]*?<\/script>\n?/g,'');
  if(!html.includes('function speak('))throw new Error('Missing lesson app: '+name);
  html=html.replace('</body>',()=>'<script id="lesson-controls">\n'+source+'</script>\n</body>');
  fs.writeFileSync(name,html);
 }
};
if(require.main===module)module.exports();
