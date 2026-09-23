const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
// Days 1 and 2 migrated to the shared seven-part runtime, with their own layout checks.
require('./check-unit1-2.cjs');
const files=['travel-english-unit3-airport.html','travel-english-unit4-transit.html'];
for(const [index,file] of files.entries()){
 const html=fs.readFileSync(file,'utf8'),elements=new Map();
 const el=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},focus(){},setAttribute(){},querySelectorAll(){return[];}});return elements.get(s);};
 const context=vm.createContext({console,document:{querySelector:s=>s.startsWith('#')&&!html.includes('id="'+s.slice(1)+'"')?null:el(s),querySelectorAll:()=>[],addEventListener(){}},window:{scrollTo(){},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,clearTimeout(){}});
 vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
 for(let page=0;page<7;page++){vm.runInContext(`page=${page};render()`,context);assert(el('#main').innerHTML.length>500);if(page>0)assert(!el('#main').innerHTML.includes('class="chapter-art"'));}
 assert(html.indexOf('class="course-menu"')<html.indexOf('<main'));
 const summary=html.match(/<summary aria-label="課程選單">([\s\S]*?)<\/summary>/)[1];
 assert.equal((summary.match(/課程選單/g)||[]).length,1);
 assert(!html.includes('class="menu-show"')&&!html.includes('class="menu-hide"'));
 assert.equal(html.match(/<style id="course-layout-styles">\n([\s\S]*?)<\/style>/)[1],fs.readFileSync('assets/course-layout.css','utf8'));
 assert.equal(html.match(/<script id="course-layout-script">\n([\s\S]*?)<\/script>/)[1],fs.readFileSync('assets/course-layout.js','utf8'));
 for(const match of html.matchAll(/(?:src|href)="(assets\/[^"$]+)"/g))assert(fs.existsSync(match[1]),match[1]);
}
for(const width of [390,768,1024,1100,1280,1440]){
 const events={},menu={open:true,addEventListener:(name,fn)=>events[name]=fn};
 const mq={matches:width<=1100,addEventListener:(name,fn)=>events.resize=fn};
 vm.runInNewContext(fs.readFileSync('assets/course-layout.js','utf8'),{document:{querySelector:()=>menu},window:{matchMedia:()=>mq}});
 assert.equal(menu.open,width>1100);
 menu.open=true;events.click({target:{closest:()=>({})}});assert.equal(menu.open,width>1100);
 mq.matches=false;events.resize();assert.equal(menu.open,true);
 mq.matches=true;events.resize();assert.equal(menu.open,false);
}
console.log('PASS: migrated Days 1–2 plus 14 legacy lesson sections, local assets, navigation order, responsive menu state at 6 widths, selection collapse and resize reopening.');
