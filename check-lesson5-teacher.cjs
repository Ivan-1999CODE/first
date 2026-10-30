'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const file=path.resolve('travel-english-unit5-getting-around.html'),out=path.resolve('tmp/lesson5-teacher');fs.mkdirSync(out,{recursive:true});
const before=process.argv.includes('--before'),hash=()=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report={sourceHash:hash(),cases:[],screenshots:[],errors:[],failures:[]};
const configs=[{width:320,height:568,theme:'light',size:'large'},{width:390,height:844,theme:'dark',size:'large'},{width:768,height:1024,theme:'light',size:'standard'},{width:1024,height:768,theme:'dark',size:'large'},{width:1440,height:1000,theme:'light',size:'standard'},{width:1440,height:1000,theme:'dark',size:'standard'}];
const shot=async(p,name,selector)=>{const o={path:path.join(out,name+'.png')};if(selector)await p.locator(selector).screenshot(o);else await p.screenshot(o);report.screenshots.push(name+'.png')};
const contrast=(a,b)=>{const lum=s=>{const rgb=s.match(/[\d.]+/g).slice(0,3).map(v=>Number(v)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});let active;
try{
 for(const c of before?[configs[1],configs[4]]:configs){const tag=`${c.width}-${c.theme}-${c.size}`,ctx=await browser.newContext({viewport:{width:c.width,height:c.height},isMobile:c.width<400,hasTouch:c.width<1100}),p=await ctx.newPage();active=p;p.setDefaultTimeout(10000);p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size)},c);await p.goto(pathToFileURL(file).href);
  await p.evaluate(()=>{window.__teacherSpeech=[];speechSynthesis.speak=u=>window.__teacherSpeech.push({text:u.text,rate:u.rate})});
  const answers=await p.evaluate(()=>JSON.stringify(state.answers));
  for(let n=0;n<(before?2:4);n++){
   await p.locator(`#dg-context [data-dg-task="${n}"]`).click();await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="4"]').click();const guide=p.locator('.dg-teacher');assert(!await guide.evaluate(e=>e.open));const summary=guide.locator(':scope > summary');await summary.scrollIntoViewIfNeeded();if(c.width===1440){await summary.focus();await summary.press('Enter')}else await summary.click();assert(await guide.evaluate(e=>e.open));
   if(before){await shot(p,`before-${tag}-task${n}`,'.dg-teacher');continue}
   const steps=await p.evaluate(()=>{const r=activeRound();return flows[r.flowIds[r.pairIds.indexOf(pair)]??r.flowIds[0]].steps});
   const cards=guide.locator('[data-teacher-step]');assert.equal(await cards.count(),steps.length);assert.equal(await guide.locator(':scope > .hint').count(),0,'Long duplicate context moved out of card path');assert(await guide.locator('.d5-teacher-cards').evaluate(e=>e.nextElementSibling?.classList.contains('d5-teacher-extras')));
   for(let i=0;i<steps.length;i++){const card=cards.nth(i),s=steps[i];assert.equal(await card.getAttribute('data-teacher-step-id'),s.id);assert.equal(await card.locator('.d5-teacher-order').innerText(),String(i+1).padStart(2,'0'));assert.equal(await card.locator('.d5-teacher-line').innerText(),s.line);assert.equal(await card.locator('.d5-teacher-translation').innerText(),s.zh);assert.equal(await card.locator('h3').innerText(),s.askFirst?'先聽學生，再回這句':i===0?'老師先開口':'老師接著問');
    const buttons=card.locator('[data-say]');assert.equal(await buttons.count(),2);for(const b of await buttons.all())assert.equal(await b.getAttribute('data-say'),s.line);
    const style=await card.evaluate(e=>{const q=e.querySelector('.d5-teacher-speech'),line=e.querySelector('.d5-teacher-line'),zh=e.querySelector('.d5-teacher-translation'),cue=e.querySelector('.d5-teacher-trigger'),r=q.getBoundingClientRect();return{bg:getComputedStyle(q).backgroundColor,fg:getComputedStyle(line).color,zh:getComputedStyle(zh).color,font:parseFloat(getComputedStyle(line).fontSize),cueFont:parseFloat(getComputedStyle(cue).fontSize),cardBg:getComputedStyle(e).backgroundColor,spill:e.scrollWidth>e.clientWidth+1,right:r.right,left:r.left}});
    assert.notEqual(style.bg,style.cardBg,'Spoken line has distinct surface');assert(style.font>=24&&style.font>style.cueFont*1.4,'English has clear type hierarchy');assert(contrast(style.fg,style.bg)>=4.5);assert(contrast(style.zh,style.bg)>=4.5);assert(!style.spill);assert(style.left>=0&&style.right<=c.width+1);
   }
   if(n===3)assert((await cards.nth(1).locator('.d5-teacher-trigger').innerText()).startsWith('到了入口後'),'Dropoff location changes before stopping');
   const play=cards.first().locator('[data-say]');for(const b of await play.all()){await b.hover();await b.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));const bstyle=await b.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{fg:s.color,bg:s.backgroundColor,w:r.width,h:r.height}});assert(contrast(bstyle.fg,bstyle.bg)>=4.5,'Hovered audio button contrast '+JSON.stringify(bstyle));assert(bstyle.w>=44&&bstyle.h>=44);await b.focus();await b.press('Enter');assert.notEqual(await b.evaluate(e=>getComputedStyle(e).outlineStyle),'none')}
   const requests=await p.evaluate(()=>window.__teacherSpeech.slice(-2));assert(requests.every(x=>x.text===steps[0].line));assert(requests[1].rate<requests[0].rate);
   await p.evaluate(()=>stopAudio());
   if(n===0||c.width===1440&&c.theme==='light'){
    await summary.scrollIntoViewIfNeeded();await shot(p,`after-${tag}-task${n}-open`,'.dg-teacher');await shot(p,`after-${tag}-task${n}-first-card`,'.d5-teacher-step:first-child');
   }
   const extras=guide.locator('.d5-teacher-extras > details');assert.equal(await extras.count(),2);for(const d of await extras.all()){assert(!await d.evaluate(e=>e.open));await d.locator(':scope > summary').click();assert(await d.evaluate(e=>e.open))}
   if(n===0)await shot(p,`after-${tag}-extras-open`,'.d5-teacher-extras');
   assert(await p.locator('.dg-student-help').evaluate(e=>e.previousElementSibling?.classList.contains('dg-teacher')));assert(!await p.locator('.dg-student-help').evaluate(e=>e.open));assert.equal(await p.locator('.dg-pair-note').count(),0);await summary.click();await p.locator('.dg-student-help > summary').click();assert(await p.locator('.dg-student-help').evaluate(e=>e.open));assert(!await guide.evaluate(e=>e.open));
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Expanded content stays within viewport');assert.equal(await p.evaluate(()=>JSON.stringify(state.answers)),answers);
   report.cases.push({config:tag,task:n,steps:steps.length,wordingAndOrder:true,contrast:true,audioRequests:true,helpIndependent:true});
  }
  await ctx.close();console.log(`${before?'BEFORE':'PASS'} ${tag}`);
 }
 assert.deepEqual(report.errors,[]);assert.equal(hash(),report.sourceHash);
}catch(e){report.failures.push(e.stack);if(active)await active.screenshot({path:path.join(out,'failure.png')});throw e}
finally{fs.writeFileSync(path.join(out,before?'before.json':'report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log(`${before?'Saved before views':'PASS '+report.cases.length+' teacher cases'}; ${report.screenshots.length} screenshots.`);
})().catch(e=>{console.error(e);process.exit(1)});
