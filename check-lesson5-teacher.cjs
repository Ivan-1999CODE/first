'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const file=path.resolve('travel-english-unit5-getting-around.html'),out=path.resolve('tmp/lesson5-teacher-chat');
fs.mkdirSync(out,{recursive:true});
const before=process.argv.includes('--before'),digest=s=>crypto.createHash('sha256').update(s).digest('hex'),hash=()=>digest(fs.readFileSync(file));
const report={sourceHash:hash(),cases:[],screenshots:[],errors:[],failures:[]};
const configs=[
 {width:320,height:568,theme:'light',size:'large'},
 {width:390,height:844,theme:'dark',size:'large'},
 {width:768,height:1024,theme:'light',size:'standard'},
 {width:1024,height:768,theme:'dark',size:'large'},
 {width:1440,height:1000,theme:'light',size:'standard'},
 {width:1440,height:1000,theme:'dark',size:'standard'}
];
const shot=async(p,name,selector)=>{
 const options={path:path.join(out,name+'.png')};
 const viewport=p.viewportSize();
 try{
  if(selector){
   const target=p.locator(selector),box=await target.boundingBox();
   // A taller capture viewport avoids Chromium truncating a long locator image.
   if(box.height>viewport.height-160)await p.setViewportSize({...viewport,height:Math.ceil(box.height+180)});
   await target.screenshot(options);
  }else await p.screenshot(options);
 }finally{if(p.viewportSize().height!==viewport.height)await p.setViewportSize(viewport)}
 report.screenshots.push(name+'.png');
};
const contrast=(fg,bg)=>{
 const lum=rgb=>rgb.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 const a=lum(fg),b=lum(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
};
// Collect computed geometry and composited colors together, keeping the 24 cases fast.
function readPresentation(root){
 const parse=s=>{const a=s.match(/[\d.]+/g).map(Number);return[a[0],a[1],a[2],a[3]??1]};
 const over=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));
 const background=e=>{const chain=[];for(let n=e;n;n=n.parentElement)chain.unshift(n);return chain.reduce((bg,n)=>over(parse(getComputedStyle(n).backgroundColor),bg),[255,255,255])};
 const colors=e=>{const bg=background(e);return{fg:over(parse(getComputedStyle(e).color),bg),bg}};
 const rect=e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
 return Array.from(root.querySelectorAll('.d5-chat-exchange')).map(exchange=>({
  id:exchange.dataset.teacherStepId,index:exchange.dataset.teacherStep,rect:rect(exchange),
  divider:exchange.querySelector('.d5-chat-divider').textContent.trim(),
  messages:Array.from(exchange.querySelectorAll(':scope > article.d5-chat-message')).map(message=>({
   speaker:message.dataset.speaker,role:message.querySelector('.d5-chat-role').textContent.trim(),rect:rect(message),
   en:message.querySelector('.d5-chat-en').textContent.trim(),zh:message.querySelector('.d5-chat-zh').textContent.trim(),
   enFont:parseFloat(getComputedStyle(message.querySelector('.d5-chat-en')).fontSize),zhFont:parseFloat(getComputedStyle(message.querySelector('.d5-chat-zh')).fontSize),
   spill:Array.from(message.querySelectorAll('.d5-chat-en,.d5-chat-zh,.d5-chat-role,.d5-chat-audio,.d5-chat-audio *')).some(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+1),
   colors:['.d5-chat-en','.d5-chat-zh','.d5-chat-role'].map(s=>colors(message.querySelector(s))),
   buttons:Array.from(message.querySelectorAll('.d5-chat-audio [data-say]')).map(b=>({text:b.dataset.say,slow:b.dataset.slow==='true',rect:rect(b),...colors(b)}))
  }))
 }));
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});let active;
 try{
  const baseline=before?null:JSON.parse(fs.readFileSync(path.join(out,'before.json'),'utf8'));
  for(const c of before?[configs[1],configs[4]]:configs){
   const tag=`${c.width}-${c.theme}-${c.size}`,representative=c.width<400||c.width===1440;
   const ctx=await browser.newContext({viewport:{width:c.width,height:c.height},isMobile:c.width<400,hasTouch:c.width<1100});
   const p=await ctx.newPage();active=p;p.setDefaultTimeout(10000);let messageCount=0;
   p.on('pageerror',e=>report.errors.push(e.message));
   await p.addInitScript(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size)},c);
   await p.goto(pathToFileURL(file).href);
   await p.evaluate(()=>{window.__teacherSpeech=[];speechSynthesis.speak=u=>window.__teacherSpeech.push({text:u.text,rate:u.rate})});
   const answers=await p.evaluate(()=>JSON.stringify(state.answers));
   const curriculumHash=digest(await p.evaluate(()=>JSON.stringify({flows,pairs})));
   report.curriculumHash=curriculumHash;
   if(!before)assert.equal(curriculumHash,baseline.curriculumHash,'Original flow/pair curriculum matches the purple version');
   for(let n=0;n<(before?2:4);n++){
    await p.locator(`#dg-context [data-dg-task="${n}"]`).click();
    await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="4"]').click();
    const guide=p.locator('.dg-teacher'),summary=guide.locator(':scope > summary');
    assert(!await guide.evaluate(e=>e.open));await summary.scrollIntoViewIfNeeded();
    if(c.width===1440){await summary.focus();await summary.press('Enter')}else await summary.click();
    assert(await guide.evaluate(e=>e.open));
    if(before){await shot(p,`before-${tag}-task${n}`,'.dg-teacher');continue}
    assert(await guide.evaluate(e=>e.matches('details.dg-teacher.d5-teacher-guide')));
    const expected=await p.evaluate(()=>{
     const r=activeRound(),p=pairs[pair],steps=flows[r.flowIds[r.pairIds.indexOf(pair)]??r.flowIds[0]].steps;
     const original=document.createElement('div');original.innerHTML=d5BaseTeacherGuide(p,r,steps);
     const g=original.querySelector('.dg-teacher');
     return{steps,role:r.role||course.replyRole,first:p.first,
      extras:[g.querySelector('.dg-teacher-start').outerHTML,g.querySelector(':scope > details:last-child').outerHTML],
      help:original.querySelector('.dg-student-help').outerHTML};
    });
    const {steps}=expected;
    assert((await guide.locator('.d5-teacher-intro').innerText()).includes(`${steps.length} 段對話`));
    assert((await guide.locator('.d5-teacher-intro').innerText()).includes(`${expected.first}先開口`));
    assert((await guide.locator('.d5-chat-note').innerText()).includes('參考說法'));
    assert.equal(await guide.locator(':scope > .hint').count(),0);
    assert(await guide.locator('.d5-teacher-chat').evaluate(e=>e.nextElementSibling?.classList.contains('d5-teacher-extras')));
    if(n===0&&representative||n===3&&(c.width===390||c.width===1440&&c.theme==='light')){
     await shot(p,`after-${tag}-task${n}-open`,'.dg-teacher');
     if(n===0)await shot(p,`after-${tag}-chat`,'.d5-teacher-chat');
    }
    const exchanges=await guide.evaluate(readPresentation);assert.equal(exchanges.length,steps.length);
    let minimumContrast=Infinity;
    for(let i=0;i<steps.length;i++){
     const s=steps[i],x=exchanges[i],order=s.askFirst?['student','teacher']:['teacher','student'];
     assert.equal(x.id,s.id);assert.equal(x.index,String(i));assert(x.divider.startsWith(String(i+1).padStart(2,'0')));
     assert.deepEqual(x.messages.map(m=>m.speaker),order,`${s.id}: DOM reading order follows askFirst`);
     assert(x.messages[0].rect.bottom<=x.messages[1].rect.top,`${s.id}: visual order matches reading order`);
     for(const m of x.messages){
      const student=m.speaker==='student',line=student?s.answer:s.line;
      assert.equal(m.en,line);assert.equal(m.zh,student?s.answerZh:s.zh);
      assert.equal(m.role,student?'學生 · 旅客':`老師 · ${s.role||expected.role}`);
      assert(m.enFont>=19&&m.enFont>m.zhFont,'English is readable and larger than the translation');
      assert(!m.spill,`${s.id}/${m.speaker}: content fits bubble`);
      assert(m.rect.left>=0&&m.rect.right<=c.width+1,`${s.id}/${m.speaker}: fits viewport`);
      assert(Math.abs(student?m.rect.right-x.rect.right:m.rect.left-x.rect.left)<=2,`${s.id}/${m.speaker}: correct left/right alignment`);
      assert(student?m.rect.left>x.rect.left+2:m.rect.right<x.rect.right-2,`${s.id}/${m.speaker}: visible side inset`);
      assert.equal(m.buttons.length,2);assert.deepEqual(m.buttons.map(b=>b.slow),[false,true]);
      for(const b of m.buttons){assert.equal(b.text,line);assert(b.rect.width>=44&&b.rect.height>=44,'Touch targets are at least 44 px')}
      for(const colors of [...m.colors,...m.buttons]){
       const ratio=contrast(colors.fg,colors.bg);minimumContrast=Math.min(minimumContrast,ratio);
       assert(ratio>=4.5,`${s.id}/${m.speaker}: contrast ${ratio.toFixed(2)} is below 4.5`);
      }
      messageCount++;
     }
    }
    if(n===3){assert(exchanges[0].divider.endsWith('還沒到入口'));assert(exchanges[1].divider.endsWith('已到入口 · 可以停車'))}
    // Exercise both speakers' normal/slow buttons using keyboard, including hover and focus colors.
    await p.evaluate(()=>{window.__teacherSpeech=[]});
    const firstMessages=guide.locator('.d5-chat-exchange').first().locator('.d5-chat-message');
    for(const message of await firstMessages.all())for(const button of await message.locator('.d5-chat-audio [data-say]').all()){
     await button.hover();
     const colors=await button.evaluate(e=>{const s=getComputedStyle(e);return{fg:s.color.match(/[\d.]+/g).slice(0,3).map(Number),bg:s.backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number)}});
     assert(contrast(colors.fg,colors.bg)>=4.5,'Hovered audio contrast');
     await button.focus();await button.press('Enter');
     assert(await button.evaluate(e=>document.activeElement===e&&getComputedStyle(e).outlineStyle!=='none'),'Keyboard focus is visible');
    }
    const requests=await p.evaluate(()=>window.__teacherSpeech);assert.equal(requests.length,4);
    exchanges[0].messages.forEach((m,i)=>{assert.equal(requests[i*2].text,m.en);assert.equal(requests[i*2+1].text,m.en);assert(requests[i*2+1].rate<requests[i*2].rate)});
    await p.evaluate(()=>stopAudio());
    const extras=guide.locator('.d5-teacher-extras > details');assert.equal(await extras.count(),2);
    assert.deepEqual(await extras.evaluateAll(es=>es.map(e=>e.outerHTML)),expected.extras,'Opening and complete conditions preserved exactly');
    for(const d of await extras.all()){
     assert(!await d.evaluate(e=>e.open));const toggle=d.locator(':scope > summary');await toggle.focus();await toggle.press('Enter');assert(await d.evaluate(e=>e.open));
    }
    if(n===0&&representative)await shot(p,`after-${tag}-extras-open`,'.d5-teacher-extras');
    const help=p.locator('.dg-student-help');
    assert.equal(await help.evaluate(e=>e.outerHTML),expected.help,'External student help and original hint IDs preserved');
    assert(await help.evaluate(e=>e.previousElementSibling?.classList.contains('dg-teacher')&&!e.closest('.dg-teacher')));
    assert.equal(await p.locator('.dg-pair-note').count(),0);
    await summary.focus();await summary.press(' ');assert(!await guide.evaluate(e=>e.open));
    await help.locator(':scope > summary').focus();await help.locator(':scope > summary').press('Enter');
    assert(await help.evaluate(e=>e.open));assert(!await guide.evaluate(e=>e.open),'Student help opens independently');
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Expanded content stays within viewport');
    assert.equal(await p.evaluate(()=>JSON.stringify(state.answers)),answers);
    assert.equal(digest(await p.evaluate(()=>JSON.stringify({flows,pairs}))),curriculumHash);
    report.cases.push({config:tag,task:n,steps:steps.length,messages:steps.length*2,minimumContrast:Number(minimumContrast.toFixed(2)),contentOrderAndSides:true,audioAndKeyboard:true,helpIndependent:true,originalDataUnchanged:true});
   }
   if(!before)assert.equal(messageCount,20,'All 20 authored messages verified in each configuration');
   await ctx.close();console.log(`${before?'BEFORE':'PASS'} ${tag}${before?'':': 20 messages / 4 tasks'}`);
  }
  assert.deepEqual(report.errors,[]);assert.equal(hash(),report.sourceHash,'Generated HTML did not change during QA');
  if(!before){assert.equal(report.cases.length,24);assert.equal(report.cases.reduce((sum,c)=>sum+c.messages,0),120)}
 }catch(e){report.failures.push(e.stack);if(active)await active.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e}
 finally{fs.writeFileSync(path.join(out,before?'before.json':'report.json'),JSON.stringify(report,null,2));await browser.close()}
 console.log(`${before?'Saved before views':'PASS '+report.cases.length+' teacher chat cases'}; ${report.screenshots.length} screenshots.`);
})().catch(e=>{console.error(e);process.exit(1)});
