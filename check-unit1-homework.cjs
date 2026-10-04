const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('travel-english.html')).href);
  await page.locator('#field-before').fill('PRIVATE STUDENT NOTE <script>');
  await page.evaluate(()=>{roundsDone=['A','B','C'];persistRound();});
  const baseline=await page.evaluate(()=>({...localStorage}));
  await page.locator('[data-homework-open]').click();
  const dialog=page.locator('.homework-dialog'),print=page.locator('#homework-print');
  const output='tmp/pdfs/day1-homework-qa';fs.mkdirSync(output,{recursive:true});
  const ready=()=>page.waitForFunction(()=>!document.querySelector('#homework-print').disabled);
  await ready();
  assert.deepEqual(await dialog.locator('input:checked').evaluateAll(els=>els.map(e=>e.value)),['A']);
  for(const ids of [['A'],['B'],['C'],['A','B'],['A','C'],['B','C'],['A','B','C']]){
   for(const id of ['A','B','C'])await dialog.locator(`input[value="${id}"]`).setChecked(ids.includes(id));
   await ready();
   const content=await page.locator('#homework-preview').contentFrame().locator('body').innerText();
   assert(!content.includes('PRIVATE STUDENT NOTE'));
   assert.equal(await page.locator('#homework-preview').contentFrame().locator('.task').count(),3);
   if(ids.join('')==='B'){assert(content.includes('Can I walk there?'));assert(content.includes('Thank you for your help.'));assert(!content.includes('Can you tell me where the bank is?'));}
   if(ids.join('')==='C'){assert(content.includes('Could you say that again?'));assert(!content.includes('Can I take a bus?'));}
   const hints=await page.locator('#homework-preview').contentFrame().locator('.hint-row b').allTextContents();
   assert.equal(new Set(hints).size,hints.length);
   const sheet=await browser.newPage();
   await sheet.setContent(await page.locator('#homework-preview').getAttribute('srcdoc'));
   await sheet.emulateMedia({media:'print'});
   await sheet.pdf({path:`${output}/${ids.join('')}.pdf`,preferCSSPageSize:true,printBackground:true});
   await sheet.close();
  }
  await dialog.locator('#homework-date').fill('2026-09-24');await ready();
  assert((await page.locator('#homework-preview').contentFrame().locator('.meta').first().innerText()).includes('2026-09-24'));
  for(const id of ['A','B','C'])await dialog.locator(`input[value="${id}"]`).uncheck();
  assert(await print.isDisabled());assert(await page.locator('#homework-preview').isHidden());
  await dialog.locator('input[value="B"]').check();await ready();
  await page.locator('#homework-preview').contentFrame().locator('body').evaluate(()=>{window.print=()=>{document.body.dataset.printCalled='yes';};});
  await print.click();assert.equal(await page.locator('#homework-preview').contentFrame().locator('body').getAttribute('data-print-called'),'yes');
  // Selection/export must not mutate course answers or completed rounds.
  assert.deepEqual(await page.evaluate(()=>({...localStorage})),baseline);
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  assert(await page.locator('[data-homework-open]').evaluate(el=>el===document.activeElement));
  await page.locator('[data-focus-round="2"]').first().click();await page.locator('[data-homework-open]').click();await ready();
  assert.deepEqual(await dialog.locator('input:checked').evaluateAll(els=>els.map(e=>e.value)),['C']);
  for(const theme of ['light','dark'])for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:1000});
   await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';appearance();},theme);
   assert(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1),`dialog overflow ${width} ${theme}`);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert(await page.locator('#homework-preview').contentFrame().locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(width!==320)await page.screenshot({path:`${output}/dialog-${theme}-${width}.png`,fullPage:true});
  }
  await dialog.locator('[data-homework-close]').click();
  await page.reload();assert.equal(await page.locator('#field-before').inputValue(),'PRIVATE STUDENT NOTE <script>');
  assert.deepEqual(errors,[]);
  console.log('PASS: 7 round combinations, 3 tasks each, prerequisite phrases, deduplication, date, empty selection, print action, Esc/focus, saved state unchanged, responsive light/dark/large text.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
