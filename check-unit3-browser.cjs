const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(require('url').pathToFileURL(path.resolve('travel-english-unit3-airport.html')).href);
 await page.locator('#before').fill('one bag, aisle please');
 const nav=async p=>{const menu=page.locator('.course-menu');if(!await menu.getAttribute('open')){if(await menu.locator('summary').isVisible())await menu.locator('summary').click();}await page.locator(`#nav [data-page="${p}"]`).click();};
 await nav(2);fs.mkdirSync('qa-day3',{recursive:true});
 await page.screenshot({path:'qa-day3/scene-desktop.png',fullPage:true});
 for(let s=0;s<3;s++){
  await page.locator(`[data-scene="${s}"]`).first().click();
  const count=await page.evaluate(()=>lessons[scene].turns.length);
  for(let t=0;t<count;t++){
   assert(await page.locator('#spoken').isDisabled());assert(await page.locator('[data-choice]').first().isDisabled());assert(await page.locator('#nextTurn').isDisabled());
   assert.equal(await page.locator('.airport-flow details[open]').count(),0);
   // Text-only path and keyboard confirmation work without audio.
   await page.locator('.airport-flow details').first().locator('summary').click();
   await page.locator('#heard').focus();await page.keyboard.press('Space');
   await page.locator('#spoken').focus();await page.keyboard.press('Space');
   const correct=await page.evaluate(()=>airportStep().correct),wrong=await page.evaluate(()=>(airportStep().correct+1)%airportStep().options.length);
   await page.locator(`[data-choice="${wrong}"]`).click();assert(await page.locator('#nextTurn').isDisabled());
   assert((await page.locator('#feedback').innerText()).includes('再試一次'));
   await page.locator(`[data-choice="${correct}"]`).focus();await page.keyboard.press('Enter');
   assert(await page.locator('#nextTurn').isEnabled());assert.equal(await page.locator('.airport-summary li').filter({hasText:'✓'}).count(),t+1);
   if(t===0){await page.locator('#heard').uncheck();assert(await page.locator('#spoken').isDisabled());assert(await page.locator('#nextTurn').isDisabled());assert.equal(await page.locator('.airport-summary li').filter({hasText:'✓'}).count(),0);await page.locator('#heard').check();await page.locator('#spoken').check();await page.locator(`[data-choice="${correct}"]`).click();}
   if(s===0&&t===3){assert((await page.locator('.airport-pass').innerText()).includes('18C'));await page.screenshot({path:'qa-day3/seat-selected.png',fullPage:true});}
   if(s===2&&t===3){assert((await page.locator('.airport-counter').innerText()).includes('包包已打開'));await page.screenshot({path:'qa-day3/bag-open.png',fullPage:true});}
   await page.locator('#nextTurn').click();
  }
  assert(await page.locator('.airport-finish').isVisible());
 }
 await page.locator('[data-scene="0"]').first().click();
 for(let i=0;i<2;i++){await page.locator('#heard').check();await page.locator('#spoken').check();await page.locator('[data-choice="0"]').click();if(i===0)await page.locator('#nextTurn').click();}
 await page.locator('[data-act="back"]').click();assert.equal(await page.locator('.airport-summary li').filter({hasText:'✓'}).count(),0);assert(await page.locator('#spoken').isDisabled());
 await page.reload();assert.equal(await page.locator('#before').inputValue(),'one bag, aisle please');assert((await page.locator('#main').innerText()).includes('3 / 3'));
 await nav(2);await page.setViewportSize({width:390,height:844});await page.locator('#large').click();
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  for(let s=0;s<3;s++){
   await page.locator(`[data-scene="${s}"]`).first().click();const count=await page.evaluate(()=>lessons[scene].turns.length);
   for(let t=0;t<count;t++){
    await page.locator('#heard').check();await page.locator('#spoken').check();const correct=await page.evaluate(()=>airportStep().correct);await page.locator(`[data-choice="${correct}"]`).click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow: ${theme} scene ${s} turn ${t}`);
    if((s===0&&t===3)||(s===2&&t===3))await page.screenshot({path:`qa-day3/mobile-${theme}-${s}-${t}.png`,fullPage:true});
    await page.locator('#nextTurn').click();
   }
  }
 }
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: 14-step airport flow, text/keyboard route, wrong-answer retries, revoked confirmations, backward invalidation, visible scene changes, persistence, 390px large text in both scene palettes, no runtime errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
