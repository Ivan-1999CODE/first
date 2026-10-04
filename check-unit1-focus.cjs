const fs=require('fs'),assert=require('assert/strict'),path=require('path');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const data=require('./assets/day1-focus-data.cjs'),original=require('./assets/day1-2-data.cjs')[0];
assert.deepEqual(data.phrases,original.phrases);
assert.deepEqual(data.rounds.flatMap(r=>r.phraseIds).sort(),data.phrases.map(p=>p.id).sort());
assert(data.rounds.every(r=>r.phraseIds.length>=3&&r.phraseIds.length<=5));
const old={answers:{before:'Original first try',after:'Original later try','mission-need-0':'Old postcard answer','note-station':'Original pair note',home:'Original homework'},checks:{station:[true,false,true]},ratings:{ask:3},complete:['station']};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(({key,old})=>{if(!localStorage.getItem('qa-focus-seeded')){localStorage.setItem(key,JSON.stringify(old));localStorage.setItem('qa-focus-seeded','yes');}}, {key:original.course.id,old});
 await p.goto(require('url').pathToFileURL(path.resolve('travel-english.html')).href);
 const nav=async n=>{const menu=p.locator('#courseMenu'),summary=menu.locator('summary').first();if(await summary.isVisible()&&!await menu.evaluate(e=>e.open))await summary.click();await p.locator(`#nav [data-page="${n}"]`).click();};
 const footer=()=>p.locator('#main > .footer-actions > button').last();
 const gate=async()=>{const first=await p.locator('#spoken').isDisabled()?'heard':'spoken';await p.locator('#'+first).check();await p.locator(first==='heard'?'#spoken':'#heard').check();};
 assert.equal(await p.locator('#nav button').count(),7);assert.equal(await p.locator('#field-before').inputValue(),'Original first try');
 await p.locator('#field-before').fill('My new first try');
 fs.mkdirSync('qa-unit1-focus',{recursive:true});await p.screenshot({path:'qa-unit1-focus/home.png',fullPage:true});
 await p.locator('[data-focus-round="0"]').first().click();
 for(let r=0;r<data.rounds.length;r++){
  assert.equal(await p.evaluate(()=>focusRound),r);assert.equal(await p.evaluate(()=>page),1);
  assert.equal(await p.locator('.focus-phrase:visible').count(),data.rounds[r].phraseIds.length);
  await p.locator('#allChinese').click();assert((await p.locator('#allChinese').innerText()).includes('收起'));await p.locator('#allChinese').click();
  await p.locator('[data-mode="reply"]').click();assert.equal(await p.locator('.workshop-picker button').count(),data.rounds[r].replyIds.length);
  for(const i of data.rounds[r].replyIds){await p.locator(`[data-reply="${i}"]`).first().click();assert.equal(await p.locator('.workshop-answer details[open]').count(),0);}
  await p.locator('[data-mode="library"]').click();
  await p.screenshot({path:`qa-unit1-focus/phrases-${r}.png`,fullPage:true});
  await footer().click();assert.equal(await p.evaluate(()=>page),2);
  for(let i=0;i<data.flows[r].steps.length;i++){
   const t=data.flows[r].steps[i];assert(await p.locator('[data-choice]').first().isDisabled());await gate();
   const wrong=t.objects.findIndex((_,j)=>!t.valid.includes(j));if(wrong>=0){await p.locator(`[data-choice="${wrong}"]`).click();assert(await p.locator('[data-act="next"]').isDisabled());}
   await p.locator(`[data-choice="${t.valid[0]}"]`).click();
   if(t.position)assert((await p.locator('.scene-state').innerText()).includes(t.position[2]));
   if(i===0){await p.locator('#spoken').uncheck();assert(await p.locator('[data-act="next"]').isDisabled());await gate();await p.locator(`[data-choice="${t.valid[0]}"]`).click();}
   await p.locator('[data-act="next"]').click();
  }
  assert((await p.locator('#main').innerText()).includes('流程完成'));await footer().click();
  for(const idx of data.rounds[r].missionIds){assert.equal(await p.evaluate(()=>mission),idx);assert.equal(await p.locator('#main .grid details[open]').count(),0);await p.locator(`[data-field="mission-${data.missions[idx].id}"]`).fill(`round ${r} mission ${idx}`);await footer().click();}
  assert.equal(await p.evaluate(()=>page),4);
  for(const idx of data.rounds[r].pairIds){assert.equal(await p.evaluate(()=>pair),idx);const id=data.pairs[idx].id;await p.locator(`[data-pair-check="${id}:0"]`).check();await p.locator(`#field-note-${id}`).fill(`pair ${id}`);await p.locator('details.teacher>summary').click();await p.screenshot({path:`qa-unit1-focus/teacher-${id}.png`,fullPage:true});await footer().click();}
 }
 assert.equal(await p.evaluate(()=>page),5);assert.deepEqual(await p.evaluate(()=>roundsDone),['A','B','C']);
 await p.locator('details').filter({has:p.locator('summary', {hasText:'改版前的第一天紀錄'})}).locator('summary').first().click();assert((await p.locator('#main').innerText()).includes('Old postcard answer'));
 await p.locator('#field-after').fill('My new later try');await p.locator('[data-rating="ask:3"]').click();assert.equal(await p.locator('.meter .green').count(),3);await p.locator('[data-rating="ask:1"]').click();assert.equal(await p.locator('.meter .green').count(),0);
 await p.reload();assert.equal(await p.locator('#field-before').inputValue(),'My new first try');assert.deepEqual(await p.evaluate(()=>roundsDone),['A','B','C']);
 for(let r=0;r<3;r++){await p.locator(`[data-focus-round="${r}"]`).first().click();await nav(3);assert.equal(await p.locator('[data-field]').inputValue(),`round ${r} mission ${r*2}`);await nav(4);assert(await p.locator('[data-pair-check]').first().isChecked());await nav(0);}
 assert.deepEqual(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),original.course.id),old);
 await p.locator('[data-focus-round="1"]').first().click();await footer().click();await gate();await p.locator('[data-choice="0"]').click();await p.locator('[data-act="next"]').click();await p.locator('[data-act="back"]').click();assert.equal(await p.evaluate(()=>history.length),0);assert(await p.locator('[data-choice]').first().isDisabled());
 for(const theme of ['light','dark'])for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.size='large';appearance();return new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)));},theme);for(let r=0;r<3;r++){await nav(1);await p.locator(`[data-focus-round="${r}"]`).first().click();for(let n=1;n<=4;n++){await nav(n);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${theme} ${width} ${r} ${n}`);if(width===390&&r===1&&(n===1||n===2))await p.screenshot({path:`qa-unit1-focus/${theme}-mobile-${n}.png`,fullPage:true});}}}
 await nav(6);await p.locator('[data-quiz="route:0"]').click();assert((await p.locator('#main').innerText()).includes('再聽一次'));await p.locator('[data-quiz="route:1"]').click();await p.locator('[data-home="spoken"]').check();await p.reload();await nav(6);assert(await p.locator('[data-home="spoken"]').isChecked());
 const legacy=await browser.newPage();await legacy.addInitScript(()=>localStorage.setItem('travel-lab-unit1-v2',JSON.stringify({before:'Earlier version attempt',after:'Earlier answer'})));await legacy.goto(require('url').pathToFileURL(path.resolve('travel-english.html')).href);assert.equal(await legacy.locator('#field-before').inputValue(),'Earlier version attempt');await legacy.close();
 assert.deepEqual(errors,[]);console.log('PASS: all 13 original phrases; 3 full round cycles; retry, cancel, back; 6 independent missions/pairs; v2/v3 records preserved; reload, ratings, homework; 96 responsive round/view states.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
