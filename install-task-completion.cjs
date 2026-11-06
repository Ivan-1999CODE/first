'use strict';
const fs=require('node:fs');
const read=f=>fs.readFileSync(f,'utf8');
function install(file){
 let html=read(file).replace(/<style id="task-completion-styles">[\s\S]*?<\/style>\n?/g,'').replace(/<script id="task-completion-runtime">[\s\S]*?<\/script>\n?/g,'');
 // Older generated lessons have a Day 2-only integrated finish branch.
 // Route that branch through the same helper without rebuilding lesson data.
 html=html.replace(/^  if\(f.done&&data.day===2\)return top\+.*\r?\n/gm,'');
 html=html.replace('</head>',()=>`<style id="task-completion-styles">${read('assets/task-completion.css')}</style>\n</head>`)
  .replace('</body>',()=>`<script id="task-completion-runtime">${read('assets/task-completion.js')}\nrender();</script>\n</body>`);
 fs.writeFileSync(file,html);
}
module.exports=install;
if(require.main===module){
 for(let day=2;day<=14;day++){
  const d=require('./assets/micro-curriculum.cjs').make(day);
  const file=d.file||'travel-english-unit2-shopping.html';
  install(file);console.log('Updated completion: '+file);
 }
 require('./build-pwa.cjs')();
}
