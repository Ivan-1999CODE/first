const {chromium}=require('playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));fs.mkdirSync('qa-day14',{recursive:true});
 const url=require('url').pathToFileURL(path.resolve('travel-english-unit14-travel-questions.html')).href;
 await page.goto(url);
 const nav=async n=>{if(await page.locator('#courseMenu>summary').isVisible()&&!(await page.locator('#courseMenu').evaluate(e=>e.open)))await page.locator('#courseMenu>summary').click();await page.locator(`#nav [data-page="${n}"]`).click();};
 const gate=async()=>{const first=await page.locator('#spoken').isDisabled()?'heard':'spoken',second=first==='heard'?'spoken':'heard';await page.locator('#'+first).check();await page.locator('#'+second).check();};
 const step=async c=>{await gate();await page.locator(`[data-choice="${c}"]`).click();await page.locator('[data-act="next"]').click();};
 const shot=async name=>page.screenshot({path:'qa-day14/'+name+'.png',fullPage:true});
 assert.equal(await page.locator('.day-switcher a[aria-current="page"]').innerText(),'第 14 天\n問地點、時間與人物');
 assert.equal(await page.locator('.day-switcher a').count(),fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f)).length);
 await shot('home-desktop');
 await page.locator('#field-before').fill('Where meet? When leave? Who guide?');
 await nav(1);assert.equal(await page.locator('#main .grid article').count(),14);
 await page.locator('[data-mode="reply"]').click();await page.locator('[data-reply="3"]').first().click();assert.equal(await page.locator('#main details[open]').count(),0);
 await page.locator('[data-reply="6"]').first().click();assert.equal(await page.locator('[data-reply="7"]').count(),0);assert((await page.locator('#main').innerText()).includes('7 / 7'));
 await nav(2);assert(await page.locator('[data-choice="0"]').isDisabled());await step(1);
 assert(await page.locator('#heard').isDisabled());assert.equal(await page.locator('[data-say]').count(),2); // only the hidden hint answer until the student asks
 await page.locator('#spoken').check();await page.locator('#heard').check();await page.locator('[data-choice="0"]').click();assert(await page.locator('[data-act="next"]').isDisabled());assert((await page.locator('#flowFeedback').innerText()).includes('再試一次'));
 await page.locator('[data-choice="1"]').click();await shot('museum-meeting');await page.locator('[data-act="next"]').click();
 await step(2);await step(1);await step(2);assert((await page.locator('.tour-card').innerText()).includes('Ben'));await step(0);
 assert((await page.locator('#main').innerText()).includes('流程完成'));assert((await page.locator('.tour-card').innerText()).includes('14:00'));
 await page.locator('[data-start="0"]').first().click();await step(0);await step(0);await step(1);
 // Rewind from guide to destination, then change branches.
 for(let i=0;i<3;i++)await page.locator('[data-act="back"]').click();await step(1);
 assert((await page.locator('.tour-card').innerText()).includes('待詢問'));await page.locator('#spoken').check();await page.locator('#heard').check();await page.locator('[data-choice="1"]').click();await page.locator('#spoken').uncheck();assert(await page.locator('#heard').isDisabled());assert(await page.locator('[data-act="next"]').isDisabled());
 await page.locator('[data-start="1"]').first().click();for(const c of [2,2,1,0])await step(c);await shot('changed-card');
 await nav(3);await page.locator('#field-mission-close').fill('When do you close today?');await page.locator('[data-mission="3"]').click();await page.locator('#field-mission-phone').fill('Who is calling, please?');await page.locator('[data-mission="0"]').click();assert.equal(await page.locator('#field-mission-close').inputValue(),'When do you close today?');
 await nav(4);assert.equal(await page.locator('details.teacher[open]').count(),0);await page.locator('[data-pair-check="plan:0"]').check();await page.locator('#field-note-plan').fill('Where do we meet?');await page.locator('details.teacher>summary').click();await shot('teacher-light');await page.locator('[data-pair="1"]').click();assert.equal(await page.locator('details.teacher[open]').count(),0);assert.equal(await page.locator('[data-pair-check="change:0"]').isChecked(),false);await page.locator('[data-pair-check="change:1"]').check();
 await nav(5);assert((await page.locator('.readonly').innerText()).includes('Where meet?'));await page.locator('#field-after').fill('Where do we meet? When do we leave? Who is our guide?');
 await page.locator('[data-rating="where:1"]').click();await page.locator('[data-rating="when:2"]').click();await page.locator('[data-rating="who:3"]').click();assert.equal(await page.locator('.meter .yellow').count(),3);assert.equal(await page.locator('.meter .green').count(),3);await shot('progress-light');await page.locator('[data-rating="who:1"]').click();assert.equal(await page.locator('.meter .green').count(),0);
 await nav(6);await page.locator('[data-quiz="meeting:0"]').click();assert((await page.locator('#main').innerText()).includes('再聽一次'));await page.locator('[data-quiz="meeting:1"]').click();assert((await page.locator('#main').innerText()).includes('✓ hotel lobby'));await page.locator('#field-home').fill('At ten. Ben is our guide.');for(const key of ['listen','written','spoken'])await page.locator(`[data-home="${key}"]`).check();
 await page.locator('#theme').click();await page.locator('#large').click();await page.reload();assert.equal(await page.locator('#field-before').inputValue(),'Where meet? When leave? Who guide?');assert((await page.locator('#main').innerText()).includes('2 / 2 已練習'));assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('html').getAttribute('data-size'),'large');
 await nav(4);assert(await page.locator('[data-pair-check="plan:0"]').isChecked());assert.equal(await page.locator('#field-note-plan').inputValue(),'Where do we meet?');await page.locator('details.teacher>summary').click();await shot('teacher-dark-large');
 await nav(5);assert.equal(await page.locator('#field-after').inputValue(),'Where do we meet? When do we leave? Who is our guide?');await shot('progress-dark-large');await nav(6);assert.equal(await page.locator('#field-home').inputValue(),'At ten. Ben is our guide.');assert(await page.locator('[data-home="spoken"]').isChecked());
 for(const width of [1440,1024,768,390,320]){await page.setViewportSize({width,height:1000});for(let i=0;i<7;i++){await nav(i);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${width} part ${i+1}`);if(width<=1100)assert.equal(await page.locator('#courseMenu').getAttribute('open'),null);if(width===390)await shot('mobile-dark-large-'+i);} }
 await page.setViewportSize({width:1440,height:1000});await page.locator('#large').click();await nav(1);await page.locator('[data-mode="library"]').click();await shot('phrases-dark');await nav(2);await page.locator('[data-start="0"]').first().click();await step(0);await shot('scene-dark');
 // Keyboard activation and voice configuration are observable without claiming audible QA.
 await page.locator('#theme').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
 await page.evaluate(()=>{window.__voice=[];window.speechSynthesis.speak=u=>window.__voice.push({text:u.text,lang:u.lang,rate:u.rate});});await nav(1);await page.locator('[data-mode="library"]').click();await page.locator('[data-say]').first().click();await page.locator('[data-slow]').first().click();const voice=await page.evaluate(()=>window.__voice);assert.equal(voice.length,2);assert.equal(voice[0].lang,'en-US');assert(voice[1].rate<voice[0].rate);assert.equal(voice[0].text,voice[1].text);
 // Storage and speech being unavailable must not prevent completing the text route.
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{Storage.prototype.getItem=function(){throw Error('blocked')};Storage.prototype.setItem=function(){throw Error('blocked')};Object.defineProperty(window,'speechSynthesis',{value:undefined});});await fallback.goto(url);assert(await fallback.locator('#storageNotice').isVisible());await fallback.locator('[data-start="0"]').click();await fallback.locator('[data-say]').first().click();assert((await fallback.locator('#toast').innerText()).includes('無法朗讀'));await fallback.close();
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: Edge file://; both destinations and change flow; gates/retry/backtrack; all saved fields and appearance; teachers/ratings/homework; seven pages at five widths; keyboard, voice configuration, storage/audio fallback; no page errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
