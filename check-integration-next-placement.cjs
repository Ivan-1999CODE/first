'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/integration-next-placement');fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f));
const read=(html,key)=>{const m=html.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'));return m?JSON.parse(m[1]):null;};
const targets=files.flatMap(file=>{const html=fs.readFileSync(file,'utf8'),data=read(html,'chapterIntegration');return data?data.groups.map(g=>({file,hash:'#chapter-'+g.id,kind:'ci',group:g})):[];});
const hotelFile='travel-english-unit8-hotel.html';
targets.push(...[{hash:'#integrated',kind:'hi'},{hash:'#integrated-stay',kind:'hx'},{hash:'#integrated-chapter',kind:'hx'}].map(x=>({file:hotelFile,...x})));
const sel={ci:{next:'[data-ci-next]',back:'[data-ci-back]',restart:'[data-ci-restart]',gate:'data-ci-gate',choice:'data-ci-choice',grid:'.ci-flow-grid',options:'.vf-interaction'},hi:{next:'[data-hi-flow-next]',back:'[data-hi-flow-back]',restart:'[data-hi-flow-restart]',gate:'data-hi-gate',choice:'data-hi-choice',grid:'.hi-flow-grid',options:'.vf-interaction'},hx:{next:'[data-hx-next]',back:'[data-hx-back]',restart:'[data-hx-restart]',gate:'data-hx-gate',choice:'data-hx-choice',grid:'.hi-flow-grid',options:'.hi-known'}};
const report={groups:0,layoutStates:0,errors:[],screenshots:[]};
const url=t=>pathToFileURL(path.resolve(t.file)).href+t.hash;
async function open(p,t){await p.goto(url(t));await p.reload();await p.locator('.dg-section-switch button').nth(2).click();}
async function shot(p,name){await p.locator('[data-ci-next],[data-hi-flow-next],[data-hx-next]').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');}
async function geometry(p,t){
 const s=sel[t.kind],m=await p.evaluate(({s})=>{
  const button=document.querySelector(s.next),grid=document.querySelector(s.grid),col=grid.lastElementChild,options=col.querySelector(s.options);
  const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const style=getComputedStyle(col),left=parseFloat(style.paddingLeft)+parseFloat(style.borderLeftWidth),right=parseFloat(style.paddingRight)+parseFloat(style.borderRightWidth);
  return{inside:col.contains(button),b:rect(button),col:rect(col),o:rect(options),left,right,width:innerWidth,scroll:document.documentElement.scrollWidth,columns:getComputedStyle(grid).gridTemplateColumns,toolsWithSpeech:grid.firstElementChild.contains(document.querySelector(s.back))};
 },{s});
 assert(m.inside,'Continue stays inside the options column');assert(m.toolsWithSpeech,'Secondary actions stay with the dialogue');
 assert(m.b.y>=m.o.bottom-1,'Continue follows the choices and feedback');assert(Math.abs(m.b.right-(m.col.right-m.right))<3,'Continue aligns with the right content edge: '+t.hash+JSON.stringify(m));
 assert(m.b.height>=44&&m.b.width>=44);assert(m.scroll<=m.width+1,'No horizontal overflow');
 if(m.width<=640)assert(Math.abs(m.b.width-(m.col.width-m.left-m.right))<3,'Mobile continue fills the options column');
 report.layoutStates++;
}
async function unlock(p,t){const s=sel[t.kind];for(let i=0;i<2;i++){if(t.kind==='ci'){const role=await p.locator(`input[${s.gate}]:not(:disabled):not(:checked)`).first().getAttribute(s.gate);await p.locator(`input[${s.gate}="${role}"]`).click();}else{const role=await p.locator(`button[${s.gate}]:not(:disabled)`).getAttribute(s.gate);await p.locator(`button[${s.gate}="${role}"]`).press('Enter');}}}
async function chooseCorrect(p,t){
 const s=sel[t.kind],buttons=p.locator(`[${s.choice}]`);
 for(let i=0;i<await buttons.count();i++){const b=buttons.nth(i);for(const a of await b.locator('xpath=ancestor::details').all())if(!await a.evaluate(e=>e.open))await a.locator(':scope > summary').click();await b.click();if(!await p.locator(s.next).isDisabled())return;}
 throw Error('No valid option for '+t.hash);
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});p.setDefaultTimeout(6000);p.on('pageerror',e=>report.errors.push(e.stack));
  const example=targets.find(t=>t.file.startsWith('travel-english-unit2-')&&t.hash==='#chapter-single');
  if(process.argv.includes('--before')){await open(p,example);await shot(p,'before-day2');await open(p,targets.find(t=>t.hash==='#integrated-stay'));await shot(p,'before-day8');console.log('Before screenshots saved');return;}
  const baselineArg=process.argv.find(x=>x.startsWith('--baseline=')),baselineFile=baselineArg?baselineArg.slice('--baseline='.length):path.join(out,'baseline.json');
  const baseline=fs.existsSync(baselineFile)?JSON.parse(fs.readFileSync(baselineFile,'utf8')):null;
  if(baselineArg)assert(baseline,'requested baseline must exist');
  for(const f of files){const html=fs.readFileSync(f,'utf8');for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);if(baseline)for(const[key,data]of Object.entries(baseline[f]))assert.deepEqual(read(html,key),data,f+' curriculum preserved');}
  for(const t of targets){await open(p,t);assert(await p.locator(sel[t.kind].next).isDisabled());await geometry(p,t);report.groups++;}
  for(const t of [example,targets.find(t=>t.kind==='hi'),targets.find(t=>t.kind==='hx')])for(const theme of ['light','dark'])for(const width of [390,820,1280]){
   await p.setViewportSize({width,height:900});await p.evaluate(theme=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size','large');},theme);await open(p,t);
   const s=sel[t.kind];assert(await p.locator(s.next).isDisabled());await geometry(p,t);
   await unlock(p,t);await chooseCorrect(p,t);await geometry(p,t);await p.locator(s.next).hover();await p.locator(s.next).focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');
   assert.equal(await p.locator(s.next).evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
   if(t===example&&[390,1280].includes(width))await shot(p,`after-day2-${theme}-${width}`);
   if(t.kind==='hx'&&width===1280)await shot(p,`after-day8-${theme}`);
   await p.keyboard.press('Enter');assert(await p.locator(s.next).isDisabled());assert(!await p.locator(s.back).isDisabled());await p.locator(s.back).click();assert(await p.locator(s.next).isDisabled());await p.locator(s.restart).click();assert(await p.locator(s.back).isDisabled());
  }
  // Exercise the relocated last-step button through to completion.
  await open(p,example);for(const step of example.group.paths[0].steps){await unlock(p,example);await chooseCorrect(p,example);await p.locator(sel.ci.next).click();}assert(await p.locator('.ci-complete').isVisible());
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
