// Embed the shared speaking style so standalone lessons retain it after rebuilds.
const fs=require('fs');
function sync(file){
 const css=fs.readFileSync('assets/speaking-focus.css','utf8');
 const files=file?[file]:fs.readdirSync('.').filter(f=>/^travel-english(?:-unit\d+-[\w-]+)?\.html$/.test(f));
 for(const name of files){
  const before=fs.readFileSync(name,'utf8');
  const html=before.replace(/<style id="speaking-focus-styles">[\s\S]*?<\/style>\s*/g,'').replace('</head>',()=>'<style id="speaking-focus-styles">\n'+css+'\n</style></head>');
  if(html!==before)fs.writeFileSync(name,html);
 }
}
module.exports=sync;
if(require.main===module)sync();
