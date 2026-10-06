const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const catalog=require('./assets/curriculum-original.json');
const sequence=['peach','apricot','butter','rose','mauve','latte'];
const out='tmp/course-palette-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];try{
 for(let day=0;day<=14;day++){
  const file=day===1?'travel-english.html':catalog.find(x=>x.day===day).file;
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(file)).href);
  assert.equal(await page.locator('html').getAttribute('data-course-palette'),sequence[day%6]);
  assert.equal(await page.locator('#course-palette-styles').count(),1);
  assert.equal(await page.locator('#course-palette-styles').textContent(),'\n'+fs.readFileSync('assets/course-palettes.css','utf8'));
  const theme=page.locator('#theme,#themeToggle'),size=page.locator('#large');
  await page.evaluate(()=>localStorage.setItem('palette-qa-record','保留學習紀錄'));
  const colors={};let minContrast=Infinity;
  for(const dark of [false,true]){
   if((await theme.getAttribute('aria-pressed')==='true')!==dark)await theme.click();
   for(const width of [1440,320]){
    await page.setViewportSize({width,height:1000});
    if((await size.getAttribute('aria-pressed')==='true')!==(width===320))await size.click();
    for(let part=0;part<7;part++){
     await page.evaluate(n=>navigate(n),part);
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
      const root=getComputedStyle(document.documentElement);
      const tokens=['bg','panel','ink','muted','line','accent','soft','on-accent','neutral','hear-bg','hear-ink','hear-line','say-bg','say-ink','say-line'].map(name=>root.getPropertyValue('--'+name).trim());
      return {overflow:document.documentElement.scrollWidth>innerWidth+2,bg:getComputedStyle(document.body).backgroundColor,tokens,contrasts};
     });
     assert(!result.overflow,`${day}/${dark}/${width}/${part}: overflow`);
     const bad=result.contrasts.filter(c=>c.ratio<4.5);assert.deepEqual(bad,[],`${day}/${dark}/${width}/${part}: contrast`);
     minContrast=Math.min(minContrast,...result.contrasts.map(c=>c.ratio));
     const mode=dark?'dark':'light';colors[mode]??=result.bg;assert.equal(colors[mode],result.bg,'Background must stay consistent across all seven parts');
     colors[mode+'Tokens']??=result.tokens;assert.deepEqual(colors[mode+'Tokens'],result.tokens);
     if(day<6&&width===1440&&part===1)await page.screenshot({path:`${out}/day${day}-${mode}.png`});
     if(day===0&&width===320&&part===2)await page.screenshot({path:`${out}/day0-${mode}-mobile.png`});
    }
   }
  }
  await page.reload();assert.equal(await theme.getAttribute('aria-pressed'),'true');assert.equal(await size.getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>localStorage.getItem('palette-qa-record')),'保留學習紀錄');assert.deepEqual(errors,[]);
  report.push({day,palette:sequence[day%6],colors,minContrast});await context.close();console.log(`PASS Day ${day}: seven parts, two themes, desktop/mobile, contrast and preferences.`);
 }
 assert.equal(new Set(report.slice(0,6).map(r=>r.colors.light)).size,6);
 for(const r of report){assert.equal(r.colors.dark,report[1].colors.dark);assert.deepEqual(r.colors.darkTokens,report[1].colors.darkTokens,'All dark palettes match Day 1');}
 for(const r of report.slice(6))assert.deepEqual(r.colors,report[r.day%6].colors);
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
