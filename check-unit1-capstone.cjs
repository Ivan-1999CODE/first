const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/day1-capstone-qa');fs.mkdirSync(out,{recursive:true});
const expected=['How do I get to the train station?','Could you say that again?','Turn left?','Could you show me on the map?','Can I walk there?','Can I take a bus?'];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const report=[];
try{
 for(const [width,height,theme,size] of [[1366,768,'light','standard'],[1024,768,'dark','large'],[768,1024,'light','large'],[390,844,'dark','large']]){
  const context=await browser.newContext({viewport:{width,height}}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({theme,size})=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size',size);},{theme,size});
  await p.goto(pathToFileURL(path.resolve('travel-english.html')).href);
  const go=async n=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${n}"]`).click();assert.equal(await p.evaluate(()=>page),n);};
  const shot=async name=>p.screenshot({path:path.join(out,`${width}-${theme}-${name}.png`),fullPage:true});
  const overflow=async()=>assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`No overflow at ${width}`);
  const capAction=action=>p.locator(`[data-cap-action="${action}"]`);
  await p.locator('#field-before-A').fill('original A answer');
  await p.locator('#dg-menu-open').click();await p.locator('[data-dg-round="2"]').click();
  await p.locator('#field-before-C').fill('original C answer');
  await go(2);await p.locator('#spoken').check();await p.locator('#heard').check();await p.locator('[data-choice="0"]').click();
  const learning=()=>p.evaluate(()=>JSON.stringify({state,flow,turn,history,choice,heard,spoken,finished,focusRound}));
  const stored=()=>p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key.startsWith('travel-lab-unit1'))));
  const before=await learning(),saved=await stored();
  assert.deepEqual(await p.evaluate(()=>roundsDone),[]);
  await p.locator('#dg-menu-open').click();
  const menu=p.locator('#nav [data-page="7"]');assert(await menu.isEnabled());await menu.scrollIntoViewIfNeeded();await menu.hover();await menu.focus();
  await p.screenshot({path:path.join(out,`${width}-${theme}-menu.png`)});
  await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open');
  await go(7);assert.deepEqual(await p.evaluate(()=>capstoneSteps.map(t=>t.answer)),expected);
  assert.equal(await p.locator('[data-dg-round][aria-pressed="true"]').count(),0);
  assert.equal(await p.locator('#nav [data-page="7"]').getAttribute('aria-current'),'step');
  for(let step=0;step<6;step++){
   assert.equal(await p.evaluate(()=>capstoneState.step),step);assert.equal(await p.locator('.cap-student').count(),1);
   assert.equal(await p.locator('[data-cap-choice]').count(),0,'Next-role controls are hidden while student speaks');
   const bounds=[];
   for(const level of [0,1,2,0]){await p.locator(`[data-cap-hint="${level}"]`).click();bounds.push((await capAction('spoken').boundingBox()).y);}
   assert(Math.max(...bounds)-Math.min(...bounds)<1,'Hint switches do not move confirmation');
   const left=await p.locator('.cap-dialogue').boundingBox(),right=await p.locator('.cap-board').boundingBox();
   assert(width<740?right.y>=left.y+left.height:Math.abs(left.y-right.y)<2,'Responsive columns');
   await overflow();if(step===0||step===5)await shot(`step${step+1}-student`);
   if(width>=1024){const action=await capAction('spoken').boundingBox();assert(action.y+action.height<=height,`Speaking control at step ${step+1} / ${width}: ${action.y+action.height}`);}
   await capAction('spoken').click();assert.equal(await p.locator('.cap-other').count(),1);
   assert(await capAction('next').isDisabled());
   assert(await p.locator('[data-cap-choice]').evaluateAll(es=>es.every(e=>e.disabled)));
   await p.locator('[data-cap-transcript]').click();
   assert.equal(await p.locator('.cap-listening .cap-pane[aria-hidden="false"] .cap-en').innerText(),await p.evaluate(()=>capstoneSteps[capstoneState.step].line));
   await p.locator('[data-cap-heard]').check();
   await p.locator('[data-cap-choice="1"]').click();assert(await capAction('next').isDisabled());
   await p.locator('[data-cap-choice="0"]').click();assert(await capAction('next').isEnabled());
   if(step===0){
    await p.locator('[data-cap-heard]').uncheck();assert(await capAction('next').isDisabled());assert.equal(await p.evaluate(()=>capstoneState.choice),null);
    await capAction('repeat').click();assert.equal(await p.locator('.cap-student').count(),1);assert.equal(await p.locator('[data-cap-hint="0"]').getAttribute('aria-pressed'),'true');
    await capAction('spoken').click();await p.locator('[data-cap-heard]').check();await p.locator('[data-cap-choice="0"]').click();
   }
   if(step===3||step===5){assert.equal(await p.locator('.cap-map button[data-cap-choice]').count(),2);await p.locator('[data-cap-choice="0"]').hover();await shot(`step${step+1}-map`);}
   await overflow();
   if(width>=1024){await p.evaluate(()=>scrollTo(0,0));const action=await capAction('next').boundingBox();assert(action.y+action.height<=height,`Next at step ${step+1} / ${width}: ${action.y+action.height}`);}
   await capAction('next').click();
   if(step===0){
    await capAction('back').click();assert.equal(await p.evaluate(()=>capstoneState.step),0);assert.deepEqual(await p.evaluate(()=>capstoneState.completed),[]);
    await capAction('spoken').click();await p.locator('[data-cap-heard]').check();await p.locator('[data-cap-choice="0"]').click();await capAction('next').click();
   }
  }
  assert(await p.locator('.cap-complete').isVisible());assert.equal(await p.evaluate(()=>page),7);await shot('complete');
  assert.equal(await learning(),before,'Integration never changes the original task state');assert.deepEqual(await stored(),saved,'Integration does not write learning records');
  await capAction('reset').click();assert.equal(await p.evaluate(()=>capstoneState.step),0);assert.equal(await p.locator('[data-cap-hint="0"]').getAttribute('aria-pressed'),'true');
  await go(2);assert.equal(await learning(),before,'Original Part 3 attempt survives the integration practice');
  await go(7);await p.locator('#dg-menu-open').click();await p.locator('[data-dg-round="1"]').click();assert.equal(await p.evaluate(()=>page),0);assert.equal(await p.evaluate(()=>focusRound),1);
  await go(7);assert.equal(await p.evaluate(()=>capstoneState.step),0);
  await p.reload();assert.equal(await p.evaluate(()=>page),0,'Reload starts normal teaching, never Part 8');
  assert.deepEqual(errors,[]);report.push({width,height,theme,size,steps:6,errors});await context.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('PASS: manual unlocked Part 8; six-stage flow; fixed hints, transcript, gates, retries, back, restart; state isolation; tablet/mobile themes and open menu.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
