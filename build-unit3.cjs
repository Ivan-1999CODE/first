// Update only Day 3's interactive flow; the existing HTML is the course shell.
const fs=require('fs');
const file='travel-english-unit3-airport.html';
let html=fs.readFileSync(file,'utf8');
const start='// DAY3 INTERACTIVE FLOW START',end='// DAY3 INTERACTIVE FLOW END';
html=html.replace(new RegExp(start+'[\\s\\S]*?'+end+'\\r?\\n?'),'');
for(const name of ['practice','canNext','startScene','nextTurn','choose']){
 html=html.replace(new RegExp('^function '+name+'\\([^\\n]*\\r?\\n','m'),'');
}
html=html.replace("document.addEventListener('input',",()=>start+'\n'+fs.readFileSync('assets/day3-scenes.js','utf8')+'\n'+end+"\ndocument.addEventListener('input',");
html=html.replace("if(e.target.id==='spoken'){spoken=e.target.checked;$('#nextTurn').disabled=!canNext();}","if(e.target.id==='heard'||e.target.id==='spoken'){airportConfirm(e.target.id,e.target.checked);return;}");
html=html.replace("if(d.act==='back'&&turn>0){stopAudio();turn--;spoken=false;choice=-1;feedback='';render();return;}","if(d.act==='back')return airportBack();");
html=html.replace(/<style id="day3-scene-styles">[\s\S]*?<\/style>/,'');
html=html.replace('</head>',()=>'<style id="day3-scene-styles">\n'+fs.readFileSync('assets/day3-scenes.css','utf8')+'\n</style></head>');
fs.writeFileSync(file,html);
console.log('Built standalone Day 3 interactive airport flows.');
