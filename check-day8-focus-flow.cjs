'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const file='travel-english-unit8-hotel.html',html=fs.readFileSync(file,'utf8');
const read=(h,k)=>JSON.parse(h.match(new RegExp('(?:^|[>\\n])const '+k+'=(.*);(?:\\r?\\n|<)'))[1]);
const d=read(html,'hotelIntegration'),out=path.resolve('tmp/day8-focus-flow');fs.mkdirSync(out,{recursive:true});
for(const s of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);
const baseline='tmp/day8-focus-before/'+file;
if(fs.existsSync(baseline))for(const m of fs.readFileSync(baseline,'utf8').matchAll(/(?:^|[>\n])const (\w+)=(.*);(?:\r?\n|<)/g)){
 let value;try{value=JSON.parse(m[2]);}catch{continue;}assert.deepEqual(read(html,m[1]),value,'curriculum preserved: '+m[1]);
}
const report={paths:0,steps:0,decisionBranches:0,layouts:0,errors:[],screenshots:[]};
const url=pathToFileURL(path.resolve(file)).href;
const next=prefix=>prefix==='hi'?'[data-hi-flow-next]':'[data-hx-next]';
async function click(p,selector){
 const b=p.locator(selector).first();
 for(const parent of await b.locator('xpath=ancestor::details').all())if(!await parent.evaluate(e=>e.open))await parent.locator(':scope > summary').click();
 await b.click();
}
async function open(p,group){await p.goto(url+(group==='checkin'?'#integrated':'#integrated-'+group));await p.reload();await p.locator('.dg-section-switch button').nth(2).click();}
async function role(p,prefix,expected){
 assert.equal(await p.locator('[data-hotel-flow-role]').count(),1,'only one active role');
 assert.equal(await p.locator('[data-hotel-flow-role]').getAttribute('data-hotel-flow-role'),expected);
 assert.equal(await p.locator(`button[data-${prefix}-gate]`).count(),1,'one confirmation button');
 assert.equal(await p.locator(`input[data-${prefix}-gate]`).count(),0,'no checkbox plus second confirmation');
 assert.equal(await p.locator(`button[data-${prefix}-gate]`).getAttribute(`data-${prefix}-gate`),expected);
 assert(await p.locator(next(prefix)).isDisabled(),'no next before completion');
}
async function confirm(p,prefix,which){await p.locator(`[data-${prefix}-gate="${which}"]`).press('Enter');assert.equal(await p.evaluate(()=>document.activeElement.id),'hotel-flow-turn','focus follows the turn');}
async function resetDialogue(p,prefix){await click(p,`[data-${prefix}-dialogue-restart]`);assert(await p.locator(next(prefix)).isDisabled());assert.equal(await p.locator('.hi-dialogue-recap').count(),0);}
async function dialogue(p,prefix,s,decision){
 const first=s.askFirst?'spoken':'heard',second=s.askFirst?'heard':'spoken';
 await role(p,prefix,first);
 assert.equal(await p.locator('.hi-dialogue-recap').count(),0,'no recap before first turn');
 const buttons=p.locator(`[data-${prefix}-choice]`);
 for(const b of await buttons.all())assert(await b.isDisabled());
 await confirm(p,prefix,first);await role(p,prefix,second);
 assert.equal(await p.locator('.hi-dialogue-recap').getAttribute('open'),null,'recap defaults closed');
 await p.locator('.hi-dialogue-recap>summary').click();
 assert.equal(await p.locator('.hi-dialogue-recap section').count(),1,'recap includes only the completed turn');
 assert.equal(await p.locator('.hi-dialogue-recap .hi-en').innerText(),s.askFirst?s.answer:s.line);
 await p.locator('.hi-dialogue-recap>summary').click();
 if(s.decisions){
  assert(await p.locator('[data-hx-gate="spoken"]').isDisabled(),'choose before speaking');
  const wrong=s.decisions.findIndex((_,i)=>!s.allowed.includes(i));
  if(wrong>=0){await p.locator(`[data-hx-decision="${wrong}"]`).click();assert.equal(await p.locator(`[data-hx-decision="${wrong}"]`).getAttribute('data-result'),'wrong');assert(await p.locator('[data-hx-gate="spoken"]').isDisabled(),'invalid decision must remain editable');}
  await p.locator(`[data-hx-decision="${decision}"]`).click();
  assert.equal(await p.locator(`[data-hx-decision="${decision}"]`).getAttribute('data-result'),'correct');
 }
 await confirm(p,prefix,second);
 assert.equal(await p.locator('[data-hotel-flow-role]').count(),0,'listening and speaking cards collapse before the answer');
 assert.equal(await p.locator('.hi-dialogue-recap').getAttribute('open'),null);
 await p.locator('.hi-dialogue-recap>summary').click();assert.equal(await p.locator('.hi-dialogue-recap section').count(),2);
 const expected=s.decisions?s.decisions[decision].answer:s.answer;
 assert((await p.locator('.hi-dialogue-recap').innerText()).includes(expected));
 await p.locator('.hi-dialogue-recap>summary').click();
}
async function choose(p,prefix,s){
 const wrong=(s.options||s.objects).findIndex((_,i)=>!s.valid.includes(i));
 if(wrong>=0){await click(p,`[data-${prefix}-choice="${wrong}"]`);assert(await p.locator(next(prefix)).isDisabled());assert.equal(await p.locator(`[data-${prefix}-choice="${wrong}"]`).first().getAttribute('data-result'),'wrong');}
 await click(p,`[data-${prefix}-choice="${s.valid[0]}"]`);
 assert.equal(await p.locator(`[data-${prefix}-choice="${s.valid[0]}"]`).first().getAttribute('data-result'),'correct');assert(!await p.locator(next(prefix)).isDisabled());
 assert.equal(await p.locator('.hi-dialogue').getAttribute('data-hotel-flow-stage'),'complete','correct answer does not auto-advance');
}
async function step(p,prefix,s,redo=false){
 await dialogue(p,prefix,s,s.allowed?.[0]);
 if(s.decisions){
  for(const decision of s.allowed.slice(1)){await resetDialogue(p,prefix);await dialogue(p,prefix,s,decision);report.decisionBranches++;}
  assert(!await p.locator(next(prefix)).isDisabled());report.decisionBranches++;
 }else{
  await choose(p,prefix,s);
  if(redo){await resetDialogue(p,prefix);await dialogue(p,prefix,s);assert.equal(await p.locator(`[data-${prefix}-choice][aria-pressed=true]`).count(),0,'old result cleared');await choose(p,prefix,s);}
 }
 await p.locator(next(prefix)).click();report.steps++;
}
async function shot(p,name){await p.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');}
async function bounds(p,label){
 const result=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('.hi-flow-grid *')].filter(e=>e.checkVisibility()&&!e.closest('[inert],[aria-hidden="true"]')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left< -1||r.right>innerWidth+1)}).slice(0,5).map(e=>e.className)}));
 assert(result.scroll<=result.width+1,label+JSON.stringify(result));assert.deepEqual(result.bad,[],label);report.layouts++;
}
async function color(p,selector,result){
 const c=await p.locator(selector).evaluate(e=>{const s=getComputedStyle(e);return{bg:s.backgroundColor,fg:s.color,line:s.borderColor};});
 const rgb=c.bg.match(/\d+/g).map(Number);assert(result==='correct'?rgb[1]>rgb[0]:rgb[0]>rgb[1],result+' background '+JSON.stringify(c));
 const luminance=value=>{const v=value.match(/\d+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
 const a=luminance(c.bg),b=luminance(c.fg);assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'readable selected button '+JSON.stringify(c));
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:1024},reducedMotion:'reduce'}),p=await ctx.newPage();p.setDefaultTimeout(7000);p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(url);
  const ordinary=read(html,'course').id,keys=[d.storageKey,...d.extended.groups.map(g=>g.storageKey)];
  const original=JSON.stringify({answers:{before:'原任務保留'},ratings:{start:2}});
  await p.evaluate(({keys,ordinary,original})=>{for(const key of keys)localStorage.setItem(key,JSON.stringify({answers:{before:'既有課前筆記',after:'既有課後筆記'},home:{spoken:true}}));localStorage.setItem(ordinary,original);},{keys,ordinary,original});
  await open(p,'checkin');
  // Guard against stale or out-of-order confirmation, even without UI disabling.
  assert(await p.evaluate(()=>{const s={askFirst:true},f={heard:false,spoken:false,choice:-1};return !hotelFlowConfirm(s,f,'heard')&&!f.heard&&hotelFlowConfirm(s,f,'spoken')&&!hotelFlowConfirm(s,f,'spoken');}));
  for(const route of d.practice.flowRoutes)for(const c of d.scenarios){
   await click(p,`[data-hi-route="${route.id}"]`);await click(p,`[data-hi-flow-scenario="${c.id}"]`);
   for(const [i,key] of route.order.entries())await step(p,'hi',c.steps.find(s=>s.key===key),i===0);
   assert.equal(await p.locator('.hi-dialogue').count(),0);report.paths++;
  }
  for(const g of d.extended.groups){
   await open(p,g.id);
   for(const flow of g.flows){
    await p.locator(`[data-hx-flow="${flow.id}"]`).click();
    for(const [i,s] of flow.steps.entries())await step(p,'hx',s,i===0);
    assert.equal(await p.locator('.hi-complete').count(),1);report.paths++;
   }
   console.log('Completed integration routes: '+g.id);
  }
  // Back and restart invalidate the current answer, while earlier history is retained.
  await open(p,'chapter');const firstFlow=d.extended.groups.find(g=>g.id==='chapter').flows[0];
  await step(p,'hx',firstFlow.steps[0]);await step(p,'hx',firstFlow.steps[1]);
  await p.locator('[data-hx-back]').click();await role(p,'hx',firstFlow.steps[1].askFirst?'spoken':'heard');assert.equal(await p.locator('.hx-journal li').count(),1);
  await p.locator('[data-hx-restart]').click();assert.equal(await p.locator('.hx-journal li').count(),0);assert(await p.locator('[data-hx-back]').isDisabled());
  for(const group of ['checkin','stay','chapter'])for(const theme of ['light','dark'])for(const width of [390,820,1366]){
   await p.setViewportSize({width,height:width===390?844:1024});await open(p,group);
   await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';},theme);
   const prefix=group==='checkin'?'hi':'hx',s=group==='checkin'?d.scenarios[0].steps[0]:d.extended.groups.find(g=>g.id===group).flows[0].steps[0];
   await bounds(p,group+' '+theme+' '+width+' first');
   if(width===1366&&group==='chapter'){await p.locator('.hi-dialogue').scrollIntoViewIfNeeded();await shot(p,`${group}-${theme}-speaking`);}
   const first=s.askFirst?'spoken':'heard';await confirm(p,prefix,first);
   await p.locator('.hi-transcript>summary').click().catch(()=>{});
   await p.locator('.hi-dialogue-recap>summary').click();await bounds(p,'transcript and recap open');
   if(group==='chapter'&&width!==390){await p.locator('.hi-dialogue').scrollIntoViewIfNeeded();await shot(p,`${group}-${theme}-${width}-listening`);}
   await confirm(p,prefix,s.askFirst?'heard':'spoken');
   const wrong=(s.options||s.objects).findIndex((_,i)=>!s.valid.includes(i));
   await click(p,`[data-${prefix}-choice="${wrong}"]`);await color(p,`[data-${prefix}-choice="${wrong}"]`,'wrong');await bounds(p,'wrong answer');
   if(group==='chapter'){await p.locator(`[data-${prefix}-choice="${wrong}"]`).scrollIntoViewIfNeeded();await shot(p,`${group}-${theme}-${width}-wrong`);}
   await click(p,`[data-${prefix}-choice="${s.valid[0]}"]`);await color(p,`[data-${prefix}-choice="${s.valid[0]}"]`,'correct');
   await p.locator(`[data-${prefix}-choice="${s.valid[0]}"]`).hover();await color(p,`[data-${prefix}-choice="${s.valid[0]}"]`,'correct');
   await p.locator('.hi-dialogue-recap>summary').click();await bounds(p,'correct with recap');
   if(group==='chapter'){await p.locator(`[data-${prefix}-choice="${s.valid[0]}"]`).scrollIntoViewIfNeeded();await shot(p,`${group}-${theme}-${width}-correct`);}
   const geometry=await p.locator(next(prefix)).evaluate(e=>{const grid=e.closest('.hi-flow-grid'),col=grid.lastElementChild,r=e.getBoundingClientRect(),c=col.getBoundingClientRect(),style=getComputedStyle(col),inset=parseFloat(style.paddingRight)+parseFloat(style.borderRightWidth);return{inside:col.contains(e),height:r.height,right:Math.abs(r.right-(c.right-inset))};});
   assert(geometry.inside&&geometry.height>=44&&geometry.right<3,'continue stays below the answer column: '+group+' '+width+' '+JSON.stringify(geometry));
   if(group==='chapter'&&width===820){await p.locator('#dg-menu-open').click();await shot(p,`menu-${theme}-820`);await p.locator('#dg-course-dialog').press('Escape');}
  }
  const stored=await p.evaluate(({keys,ordinary})=>({groups:keys.map(k=>JSON.parse(localStorage.getItem(k))),ordinary:localStorage.getItem(ordinary)}),{keys,ordinary});
  assert.equal(stored.ordinary,original);for(const g of stored.groups){assert.equal(g.answers.before,'既有課前筆記');assert.equal(g.answers.after,'既有課後筆記');assert.equal(g.home.spoken,true);}
  assert.equal(stored.groups[0].suite.routes.length,d.practice.flowRoutes.length*d.scenarios.length);
  d.extended.groups.forEach((g,i)=>assert.deepEqual(stored.groups[i+1].complete,g.flows.map(f=>f.id)));
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
