const fs=require('node:fs');
module.exports=function install(file,data){
 const integration=require('./assets/chapter-integration-data.cjs')(data);
 if(!integration)return;
 const read=f=>fs.readFileSync(f,'utf8');
 const css=read('assets/chapter-integration.css')+'\n'+read('assets/integrated-completion.css');
 const runtime=read('assets/integrated-completion.js')+'\n'+read('assets/chapter-integration.js');
 const json=JSON.stringify(integration).replace(/</g,'\\u003c');
 const html=read(file).replace(/<style id="chapter-integration-styles">[\s\S]*?<\/style>\s*/g,'').replace(/<script id="chapter-integration">[\s\S]*?<\/script>\s*/g,'');
 fs.writeFileSync(file,html.replace('</head>',()=>`<style id="chapter-integration-styles">${css}</style>\n</head>`).replace('</body>',()=>`<script id="chapter-integration">\nconst chapterIntegration=${json};\n${runtime}\n</script>\n</body>`));
};
