// Browser emulation, not physical iPhone/iPad certification. No real learner profile is used.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('tmp/playwright-browsers');
const {chromium,webkit}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const web=process.argv.includes('--webkit'),engine=web?'webkit':'edge';
const catalog=require('./assets/curriculum-original.json');
const files=['index.html',...Array.from({length:15},(_,d)=>d===1?'travel-english.html':catalog.find(x=>x.day===d).file)];
const profiles=[[320,568],[360,800],[390,844],[430,932],[568,320],[844,390],[768,1024],[1024,768],[1100,820],[1101,820],[1280,800],[1440,900],[1920,1080]];
const out=`tmp/responsive-qa-${engine}`;fs.mkdirSync(out,{recursive:true});
const report={engine,physicalDevice:false,profiles,files:[],layoutStates:0,errors:[],failures:[]};
function sourceCheck(file){
 const html=fs.readFileSync(file,'utf8');
 for(const [id,tag,asset] of [['responsive-layout-styles','style','responsive-layout.css'],['responsive-layout-script','script','responsive-layout.js']]){
  const blocks=[...html.matchAll(new RegExp(`<${tag} id="${id}">\\n([\\s\\S]*?)<\\/${tag}>`,'g'))];
  assert.equal(blocks.length,1,`${file}: one ${id}`);assert.equal(blocks[0][1],fs.readFileSync('assets/'+asset,'utf8'));
 }
}
async function layout(p,label){
 const issues=await p.evaluate(()=>{
  const es=[...document.querySelectorAll('#main *,main *, .top *, .course-menu>summary, .unit-menu>summary')].filter(e=>e.checkVisibility()&&e.getClientRects().length&&!e.closest('svg'));
  const name=e=>`${e.tagName}.${e.className}: ${e.textContent.trim().slice(0,55)}`;
  const outside=es.filter(e=>{const r=e.getBoundingClientRect();return r.left< -2||r.right>innerWidth+2;}).map(name);
  const small=es.filter(e=>e.matches('button,summary,textarea,label:has(input)')&&(e.offsetWidth<44||e.offsetHeight<44)).map(name);
  const broken=[...document.images].filter(e=>!e.complete||!e.naturalWidth).map(e=>e.alt);
  return {overflow:document.documentElement.scrollWidth>innerWidth+2,outside:outside.slice(0,5),small:small.slice(0,5),broken};
 });
 report.layoutStates++;
 if(issues.overflow||issues.outside.length||issues.small.length||issues.broken.length){
  if(report.failures.length<6)await p.screenshot({path:path.join(out,`failure-${report.failures.length}.png`)});
  report.failures.push({label,...issues});
 }
}
async function nav(p,n){
 if(await p.locator('.course-menu>summary').isVisible()&&!await p.locator('.course-menu').evaluate(e=>e.open))await p.locator('.course-menu>summary').click();
 await p.locator(`#nav [data-page="${n}"]`).click();assert.equal(await p.evaluate(()=>page),n);
 const bounds=await p.evaluate(()=>({title:document.querySelector('#main h1').getBoundingClientRect().top,header:document.querySelector('.top').getBoundingClientRect().bottom,height:innerHeight}));
 assert(bounds.title>=bounds.header-1&&bounds.title<bounds.height-70,'Section heading visible: '+JSON.stringify(bounds));
 assert(await p.locator('#main').evaluate(e=>e===document.activeElement),'Section receives keyboard focus');
}
async function settings(p,theme,size){
 if(await p.locator('html').getAttribute('data-theme')!==theme)await p.locator('#theme').click();
 if(await p.locator('html').getAttribute('data-size')!==size)await p.locator('#large').click();
}
(async()=>{const b=await(web?webkit.launch():chromium.launch({channel:'msedge'}));try{
 for(const file of files){sourceCheck(file);const home=file==='index.html';
  const context=await b.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
  const p=await context.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>report.errors.push({file,message:e.message}));
  await p.goto(pathToFileURL(path.resolve(file)).href);
  for(const [width,height] of profiles){await p.setViewportSize({width,height});
   for(const theme of ['light','dark'])for(const size of ['standard','large']){
    await settings(p,theme,size);const label=`${file} ${width}x${height} ${theme} ${size}`;
    if(home){await layout(p,label);continue;}
    const menu=p.locator('.unit-menu'),summary=menu.locator(':scope>summary');
    if(width<=1100){
     assert(!await menu.evaluate(e=>e.open),'Compact day picker starts closed');
     const current=await p.locator('.day-switcher [aria-current=page]').evaluate(e=>e.querySelector('strong').textContent+' · '+e.querySelector('small').textContent);
     assert.equal(await summary.locator('.unit-menu-current').textContent(),current);
     await summary.click();assert(await menu.evaluate(e=>e.open));
     const links=menu.locator('a');assert.equal(await links.count(),15);
     for(const i of [0,14]){await links.nth(i).scrollIntoViewIfNeeded();const r=await links.nth(i).boundingBox();assert(r.width>=44&&r.height>=44);}
     await summary.focus();await p.keyboard.press('Escape');assert(!await menu.evaluate(e=>e.open));
     assert(await summary.evaluate(e=>e===document.activeElement));
     await p.locator('.course-menu>summary').click();await layout(p,label+' course menu open');
    }else{assert(await menu.evaluate(e=>e.open));assert(!await summary.isVisible());}
    for(let n=0;n<7;n++){
     // Phone touch paths have a separate end-to-end suite; click all desktop parts here.
     if(width===1440&&theme==='light'&&size==='standard')await nav(p,n);else await p.evaluate(n=>navigate(n),n);
     await layout(p,label+` part ${n+1}`);
     await p.evaluate(()=>document.querySelectorAll('#main details').forEach(e=>e.open=true));
     await layout(p,label+` part ${n+1} hints open`);
     if(n===1){await p.locator('[data-study-view="reply"]').click();await layout(p,label+' listening');await p.evaluate(()=>document.querySelectorAll('#main details').forEach(e=>e.open=true));await layout(p,label+' listening hints');}
    }
    if(width>1100){
     await p.evaluate(()=>window.scrollTo(0,1200));
     const box=await p.locator('.course-menu').boundingBox(),header=await p.locator('.top').boundingBox();
     assert(box.y>=header.height-1&&box.y<height-44,'Desktop navigation stays visible');
     await p.locator('#nav [data-page="1"]').click();assert.equal(await p.evaluate(()=>page),1);
    }
   }
  }
  // Responsive breakpoints preserve answers and leave every navigation item reachable.
  if(!home){
   await p.setViewportSize({width:390,height:844});await nav(p,0);await p.locator('#field-before').fill('Please help me. 手機輸入保留。');
   await p.setViewportSize({width:1440,height:900});await p.setViewportSize({width:390,height:844});assert(!await p.locator('.unit-menu').evaluate(e=>e.open));
   await p.reload();assert.equal(await p.locator('#field-before').inputValue(),'Please help me. 手機輸入保留。');
  }
  if(home||/unit7-|travel-english\.html|japanese/.test(file)){
   for(const [width,height,theme,size] of [[390,844,'light','standard'],[320,568,'dark','large'],[768,1024,'light','large'],[1440,900,'dark','large']]){
    await p.setViewportSize({width,height});await settings(p,theme,size);if(!home)await nav(p,0);await p.evaluate(()=>scrollTo(0,0));
    const stem=file.replace('.html','')+`-${width}-${theme}`;await p.screenshot({path:path.join(out,stem+'.png')});
    if(!home&&width<=1100){await p.locator('.unit-menu>summary').click();await p.locator('.day-switcher [aria-current=page]').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,stem+'-menu.png')});await p.locator('.unit-menu>summary').focus();await p.keyboard.press('Escape');}
    if(!home){await nav(p,4);await p.locator('.teacher>summary').click();await p.locator('.teacher').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,stem+'-teacher.png')});}
   }
  }
  // Popups must fit the phone, landscape phone, tablet and desktop in both themes.
  if(file==='travel-english.html'||(file.startsWith('travel-japanese')&&await p.locator('.jp-glossary').count())){
   for(const [width,height] of [[320,568],[844,390],[768,1024],[1440,900]])for(const theme of ['light','dark']){
    await p.setViewportSize({width,height});await settings(p,theme,'large');
    let popup;
    if(file==='travel-english.html'){await p.locator('[data-homework-open]').click();popup=p.locator('.homework-dialog');}
    else{await nav(p,1);await p.locator('.task-phrase-grid .jp-word').first().click();popup=p.locator('.jp-glossary');}
    const r=await popup.boundingBox();assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,'Popup fits viewport');
    await p.screenshot({path:path.join(out,`${file.replace('.html','')}-${width}-${theme}-popup.png`)});
    await popup.getByRole('button',{name:file==='travel-english.html'?'關閉':'關閉詞語意思',exact:true}).click();assert(!await popup.isVisible());
   }
  }
  report.files.push(file);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(`PASS ${file}: ${report.layoutStates} layout states checked, ${report.failures.length} findings`);await context.close();
 }
 assert.deepEqual(report.failures,[]);assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;throw e;}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
