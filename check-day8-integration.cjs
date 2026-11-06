// Targeted checks for the local Day 8 pilot: real browser interactions, record
// isolation, changing conditions, original-task regression, and visual states.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum=require('./assets/micro-curriculum.cjs').make(8);
const data=require('./assets/day8-integration-data.cjs')(curriculum);
const file='travel-english-unit8-hotel.html',html=fs.readFileSync(file,'utf8');
const url=pathToFileURL(path.resolve(file)).href,out=path.resolve('tmp/day8-integration');
fs.mkdirSync(out,{recursive:true});
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const read=k=>JSON.parse(html.match(new RegExp('(?:^|[>\\n])const '+k+'=(.*);(?:\\r?\\n|<)'))[1]);
assert.deepEqual(read('rounds'),curriculum.rounds,'original task records and content unchanged');
assert.deepEqual(read('hotelIntegration'),JSON.parse(JSON.stringify(data)),'built integration uses source data');
assert.equal(data.steps.length,7);assert.equal(data.scenarios.length,5);
assert.equal(new Set(data.steps.map(s=>s.answer)).size,7);
const sourceRounds=curriculum.rounds.slice(0,3);
const taught=new Set(sourceRounds.flatMap(r=>[...r.phraseIds.map(id=>curriculum.phrases.find(p=>p.id===id).en),...[r.variation,...(r.additionalVariations||[])].flatMap(v=>v.steps.map(s=>s.answer))]));
assert(data.scenarios.every(c=>c.steps.every(s=>taught.has(s.answer))));
assert.notEqual(data.storageKey,curriculum.course.id);
const report={paths:0,views:0,originalViews:0,errors:[],screenshots:[]};
const openAncestors=async loc=>{for(const d of await loc.locator('xpath=ancestor::details').all())if(!await d.evaluate(e=>e.open))await d.locator(':scope > summary').click();};
const fill=async(p,key,value)=>{const t=p.locator(`[data-hi-field="${key}"]`);await openAncestors(t);await t.fill(value);};
const chapter=async(p,n)=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-hi-page="${n}"]`).click();assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),String(n+1));};
const pick=async(p,attr,id)=>{await p.locator('#main .hi-picker > summary').click();await p.locator(`[data-hi-${attr}="${id}"]`).click();};
const record=async p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),data.storageKey);
async function bounds(p,label){
 const problem=await p.evaluate(()=>{
  const visible=e=>{if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden'||e.closest('[inert],[aria-hidden="true"]'))return false;let n=e;while(n.parentElement){const parent=n.parentElement;if(parent.tagName==='DETAILS'&&!parent.open&&n.tagName!=='SUMMARY')return false;n=parent;}return true;};
  const bad=[...document.querySelectorAll('#main *,#hi-mode-bar *,#dg-context *,#dg-course-dialog[open] *')].filter(e=>visible(e)&&!e.closest('.dg-task-switch')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left< -1||r.right>innerWidth+1)}).slice(0,6).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,65)}));
  return {width:innerWidth,scroll:document.documentElement.scrollWidth,bad};
 });
 assert(problem.scroll<=problem.width+1,label+': document overflow '+JSON.stringify(problem));assert.deepEqual(problem.bad,[],label+': visible bounds');report.views++;
}
async function shot(p,name){await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:path.join(out,name+'.png'),fullPage:!name.startsWith('menu-')});report.screenshots.push(name+'.png');}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1280,height:900}}),p=await ctx.newPage();p.setDefaultTimeout(7000);p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(url);
  const sentinel=JSON.stringify({answers:{'entry-before-A':'原任務已保存的回答'},checks:{},ratings:{},complete:[],roundsDone:['A'],taskHome:{}});
  await p.evaluate(({key,sentinel})=>localStorage.setItem(key,sentinel),{key:curriculum.course.id,sentinel});await p.reload();
  assert.equal(await p.locator('[data-dg-task]').count(),6);
  // Regression includes opening the integrated route while the original page
  // is on its study tab, where shared translation decoration used to run.
  for(let r=0;r<6;r++)for(let n=0;n<7;n++){
   await p.evaluate(({r,n})=>{setTaskRound(r);navigate(n)},{r,n});assert(await p.locator('#main').innerText());report.originalViews++;
  }
  await p.evaluate(()=>{setTaskRound(0);navigate(1)});
  const originalBefore=await p.evaluate(key=>localStorage.getItem(key),curriculum.course.id);
  await p.locator('[data-hi-mode="integrated"]').click();
  assert.equal(await p.locator('#nav [data-hi-page]').count(),7);assert.equal(await p.locator('#allChinese').count(),0);
  await fill(p,'before','入住前 <img src=x onerror=alert(1)> & 我的嘗試');
  assert.equal((await record(p)).answers.before,'入住前 <img src=x onerror=alert(1)> & 我的嘗試');
  await p.locator('[data-hi-direct]').click();await p.locator('[data-hi-live-mode="original"]').click();assert.equal(await p.locator('[data-hi-practice="independent"]').getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('.hi-goal-hint').count(),0);assert.equal(await p.locator('.hi-student-help').getAttribute('open'),null);
  await p.locator('[data-hi-goal="0"]').check();await fill(p,'note-original-independent','我先報了姓名，老師就接著問晚數。');
  await p.locator('[data-hi-practice="guided"]').click();assert.equal(await p.locator('[data-hi-goal="0"]').isChecked(),false);
  await p.locator('[data-hi-goal="1"]').check();await p.locator('[data-hi-goal="1"]').uncheck();
  await pick(p,'pair','nights');await p.locator('[data-hi-goal="1"]').check();
  await p.locator('.hi-teacher > summary').click();await p.locator('[data-hi-alternate]').check();assert((await p.locator('.hi-teacher-cards').innerText()).includes('How long will you be staying?'));
  await chapter(p,1);await p.locator('[data-hotel-study-all]').click();await p.locator('.study-navigation [data-hi-study="reply"]').click();
  for(let i=0;i<data.steps.length;i++){
   const s=data.steps[i];await p.locator(`.workshop-picker [data-hi-reply="${i}"]`).click();
   assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),s.askFirst?'self':'other');
   if(!s.askFirst){assert.equal(await p.locator('.hi-transcript').getAttribute('open'),null);await p.locator('[data-hi-study-role="self"]').click();}
   await p.locator('[data-guide-hint][data-level="2"]').click();
   if(s.askFirst){await p.locator('[data-hi-study-role="other"]').click();assert.equal(await p.locator('.hi-transcript').getAttribute('open'),null);}
  }
  await chapter(p,2);
  for(const c of data.scenarios){
   await pick(p,'flow-scenario',c.id);
   for(let i=0;i<c.steps.length;i++){
    const s=c.steps[i];assert.equal(await p.locator('[data-hi-flow-next]').isDisabled(),true);assert.equal(await p.locator('[data-hi-choice="0"]').isDisabled(),true);
    const first=s.askFirst?'spoken':'heard',second=s.askFirst?'heard':'spoken';
    assert.equal(await p.locator(`[data-hi-gate="${second}"]`).isDisabled(),true);
    await p.locator(`[data-hi-gate="${first}"]`).check();await p.locator(`[data-hi-gate="${second}"]`).check();
    const incorrect=s.objects.findIndex((_,j)=>!s.valid.includes(j));
    await p.locator(`[data-hi-choice="${incorrect}"]`).click();assert.equal(await p.locator('[data-hi-flow-next]').isDisabled(),true);assert((await p.locator('.hi-feedback').innerText()).includes('再聽'));
    await p.locator(`[data-hi-choice="${s.valid[0]}"]`).click();assert.equal(await p.locator('[data-hi-flow-next]').isDisabled(),false);
    if(c.id==='original'&&i===3){
     assert((await p.locator('.hi-room-key').innerText()).includes('305'));
     await p.locator(`[data-hi-gate="${first}"]`).uncheck();assert.equal(await p.locator(`[data-hi-gate="${second}"]`).isChecked(),false);assert(!(await p.locator('.hi-room-key').innerText()).includes('305'));
     await p.locator(`[data-hi-gate="${first}"]`).check();await p.locator(`[data-hi-gate="${second}"]`).check();await p.locator(`[data-hi-choice="${s.valid[0]}"]`).click();
    }
    await p.locator('[data-hi-flow-next]').click();
   }
   assert((await p.locator('#main').innerText()).includes('已準備好拿著房卡上樓'));
   const text=await p.locator('.hi-desk').innerText();assert(text.includes(c.name));assert(text.includes(c.nights+' 晚'));assert(text.includes(c.checkout+' 點退房'));assert(text.includes('往'+c.elevator+'邊電梯'));report.paths++;
  }
  // Reviewing earlier speech preserves facts and persisted work.
  await p.locator('[data-hi-flow-restart]').click();
  for(let i=0;i<2;i++){const s=data.steps[i];await p.locator(`[data-hi-gate="${s.askFirst?'spoken':'heard'}"]`).check();await p.locator(`[data-hi-gate="${s.askFirst?'heard':'spoken'}"]`).check();await p.locator('[data-hi-choice="0"]').click();await p.locator('[data-hi-flow-next]').click();}
  const beforeReview=await p.locator('.hi-desk').innerText();await p.locator('[data-vf-review="back"]').click();assert.equal(await p.locator('.hi-desk').innerText(),beforeReview);await p.locator('[data-vf-review="current"]').click();assert.equal(await p.locator('.hi-desk').innerText(),beforeReview);
  await chapter(p,3);await p.locator('[data-hi-challenge-mode="single"]').click();
  const nights=data.sayPrompts.findIndex(s=>s.sentences.includes('I’m staying for two nights.')),checkout=data.sayPrompts.findIndex(s=>s.sentences.includes('What time is check-out?'));
  await p.locator(`nav [data-hi-say="${nights}"]`).click();await fill(p,data.sayPrompts[nights].id,'我住兩晚。');
  await p.locator(`nav [data-hi-say="${checkout}"]`).click();await fill(p,data.sayPrompts[checkout].id,'What time is check-out?');
  await p.locator(`nav [data-hi-say="${nights}"]`).click();assert.equal(await p.locator(`[data-hi-field="${data.sayPrompts[nights].id}"]`).inputValue(),'我住兩晚。');
  await chapter(p,5);assert.equal(await p.locator('#main img[src=x]').count(),0);assert((await p.locator('.readonly').innerText()).includes('<img src=x'));
  assert.equal(await p.locator('.hi-rating[data-level="0"]').count(),4);await fill(p,'after','現在可以完成入住。');
  for(const n of [1,2,3,1]){await p.locator(`[data-hi-rating="connect:${n}"]`).click();assert.equal(await p.locator('.hi-rating').last().getAttribute('data-level'),String(n));assert.equal(await p.locator('.hi-rating').last().locator('.meter .'+(n===3?'green':'yellow')).count(),n);}
  await chapter(p,6);await p.locator('[data-hi-quiz="checkout:0"]').click();assert((await p.locator('.hi-quiz').first().innerText()).includes('再聽一次'));await p.locator('[data-hi-quiz="checkout:1"]').click();assert((await p.locator('.hi-quiz').first().innerText()).includes('✓'));await p.locator('[data-hi-home="listen"]').check();await p.locator('[data-hi-home-transfer]').check();await fill(p,'home-transfer-v2','我可以不用完整句提示。');
  const saved=await record(p);assert.equal(saved.complete.length,5);assert.equal(saved.suite.homeSpoken,true);
  assert.equal(await p.evaluate(key=>localStorage.getItem(key),curriculum.course.id),originalBefore,'integrated practice never writes original records');
  await p.reload();await p.locator('[data-hi-mode="integrated"]').click();assert.deepEqual(await record(p),saved);
  await chapter(p,4);await p.locator('[data-hi-live-mode="original"]').click();await p.locator('[data-hi-practice="independent"]').click();assert.equal(await p.locator('[data-hi-goal="0"]').isChecked(),true);await pick(p,'pair','nights');assert.equal(await p.locator('[data-hi-goal="0"]').isChecked(),false);await p.locator('[data-hi-practice="guided"]').click();assert.equal(await p.locator('[data-hi-goal="1"]').isChecked(),true);
  await p.locator('[data-hi-mode="single"]').click();assert.equal(await p.locator('[data-dg-task]').count(),6);await p.locator('[data-hi-mode="integrated"]').click();
  // Unsupported speech has a visible text route, with no microphone requirement.
  await p.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true}));await chapter(p,1);await p.locator('[data-say]').first().click();assert((await p.locator('.lesson-audio-status').innerText()).includes('不支援朗讀'));
  await ctx.close();
  for(const config of [{width:1280,height:900,theme:'light',size:'standard'},{width:1024,height:768,theme:'dark',size:'large'},{width:375,height:812,theme:'light',size:'large'},{width:320,height:720,theme:'dark',size:'large'}]){
   const c=await browser.newContext({viewport:{width:config.width,height:config.height}}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
   await p.addInitScript(c=>{if(!localStorage.getItem('travel-lab-theme'))localStorage.setItem('travel-lab-theme',c.theme);if(!localStorage.getItem('travel-lab-text-size'))localStorage.setItem('travel-lab-text-size',c.size)},config);await p.goto(url+'#integrated');assert.equal(await p.locator('.hi-content').count(),1,'direct integration link');
   for(let n=0;n<7;n++){
    if(n)await chapter(p,n);await bounds(p,`${config.width}/${config.theme}/part${n+1}`);
    if(n===0){const contrast=await p.locator('.hi-hero .eyebrow').evaluate(e=>{const luminance=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{const c=n/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((a,c,i)=>a+c*[.2126,.7152,.0722][i],0);const a=luminance(getComputedStyle(e).color),b=luminance(getComputedStyle(e.closest('.hi-hero')).backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});assert(contrast>=4.5,'hero eyebrow contrast');await shot(p,`home-${config.width}-${config.theme}`);}
    if(n===2){await p.locator('[data-guide-hint][data-level="2"]').first().click();await p.locator('.hi-transcript > summary').click();await bounds(p,'expanded-flow-'+config.width);if(config.width>=1024)await shot(p,`flow-${config.width}-${config.theme}`);}
    if(n===3){await p.locator('[data-hi-challenge-mode="single"]').click();await p.locator('[data-say-support="2"]').click();await p.locator('nav [data-hi-say="1"]').hover();await p.locator('nav [data-hi-say="2"]').focus();await bounds(p,'expanded-say-'+config.width);await shot(p,`say-${config.width}-${config.theme}`);}
    if(n===4){await p.locator('.hi-teacher > summary').click();await bounds(p,'expanded-teacher-'+config.width);if(config.width>=1024)await shot(p,`teacher-${config.width}-${config.theme}`);}
    if(n===5){await p.locator('[data-hi-rating="start:1"]').click();await p.locator('[data-hi-rating="respond:2"]').click();await p.locator('[data-hi-rating="information:3"]').click();await bounds(p,'ratings-'+config.width);if(config.width>=1024)await shot(p,`progress-${config.width}-${config.theme}`);}
   }
   await p.locator('#dg-menu-open').click();await p.locator('#nav [data-hi-page="2"]').hover();await p.locator('#nav [data-hi-page="3"]').focus();await bounds(p,'menu-'+config.width);await shot(p,`menu-${config.width}-${config.theme}`);await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open');
   await p.locator('#theme').click();await p.locator('#large').click();await p.reload();assert.equal(await p.locator('html').getAttribute('data-theme'),config.theme==='light'?'dark':'light');assert.equal(await p.locator('html').getAttribute('data-size'),config.size==='large'?'standard':'large');
   await c.close();
  }
  for(const broken of ['{bad',JSON.stringify({answers:{before:99},checks:{'original-guided':[true,'yes']},ratings:{start:99},complete:'wrong',home:{listen:1}}),'blocked']){
   const c=await browser.newContext(),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
   await p.addInitScript(({key,broken})=>{if(broken==='blocked'){const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(k){if(k===key)throw Error('blocked');return get.call(this,k)};Storage.prototype.setItem=function(k,v){if(k===key)throw Error('blocked');return set.call(this,k,v)}}else localStorage.setItem(key,broken)},{key:data.storageKey,broken});
   await p.goto(url);await p.locator('[data-hi-mode="integrated"]').click();await fill(p,'before','仍可作答');await chapter(p,5);assert((await p.locator('.readonly').innerText()).includes('仍可作答'));assert.equal(await p.locator('.hi-rating[data-level="0"]').count(),4);if(broken==='blocked')assert.equal(await p.locator('#hi-save-notice').isVisible(),true);await c.close();
  }
  assert.deepEqual(report.errors,[],'no browser runtime errors');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('PASS: '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
