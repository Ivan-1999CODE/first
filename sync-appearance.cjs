const fs=require('fs');
const assets=Object.fromEntries(['appearance-init.js','appearance.css','appearance.js'].map(name=>[name,fs.readFileSync('assets/'+name,'utf8')]));
const coursePaletteStyles=fs.readFileSync('assets/course-palettes.css','utf8');
const coursePalettes=['peach','apricot','butter','rose','mauve','latte'];
module.exports=function syncAppearance(file){
 const files=file?[file]:fs.readdirSync('.').filter(f=>f==='index.html'||/^travel-(?:english(?:-unit.*)?|japanese-day0-directions)\.html$/.test(f));
 for(const name of files){
  let html=fs.readFileSync(name,'utf8');
  for(const id of ['shared-appearance-init','shared-appearance-styles','shared-appearance-controls','course-palette-styles'])html=html.replace(new RegExp('<(script|style) id="'+id+'"[^>]*>[\\s\\S]*?<\\/\\1>\\s*','g'),'');
  html=html.replace(/<script data-(?:theme-init|appearance-init|theme-controls)[^>]*>[\s\S]*?<\/script>\s*/g,'');
  const kind=name==='index.html'?'index':html.includes('class="shell"')?'legacy':'modern';
  const fallback=kind==='legacy'&&!/<style id="day[789]-styles"/.test(html);
  html=html.replace(/ data-appearance-(?:kind="[^"]*"|fallback(?:="[^"]*")?)/g,'');
  html=html.replace('<html ',`<html data-appearance-kind="${kind}"${fallback?' data-appearance-fallback':''} `);
  const courseDay=name==='travel-japanese-day0-directions.html'?0:name==='travel-english.html'?1:Number(name.match(/^travel-english-unit(\d+)-/)?.[1]);
  html=html.replace(/ data-course-(?:palette|day)="[^"]*"/g,'');
  if(Number.isInteger(courseDay))html=html.replace('<html ',`<html data-course-day="${courseDay}" data-course-palette="${coursePalettes[courseDay%coursePalettes.length]}" `);
  html=html.replace(/(<meta charset="utf-8"\s*\/?>)/i,meta=>meta+'\n<script id="shared-appearance-init" data-appearance-init>\n'+assets['appearance-init.js']+'</script>');
  html=html.replace('</head>',()=>'<style id="shared-appearance-styles">\n'+assets['appearance.css']+'</style>\n</head>');
  if(Number.isInteger(courseDay))html=html.replace('</head>',()=>'<style id="course-palette-styles">\n'+coursePaletteStyles+'</style>\n</head>');
  if(kind==='index'&&!html.includes('id="large"'))html=html.replace('<body>','<body>\n<header class="top"><div class="top-inner"><span class="brand">Travel Lab ↗</span><div class="tools" role="group" aria-label="閱讀設定"><button id="large" type="button" aria-pressed="false">放大文字</button><button id="theme" type="button" aria-label="切換為深色模式" aria-pressed="false">☾ 深色</button></div></div></header>');
  if(!/<button[^>]*id="(?:theme|themeToggle)"/.test(html))html=html.replace(/(<button[^>]*id="large"[^>]*>[\s\S]*?<\/button>)/,'$1<button id="themeToggle" type="button" aria-label="切換為深色模式" aria-pressed="false">☾ 深色</button>');
  // Template-based builders may inherit the control before adding their own.
  let seen=false;
  html=html.replace(/<button[^>]*id="(?:theme|themeToggle)"[^>]*>[\s\S]*?<\/button>/g,button=>{if(seen)return '';seen=true;return button;});
  html=html.replace('</body>',()=>'<script id="shared-appearance-controls">\n'+assets['appearance.js']+'</script>\n</body>');
  if(html!==fs.readFileSync(name,'utf8'))fs.writeFileSync(name,html);
 }
};
if(require.main===module){module.exports();console.log('Synced appearance: index and Days 0–14.');}
