'use strict';
const fs=require('node:fs');
module.exports=function installHomework(file){
 const read=f=>fs.readFileSync(f,'utf8');
 const html=read(file).replace(/<style id="homework-styles">[\s\S]*?<\/style>\s*/g,'').replace(/<script id="homework-runtime">[\s\S]*?<\/script>\s*/g,'');
 fs.writeFileSync(file,html.replace('</head>',()=>`<style id="homework-styles">${read('assets/day1-homework.css')}</style>\n</head>`).replace('</body>',()=>`<script id="homework-runtime">${read('assets/day1-homework.js')}</script>\n</body>`));
};
