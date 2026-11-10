'use strict';
// Isolated browser state: unrestricted selection, source correspondence, print handoff and layout.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/homework-export');fs.mkdirSync(out,{recursive:true});
const report={pages:0,items:0,scenarios:0,defaultSelections:0,pdfs:[],screenshots:[],errors:[]};
const noPDF=process.argv.includes('--no-pdf');
async function ready(p){await p.waitForFunction(()=>{const d=document.querySelector('#homework-preview')?.contentDocument;return !document.querySelector('#homework-print')?.disabled&&d?.querySelector('[data-paper-section=questions]');});}
async function select(p,keys){await p.evaluate(keys=>{document.querySelectorAll('[name=homework-item]').forEach(e=>e.checked=keys.includes(e.value));document.querySelector('[name=homework-item]').dispatchEvent(new Event('change',{bubbles:true}));},keys);await ready(p);}
async function paper(p){return p.locator('#homework-preview').evaluate(e=>({html:e.srcdoc,text:e.contentDocument.body.innerText,questions:e.contentDocument.querySelector('[data-paper-section=questions]').innerText,keys:[...e.contentDocument.querySelectorAll('[data-homework-key]')].map(n=>n.dataset.homeworkKey),sections:[...e.contentDocument.querySelectorAll('[data-paper-section]')].map(n=>n.dataset.paperSection)}));}
async function pdf(p,name){if(noPDF)return;const html=(await paper(p)).html;fs.writeFileSync(path.join(out,name+'.html'),html);const sheet=await p.context().newPage();await sheet.setContent(html);await sheet.emulateMedia({media:'print'});await sheet.evaluate(()=>document.fonts.ready);const file=path.join(out,name+'.pdf');await sheet.pdf({path:file,format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});report.pdfs.push(file);await sheet.close();}
async function snap(p,name,bottom=false){await p.locator('.homework-dialog').evaluate((e,bottom)=>{e.scrollTop=bottom?e.scrollHeight:0;},bottom);await p.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');}
async function theme(p,name){await p.evaluate(name=>{document.documentElement.dataset.theme=name;appearance();},name);await p.waitForTimeout(220);}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const file of fs.readdirSync('.').filter(f=>/^travel-english(?:-unit\d+-[^.]+)?\.html$/.test(f))){
   const ctx=await browser.newContext({viewport:{width:1366,height:1100},reducedMotion:'reduce'}),p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>report.errors.push(file+': '+e.message));
   await p.goto(pathToFileURL(path.resolve(file)).href);
   const expected=await p.evaluate(()=>{
    const result=rounds.map(r=>({key:'task:'+r.id,contexts:[r.home.task],answers:[r.home.answer],count:1}));
    if(typeof chapterIntegration!=='undefined')chapterIntegration.groups.forEach(g=>result.push({key:'integrated:'+g.id,contexts:g.paths.map(p=>p.context),answers:g.paths.flatMap(p=>p.steps.map(s=>s.answer)),count:g.paths.length}));
    if(typeof capstoneSteps!=='undefined')result.push({key:'integrated:capstone',contexts:capstoneSteps.map(s=>s.title),answers:capstoneSteps.map(s=>s.answer),count:1});
    if(typeof hotelIntegration!=='undefined'){
     result.push({key:'integrated:checkin',contexts:['Jamie Lin','3 晚'],answers:['nights','passport','name','breakfast'].map(k=>hotelIntegration.practice.transfer.steps.find(s=>s.key===k).answer),count:1});
     hotelIntegration.extended.groups.forEach(g=>result.push({key:'integrated:'+g.id,contexts:[g.homework.context],answers:g.homework.speakSteps.map(s=>s.answer),count:1}));
    }
    return result;
   });
   await p.evaluate(()=>{navigate(6);localStorage.setItem('homework-private-qa','PRIVATE STUDENT ANSWER MUST NOT EXPORT');});
   assert.equal(await p.locator('#main [data-homework-open]').count(),1);
   const storedBefore=await p.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));
   await p.locator('#main [data-homework-open]').click();await ready(p);
   assert.equal(await p.locator('[name=homework-item]').count(),expected.length);
   assert.equal(await p.locator('[name=homework-item]:disabled').count(),0);
   assert.deepEqual(await p.locator('[name=homework-item]:checked').evaluateAll(es=>es.map(e=>e.value)),[expected[0].key]);
   // Every entry can be exported alone, including tasks never visited or marked complete.
   for(const item of expected){
    await select(p,[item.key]);const contents=await paper(p);
    assert.deepEqual(contents.keys,Array(item.count).fill(item.key));
    for(const text of item.contexts)assert(contents.questions.includes(text),file+' missing prompt '+text);
    for(const text of item.answers){assert(text&&contents.text.includes(text),file+' missing reference '+text);assert(!contents.questions.includes(text),file+' leaked answer into prompt '+text);}
    assert(!contents.text.includes('PRIVATE STUDENT ANSWER'));assert(!contents.text.includes('undefined'));assert(!contents.text.includes('[object Object]'));
    report.items++;report.scenarios+=item.count;
   }
   await p.locator('[data-homework-select=none]').click();assert(await p.locator('#homework-print').isDisabled());assert(await p.locator('#homework-preview').isHidden());
   // A pending iframe load cannot re-enable printing after the selection is cleared.
   await p.evaluate(()=>{document.querySelector('[data-homework-select=all]').click();document.querySelector('[data-homework-select=none]').click();});
   await p.waitForTimeout(100);assert(await p.locator('#homework-print').isDisabled());
   await p.locator('[data-homework-select=all]').click();await ready(p);let content=await paper(p);
   assert.deepEqual(content.keys,expected.flatMap(e=>Array(e.count).fill(e.key)));assert.deepEqual(content.sections,['questions','hints','answers']);
   if(/unit3-|unit8-|unit12-/.test(file))await pdf(p,file.match(/unit(\d+)/)[1]+'-all');
   // Real print control targets the prepared iframe, not the lesson page.
   await p.locator('#homework-preview').evaluate(e=>{e.contentWindow.print=()=>{e.dataset.printCalled='yes';};});
   await p.locator('#homework-print').click();assert.equal(await p.locator('#homework-preview').getAttribute('data-print-called'),'yes');
   if(file==='travel-english.html'){
    await select(p,['task:A']);assert.deepEqual((await paper(p)).sections,['questions','reference']);await pdf(p,'1-single');
    await select(p,['task:A','integrated:route-help']);await p.locator('#homework-date').fill('2026-11-10');await ready(p);assert((await paper(p)).text.includes('2026-11-10'));await pdf(p,'1-mixed');
    // The explicit selection survives closing and reopening in the same task.
    await p.locator('[data-homework-close]').click();await p.locator('#main [data-homework-open]').click();await ready(p);assert.deepEqual([...new Set((await paper(p)).keys)],['task:A','integrated:route-help']);
    for(const name of ['light','dark']){
     await theme(p,name);await p.setViewportSize({width:1366,height:1100});await p.locator('[value="task:A"]').focus();await p.locator('[value="task:B"]').locator('..').hover();await snap(p,'dialog-'+name+'-desktop');await snap(p,'preview-'+name+'-desktop',true);
     await p.setViewportSize({width:390,height:844});await snap(p,'dialog-'+name+'-mobile');assert(await p.locator('.homework-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await snap(p,'preview-'+name+'-mobile',true);
     await p.locator('[data-homework-select=none]').click();assert(await p.locator('#homework-print').isDisabled());await p.locator('#homework-print').scrollIntoViewIfNeeded();await snap(p,'empty-'+name+'-mobile',true);await select(p,['task:A','integrated:route-help']);
    }
    await p.setViewportSize({width:1366,height:1100});await theme(p,'light');
   }
   assert.equal(await p.evaluate(()=>JSON.stringify(Object.entries(localStorage).filter(([k])=>!['travel-lab-appearance'].includes(k)).sort())),await p.evaluate(s=>JSON.stringify(JSON.parse(s).filter(([k])=>!['travel-lab-appearance'].includes(k))),storedBefore),'Export must not alter learning storage');
   await p.locator('[data-homework-close]').click();
   // Switching to any integrated group preselects that exact group.
   for(const item of expected.filter(e=>e.key.startsWith('integrated:'))){
    const id=item.key.slice('integrated:'.length);await p.locator('#dg-menu-open').click();
    if(id==='capstone')await p.locator('[data-ci-capstone]').click();
    else if(await p.locator('[data-ci-group="'+id+'"]').count())await p.locator('[data-ci-group="'+id+'"]').click();
    else await p.locator('[data-hi-group="'+id+'"]').click();
    if(id!=='capstone'){await p.evaluate(()=>navigate(6));assert.equal(await p.locator('#main [data-homework-open]').count(),1);}
    await p.locator('footer [data-homework-open]').click();await ready(p);assert.deepEqual(await p.locator('[name=homework-item]:checked').evaluateAll(es=>es.map(e=>e.value)),[item.key]);await p.locator('[data-homework-close]').click();report.defaultSelections++;
   }
   report.pages++;await ctx.close();console.log('PASS '+file+' ('+expected.length+' items)');
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
