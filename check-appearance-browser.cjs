const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),http=require('http');
const {pathToFileURL}=require('url');
const files=fs.readdirSync('.').filter(f=>f==='index.html'||/^travel-(?:english(?:-unit.*)?|japanese-day0-directions)\.html$/.test(f));
const output='tmp/appearance-qa';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const issues=[],report=[];
 try{
  for(const file of files){
   const html=fs.readFileSync(file,'utf8');
   for(const [id,asset,tag] of [['shared-appearance-init','appearance-init.js','script'],['shared-appearance-styles','appearance.css','style'],['shared-appearance-controls','appearance.js','script']]){
    const matches=[...html.matchAll(new RegExp('<'+tag+' id="'+id+'"[^>]*>\\n([\\s\\S]*?)<\\/'+tag+'>','g'))];
    assert.equal(matches.length,1,file+' '+id);assert.equal(matches[0][1],fs.readFileSync('assets/'+asset,'utf8'));
   }
   const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.resolve(file)).href);
   const theme=page.locator('#theme,#themeToggle'),size=page.locator('#large');
   assert.equal(await theme.count(),1,file+' theme control');assert.equal(await size.count(),1,file+' size control');
   assert.equal(await theme.getAttribute('aria-pressed'),'false');
   const standard=await page.locator('body').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
   const smallButton=await size.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
   await size.focus();await page.keyboard.press('Enter');
   assert.equal(await size.getAttribute('aria-pressed'),'true');
   assert(await page.locator('body').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>standard,file+' body grows');
   assert(await size.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>smallButton,file+' controls grow');
   await theme.focus();await page.keyboard.press('Space');
   assert.equal(await theme.getAttribute('aria-pressed'),'true');
   await page.evaluate(()=>localStorage.setItem('appearance-qa-learning-record','保留作答'));
   await page.reload();
   assert.equal(await size.getAttribute('aria-pressed'),'true',file+' saved size');
   assert.equal(await theme.getAttribute('aria-pressed'),'true',file+' saved theme');
   assert.equal(await page.evaluate(()=>localStorage.getItem('appearance-qa-learning-record')),'保留作答');
   for(const width of [1440,768,390,320]){
    await page.setViewportSize({width,height:1000});
    for(const dark of [true,false]){
     if((await theme.getAttribute('aria-pressed')==='true')!==dark)await theme.click();
     for(let part=0;part<(file==='index.html'?1:7);part++){
      if(file!=='index.html')await page.evaluate(n=>navigate(n),part);
      const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('.top button')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width};})}));
      if(layout.scroll>width+1)issues.push({file,width,dark,part,layout});
      assert(layout.buttons.every(b=>b.x>=0&&b.right<=width+1),file+' header controls reachable');
      if(dark&&width===390&&['index.html','travel-english-unit4-transit.html','travel-english-unit6-ordering.html'].includes(file)&&[0,2,4,5].includes(part))await page.screenshot({path:path.join(output,file.replace('.html','')+'-'+part+'.png'),fullPage:true});
     }
    }
   }
   await page.setViewportSize({width:1440,height:1000});
   await size.click();assert.equal(await size.getAttribute('aria-pressed'),'false');
   assert.equal(await page.locator('body').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)),standard);
   if(await theme.getAttribute('aria-pressed')==='true')await theme.click();
   await page.reload();assert.equal(await size.getAttribute('aria-pressed'),'false');assert.equal(await theme.getAttribute('aria-pressed'),'false');
   assert.deepEqual(errors,[],file);report.push({file,sections:file==='index.html'?1:7,widths:4,themes:2,keyboard:true,reload:true});
   await context.close();console.log('PASS controls and persistence: '+file);
  }
  // A real navigation on one origin verifies the index and different runtime generations share preferences.
  const server=http.createServer((req,res)=>{const file=decodeURIComponent(req.url.slice(1)||'index.html');if(!files.includes(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(file));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
   const context=await browser.newContext(),page=await context.newPage(),base='http://127.0.0.1:'+server.address().port;
   await page.goto(base+'/index.html');await page.locator('#large').click();await page.locator('#theme').click();
   for(const file of ['travel-english-unit3-airport.html','travel-english-unit7-fitting.html','travel-english.html','travel-japanese-day0-directions.html','index.html']){
    await page.locator('a[href$="'+file+'"]').first().click();
    assert.equal(await page.locator('#large').getAttribute('aria-pressed'),'true',file+' cross-page size');
    assert.equal(await page.locator('#theme,#themeToggle').getAttribute('aria-pressed'),'true',file+' cross-page theme');
   }
   await context.close();
  }finally{await new Promise(resolve=>server.close(resolve));}
  for(const file of ['index.html','travel-english-unit3-airport.html','travel-english.html']){
   for(const blocked of [true,false]){
    const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(blocked=>{if(blocked){Object.defineProperty(window,'localStorage',{get(){throw new Error('storage blocked');}});}else{localStorage.setItem('travel-lab-theme','invalid');localStorage.setItem('travel-lab-text-size','invalid');}},blocked);
    await page.goto(pathToFileURL(path.resolve(file)).href);assert.equal(await page.locator('#large').getAttribute('aria-pressed'),'false');
    await page.locator('#large').click();await page.locator('#theme,#themeToggle').click();assert.equal(await page.locator('#large').getAttribute('aria-pressed'),'true');
    if(blocked)assert(await page.locator('.appearance-status').isVisible());
    assert.deepEqual(errors,[],file+' storage fallback');await context.close();
   }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({report,issues},null,2));
  assert.deepEqual(issues,[],'No horizontal overflow in large type: see '+output+'/report.json');
  console.log('PASS: 16 standalone files, 848 section/width/theme views, cross-page settings, invalid/blocked storage.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
