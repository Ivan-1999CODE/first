const {chromium}=require('playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));fs.mkdirSync('qa-day12',{recursive:true});
 await page.goto(require('url').pathToFileURL(path.resolve('travel-english-unit12-how.html')).href);
 const nav=async i=>{const menu=page.locator('#courseMenu');if(await menu.evaluate(e=>!e.open))await menu.locator(':scope>summary').click();await page.locator(`#nav [data-page="${i}"]`).click();};
 const step=async c=>{await page.locator('#heard').check();await page.locator('#spoken').check();await page.locator(`[data-choice="${c}"]`).click();await page.locator('[data-act="next"]').click();};
 assert.equal(await page.locator('.day-switcher a small:visible').count(),fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f)).length);
 assert.equal(await page.locator('.day-switcher a[aria-current=page]').getAttribute('href'),'travel-english-unit12-how.html');
 await page.screenshot({path:'qa-day12/home-desktop.png',fullPage:true});
 await page.locator('#field-before').fill('How about museum?');
 await page.locator('#theme').click();await page.locator('#large').click();await page.reload();
 assert.equal(await page.locator('#field-before').inputValue(),'How about museum?');
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('html').getAttribute('data-size'),'large');
 for(const width of [1440,1024,768,390,320]){await page.setViewportSize({width,height:1000});for(let i=0;i<7;i++){await nav(i);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${width} part ${i+1}`);}}
 await page.setViewportSize({width:1440,height:1000});await nav(1);
 assert.equal(await page.locator('.phrase-grid article').count(),16);assert.equal(await page.locator('#main details[open]').count(),0);
 await page.screenshot({path:'qa-day12/phrases-dark-large.png',fullPage:true});
 await page.locator('[data-mode="reply"]').click();await page.locator('[data-reply="4"]').first().click();assert.equal(await page.locator('#main details[open]').count(),0);
 await page.locator('#main summary').first().click();assert((await page.locator('#main details[open]').innerText()).includes('How many tickets'));
 await page.locator('[data-reply="7"]').first().click();assert.equal(await page.locator('#main details[open]').count(),0);assert(await page.locator('#main').getByRole('button',{name:'進入互動流程 →',exact:true}).isVisible());
 await nav(2);await page.locator('[data-start="0"]').first().click();assert(await page.locator('[data-choice="0"]').isDisabled());assert(await page.locator('#spoken').isDisabled());
 await page.locator('#heard').check();assert(await page.locator('[data-choice="0"]').isDisabled());await page.locator('#spoken').check();await page.locator('[data-choice="1"]').click();assert((await page.locator('.trip-summary').innerText()).includes('植物園'));
 await page.locator('[data-act="next"]').click();await page.locator('#heard').check();await page.locator('#spoken').check();await page.locator('[data-choice="1"]').click();assert(await page.locator('[data-act="next"]').isDisabled());assert((await page.locator('#flowFeedback').innerText()).includes('再試一次'));
 await page.locator('[data-act="back"]').click();await step(0);assert((await page.locator('[data-say]').first().getAttribute('data-say')).includes('twelve'));
 for(const c of [0,0,0,0,0,0,1])await step(c);
 await page.screenshot({path:'qa-day12/route-dark-large.png',fullPage:true});assert.equal(await page.locator('.ticket').count(),2);
 await step(0);assert((await page.locator('#main').innerText()).includes('24 元'));assert((await page.locator('#main').innerText()).includes('流程完成'));
 await page.locator('#theme').click();await page.locator('#large').click();await page.screenshot({path:'qa-day12/tickets-light.png',fullPage:true});
 await page.locator('[data-start="1"]').first().click();for(const c of [0,1,0,0])await step(c);assert((await page.locator('#main').innerText()).includes('咖啡廳 · 步行 3 分鐘'));
 await nav(3);await page.locator('#field-mission-limited').fill('How long does it take?');await page.locator('[data-mission="1"]').click();await page.locator('#field-mission-budget').fill('How about the park?');await page.locator('[data-mission="0"]').click();assert.equal(await page.locator('#field-mission-limited').inputValue(),'How long does it take?');
 await nav(4);assert.equal(await page.locator('.teacher[open]').count(),0);await page.locator('[data-pair-check="plan:0"]').check();await page.locator('#field-note-plan').fill('How about visiting the museum?');await page.locator('.teacher>summary').click();await page.screenshot({path:'qa-day12/teacher-light.png',fullPage:true});
 await page.locator('[data-pair="1"]').click();assert.equal(await page.locator('.teacher[open]').count(),0);assert.equal(await page.locator('#field-note-bus').inputValue(),'');assert.equal(await page.locator('[data-pair-check="bus:0"]').isChecked(),false);
 await page.locator('#theme').click();await page.locator('.teacher>summary').click();await page.screenshot({path:'qa-day12/teacher-dark.png',fullPage:true});
 await nav(5);await page.locator('#field-after').fill('How about visiting the museum? How do we get there? How long does it take?');assert.equal(await page.locator('.readonly').innerText(),'How about museum?');
 for(const [id,n] of [['connect',1],['route',2],['time',3]])await page.locator(`[data-rating="${id}:${n}"]`).click();assert.equal(await page.locator('.meter .yellow').count(),3);assert.equal(await page.locator('.meter .green').count(),3);await page.screenshot({path:'qa-day12/progress-dark.png',fullPage:true});await page.locator('[data-rating="time:1"]').click();assert.equal(await page.locator('.meter .green').count(),0);
 await page.locator('#theme').click();await page.screenshot({path:'qa-day12/progress-light.png',fullPage:true});
 await nav(6);await page.locator('[data-quiz="frequency:0"]').click();assert((await page.locator('#main').innerText()).includes('再聽一次'));await page.locator('[data-quiz="frequency:1"]').click();assert((await page.locator('#main').innerText()).includes('✓ every ten minutes'));await page.locator('#field-home').fill('Three adult tickets, please.');await page.locator('[data-home="spoken"]').check();
 await page.reload();assert((await page.locator('#main').innerText()).includes('2 / 2 已練習'));await nav(3);assert.equal(await page.locator('#field-mission-limited').inputValue(),'How long does it take?');await nav(4);assert(await page.locator('[data-pair-check="plan:0"]').isChecked());assert.equal(await page.locator('#field-note-plan').inputValue(),'How about visiting the museum?');await nav(5);assert((await page.locator('#field-after').inputValue()).includes('How long'));await nav(6);assert(await page.locator('[data-home="spoken"]').isChecked());
 // Expanded content and large text must remain reachable on phones.
 await page.setViewportSize({width:390,height:844});await page.locator('#large').click();await page.locator('#theme').click();
 for(const i of [1,2,4,5]){await nav(i);if(i===1){await page.locator('[data-mode="library"]').click();await page.locator('summary').filter({hasText:'補充工具箱'}).click();}if(i===4)await page.locator('.teacher>summary').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`expanded mobile ${i}`);await page.screenshot({path:`qa-day12/mobile-part${i+1}.png`,fullPage:true});}
 await nav(0);await page.screenshot({path:'qa-day12/home-mobile-dark-large.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#large').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 // Explicit text fallback with browser speech unavailable.
 await page.addInitScript(()=>{Object.defineProperty(window,'speechSynthesis',{value:undefined});});await page.reload();await nav(1);await page.locator('[data-say]').first().click();assert((await page.locator('#toast').innerText()).includes('無法朗讀'));
 assert.deepEqual(errors,[]);
 console.log('PASS: Edge browser; all seven sections at five widths, light/dark and large text, hidden hints, both flows with retry/backtracking, independent persistence, ratings, mobile expanded content, audio fallback, no page errors.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
