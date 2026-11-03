// Reuse the current English presentation, localized only for these two lessons.
const fs=require('node:fs');
const read=name=>fs.readFileSync('assets/'+name,'utf8');
function runtime(language){
 const name=language==='ko'?'韓文':'日文';
 const localize=text=>text.replaceAll('英文',name).replaceAll('lang="en"',`lang="${language}"`);
 return ['lesson-guided-pages.js','lesson-guided-study.js','lesson-guided-scene.js','lesson-guided.js',
  'lesson-focus-flow.js','lesson5-teacher.js','lesson5-hierarchy.js'].map(file=>localize(read(file))).join('\n')+'\n'+read('day0-guided.js');
}
function styles(){
 return read('day1-guided.css').replaceAll('day1-guided','lesson-guided')+'\n'+
  ['lesson-guided.css','lesson5-hierarchy.css','lesson5-flow.css','lesson5-teacher.css','day0-guided.css'].map(read).join('\n');
}
module.exports={runtime,styles};
