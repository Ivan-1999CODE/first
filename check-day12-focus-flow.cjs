'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const files=['travel-english-unit12-how.html','travel-english-unit13-why-which.html','travel-english-unit14-travel-questions.html'];
const out=path.resolve('tmp/day12-focus-flow');fs.mkdirSync(out,{recursive:true});
const report={pages:0,flows:0,turns:0,reviews:0,layouts:0,unchangedParts:0,errors:[],screens:[]};
const url=f=>pathToFileURL(path.resolve(f)).href;
const data=html=>Object.fromEntries([...html.matchAll(/(?:^|[>\n])const (\w+)=(.*);(?:\r?\n|<)/g)].flatMap(m=>{try{return [[m[1],JSON.parse(m[2])]];}catch{return [];}}));
for(const file of files){
 const html=fs.readFileSync(file,'utf8');
 for(const s of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);
 const before=path.join(out,'before',file);
 if(fs.existsSync(before))assert.deepEqual(data(html),data(fs.readFileSync(before,'utf8')),file+' curriculum preserved');
}
const worker=fs.readFileSync('sw.js','utf8');
for(const entry of JSON.parse(worker.match(/const FILES = (\[[\s\S]*?\]);/)[1])){
 let bytes=fs.readFileSync(entry.path);
 if(/\.(html|js|css|json|webmanifest|svg)$/i.test(entry.path))bytes=Buffer.from(new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes).replace(/\r\n?/g,'\n'));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path+' offline hash');
}
async function unchangedParts(browser,file){
 const before=path.join(out,'before',file);if(!fs.existsSync(before))return;
 const snapshots=[];
 for(const version of [before,file]){
  const context=await browser.newContext();const p=await context.newPage();
  await p.goto(url(version));
  snapshots.push(await p.evaluate(()=>{
   const snapshots=[];
   for(let ri=0;ri<rounds.length;ri++)for(const part of [0,1,3,4,5,6]){
    setTaskRound(ri);navigate(part);snapshots.push(document.querySelector('#main').innerHTML);
   }
   return snapshots;
  }));await context.close();
 }
 assert.deepEqual(snapshots[1],snapshots[0],'other six parts retain their markup');report.unchangedParts+=snapshots[0].length;
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  await unchangedParts(browser,files[0]);
  const p=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
  p.on('pageerror',e=>report.errors.push(e.message));
  for(const file of files){
   await p.goto(url(file));
   const result=await p.evaluate(()=>{
    const ensure=(value,message)=>{if(!value)throw Error(message);};
    const click=selector=>{const e=document.querySelector(selector);ensure(e&&!e.disabled,'enabled '+selector);e.click();};
    const snapshot=()=>JSON.stringify({turn,history,heard,spoken,choice,feedback,finished,state,storage:{...localStorage}});
    const result={flows:0,turns:0,reviews:0};
    ensure(course.id==='travel-lab-en-rescue-12-14-v1','saved key retained');
    for(let ri=0;ri<rounds.length;ri++){
     setTaskRound(ri);start(activeRound().flowIds[0]);
     ensure(document.querySelector('[data-vf-review="back"]').disabled,'first sentence has no earlier speech');
     while(!finished){
      const s=currentStep(),order=s.askFirst?['spoken','heard']:['heard','spoken'];
      ensure(document.querySelectorAll('.d5-section-heading').length===1,'one shared section heading');
      ensure(document.querySelectorAll('.d5-flow-steps li').length===3,'three stages');
      const stage=()=>[...document.querySelectorAll('.d5-flow-steps li')].findIndex(e=>e.hasAttribute('aria-current'));
      ensure(stage()===0,'starts at first stage');
      ensure(!document.querySelector('.rescue-speaking,.speaking-cue'),'no old card/cue');
      ensure([...document.querySelectorAll('[data-choice]')].every(e=>e.disabled),'choices locked initially');
      for(const [i,gate] of order.entries()){
       const speaker=document.querySelector('.dg-speaker');
       ensure(speaker.classList.contains('dg-listener')===(gate==='heard'),'correct current role');
       ensure(speaker.querySelectorAll('.d5-focus-cue').length===(gate==='spoken'?1:0),'one shared speaking cue');
       click('#'+gate);ensure(stage()===i+1,'stage advances with gate');
       ensure([...document.querySelectorAll('.dg-repeat-confirm input')].every(e=>e.disabled),'previous gates not editable');
       const saved=snapshot();click('[data-vf-review="back"]');
       ensure(snapshot()===saved,'previous sentence keeps progress and records');
       ensure(document.querySelector('.vf-dialogue-review .en').textContent===(gate==='spoken'?s.answer:s.line),'correct previous sentence');
       click('[data-vf-review="current"]');ensure(snapshot()===saved,'return keeps progress');result.reviews++;
      }
      ensure(document.querySelector('.d5-dialogue-complete'),'shared completion handoff');
      ensure(!document.querySelector('.d5-dialogue-recap').open,'dialogue recap collapsed');
      ensure(!document.querySelector('.dg-speaker'),'speaking card replaced after both gates');
      const bad=s.objects.findIndex((_,i)=>!accepted(s,i));
      click(`[data-choice="${bad}"]`);ensure(!canNext(),'wrong choice cannot advance');
      click(`[data-choice="${s.valid[0]}"]`);ensure(canNext(),'correct choice can advance');
      click('[data-act="next"]');result.turns++;
     }
     ensure(document.querySelector('.rescue-result').textContent.includes(activeRound().rescue.outcome),'rescue outcome retained');
     ensure(state.complete.includes(flows[flow].id),'completion saved');
     ensure(document.querySelector('.completion-section-nav'),'shared completion footer');
     ensure(document.querySelectorAll('.rescue-toolkit').length===1,'help phrases retained once');
     result.flows++;
    }
    return result;
   });
   for(const key of ['flows','turns','reviews'])report[key]+=result[key];report.pages++;
   await p.reload();assert(await p.evaluate(()=>flows.every(f=>state.complete.includes(f.id))),'completion survives reload');
  }
  await p.goto(url(files[0]));
  for(const theme of ['light','dark'])for(const width of [390,820,1280]){
   await p.setViewportSize({width,height:1000});
   await p.evaluate(({theme,width})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size=width===1280?'standard':'large';setTaskRound(0);start(0);},{theme,width});
   const shot=async name=>{const f=`${theme}-${width}-${name}.png`;await p.screenshot({path:path.join(out,f),fullPage:true});report.screens.push(f);};
   const check=async()=>{assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow '+theme+width);report.layouts++;};
   await check();await shot('start');
   const hint=p.locator('.dg-hint-tabs button').last();await hint.click();await check();
   await hint.hover();await p.keyboard.press('Tab');await hint.focus();assert.notEqual(await hint.evaluate(e=>getComputedStyle(e).outlineStyle),'none','visible keyboard focus');
   await shot('hint');
   await p.evaluate(()=>document.getElementById('spoken').click());await check();
   await p.locator('[data-dg-transcript]').click();await shot('listening');
   await p.evaluate(()=>document.getElementById('heard').click());await check();
   await p.locator('.d5-dialogue-recap > summary').click();await check();await shot('ready');
   await p.locator('.rescue-toolkit > summary').click();await check();await shot('toolkit');
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
