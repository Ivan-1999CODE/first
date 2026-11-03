'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/teacher-chat-qa'),before=process.argv.includes('--before'),goalsOnly=process.argv.includes('--goals-only');
fs.mkdirSync(out,{recursive:true});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const files=['travel-english.html',...Array.from({length:13},(_,i)=>fs.readdirSync('.').find(f=>f.startsWith('travel-english-unit'+(i+2)+'-')&&f.endsWith('.html')))];
const configs=[{width:1440,height:1000,theme:'light',size:'standard'},{width:390,height:844,theme:'dark',size:'large'},{width:320,height:568,theme:'light',size:'large'},{width:768,height:1024,theme:'dark',size:'standard'}];
const report={curriculum:{},pairs:0,hints:0,records:0,screenshots:[],errors:[]};
async function shot(p,name){
 const target=p.locator('.dg-goals'),size=p.viewportSize(),box=await target.boundingBox();
 if(box.height>size.height-120)await p.setViewportSize({...size,height:Math.ceil(box.height+160)});
 await target.screenshot({path:path.join(out,name+'.png')});
 await p.setViewportSize(size);report.screenshots.push(name+'.png');
}
function contrast(fg,bg){
 const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const a=lum(fg),b=lum(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
async function presentation(p){
 const result=await p.locator('.dg-goals').evaluate(root=>{
  const parse=s=>{const v=s.match(/[\d.]+/g).map(Number);return[v[0],v[1],v[2],v[3]??1]};
  const over=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
  const colors=e=>{const chain=[];for(let n=e;n;n=n.parentElement)chain.unshift(n);const bg=chain.reduce((b,n)=>over(parse(getComputedStyle(n).backgroundColor),b),[255,255,255]);return{fg:over(parse(getComputedStyle(e).color),bg),bg}};
  const elements=[...root.querySelectorAll('.d5-script-en,.d5-script-role,.d5-student-hint > summary,.d5-teacher-guide > summary')];
  const chat=[...root.querySelectorAll('.d5-script-line')].map(e=>{
   const box=e.getBoundingClientRect(),parent=e.parentElement.getBoundingClientRect();
   return{speaker:e.dataset.speaker,left:box.left-parent.left,right:parent.right-box.right};
  });
  return{overflow:document.documentElement.scrollWidth>innerWidth+1,chat,items:elements.map(e=>({text:e.textContent,spill:e.scrollWidth>e.clientWidth+1,...colors(e)}))};
 });
 assert(!result.overflow,'Expanded hints fit viewport');
 for(const line of result.chat){
  assert(Math.abs(line.speaker==='student'?line.right:line.left)<1,'Chat bubbles align by speaker');
  assert((line.speaker==='student'?line.left:line.right)>5,'Chat bubbles leave space on the opposite side');
 }
 for(const item of result.items){assert(!item.spill,item.text+' fits');assert(contrast(item.fg,item.bg)>=4.5,item.text+' has readable contrast')}
}
async function checkGoalColor(p,selector='[data-pair-check]'){
 const goal=p.locator(selector).first(),row=goal.locator('xpath=..');
 const background=await row.evaluate(e=>getComputedStyle(e).backgroundColor);
 await goal.focus();await goal.press(' ');assert(await goal.isChecked());
 await row.hover();
 const colors=await row.evaluate(e=>({bg:getComputedStyle(e).backgroundColor,fg:getComputedStyle(e.querySelector('span')).color}));
 const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),bg=rgb(colors.bg);
 assert.notEqual(colors.bg,background,'Checked goal changes background');
 assert(bg[1]>bg[0]&&bg[1]>bg[2],'Checked goal has a green background');
 const accent=rgb(await goal.evaluate(e=>getComputedStyle(e).accentColor));
 assert(accent[1]>accent[0]&&accent[1]>accent[2],'Goal checkbox is green');
 assert(contrast(rgb(colors.fg),bg)>=4.5,'Completed goal text has readable contrast');
 await goal.press(' ');assert(!await goal.isChecked());
 assert.equal(await row.evaluate(e=>getComputedStyle(e).backgroundColor),background,'Unchecking restores original background');
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});let p;
 const baseline=!before&&fs.existsSync(path.join(out,'before.json'))?JSON.parse(fs.readFileSync(path.join(out,'before.json'),'utf8')):null;
 try{
  for(const [fileIndex,file] of files.entries())for(const [ci,c] of (before?[configs[0]]:configs).entries()){
   const day=fileIndex+1,ctx=await browser.newContext({viewport:{width:c.width,height:c.height}});p=await ctx.newPage();p.setDefaultTimeout(10000);
   p.on('pageerror',e=>report.errors.push('Day '+day+': '+e.message));
   await p.addInitScript(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size)},c);
   await p.goto(pathToFileURL(path.resolve(file)).href);
   const curriculum=await p.evaluate(()=>JSON.stringify({course,rounds,flows,pairs,phrases,missions,replies}));report.curriculum[file]=hash(curriculum);
   if(baseline)assert.equal(hash(curriculum),baseline.curriculum[file],'Day '+day+': curriculum unchanged');
   if(before){
    if([1,12].includes(day)){
     await p.evaluate(()=>navigate(4));
     if(goalsOnly)await p.locator('[data-pair-check]').first().check();
     else await p.locator('.dg-teacher > summary').click();
     await shot(p,'before-'+(goalsOnly?'goals-':'')+'day'+day);
    }
    await ctx.close();continue
   }
   const answers=await p.evaluate(()=>JSON.stringify(state.answers)),roundCount=await p.evaluate(()=>rounds.length);
   for(let ri=0;ri<roundCount;ri++){
    await p.locator('[data-dg-task="'+ri+'"]').click();await p.evaluate(()=>navigate(4));
    const pairIds=await p.evaluate(()=>(typeof activeRound==='function'?activeRound():currentRound()).pairIds);
    for(const pi of pairIds){
     await p.evaluate(n=>{pair=n;render()},pi);
     if(goalsOnly){
      await checkGoalColor(p);
      if(ri===0&&pi===pairIds[0]&&[1,12].includes(day)&&ci<2){
       await p.locator('[data-pair-check]').first().check();await shot(p,'goals-day'+day+'-'+c.theme);await p.locator('[data-pair-check]').first().uncheck();
      }
      report.pairs++;continue;
     }
     const expected=await p.evaluate(()=>{const r=typeof activeRound==='function'?activeRound():currentRound(),f=flows[r.flowIds?.[r.pairIds.indexOf(pair)]??rounds.indexOf(r)];return{steps:f.steps,prelude:f.prelude,id:pairs[pair].id}});
     const guide=p.locator('.dg-teacher'),summary=guide.locator(':scope > summary');assert(!await guide.evaluate(e=>e.open));
     await summary.focus();await summary.press('Enter');assert(await guide.evaluate(e=>e.open));
     assert.equal(await guide.locator('button,audio,.reference-translation,details').count(),0);
     assert.equal(await guide.locator('.d5-chat-bubble').count(),expected.steps.length*2+(expected.prelude?1:0));
     assert(!/[\u3400-\u9fff]/u.test(await guide.locator('.d5-teacher-script').textContent()),'Teacher reference is English only');
     const actual=await guide.locator('[data-teacher-step]').evaluateAll(es=>es.map(e=>({id:e.dataset.teacherStepId,lines:[...e.querySelectorAll('.d5-script-line')].map(line=>({speaker:line.dataset.speaker,text:line.querySelector('.d5-script-en').textContent}))})));
     assert.deepEqual(actual,expected.steps.map(s=>({id:s.id,lines:(s.askFirst?['student','teacher']:['teacher','student']).map(speaker=>({speaker,text:speaker==='student'?s.answer:s.line}))})));
     assert.equal(await guide.locator('[data-teacher-prelude]').count(),expected.prelude?1:0);
     if(expected.prelude)assert.equal(await guide.locator('[data-teacher-prelude] .d5-script-en').textContent(),expected.prelude.line);
     const help=p.locator('.dg-student-help'),hints=help.locator(':scope > details');
     assert(await help.evaluate(e=>!e.closest('details')&&e.previousElementSibling.matches('.dg-teacher')),'Student hints are independent');
     assert.equal(await hints.count(),expected.steps.length);
     assert.equal(await hints.locator('[data-hint-key]').evaluateAll(es=>new Set(es.map(e=>e.dataset.hintKey)).size),expected.steps.length);
     assert(await hints.evaluateAll(es=>es.every(e=>!e.open)));
     for(let i=0;i<expected.steps.length;i++){
      const hint=hints.nth(i),toggle=hint.locator(':scope > summary');await toggle.focus();await toggle.press('Enter');
      assert(await hint.evaluate(e=>e.open));assert.equal(await help.locator(':scope > details[open]').count(),1,'Only requested cue opens');
      await hint.locator('[data-level="1"]').click();assert.equal(await hint.locator('.dg-keywords').textContent(),expected.steps[i].words);
      await hint.locator('[data-level="2"]').click();assert.equal(await hint.locator('[data-pane="2"] .en').textContent(),expected.steps[i].answer);
      assert.equal(await hint.locator('[data-pane="2"]').getAttribute('aria-hidden'),'false');
      await presentation(p);
      if(i===0&&ri===0&&[1,5,7,11,12].includes(day)&&ci<2){
       await toggle.hover();await toggle.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');assert(await toggle.evaluate(e=>getComputedStyle(e).outlineStyle!=='none'));
       await presentation(p);await shot(p,'day'+day+'-'+c.width+'-'+c.theme+'-expanded');
      }
      await toggle.focus();await toggle.press(' ');assert(!await hint.evaluate(e=>e.open));report.hints++;
     }
     await summary.focus();await summary.press(' ');assert(!await guide.evaluate(e=>e.open));
     await hints.first().locator('summary').focus();await p.keyboard.press('Enter');assert(!await guide.evaluate(e=>e.open));
     assert.equal(await p.evaluate(()=>JSON.stringify(state.answers)),answers,'Viewing hints preserves written answers');
     report.pairs++;
    }
   }
   if(ci===0){
    const goal=p.locator('[data-pair-check]').first(),key=await goal.getAttribute('data-pair-check');
    await goal.check();assert(await goal.isChecked());await p.reload();await p.evaluate(()=>navigate(4));
    await p.locator('[data-dg-task="'+(roundCount-1)+'"]').click();
    await p.evaluate(key=>{pair=pairs.findIndex(p=>key.startsWith(p.id+':'));render()},key);
    assert(await p.locator('[data-pair-check="'+key+'"]').isChecked());await p.locator('[data-pair-check="'+key+'"]').uncheck();report.records++;
   }
   if(goalsOnly&&day===8){
    await p.locator('[data-hi-mode="integrated"]').click();
    await p.locator('#dg-menu-open').click();await p.locator('#nav [data-hi-page="4"]').click();
    for(const practice of ['guided','independent']){
     await p.locator('[data-hi-practice="'+practice+'"]').click();await checkGoalColor(p,'[data-hi-goal]');
    }
    if(ci<2){
     await p.locator('[data-hi-goal]').first().check();
     await p.locator('.hi-pair-grid > section').screenshot({path:path.join(out,'goals-hotel-'+c.theme+'.png')});
    }
   }
   await ctx.close();console.log('PASS Day '+day+': '+c.width+' '+c.theme+' '+c.size);
  }
  assert.deepEqual(report.errors,[]);
 }catch(e){report.failure=e.stack;await p?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e}
 finally{fs.writeFileSync(path.join(out,before?(goalsOnly?'before-goals.json':'before.json'):(goalsOnly?'goals-report.json':'report.json')),JSON.stringify(report,null,2));await browser.close()}
 console.log(before?'Saved curriculum baseline for '+files.length+' lessons.':'PASS '+report.pairs+' task views, '+(goalsOnly?'goal colors and keyboard toggles':report.hints+' individual hints')+', '+report.records+' saved-goal checks.');
})().catch(e=>{console.error(e);process.exitCode=1});
