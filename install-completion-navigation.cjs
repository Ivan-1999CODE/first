'use strict';
const fs=require('node:fs');
function install(file){
 let html=fs.readFileSync(file,'utf8')
  .replace(/<style id="completion-navigation-styles">[\s\S]*?<\/style>\n?/g,'')
  .replace(/<script id="completion-navigation-runtime">[\s\S]*?<\/script>\n?/g,'');
 html=html.replace('</head>',()=>`<style id="completion-navigation-styles">${fs.readFileSync('assets/completion-navigation.css','utf8')}</style>\n</head>`)
  .replace('</body>',()=>`<script id="completion-navigation-runtime">${fs.readFileSync('assets/completion-navigation.js','utf8')}\nrender();</script>\n</body>`);
 fs.writeFileSync(file,html);
}
module.exports=install;
if(require.main===module){
 const files=fs.readdirSync('.').filter(file=>/^travel-english.*\.html$/.test(file));
 for(const file of files)install(file);
 require('./build-pwa.cjs')();
 console.log(`Updated completion navigation in ${files.length} English pages.`);
}
