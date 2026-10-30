const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const files=['index.html',...fs.readdirSync('.').filter(f=>/^travel-.*\.html$/.test(f))];
const paletteFor=f=>f.includes('japanese')?'titanium':f.includes('korean')?'silver':'navy';
const out='tmp/language-palettes';fs.mkdirSync(out,{recursive:true});
async function inspectPopup(page,scope,label){
 const result=await page.locator(scope).evaluate(e=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
  const lum=c=>c.slice(0,3).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  const bg=e=>{for(let n=e;n;n=n.parentElement){const c=rgb(getComputedStyle(n).backgroundColor);if(c.length===3||c[3]===1)return c;}return [255,255,255]};
  const bad=[e,...e.querySelectorAll('*')].filter(n=>n.getClientRects().length&&[...n.childNodes].some(t=>t.nodeType===3&&t.textContent.trim())&&!n.disabled).map(n=>{const a=lum(rgb(getComputedStyle(n).color)),b=lum(bg(n));return{text:n.textContent.trim().slice(0,40),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}}).filter(x=>x.ratio<4.5);
  const r=e.getBoundingClientRect();return{bad,left:r.left,right:r.right,width:innerWidth};
 });
 assert.deepEqual(result.bad,[],label+' popup contrast');
 assert(result.left>=0&&result.right<=result.width+1,label+' popup fits');
 await page.screenshot({path:`${out}/${label}.png`});
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];try{
 for(const file of files){
  const day=file;const palette=paletteFor(file);
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(file)).href);
  assert.equal(await page.locator('html').getAttribute('data-course-palette'),palette);
  assert.equal(await page.locator('#course-palette-styles').count(),1);
  assert.equal(await page.locator('#course-palette-styles').textContent(),'\n'+fs.readFileSync('assets/course-palettes.css','utf8').replace(/\r\n/g,'\n'));
  const theme=page.locator('#theme,#themeToggle'),size=page.locator('#large');
  await page.evaluate(()=>localStorage.setItem('palette-qa-record','保留學習紀錄'));
  const colors={};let minContrast=Infinity;
  for(const dark of [false,true]){
   if((await theme.getAttribute('aria-pressed')==='true')!==dark)await theme.click();
   for(const width of [1440,320]){
    await page.setViewportSize({width,height:1000});
    if((await size.getAttribute('aria-pressed')==='true')!==(width===320))await size.click();
    for(let part=0;part<(file==='index.html'?1:7);part++){
     if(file!=='index.html')await page.evaluate(n=>navigate(n),part);
     const result=await page.evaluate(()=>{
      const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
      const lum=c=>c.slice(0,3).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
      const bg=e=>{for(let n=e;n;n=n.parentElement){const c=rgb(getComputedStyle(n).backgroundColor);if(c.length===3||c[3]===1)return c;}return [255,255,255];};
      const selectors=['h1','.lead','.muted','.fine','.eyebrow','.study-meaning','.preview-meaning','.study-heading h2','.study-heading p','.study-navigation strong','.study-navigation small','.scene-ledger span','.scene-ledger strong','button.primary','.task-round-picker button[aria-pressed=true]','.tools button','#nav button[aria-current=step]','.day-switcher a[aria-current=page]'];
      const contrasts=[];
      for(const sel of selectors)for(const e of document.querySelectorAll(sel)){
       if(!e.getClientRects().length||!e.textContent.trim()||e.disabled||getComputedStyle(e).opacity!=='1')continue;
       const a=lum(rgb(getComputedStyle(e).color)),b=lum(bg(e));contrasts.push({selector:sel,text:e.textContent.trim().slice(0,35),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
      }
      const root=getComputedStyle(document.body);
      const tokens=['bg','panel','ink','muted','line','accent','soft','on-accent','neutral','hear-bg','hear-ink','hear-line','say-bg','say-ink','say-line'].map(name=>root.getPropertyValue('--'+name).trim());
      return {overflow:document.documentElement.scrollWidth>innerWidth+2,bg:getComputedStyle(document.body).backgroundColor,tokens,contrasts};
     });
     assert(!result.overflow,`${day}/${dark}/${width}/${part}: overflow`);
     const bad=result.contrasts.filter(c=>c.ratio<4.5);assert.deepEqual(bad,[],`${day}/${dark}/${width}/${part}: contrast`);
     minContrast=Math.min(minContrast,...result.contrasts.map(c=>c.ratio));
     const mode=dark?'dark':'light';colors[mode]??=result.bg;assert.equal(colors[mode],result.bg,'Background must stay consistent across all seven parts');
     colors[mode+'Tokens']??=result.tokens;assert.deepEqual(colors[mode+'Tokens'],result.tokens);
     if(/japanese|korean|unit12-|unit5-/.test(file)&&width===1440&&part===1)await page.screenshot({path:`${out}/day${day}-${mode}.png`});
     if(/japanese|korean|unit12-/.test(file)&&width===320&&part===2)await page.screenshot({path:`${out}/${file}-${mode}-mobile.png`});
    }
   }
  }
  if(/japanese|korean|unit12-|unit5-/.test(file))for(const dark of [false,true])for(const width of [1440,320]){
   await page.setViewportSize({width,height:1000});
   if((await theme.getAttribute('aria-pressed')==='true')!==dark)await theme.click();
   if((await size.getAttribute('aria-pressed')==='true')!==(width===320))await size.click();
   await page.evaluate(()=>navigate(1));
   const label=`${file}-${dark?'dark':'light'}-${width}`;
   if(await page.locator('#dg-menu-open').count()){
    await page.locator('#dg-menu-open').click();
    await page.locator('#dg-course-dialog [aria-current=step]').hover();
    await page.locator('#dg-course-dialog [aria-current=step]').focus();
    await inspectPopup(page,'#dg-course-dialog',label+'-menu');
    await page.keyboard.press('Escape');
    await page.locator('#dg-day-picker > summary').click();
    await inspectPopup(page,'#dg-day-picker',label+'-days');
    await page.locator('#dg-days-close').click();
   }else{
    const summary=page.locator('#courseMenu > summary');
    if(await summary.isVisible())await summary.click();
    await page.locator('#nav [aria-current=step]').hover();
    await page.locator('#nav [aria-current=step]').focus();
    await inspectPopup(page,'#courseMenu',label+'-menu');
    await page.evaluate(()=>navigate(1));
    await page.locator('.jp-word').first().click();
    await page.locator('.jp-glossary button').hover();
    await page.locator('.jp-glossary button').focus();
    await inspectPopup(page,'.jp-glossary',label+'-glossary');
    await page.locator('.jp-glossary button').click();
   }
  }
  await page.reload();assert.equal(await theme.getAttribute('aria-pressed'),'true');assert.equal(await size.getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>localStorage.getItem('palette-qa-record')),'保留學習紀錄');assert.deepEqual(errors,[]);
  report.push({day,palette,colors,minContrast});await context.close();console.log(`PASS ${file}: two themes, desktop/mobile, contrast and preferences.`);
 }
 for(const mode of ['light','dark']){
  const representatives=['navy','titanium','silver'].map(p=>report.find(r=>r.palette===p));
  assert.equal(new Set(representatives.map(r=>r.colors[mode])).size,3);
  const english=report.filter(r=>r.palette==='navy');
  for(const r of english)assert.equal(r.colors[mode],english[0].colors[mode],'All English backgrounds match');
 }
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
