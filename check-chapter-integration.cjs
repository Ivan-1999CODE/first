'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const make=require('./assets/micro-curriculum.cjs').make,integrate=require('./assets/chapter-integration-data.cjs');
const days=[1,2,3,4,5,6,7,9,11],out=path.resolve('tmp/chapter-integration');fs.mkdirSync(out,{recursive:true});
const report={days:[],groups:0,paths:0,steps:0,questions:0,layouts:0,errors:[],screenshots:[]};
const read=(html,key)=>JSON.parse(html.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'))[1]);
const files=fs.readdirSync('.'),lessons=days.map(day=>{
 const original=day===1?require('./assets/day1-focus-data.cjs'):make(day);
 if(day===1){require('./assets/phrase-substitutions.cjs').addSubstitutions(original);require('./assets/listening-preview.cjs').addListeningPreview(original);require('./assets/english-answer-translations.cjs').addAnswerTranslations(original);}
 const data=integrate(original);
 const file=day===1?'travel-english.html':files.find(f=>f.startsWith('travel-english-unit'+day+'-')&&f.endsWith('.html'));
 const html=fs.readFileSync(file,'utf8');
 assert.deepEqual(read(html,'chapterIntegration'),JSON.parse(JSON.stringify(data)));
 for(const key of ['rounds','flows','phrases','missions','pairs'])assert.deepEqual(read(html,key),JSON.parse(JSON.stringify(original[key])),day+' unchanged '+key);
 for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
 assert.equal(new Set(data.groups.map(g=>g.storageKey)).size,data.groups.length);
 for(const g of data.groups){
  assert.equal(g.sections.length,7);assert.equal(g.checkpoint,g.paths[0].context);assert(g.questions.length);
  assert(g.sources.every(s=>data.sourceTasks.some(t=>t.label===s)));
  for(const p of g.paths){assert(p.steps.length);assert.equal(new Set(p.steps.map(s=>s.id)).size,p.steps.length);
   for(const s of p.steps){for(const key of ['answer','answerZh','line','zh','task','label','id','sourceStepId'])assert(s[key],`${day}/${g.id}/${key}`);assert(s.choiceReview?.mode);assert(s.choiceReview.reason);assert(s.valid.length&&s.valid.every(i=>s.objects[i]));assert.equal(s.phrase.en,s.answer);assert(s.phrase.zh);}
  }
  assert(g.questions.every(q=>g.paths.some(p=>p.steps.some(s=>s.id===q.step.id))));
 }
 return {day,original,data,file,url:pathToFileURL(path.resolve(file)).href};
});
// These semantic assertions are independent of the path-building implementation.
const g=(day,id)=>lessons.find(l=>l.day===day).data.groups.find(g=>g.id===id);
const budget=g(2,'budget').paths[0].steps;
assert.equal(budget[0].line,'It’s twelve dollars.');assert.equal(budget[3].answer,'I’ll take it.');
assert.deepEqual(budget.find(s=>s.label==='改用現金').choiceVisuals[0].values,[1,1,1,1]);
const toast=g(6,'budget').paths[0].steps;assert(toast.some(s=>s.answer==='I’d like the egg toast, please.'));assert(toast.some(s=>s.answer==='Is it seven dollars fifty?'));assert(!toast.some(s=>/eight dollars fifty/i.test(s.line)));
for(const p of g(7,'fit').paths)assert(!(p.steps.some(s=>s.answer==='It’s too big.')&&p.steps.some(s=>s.answer==='It’s too small.')));
assert.deepEqual(g(9,'reservation').paths.map(p=>p.id),['normal','later','change','decline']);
assert(!g(11,'interests').paths.flatMap(p=>p.steps).some(s=>s.answer==='It was great.'));
for(const day of [8,10,12,13,14])assert.equal(integrate(make(day)),null);
const baselinePath=path.join(out,'baseline.json');
if(fs.existsSync(baselinePath)){
 const baseline=JSON.parse(fs.readFileSync(baselinePath,'utf8'));
 for(const day of [8,10,12,13,14]){const file=files.find(f=>f.startsWith('travel-english-unit'+day+'-')&&f.endsWith('.html'));assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),baseline.hashes[file],file+' must be byte-identical');}
}
if(process.argv.includes('--data-only')){console.log('Chapter integration data and original-task preservation passed.');process.exit(0);}
async function part(p,n){await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-ci-section="${n}"]`).click();assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),String(n+1));}
async function fill(p,key,text){const f=p.locator(`[data-ci-field="${key}"]`);for(const a of await f.locator('xpath=ancestor::details').all())if(!await a.evaluate(e=>e.open))await a.locator(':scope > summary').click();await f.fill(text);}
async function bounds(p,name){const result=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('.ci-content button,.ci-mode-bar button,#dg-course-dialog[open] button')].filter(e=>e.checkVisibility({checkVisibilityCSS:true})).filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(e=>e.textContent.slice(0,40))}));assert(result.scroll<=result.width+1,name+JSON.stringify(result));assert.deepEqual(result.bad,[],name);report.layouts++;}
async function shot(p,name){if(!name.startsWith('menu'))await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:path.join(out,name+'.png'),fullPage:!name.startsWith('menu')});report.screenshots.push(name+'.png');}
async function step(p,s){
 assert(await p.locator('[data-ci-next]').isDisabled());
 const first=s.askFirst?'spoken':'heard',second=s.askFirst?'heard':'spoken';
 assert(await p.locator(`[data-ci-gate="${second}"]`).isDisabled());
 await p.locator(`[data-ci-gate="${first}"]`).check();await p.locator(`[data-ci-gate="${second}"]`).check();
 const wrong=s.objects.findIndex((_,i)=>!s.valid.includes(i));
 if(wrong>=0){await p.locator(`[data-ci-choice="${wrong}"]`).click();assert(await p.locator('[data-ci-next]').isDisabled());}
 for(const valid of s.valid){await p.locator(`[data-ci-choice="${valid}"]`).click();assert(!await p.locator('[data-ci-next]').isDisabled());}
 await p.locator('[data-ci-next]').click();report.steps++;
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1280,height:900}}),p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>report.errors.push(e.stack));
  for(const lesson of lessons){
   await p.goto(lesson.url);await p.evaluate(key=>localStorage.setItem(key,JSON.stringify({answers:{before:'保留原任務'},custom:'sentinel'})),lesson.original.course.id);await p.reload();
   await p.locator('[data-ci-mode="integrated"]').click();assert.equal(await p.locator('[data-ci-group]').count(),lesson.data.groups.length);
   for(const group of lesson.data.groups){
    await p.locator(`[data-ci-group="${group.id}"]`).click();assert.equal(await p.locator('#nav [data-ci-section]').count(),7);
    assert.equal(await p.locator('.ci-checkpoint').innerText(),group.checkpoint);await fill(p,'before',`${lesson.day}/${group.id} before <b>literal</b>`);
    await part(p,1);
    for(const route of group.paths){await p.locator(`[data-ci-study-path="${route.id}"]`).click();assert.equal(await p.locator('[data-ci-study-section]').count(),1);assert.equal(await p.locator('.ci-study-section .task-phrase').count(),new Set(route.steps.map(s=>s.answer)).size);assert.equal(await p.locator('.ci-vocabulary').getAttribute('open'),null);}
    await p.locator('[data-ci-all]').click();assert.equal(await p.locator('[data-ci-study-section]').count(),group.paths.length);
    const sample=group.paths[0];await p.locator(`[data-ci-study-path="${sample.id}"]`).click();await p.locator('.study-navigation [data-ci-study="reply"]').click();
    for(let i=0;i<sample.steps.length;i++){await p.locator(`[data-ci-reply="${i}"]`).first().click();assert.equal(await p.locator('[data-study-speaker]').getAttribute('data-study-speaker'),sample.steps[i].askFirst?'self':'other');}
    await part(p,2);
    for(const route of group.paths){await p.locator(`[data-ci-path="${route.id}"]`).click();for(const s of route.steps)await step(p,s);assert.equal(await p.locator('.ci-complete').count(),1);report.paths++;}
    await p.locator(`[data-ci-path="${sample.id}"]`).click();await step(p,sample.steps[0]);if(sample.steps.length>1){await p.locator('[data-ci-back]').click();assert(await p.locator('[data-ci-next]').isDisabled());assert.equal(await p.locator('.vf-history').count(),0);assert((await p.locator('.vf-result').innerText()).includes('尚未選擇'));}
    await part(p,3);
    for(let i=0;i<group.questions.length;i++){await p.locator(`nav [data-ci-question="${i}"]`).click();await fill(p,'question-'+group.questions[i].id,'question '+i);report.questions++;}
    await part(p,4);
    for(const route of group.paths){await p.locator(`[data-ci-path="${route.id}"]`).click();const guide=p.locator('.d5-teacher-guide');assert.equal(await guide.getAttribute('open'),null);await guide.locator('summary').click();assert.equal(await guide.locator('[data-say]').count(),0);assert(!/[\u4e00-\u9fff]/.test(await guide.locator('.d5-teacher-script').innerText()));await p.locator('[data-ci-goal]').first().check();await fill(p,'live-'+route.id,'live '+route.id);}
    await part(p,5);assert.equal(await p.locator('.ci-checkpoint').innerText(),group.checkpoint);await fill(p,'after','after '+group.id);await p.locator('[data-ci-rating="connect:3"]').click();assert.equal(await p.locator('.ci-rating[data-level="3"] .green').count(),3);await p.locator('[data-ci-rating="connect:1"]').click();assert.equal(await p.locator('.ci-rating[data-level="1"] .yellow').count(),1);
    await part(p,6);await p.locator('[data-ci-home="listen"]').check();await p.locator('[data-ci-home="spoken"]').check();await p.locator('[data-ci-quiz]').first().click();await fill(p,'home-'+group.paths.at(-1).id,'home note');
    const saved=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),group.storageKey);assert.equal(saved.answers.before,`${lesson.day}/${group.id} before <b>literal</b>`);assert.equal(saved.answers.after,'after '+group.id);assert.equal(saved.complete.length,group.paths.length);
    await p.reload();assert.equal(await p.locator('.ci-content').getAttribute('data-ci-group-id'),group.id);await part(p,5);assert((await p.locator('.readonly').innerText()).includes('before <b>literal</b>'));assert.equal(await p.locator('.readonly b').count(),0);report.groups++;
   }
   const original=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),lesson.original.course.id);assert.equal(original.custom,'sentinel');assert.equal(original.answers.before,'保留原任務');
   await p.locator('[data-ci-task="0"]').click();assert.equal(await p.locator('.ci-content').count(),0);await p.locator('[data-ci-mode="integrated"]').click();
   report.days.push(lesson.day);console.log('Day '+lesson.day+' passed all groups and paths.');
  }
  // Representative layouts exercise both source renderers, every part, popup,
  // disclosures, large type, checked goals, keyboard focus and disabled choices.
  for(const day of [1,6,9,11]){const lesson=lessons.find(l=>l.day===day);for(const theme of ['light','dark'])for(const width of [390,820,1280]){
   await p.setViewportSize({width,height:900});await p.goto(lesson.url+'#chapter-'+lesson.data.groups[0].id);
   await p.evaluate(theme=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size','large');},theme);await p.reload();
   for(const n of [0,1,2,3,4,5,6]){await part(p,n);if(n===1){const swap=p.locator('.study-inline-changes summary').first();if(await swap.count())await swap.click();}if(n===4){await p.locator('.d5-teacher-guide summary').click();await p.locator('.d5-student-hint summary').first().click();await p.locator('[data-ci-goal]').first().check();}await bounds(p,`${day}/${theme}/${width}/${n}`);}
   await p.locator('#dg-menu-open').click();await p.locator('#nav [data-ci-section="1"]').hover();await p.keyboard.press('Tab');await bounds(p,'menu');if(width===390||width===1280)await shot(p,`menu-d${day}-${theme}-${width}`);await p.keyboard.press('Escape');
  }}
  await p.setViewportSize({width:1280,height:900});await p.goto(lessons.find(l=>l.day===6).url+'#chapter-drink');await part(p,1);await shot(p,'study-drink-dark');await part(p,2);await shot(p,'flow-drink-locked');await part(p,4);await p.locator('.d5-teacher-guide summary').click();await shot(p,'teacher-drink-dark');
  // A blocked persistence API must leave practice available and show a notice.
  const blocked=await browser.newContext();await blocked.addInitScript(()=>{Storage.prototype.getItem=function(){throw Error('blocked');};Storage.prototype.setItem=function(){throw Error('blocked');};});const bp=await blocked.newPage();await bp.goto(lessons[0].url+'#chapter-route-help');assert(await bp.locator('#ci-save-notice').isVisible());await part(bp,2);assert(await bp.locator('[data-ci-next]').isVisible());await blocked.close();
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,screenshots:report.screenshots.length},null,2));
 }finally{await browser.close();}
})().catch(e=>{fs.writeFileSync(path.join(out,'failure.txt'),e.stack);console.error(e);process.exitCode=1;});
