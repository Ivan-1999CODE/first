const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const before=process.argv.includes('--before'),out=path.resolve('tmp/task-navigation-style');fs.mkdirSync(out,{recursive:true});
const read=(html,key)=>JSON.parse(html.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'))[1]);
const report={views:0,errors:[],mismatches:[],screenshots:[]};
async function settled(p){await p.mouse.move(0,0);await p.evaluate(async()=>{scrollTo(0,0);await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});}
async function shot(p,file,theme,suffix=''){
 await settled(p);const name=(before?'before-':'after-')+path.basename(file,'.html')+'-'+theme+suffix;
 for(const [part,selector]of [['header','.top'],['tasks','#dg-context']]){await p.locator(selector).screenshot({path:path.join(out,name+'-'+part+'.png')});report.screenshots.push(name+'-'+part+'.png');}
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const file of fs.readdirSync('.').filter(f=>/^travel-.*\.html$/.test(f))){
   const html=fs.readFileSync(file,'utf8'),rounds=read(html,'rounds'),course=read(html,'course');
   const dataFile=path.join(out,file+'.data-before.json'),data=Object.fromEntries(['rounds','flows','replies','phrases'].map(k=>[k,read(html,k)]));
   if(before)fs.writeFileSync(dataFile,JSON.stringify(data));else assert.deepEqual(data,JSON.parse(fs.readFileSync(dataFile,'utf8')),file+' lesson content unchanged');
   for(const theme of ['dark','light']){
    const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>report.errors.push(file+': '+e.message));
    await p.addInitScript(theme=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size','large');},theme);await p.goto(pathToFileURL(path.resolve(file)).href);
    for(const section of [0,3,6]){
     await p.evaluate(n=>navigate(n),section);await settled(p);
     const style=await p.evaluate(()=>{
      const color=x=>{const e=document.createElement('span');e.style.color=x;document.body.append(e);const v=getComputedStyle(e).color;e.remove();return v;};
      const cs=getComputedStyle(document.body),menu=document.querySelector('#dg-menu-open'),task=document.querySelector('.dg-task-switch button[aria-pressed=true]');
      const box=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {bg:s.backgroundColor,ink:s.color,border:s.borderColor,radius:s.borderRadius,width:r.width,height:r.height};};
      return {menu:box(menu),task:box(task),text:menu.textContent,accent:color(cs.getPropertyValue('--accent')),onAccent:color(cs.getPropertyValue('--on-accent')),overflow:document.documentElement.scrollWidth>innerWidth+1};
     });
     const expected=`${String(section+1).padStart(2,'0')} · ${rounds[0].displayLabel||rounds[0].id} 選單`;
     for(const [label,okay]of [['menu label',style.text===expected],['menu fill',style.menu.bg===style.accent],['menu text',style.menu.ink===style.onAccent],['selected fill',style.task.bg===style.accent],['selected text',style.task.ink===style.onAccent],['no overflow',!style.overflow]])if(!okay)report.mismatches.push({file,theme,section,label,style});
     report.views++;
    }
    await p.evaluate(()=>navigate(0));await shot(p,file,theme);
    if(!before){
     // The original square letters remain direct controls; menu follows task.
     for(const r of rounds){const ri=rounds.indexOf(r);await p.locator(`[data-dg-task="${ri}"]`).click();assert.equal(await p.locator('#dg-menu-open').textContent(),`01 · ${r.displayLabel||r.id} 選單`);}
     await p.locator('[data-dg-task="0"]').click();
     await p.locator('[data-dg-task="0"]').hover();await p.locator('[data-dg-task="0"]').focus();await shot(p,file,theme,'-selected-focus');
     await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="3"]').hover();await p.locator('#nav [data-page="3"]').focus();
     if([0,1,6,12].includes(course.day)){const name='after-'+path.basename(file,'.html')+'-'+theme+'-menu.png';await p.screenshot({path:path.join(out,name)});report.screenshots.push(name);}
     await p.keyboard.press('Escape');
    }
    await c.close();
   }
  }
  fs.writeFileSync(path.join(out,before?'before.json':'after.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({views:report.views,errors:report.errors,mismatches:report.mismatches.map(({file,theme,section,label})=>({file,theme,section,label})),screenshots:report.screenshots.length}));
  if(!before){assert.deepEqual(report.errors,[]);assert.deepEqual(report.mismatches,[]);}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
