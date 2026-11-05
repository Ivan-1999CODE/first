'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/flow-turn-navigation');fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f));
const read=(html,key)=>{const m=html.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'));return m?JSON.parse(m[1]):null;};
const baselineFile=process.argv.find(x=>x.startsWith('--baseline='))?.slice(11);
const baseline=baselineFile?JSON.parse(fs.readFileSync(baselineFile,'utf8')):null;
const lessons=files.map(file=>{const html=fs.readFileSync(file,'utf8');for(const s of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);if(baseline)for(const [key,value]of Object.entries(baseline[file]))assert.deepEqual(read(html,key),value,file+' preserves '+key);return{file,data:read(html,'chapterIntegration')};});
const worker=fs.readFileSync('sw.js','utf8');
for(const entry of JSON.parse(worker.match(/const FILES = (\[[\s\S]*?\]);/)[1])){let bytes=fs.readFileSync(entry.path);if(entry.normalizedText)bytes=Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n'));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path+' offline cache matches');}
const report={individualPages:0,groups:0,paths:0,steps:0,layouts:0,errors:[],screenshots:[]};
const url=(file,hash='')=>pathToFileURL(path.resolve(file)).href+hash;
async function choose(p,selector){const b=p.locator(selector).first();for(const a of await b.locator('xpath=ancestor::details').all())if(!await a.evaluate(e=>e.open))await a.locator(':scope > summary').click();await b.click();}
async function openIndividual(p,file){await p.goto(url(file));await p.evaluate(()=>{start(0);if(typeof dgPrelude!=='undefined'){dgPrelude.done=true;render();}});}
async function geometry(p,label){
 const m=await p.locator('.scene-board .vf-flow-navigation').evaluate(row=>{
  const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const buttons=[...row.querySelectorAll('button')];return{row:rect(row),buttons:buttons.map(b=>{const range=document.createRange();range.selectNodeContents(b);return{...rect(b),textWidth:range.getBoundingClientRect().width,text:b.textContent,overflow:b.scrollWidth>b.clientWidth+1};}),viewport:innerWidth,scroll:document.documentElement.scrollWidth};
 });
 assert.equal(m.buttons.length,2,label+' two controls');const [back,next]=m.buttons;
 assert(Math.abs(back.x-m.row.x)<2,label+' back aligns left');assert(Math.abs(next.right-m.row.right)<2,label+' next aligns right');
 assert(back.right<=next.x||back.bottom<=next.y,label+' no overlap');
 for(const b of m.buttons){assert(b.height>=44,label+' touch height');assert(!b.overflow,label+' text fits');assert(b.width-b.textWidth<=34,label+' compact text padding: '+JSON.stringify(b));}
 assert(m.scroll<=m.viewport+1,label+' no horizontal overflow');report.layouts++;
}
async function shot(p,name,selector){await p.locator(selector).scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'});p.setDefaultTimeout(7000);p.on('pageerror',e=>report.errors.push(e.message));
  for(const lesson of lessons){await openIndividual(p,lesson.file);await geometry(p,lesson.file);report.individualPages++;}
  for(const lesson of lessons.filter(x=>x.data)){
   for(const group of lesson.data.groups){
    await p.goto(url(lesson.file,'#chapter-'+group.id));await p.reload();await p.locator('.dg-section-switch button').nth(2).click();report.groups++;
    for(const route of group.paths){
     await p.locator(`[data-ci-path="${route.id}"]`).click();
     const result=await p.evaluate(route=>{
      const ensure=(ok,m)=>{if(!ok)throw Error(route.id+': '+m);};
      const click=s=>{const e=document.querySelector(s);ensure(e,'missing '+s);ensure(!e.disabled,'disabled '+s);e.click();};
      const role=(expected,s)=>{
       const cards=document.querySelectorAll('[data-ci-flow-role]');ensure(cards.length===1&&cards[0].dataset.ciFlowRole===expected,'one current role '+s.id);
       ensure(document.querySelectorAll('[data-ci-gate]').length===1,'one confirmation');ensure(document.querySelector('[data-ci-gate]').dataset.ciGate===expected,'correct gate');
       ensure(document.querySelector('[data-ci-next]').disabled,'next locked before choices');
       ensure([...document.querySelectorAll('[data-ci-choice]')].every(b=>b.disabled),'choices locked before both roles');
      };
      const dialogue=step=>{
       const s=vfPracticeDialogue(step);
       const order=s.askFirst?['spoken','heard']:['heard','spoken'];role(order[0],s);ensure(!document.querySelector('.ci-dialogue-recap'),'no premature recap');
       click(`[data-ci-gate="${order[0]}"]`);role(order[1],s);ensure(document.activeElement.id==='ci-flow-turn','focus follows speaker');
       let recap=document.querySelector('.ci-dialogue-recap');ensure(!recap.open&&recap.querySelectorAll('section').length===1,'recap only completed role, initially collapsed');
       ensure(recap.querySelector('.en').textContent===(s.askFirst?s.answer:s.line),'recap text belongs to completed role');
       click(`[data-ci-gate="${order[1]}"]`);ensure(!document.querySelector('[data-ci-flow-role],[data-ci-gate]'),'no active role after both confirmed');
       recap=document.querySelector('.ci-dialogue-recap');ensure(!recap.open&&recap.querySelectorAll('section').length===2,'both completed roles in collapsed recap');
       ensure([...document.querySelectorAll('[data-ci-choice]')].every(b=>!b.disabled),'choices unlocked');
      };
      let count=0;
      for(const [index,s]of route.steps.entries()){
       dialogue(s);
       if(index===0){click('[data-ci-dialogue-restart]');dialogue(s);}
       if(index===1){click('[data-ci-back]');dialogue(route.steps[0]);click(`[data-ci-choice="${route.steps[0].valid[0]}"]`);click('[data-ci-next]');dialogue(s);}
       const wrong=s.objects.findIndex((_,i)=>!s.valid.includes(i));if(wrong>=0){click(`[data-ci-choice="${wrong}"]`);ensure(document.querySelector('[data-ci-next]').disabled,'wrong blocks progress');}
       for(const valid of s.valid){click(`[data-ci-choice="${valid}"]`);ensure(!document.querySelector('[data-ci-next]').disabled,'valid choice accepted');}
       ensure(document.querySelector('.ci-dialogue').dataset.ciFlowStage==='complete','choice does not auto-advance');
       click('[data-ci-next]');count++;
      }
      ensure(document.querySelector('.ci-complete'),'route completes');return count;
     },route);
     report.paths++;report.steps+=result;
    }
   }
  }
  const day2='travel-english-unit2-shopping.html';
  for(const theme of ['light','dark'])for(const width of [320,390,820,1280]){
   await p.setViewportSize({width,height:1000});await p.evaluate(theme=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size','large');},theme);
   await openIndividual(p,day2);await geometry(p,theme+width);
   await p.evaluate(()=>{for(const id of currentStep().askFirst?['spoken','heard']:['heard','spoken'])document.getElementById(id).click();choose(currentStep().valid[0]);});
   await geometry(p,theme+width+' enabled');await p.locator('.vf-flow-navigation [data-act=next]').hover();await p.locator('.vf-flow-navigation [data-act=next]').focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');
   assert.notEqual(await p.locator('.vf-flow-navigation [data-act=next]').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
   if([390,1280].includes(width))await shot(p,`buttons-${theme}-${width}`,'.vf-flow-navigation');
   await p.keyboard.press('Enter');assert(await p.locator('.vf-flow-navigation [data-act=next]').isDisabled());await p.locator('.vf-flow-navigation [data-act=back]').click();assert(await p.locator('.vf-flow-navigation [data-act=back]').isDisabled());
   await p.goto(url(day2,'#chapter-water'));await p.reload();await p.locator('.dg-section-switch button').nth(2).click();
   assert.equal(await p.locator('[data-ci-flow-role]').getAttribute('data-ci-flow-role'),'heard');
   await p.locator('.ci-transcript>summary').click();await shot(p,`listen-${theme}-${width}`,'#ci-flow-turn');
   await p.locator('[data-ci-gate]').press('Space');assert.equal(await p.locator('[data-ci-flow-role]').getAttribute('data-ci-flow-role'),'spoken');
   await p.locator('.ci-dialogue-recap>summary').click();assert.equal(await p.locator('.ci-dialogue-recap section').count(),1);
   await p.getByRole('button',{name:'看整句',exact:true}).click();await shot(p,`speak-${theme}-${width}`,'#ci-flow-turn');
   await p.locator('[data-ci-gate]').press('Space');await choose(p,'[data-ci-choice="1"]');
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'integrated fits '+width);report.layouts++;
   await p.locator('#dg-menu-open').click();if(width===390)await shot(p,`menu-${theme}`,'#dg-course-dialog');await p.locator('#dg-menu-close').click();
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
