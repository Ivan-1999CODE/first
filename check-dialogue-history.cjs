'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/part03-navigation');fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f));
const report={pages:0,flows:0,steps:0,reviews:0,layouts:0,errors:[],screenshots:[]};
const url=file=>pathToFileURL(path.resolve(file)).href;
const data=html=>Object.fromEntries([...html.matchAll(/(?:^|[>\n])const (\w+)=(.*);(?:\r?\n|<)/g)].flatMap(m=>{try{return [[m[1],JSON.parse(m[2])]];}catch{return [];}}));
for(const file of files){
 const html=fs.readFileSync(file,'utf8');for(const s of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);
 const before=path.join(out,'before',file);if(fs.existsSync(before))assert.deepEqual(data(html),data(fs.readFileSync(before,'utf8')),file+' curriculum preserved');
}
async function geometry(p,label){
 const m=await p.locator('.vf-dialogue-navigation').evaluate(row=>{
  const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height};};
  return{row:rect(row),buttons:[...row.children].map(e=>({...rect(e),overflow:e.scrollWidth>e.clientWidth+1})),width:innerWidth,scroll:document.documentElement.scrollWidth};
 });
 assert.equal(m.buttons.length,2,label);const [back,restart]=m.buttons;
 assert(Math.abs(back.x-m.row.x)<2,label+' back left');assert(Math.abs(restart.right-m.row.right)<2,label+' restart right');
 assert(back.right<=restart.x+1||back.bottom<=restart.y+1,label+' no overlap');
 assert(m.buttons.every(b=>b.height>=44&&!b.overflow),label+' readable touch controls');assert(m.scroll<=m.width+1,label+' no page overflow');report.layouts++;
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'});p.setDefaultTimeout(7000);p.on('pageerror',e=>report.errors.push(e.message));
  for(const file of files){
   await p.goto(url(file));
   const result=await p.evaluate(()=>{
    const ensure=(ok,m)=>{if(!ok)throw Error(m);};
    const snapshot=()=>JSON.stringify({turn,history,heard,spoken,choice,feedback,finished,state,quantity:vfQuantityDraft,storage:{...localStorage}});
    const click=s=>{const b=document.querySelector(s);ensure(b&&!b.disabled,'available '+s);b.click();};
    let steps=0,reviews=0;
    function review(expected){
     const before=snapshot(),board=document.querySelector('.scene-board').innerHTML;
     click('[data-vf-review="back"]');ensure(document.querySelector('.vf-dialogue-review .en').textContent===expected,'correct previous speech');
     ensure(snapshot()===before,'review preserves all exercise state');
     let guard=0;while(!document.querySelector('[data-vf-review="back"]').disabled){ensure(++guard<100,'finite history');click('[data-vf-review="back"]');ensure(snapshot()===before,'older review preserves state');}
     click('[data-vf-review="current"]');ensure(!document.querySelector('.vf-dialogue-review'),'return closes review');ensure(snapshot()===before,'return preserves state');ensure(document.querySelector('.scene-board').innerHTML===board,'same answers and gate after return');reviews++;
    }
    const visits=typeof day2Practice==='object'?day2Practice.scenes.map(scene=>({fi:flows.findIndex(f=>f.id===scene.flowId),scene})):flows.map((_,fi)=>({fi}));
    for(const {fi,scene} of visits){
     start(fi);if(scene){click(`[data-d2-scene="${scene.id}"]`);click('[data-d2-restart]');}
     if(typeof dgPrelude!=='undefined'){dgPrelude.done=true;render();}
     ensure(document.querySelector('[data-vf-review="back"]').disabled,'no unseen speech at task start');
     let guard=0;
     while(!finished){
      ensure(++guard<60,'finite flow');const s=currentStep(),order=s.askFirst?['spoken','heard']:['heard','spoken'];
      click('#'+order[0]);review(order[0]==='spoken'?s.answer:s.line);
      click('#'+order[1]);review(order[1]==='spoken'?s.answer:s.line);
      choose(s.valid.at(-1));ensure(canNext(),'valid choice');review(order[1]==='spoken'?s.answer:s.line);
      click('[data-act="next"]');steps++;
     }
     ensure(finished,'flow can finish after reviewing');
    }
    return{steps,reviews,flows:visits.length};
   });
   report.pages++;report.steps+=result.steps;report.reviews+=result.reviews;report.flows+=result.flows;
   console.log(file+': '+result.flows+' flows / '+result.steps+' steps, review preserves state');
  }
  for(const theme of ['light','dark'])for(const width of [320,390,820,1280]){
   await p.setViewportSize({width,height:1000});await p.goto(url('travel-english-unit3-airport.html'));
   await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';start(0);},theme);
   await geometry(p,theme+width+' first');assert(await p.locator('[data-vf-review="back"]').isDisabled());
   await p.evaluate(()=>document.getElementById(currentStep().askFirst?'spoken':'heard').click());
   await p.locator('[data-vf-review="back"]').focus();await p.keyboard.press('Enter');await geometry(p,theme+width+' review');
   await p.locator('[data-vf-review="current"]').hover();await p.locator('[data-vf-review="current"]').focus();
   assert.notEqual(await p.locator('[data-vf-review="current"]').evaluate(e=>getComputedStyle(e).outlineStyle),'none','keyboard focus visible');
   if(width===390||width===1280){const name=`review-${theme}-${width}.png`;await p.locator('.vf-dialogue-review').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,name)});report.screenshots.push(name);}
   await p.keyboard.press('Enter');assert.equal(await p.locator('.vf-dialogue-review').count(),0);
   await p.locator('.vf-dialogue-navigation [data-start]').click();assert(await p.locator('[data-vf-review="back"]').isDisabled());assert(await p.evaluate(()=>turn===0&&!heard&&!spoken&&history.length===0));
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
