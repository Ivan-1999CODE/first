'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/guided-section-nav');fs.mkdirSync(out,{recursive:true});
const file=path.resolve('travel-english-unit5-getting-around.html');
const report={hash:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),navigation:[],teacher:[],shared:[],errors:[],failures:[],screenshots:[]};
const configs=[{width:320,height:568,theme:'light',size:'large'},{width:390,height:844,theme:'dark',size:'large'},{width:768,height:1024,theme:'light',size:'standard'},{width:1440,height:1000,theme:'dark',size:'standard',keyboard:true}];
const shot=async(p,name,selector)=>{const opts={path:path.join(out,name+'.png')};if(selector)await p.locator(selector).screenshot(opts);else await p.screenshot(opts);report.screenshots.push(name+'.png')};
const go=async(p,n)=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${n}"]`).click();assert.equal(await p.evaluate(()=>page),n)};
const activate=async(loc,keyboard)=>{if(keyboard){await loc.focus();await loc.press('Enter')}else await loc.click()};
const footer=async(p,part)=>{
 const nav=p.locator('#main > .dg-section-footer'),buttons=nav.locator('button');assert.equal(await buttons.count(),2);assert.equal(await p.locator('#main > .session-stop').count(),0);
 assert.deepEqual(await buttons.allTextContents(),part===1?['← 回上一部分','前往 03 跟著做 →']:['← 上一部分','前往 04 換條件 →']);
 assert(!await buttons.last().isDisabled());
 const boxes=await buttons.evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right}}));
 assert(boxes[0].right<=boxes[1].x,'Footer stays left/right');assert(Math.abs(boxes[0].y-boxes[1].y)<2,'Footer stays on same row');
 assert(boxes.every(b=>b.width>=44&&b.height>=44),'Touch targets >=44px');
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow');
 assert(await nav.evaluate(e=>e===document.querySelector('#main').lastElementChild),'Chapter navigation is last main content');
 return buttons;
};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});let active;
try{
 if(process.argv.includes('--before-teacher')){
  for(const c of [configs[1],configs[3]]){const ctx=await browser.newContext({viewport:{width:c.width,height:c.height}}),p=await ctx.newPage();await p.addInitScript(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size)},c);await p.goto(pathToFileURL(file).href);await go(p,4);await p.locator('.dg-teacher > summary').click();await p.locator('.dg-teacher details > summary').filter({hasText:'學生卡住了'}).click();await p.locator('.dg-pair-note > summary').click();await shot(p,`before-teacher-${c.width}`,'.dg-goals');await ctx.close()}
  console.log('Saved before-teacher screenshots.');return;
 }
 for(const c of configs){const tag=`${c.width}-${c.theme}-${c.size}`,ctx=await browser.newContext({viewport:{width:c.width,height:c.height},hasTouch:c.width<1000,isMobile:c.width<400}),p=await ctx.newPage();active=p;p.setDefaultTimeout(10000);p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size)},c);await p.goto(pathToFileURL(file).href);
  const saved=await p.evaluate(()=>{for(const p of pairs)state.answers['note-'+p.id]='Saved note <keep> & unchanged';state.answers['before-'+rounds[0].id]='Original answer';save();return JSON.stringify(state.answers)});
  for(let n=0;n<4;n++){
   await p.locator(`#dg-context [data-dg-task="${n}"]`).click();await go(p,1);let bs=await footer(p,1);
   if(n===0){await bs.last().scrollIntoViewIfNeeded();await shot(p,`after-${tag}-part2`)}
   await activate(bs.first(),c.keyboard);assert.equal(await p.evaluate(()=>page),0);await go(p,1);bs=await footer(p,1);await activate(bs.last(),c.keyboard);
   assert.equal(await p.evaluate(()=>page),2);assert(await p.evaluate(()=>flow===activeRound().flowIds[0]));assert.equal(await p.evaluate(()=>taskRound),n);bs=await footer(p,2);
   assert(await p.locator('[data-act="next"]').isDisabled(),'Chapter link does not unlock conversation step');
   if(n===0){await bs.last().scrollIntoViewIfNeeded();await shot(p,`after-${tag}-part3`)}
   await activate(bs.last(),c.keyboard);assert.equal(await p.evaluate(()=>page),3);assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'4');
   await go(p,2);bs=await footer(p,2);await activate(bs.first(),c.keyboard);assert.equal(await p.evaluate(()=>page),1);
   if(c.width===1440){await activate((await footer(p,1)).last(),true);while(!await p.evaluate(()=>finished)){const t=await p.evaluate(()=>currentStep());await p.locator('#'+(t.askFirst?'spoken':'heard')).check();assert(await p.locator('[data-act="next"]').isDisabled());await p.locator('#'+(t.askFirst?'heard':'spoken')).check();const wrong=t.objects.findIndex((_,i)=>!t.valid.includes(i));await p.locator(`[data-choice="${wrong}"]`).click();assert(await p.locator('[data-act="next"]').isDisabled());await p.locator(`[data-choice="${t.valid[0]}"]`).click();await p.locator('[data-act="next"]').click()}
    bs=await footer(p,2);const inline=p.locator('.dg-completion [data-page="3"]');assert.equal(await inline.innerText(),'前往 04 換條件 →');await activate(inline,true);assert.equal(await p.evaluate(()=>page),3);await go(p,2);await activate((await footer(p,2)).last(),true);assert.equal(await p.evaluate(()=>page),3);
   }
   report.navigation.push({config:tag,task:n,part2:'1 ← 2 → 3',part3:'2 ← 3 → 4',completed:c.width===1440});
   await go(p,4);const teacher=p.locator('.dg-teacher'),help=p.locator('.dg-student-help');assert.equal(await help.count(),1);assert.equal(await p.locator('.dg-pair-note').count(),0);assert.equal(await p.locator('textarea[id^="note-"]').count(),0);assert(!await p.locator('#main').innerText().then(t=>t.includes('記下一句真正用到的英文')));
   assert(await help.evaluate(e=>e.previousElementSibling?.classList.contains('dg-teacher')),'Student help is immediately below teacher guide');assert(!await teacher.evaluate(e=>e.open));assert(await help.locator(':scope > summary').isVisible());
   await activate(help.locator(':scope > summary'),c.keyboard);assert(await help.evaluate(e=>e.open));assert(!await teacher.evaluate(e=>e.open),'Help opens independently of teacher guide');
   const hints=help.locator('.dg-hint');assert((await hints.count())>0);await activate(hints.first().locator('[data-level="1"]'),c.keyboard);assert.equal(await hints.first().locator('[data-level="1"]').getAttribute('aria-pressed'),'true');await activate(hints.first().locator('[data-level="2"]'),c.keyboard);assert(await hints.first().locator('[data-pane="2"]').isVisible());assert(await hints.first().locator('[data-pane="2"] [data-say]').count()>=2);
   await activate(teacher.locator(':scope > summary'),c.keyboard);assert(await teacher.evaluate(e=>e.open));assert(await help.evaluate(e=>e.open));await activate(teacher.locator(':scope > summary'),c.keyboard);assert(await help.evaluate(e=>e.open));
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Expanded help fits viewport');
   if(n===0){await shot(p,`after-${tag}-help-open`,'.dg-student-help');await activate(teacher.locator(':scope > summary'),c.keyboard);await shot(p,`after-${tag}-teacher-open`,'.dg-teacher');await activate(teacher.locator(':scope > summary'),c.keyboard);await activate(help.locator(':scope > summary'),c.keyboard);await help.scrollIntoViewIfNeeded();await shot(p,`after-${tag}-teacher-controls`)}
   const goal=p.locator('[data-pair-check]').first();await goal.check();assert(await goal.isChecked());assert.equal(await p.evaluate(()=>JSON.stringify(state.answers)),saved,'Removing note UI preserves saved notes and answers');report.teacher.push({config:tag,task:n,independentHelp:true,allHints:true,savedNotesRetained:true});
  }
  await p.reload();assert.equal(await p.evaluate(()=>JSON.stringify(state.answers)),saved,'Saved notes survive reload');await ctx.close();console.log('PASS '+tag+': navigation and independent teacher help for 4 tasks');
 }
 for(const day of [2,3,4,6,7,8,9,10,11,12,13,14]){
  const lesson=fs.readdirSync('.').find(f=>f.startsWith(`travel-english-unit${day}-`)&&f.endsWith('.html'));const ctx=await browser.newContext({viewport:{width:1024,height:768}}),p=await ctx.newPage();active=p;p.on('pageerror',e=>report.errors.push(e.message));await p.goto(pathToFileURL(path.resolve(lesson)).href);await go(p,1);assert.equal(await p.locator('#main > .session-stop').count(),0);await p.locator('.dg-section-footer button:last-child').click();assert.equal(await p.evaluate(()=>page),2);assert.equal(await p.locator('#main > .session-stop').count(),0);await p.locator('.dg-section-footer button:last-child').click();assert.equal(await p.evaluate(()=>page),3);await go(p,4);assert.equal(await p.locator('.dg-teacher .dg-student-help').count(),0);assert.equal(await p.locator('.dg-teacher + .dg-student-help').count(),1);assert.equal(await p.locator('.dg-pair-note').count(),0);report.shared.push(day);await ctx.close();
 }
 assert.deepEqual(report.errors,[]);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),report.hash,'Source stable while testing');
}catch(e){report.failures.push(e.stack);if(active)await shot(active,'failure');throw e}
finally{fs.writeFileSync(path.join(out,process.argv.includes('--before-teacher')?'before-teacher-report.json':'report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log(`PASS ${report.navigation.length} navigation cases, ${report.teacher.length} teacher cases, ${report.shared.length} other lessons; ${report.screenshots.length} screenshots.`);
})().catch(e=>{console.error(e);process.exit(1)});
