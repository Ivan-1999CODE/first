const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const day of [1,2]){
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));const dir=`qa-day${day}`;fs.mkdirSync(dir,{recursive:true});
 const file=day===1?'travel-english.html':'travel-english-unit2-shopping.html';
 await page.goto(require('url').pathToFileURL(path.resolve(file)).href);
 const nav=async n=>{const menu=page.locator('#courseMenu');if(await menu.locator('summary').first().isVisible()&&!await menu.evaluate(e=>e.open))await menu.locator('summary').first().click();await page.locator(`#nav [data-page="${n}"]`).click();};
 const shot=async name=>{await page.evaluate(()=>scrollTo(0,0));return page.screenshot({path:`${dir}/${name}.png`,fullPage:true});};
 const gate=async()=>{const first=await page.locator('#spoken').isDisabled()?'heard':'spoken',second=first==='heard'?'spoken':'heard';await page.locator('#'+first).check();await page.locator('#'+second).check();};
 const step=async n=>{await gate();await page.locator(`[data-choice="${n}"]`).click();await page.locator('[data-act="next"]').click();};
 await shot('home-desktop');await page.locator('#field-before').fill('My first try');
 await nav(1);await shot('phrases-light');await page.locator('[data-mode="reply"]').click();const last=await page.evaluate(()=>replies.length-1);await page.locator(`[data-reply="${last}"]`).first().click();assert.equal(await page.locator('#main details[open]').count(),0);assert.equal(await page.locator(`[data-reply="${last+1}"]`).count(),0);
 for(let i=0;i<=last;i++){
  await page.locator(`.workshop-picker [data-reply="${i}"]`).click();
  assert.equal(await page.locator('.workshop-card').count(),1);
  assert.equal(await page.locator('.workshop-role svg').count(),1);
  assert.equal(await page.locator('.workshop-count').innerText(),`${i+1} / ${last+1}`);
  assert.equal(await page.locator('.workshop-remix').count(),1);
  assert.equal(await page.locator('.workshop-answer details[open]').count(),0);
 }
 await shot('reply-workshop-light');
 await page.setViewportSize({width:390,height:1000});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const question=await page.locator('.workshop-question').boundingBox(),answer=await page.locator('.workshop-answer').boundingBox();assert(answer.y>=question.y+question.height-1);
 await shot('reply-workshop-mobile');await page.setViewportSize({width:1440,height:1000});
 await nav(2);assert(await page.locator('[data-choice="0"]').isDisabled());await step(0);await gate();await page.locator(`[data-choice="${day===1?0:1}"]`).click();assert(await page.locator('[data-act="next"]').isDisabled());await page.locator(`[data-choice="${day===1?1:0}"]`).click();await page.locator('[data-act="next"]').click();await step(day===1?0:1);await shot('scene-light');await step(day===1?0:1);await step(0);assert((await page.locator('#main').innerText()).includes('流程完成'));if(day===2)assert((await page.locator('.scene-state').innerText()).includes('不需付款'));
 await nav(3);const firstMission=await page.evaluate(()=>missions[0].id);await page.locator(`#field-mission-${firstMission}`).fill('First situation');await page.locator('[data-mission="1"]').click();const secondMission=await page.evaluate(()=>missions[1].id);await page.locator(`#field-mission-${secondMission}`).fill('Second situation');await page.locator('[data-mission="0"]').click();assert.equal(await page.locator(`#field-mission-${firstMission}`).inputValue(),'First situation');
 await nav(4);const pairId=await page.evaluate(()=>pairs[0].id);await page.locator(`[data-pair-check="${pairId}:0"]`).check();await page.locator(`#field-note-${pairId}`).fill('A real sentence');await page.locator('details.teacher>summary').click();await shot('teacher-light');await page.locator('[data-pair="1"]').click();assert.equal(await page.locator('details.teacher[open]').count(),0);assert.equal(await page.locator('[data-pair-check]').first().isChecked(),false);
 await nav(5);assert((await page.locator('.readonly').first().innerText()).includes('My first try'));await page.locator('#field-after').fill('My new answer');const skills=await page.evaluate(()=>course.skills.map(s=>s.id));for(let i=0;i<3;i++)await page.locator(`[data-rating="${skills[i]}:${i+1}"]`).click();assert.equal(await page.locator('.meter .yellow').count(),3);assert.equal(await page.locator('.meter .green').count(),3);await shot('progress-light');await page.locator(`[data-rating="${skills[2]}:1"]`).click();assert.equal(await page.locator('.meter .green').count(),0);
 await nav(6);const q=await page.evaluate(()=>quizzes[0]);await page.locator(`[data-quiz="${q.id}:${(q.correct+1)%q.options.length}"]`).click();assert((await page.locator('#main').innerText()).includes('再聽一次'));await page.locator(`[data-quiz="${q.id}:${q.correct}"]`).click();await page.locator('#field-home').fill('Homework');await page.locator('[data-home="spoken"]').check();
 await page.locator('#theme').click();await page.locator('#large').click();await page.reload();assert.equal(await page.locator('#field-before').inputValue(),'My first try');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('html').getAttribute('data-size'),'large');
 await nav(4);assert(await page.locator(`[data-pair-check="${pairId}:0"]`).isChecked());assert.equal(await page.locator(`#field-note-${pairId}`).inputValue(),'A real sentence');await page.locator('details.teacher>summary').click();await shot('teacher-dark');await nav(5);assert.equal(await page.locator('#field-after').inputValue(),'My new answer');await shot('progress-dark');await nav(6);assert.equal(await page.locator('#field-home').inputValue(),'Homework');assert(await page.locator('[data-home="spoken"]').isChecked());
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:1000});for(let p=0;p<7;p++){await nav(p);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Day ${day} overflow ${width} part ${p}`);if(width===390)await shot('mobile-dark-large-'+p);}}
 await page.setViewportSize({width:1440,height:1000});await nav(1);await page.locator('[data-mode="library"]').click();await shot('phrases-dark');await nav(2);await page.locator('[data-start="0"]').first().click();await step(0);await shot('scene-dark');
 assert.deepEqual(errors,[]);await page.close();console.log(`Day ${day}: Edge file:// interactions, persistence and responsive checks passed.`);
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
