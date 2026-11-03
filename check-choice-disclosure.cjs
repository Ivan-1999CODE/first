const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/choice-disclosure');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{
  for(const theme of ['light','dark']){
   const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
   await p.goto(pathToFileURL(path.resolve('travel-english-unit3-airport.html')).href);
   await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';start(flows.findIndex(f=>/gate-and-repeat/.test(f.id)));},theme);
   const result=p.locator('.vf-result'),feedback=p.locator('#flowFeedback');
   const neutral=async()=>{assert.equal(await p.locator('.vf-result-art,.vf-verdict').count(),0);assert((await result.innerText()).includes('尚未選擇'));assert(!/12|20/.test(await result.innerText()+await feedback.innerText()));};
   await neutral();await p.locator('#spoken').check();await neutral();
   await p.locator('[data-dg-transcript]').click();assert((await p.locator('.dg-transcript').innerText()).includes('12 號登機門'));await p.locator('[data-dg-transcript]').click();
   await p.locator('#heard').check();await neutral();
   await p.locator('.scene-board').screenshot({path:path.join(out,'gate-'+theme+'-unanswered.png')});
   await p.getByRole('button',{name:'選擇：20 號登機門',exact:true}).click();
   assert((await result.innerText()).includes('你剛才選的是'));assert((await result.innerText()).includes('20 號登機門'));assert((await result.innerText()).includes('還不符合對話'));
   assert(!/12/.test(await result.innerText()+await feedback.innerText()),'Wrong feedback must not supply the correct gate');
   assert((await p.locator('[data-choice="1"] .vf-choice-action').innerText()).includes('再試一次'));assert(!(await p.locator('[data-choice="1"] .vf-choice-action').innerText()).includes('✓'),'A wrong choice must not get a success checkmark');
   assert(await p.locator('[data-act="next"]').isDisabled());
   await p.locator('.vf-interaction').screenshot({path:path.join(out,'gate-'+theme+'-wrong.png')});
   await p.getByRole('button',{name:'選擇：12 號登機門',exact:true}).press('Enter');
   assert((await result.innerText()).includes('符合對話，可以繼續'));assert(await p.locator('[data-act="next"]').isEnabled());
   await p.locator('.vf-interaction').screenshot({path:path.join(out,'gate-'+theme+'-correct.png')});
   await p.locator('[data-act="next"]').click();await neutral();
   await p.locator('#spoken').check();assert.equal(await p.locator('[data-dg-transcript]').getAttribute('aria-pressed'),'false');await p.locator('#heard').check();await neutral();
   await p.locator('[data-act="back"]').click();await neutral();
   await p.getByRole('button',{name:'重新開始本任務',exact:true}).click();await neutral();
   for(const width of [320,1100]){await p.setViewportSize({width,height:850});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
   await p.setViewportSize({width:390,height:844});await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="2"]').hover();await p.locator('#nav [data-page="2"]').focus();await p.screenshot({path:path.join(out,'gate-'+theme+'-menu.png')});await p.locator('#dg-menu-close').click();
   await p.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({themes:2,states:['unanswered','wrong','correct','next','back','restart'],errors},null,2));
  console.log('PASS: gate answer disclosure, explicit chosen-result labels, wrong retry without correct answer, transcript opt-in/reset, next/back/restart, keyboard, 3 widths, 2 themes and menus.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
