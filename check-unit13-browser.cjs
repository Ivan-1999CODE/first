const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 fs.mkdirSync('qa-day13',{recursive:true});
 await page.goto(require('url').pathToFileURL(path.resolve('travel-english-unit13-why-which.html')).href);
 const nav=async n=>{if(await page.locator('#courseMenu>summary').isVisible()&&await page.locator('#courseMenu').getAttribute('open')===null)await page.locator('#courseMenu>summary').click();await page.locator(`#nav [data-page="${n}"]`).click();};
 assert.equal(await page.locator('.day-switcher [aria-current="page"]').innerText(),'第 13 天\n一起決定去哪裡');
 await page.screenshot({path:'qa-day13/home-desktop.png',fullPage:true});
 await page.locator('#field-before').fill('Museum. Hot. Bus.');
 await nav(1);await page.locator('[data-mode="reply"]').click();await page.locator('[data-reply="5"]').first().click();assert.equal(await page.locator('#main details[open]').count(),0);assert(await page.locator('#main').innerText().then(t=>t.includes('6 / 6')));
 await nav(2);assert(await page.locator('[data-choice="0"]').isDisabled());
 for(const [index,c] of [1,0,1,0,0,0,1,1,0].entries()){
  await page.locator('#heard').check();await page.locator('#spoken').check();
  if(index===6){await page.locator('[data-choice="0"]').click();assert(await page.locator('[data-act="next"]').isDisabled());}
  await page.locator(`[data-choice="${c}"]`).click();
  if(index===7)await page.screenshot({path:'qa-day13/itinerary-light.png',fullPage:true});
  await page.locator('[data-act="next"]').click();
 }
 assert((await page.locator('#main').innerText()).includes('流程完成'));
 assert((await page.locator('.itinerary').innerText()).includes('計程車'));
 assert((await page.locator('.itinerary').innerText()).includes('桌上有一杯茶'));
 await nav(3);await page.locator('#field-mission-rain').fill('It is raining. Museum?');await page.locator('[data-mission="1"]').click();await page.locator('#field-mission-tired').fill('I am tired. Bus?');
 await nav(4);await page.locator('[data-pair-check="plan:0"]').check();await page.locator('.teacher>summary').click();await page.screenshot({path:'qa-day13/teacher-light.png',fullPage:true});await page.locator('[data-pair="1"]').click();assert.equal(await page.locator('.teacher').getAttribute('open'),null);
 await nav(5);await page.locator('#field-after').fill('The museum, please. Because it is hot. Why don’t we take the bus?');assert((await page.locator('.readonly').innerText()).includes('Museum. Hot. Bus.'));
 for(const [id,n] of [['choose',1],['reason',2],['suggest',3]])await page.locator(`[data-rating="${id}:${n}"]`).click();
 assert.equal(await page.locator('.meter .yellow').count(),3);assert.equal(await page.locator('.meter .green').count(),3);
 await nav(6);await page.locator('[data-quiz="reason:0"]').click();assert((await page.locator('#main').innerText()).includes('再聽一次'));await page.locator('[data-quiz="reason:1"]').click();await page.locator('#field-home').fill('Why don’t we take a taxi?');await page.locator('[data-home="written"]').check();
 await page.locator('#theme').click();await page.locator('#large').click();await page.reload();assert.equal(await page.locator('#field-before').inputValue(),'Museum. Hot. Bus.');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('html').getAttribute('data-size'),'large');assert((await page.locator('#main').innerText()).includes('1 / 1 已練習'));
 await nav(3);assert.equal(await page.locator('#field-mission-rain').inputValue(),'It is raining. Museum?');await nav(4);assert(await page.locator('[data-pair-check="plan:0"]').isChecked());await page.locator('.teacher>summary').click();await page.screenshot({path:'qa-day13/teacher-dark.png',fullPage:true});await nav(5);assert.equal(await page.locator('.meter .green').count(),3);await page.screenshot({path:'qa-day13/progress-dark.png',fullPage:true});
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:1000});for(let n=0;n<7;n++){await nav(n);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${width} part ${n+1}`);}}
 await page.setViewportSize({width:390,height:844});await nav(0);await page.screenshot({path:'qa-day13/home-mobile-dark-large.png',fullPage:true});await nav(1);await page.locator('[data-mode="library"]').click();await page.screenshot({path:'qa-day13/phrases-mobile.png',fullPage:true});
 await page.locator('#theme').click();await nav(2);await page.locator('#heard').focus();await page.keyboard.press('Space');await page.locator('#spoken').focus();await page.keyboard.press('Space');assert(!(await page.locator('[data-choice="0"]').isDisabled()));await page.screenshot({path:'qa-day13/scene-mobile-light-large.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS browser: full route, closed café retry, all seven parts at four widths, independent saved fields, file URL reload, theme and text size, keyboard gates, screenshots.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
