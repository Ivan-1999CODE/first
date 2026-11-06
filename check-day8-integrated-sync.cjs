'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/day8-integrated-sync');fs.mkdirSync(out,{recursive:true});
const file='travel-english-unit8-hotel.html',html=fs.readFileSync(file,'utf8');
const read=(h,key)=>JSON.parse(h.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'))[1]);
const data=read(html,'hotelIntegration'),task='護照與入住證明都在手邊。先聽櫃檯要看哪一樣，再遞出並用英文回應。';
assert(!html.includes('護照與房卡都在手邊'));
const report={passportCopies:0,nightCopies:0,paths:0,passportScreens:0,nightScreens:0,layouts:0,errors:[]};
function walk(value){
 if(!value||typeof value!=='object')return;
 if(value.answer==='Here is my passport.'&&value.task!==undefined){assert.equal(value.task,task);report.passportCopies++;}
 if(value.label==='確認晚數'&&(value.objects||value.options)){
  const labels=value.objects?.map(o=>o[1])||value.options;
  assert.equal(value.choiceVisuals?.length,labels.length);
  value.choiceVisuals.forEach((v,i)=>{assert.equal(v.type,'nights');assert.equal(v.count,Number(labels[i].match(/\d+/)[0]));});
  const count=value.answer.includes('three nights')?3:2;
  for(const i of value.valid)assert.equal(value.choiceVisuals[i].count,count,'moon count follows the answer, including reversed variations');report.nightCopies++;
 }
 Object.values(value).forEach(walk);
}
walk(data);assert(report.passportCopies>=28&&report.nightCopies>=30);
assert.deepEqual(data,JSON.parse(JSON.stringify(require('./assets/day8-integration-data.cjs')(require('./assets/micro-curriculum.cjs').make(8)))));
const beforeFile=path.join(out,'before-'+file);
if(fs.existsSync(beforeFile)){
 const before=fs.readFileSync(beforeFile,'utf8');
 for(const m of before.matchAll(/(?:^|[>\n])const (\w+)=(.*);(?:\r?\n|<)/g)){
  let old;try{old=JSON.parse(m[2]);}catch{continue;}
  const current=read(html,m[1]);
  const strip=v=>{if(!v||typeof v!=='object')return;if(v.source==='B'&&v.label==='確認晚數'&&v.options){delete v.choiceVisuals;delete v.pictureChoices;delete v.choicePrompt;}Object.values(v).forEach(strip);};
  if(m[1]==='hotelIntegration'){strip(current);strip(old);}assert.deepEqual(current,old,'existing curriculum and records unchanged: '+m[1]);
 }
}
for(const s of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);
for(const entry of JSON.parse(fs.readFileSync('sw.js','utf8').match(/const FILES = (\[[\s\S]*?\]);/)[1])){
 let bytes=fs.readFileSync(entry.path);if(entry.normalizedText)bytes=Buffer.from(bytes.toString('utf8').replace(/\r\n?/g,'\n'));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path+' cache');
}
function route(spec){
 const ensure=(ok,message)=>{if(!ok)throw Error(message);};
 const click=selector=>{const el=document.querySelector(selector);ensure(el&&!el.disabled,'Unavailable '+selector);el.click();};
 click(`[data-hi-group="${spec.group}"]`);click('[data-hi-page="2"]');
 let steps,prefix,next;
 if(spec.group==='checkin'){
  click(`[data-hi-route="${spec.route}"]`);click(`[data-hi-flow-scenario="${spec.scenario}"]`);
  const c=hotelIntegration.scenarios.find(c=>c.id===spec.scenario);
  steps=hotelIntegration.practice.flowRoutes.find(r=>r.id===spec.route).order.map(k=>c.steps.find(s=>s.key===k));prefix='hi';next='hi-flow-next';
 }else{
  click(`[data-hx-flow="${spec.flow}"]`);steps=hotelIntegration.extended.groups.find(g=>g.id===spec.group).flows.find(f=>f.id===spec.flow).steps;prefix='hx';next='hx-next';
 }
 let passports=0,nights=0;
 for(const s of steps){
  const isPassport=s.answer==='Here is my passport.',isNights=s.label==='確認晚數';
  const selector=`[data-${prefix}-choice]`;
  if(isNights){
   const buttons=[...document.querySelectorAll(selector)];ensure(buttons.length===2,'two night choices');
   buttons.forEach(el=>{const i=Number(el.getAttribute('data-'+prefix+'-choice'));ensure(el.disabled,'night gate locked');ensure(el.querySelectorAll('.vf-moon').length===s.choiceVisuals[i].count,'locked moon count');});
   if(spec.stop==='nights')return {prefix,next,step:s};
  }
  for(const role of s.askFirst?['spoken','heard']:['heard','spoken']){
   if(role==='spoken'&&isPassport){ensure(document.querySelector('#hotel-flow-turn').textContent===spec.task,'passport wording on screen');passports++;if(spec.stop==='passport')return {prefix,next,step:s};}
   if(role==='spoken'&&s.decisions)click(`[data-hx-decision="${s.allowed[0]}"]`);
   click(`[data-${prefix}-gate="${role}"]`);
  }
  if(!s.decisions){
   if(isNights){
    const wrong=s.valid.includes(0)?1:0;click(`[data-${prefix}-choice="${wrong}"]`);ensure(document.querySelector(`[data-${next}]`).disabled,'wrong night count cannot advance');
    const labels=s.objects?.map(o=>o[1])||s.options;
    [...document.querySelectorAll(selector)].forEach(el=>{const i=Number(el.getAttribute('data-'+prefix+'-choice'));ensure(el.getAttribute('aria-label')==='選擇：'+labels[i],'accessible choice');ensure(el.querySelectorAll('.vf-moon').length===s.choiceVisuals[i].count,'ready moon count');});nights++;
   }
   click(`[data-${prefix}-choice="${s.valid[0]}"]`);
   if(isNights)ensure(document.querySelectorAll('.vf-result-art .vf-moon').length===s.choiceVisuals[s.valid[0]].count,'selected moon count');
  }
  click(`[data-${next}]`);
 }
 ensure(document.querySelector('.tc-frame'),'completion');
 for(const figure of document.querySelectorAll('.tc-steps figure'))if(/^住 \d+ 晚$/.test(figure.textContent.trim()))ensure(figure.querySelectorAll('.vf-moon').length===Number(figure.textContent.match(/\d+/)[0]),'completed review moon count');
 ensure(document.querySelectorAll('.completion-section-nav button').length===2,'previously updated bottom navigation retained');
 return {passports,nights};
}
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:1280,height:1100},reducedMotion:'reduce'});p.setDefaultTimeout(6000);p.on('pageerror',e=>report.errors.push(e.message));await p.goto(pathToFileURL(path.resolve(file)).href);
  const paths=[...data.practice.flowRoutes.flatMap(r=>data.scenarios.map(c=>({group:'checkin',route:r.id,scenario:c.id}))),...data.extended.groups.flatMap(g=>g.flows.map(f=>({group:g.id,flow:f.id})))];
  for(const spec of paths){const r=await p.evaluate(route,{...spec,task});report.passportScreens+=r.passports;report.nightScreens+=r.nights;report.paths++;}
  const examples=[{group:'checkin',route:'standard',scenario:'original'},{group:'checkin',route:'standard',scenario:'nights'},{group:'chapter',flow:'whole-visit'},{group:'chapter',flow:'changed-booking'}];
  for(const [index,spec]of examples.entries()){
   const passport=await p.evaluate(route,{...spec,task,stop:'passport'});assert.equal(await p.locator('#hotel-flow-turn').innerText(),task);
   await p.locator('#hotel-flow-turn').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`passport-${index}.png`)});
   for(const [width,theme]of [[820,'dark'],[390,'light']]){
    await p.setViewportSize({width,height:1100});await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';},theme);
    const {prefix,step}=await p.evaluate(route,{...spec,task,stop:'nights'});
    for(const role of ['heard','spoken'])await p.locator(`[data-${prefix}-gate="${role}"]`).click();
    const correct=p.locator(`[data-${prefix}-choice="${step.valid[0]}"]`);await correct.hover();await correct.focus();
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow');
    await p.locator('.vf-interaction').screenshot({path:path.join(out,`moons-${index}-${width}-${theme}.png`)});
    await correct.press('Enter');assert.equal(await p.locator('.vf-result-art .vf-moon').count(),step.choiceVisuals[step.valid[0]].count);
    await p.locator('.hi-dialogue-recap > summary').click();await p.locator('.hi-dialogue-recap').screenshot({path:path.join(out,`recap-${index}-${width}-${theme}.png`)});report.layouts++;
   }
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
